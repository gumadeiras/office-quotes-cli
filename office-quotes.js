#!/usr/bin/env node

/**
 * office-quotes CLI tool for Clawdbot
 * 
 * Usage: node office-quotes.js [--mode offline|api] [--theme dark|light] [--format png|jpg|webp]
 */

const API_BASE = "https://officeapi.akashrajpurohit.com";
const fs = require('fs');
// const { execSync } = require('child_process'); // Unused

// Check for Playwright
let playwright;
try {
  playwright = require('playwright');
} catch (e) {
  console.error('Playwright not installed. Run: npm install playwright && npx playwright install chromium');
  process.exit(1);
}

// Parse arguments
const args = process.argv.slice(2);
let command = null;
let mode = "offline";
let theme = "dark";
let outputFormat = "svg"; // svg, png, jpg, webp
let commandArgs = [];

// Basic argument parser to separate command from flags
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg.startsWith("--")) {
    if (arg === "--mode" && args[i + 1]) {
      mode = args[++i];
    } else if (arg === "--theme" && args[i + 1]) {
      theme = args[++i];
    } else if (arg === "--format" && args[i + 1]) {
      outputFormat = args[++i].toLowerCase();
    }
  } else if (!command) {
    command = arg;
  } else {
    commandArgs.push(arg);
  }
}

function loadQuotes() {
  const paths = [
    require('path').join(__dirname, 'data', 'quotes.json'),
    require('path').join(process.cwd(), 'data', 'quotes.json'),
    require('path').join(process.env.HOME || process.env.USERPROFILE, '.local/share/office-quotes-cli/data/quotes.json')
  ];

  for (const p of paths) {
    try {
      if (fs.existsSync(p)) {
        return JSON.parse(fs.readFileSync(p, 'utf8'));
      }
    } catch (e) {
      // ignore
    }
  }
  return null;
}

// Command Implementations
function getQuotesOrError() {
  const quotes = loadQuotes();
  if (!quotes) {
    console.error("Error: Could not find quotes.json in any expected location.");
    process.exit(1);
  }
  return quotes;
}

async function searchQuotes(query) {
  if (!query) {
    console.error("Usage: office-quotes.js search <query>");
    return;
  }
  const quotes = getQuotesOrError();
  const results = quotes
    .filter(q => q.content.toLowerCase().includes(query.toLowerCase()))
    .map(q => `[${q.character}]: ${q.content}`);

  if (results.length === 0) console.log("No matches found.");
  else results.forEach(r => console.log(r));
}

async function listQuotes(character) {
  const quotes = getQuotesOrError();
  let results;
  if (character) {
    results = quotes.filter(q => q.character.toLowerCase().includes(character.toLowerCase()));
  } else {
    results = quotes;
  }
  results.forEach(q => console.log(`${q.character}: ${q.content}`));
}

async function listCharacters() {
  const quotes = getQuotesOrError();
  const chars = [...new Set(quotes.map(q => q.character))].sort();
  chars.forEach(c => console.log(c));
}

async function countQuotes() {
  const quotes = getQuotesOrError();
  console.log(`Total quotes: ${quotes.length}`);
}

async function getOfflineQuote() {
  const quotes = getQuotesOrError();
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const quote = quotes[randomIndex];
  return { quote: quote.content, character: quote.character };
}

async function renderWithPlaywright(svgPath, outputFormat) {
  const ext = outputFormat.toLowerCase();
  const outputPath = svgPath.replace(/\.[^.]+$/, `.${ext}`);

  if (ext === 'svg') {
    return svgPath;
  }

  // Create HTML wrapper for proper rendering
  const svgContent = fs.readFileSync(svgPath, 'utf8');
  const htmlPath = svgPath.replace(/\.svg$/, '.html');

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
<style>
body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #111827; }
svg { max-width: 100%; height: auto; }
</style>
</head>
<body>
${svgContent}
</body>
</html>`;

  fs.writeFileSync(htmlPath, htmlContent);

  const browser = await playwright.chromium.launch();
  const page = await browser.newPage({ viewport: { width: 520, height: 420 } });

  await page.goto('file://' + htmlPath);
  await page.waitForTimeout(1500);

  // Screenshot the SVG element
  await page.locator('svg').screenshot({ path: outputPath });

  await browser.close();

  // Cleanup HTML
  fs.unlinkSync(htmlPath);

  return outputPath;
}

async function convertImage(svgPath, outputFormat) {
  const ext = outputFormat.toLowerCase();

  if (ext === 'svg') {
    return svgPath;
  }

  try {
    return await renderWithPlaywright(svgPath, outputFormat);
  } catch (error) {
    return { error: error.message, status: 'error' };
  }
}

async function getApiQuote() {
  const svgUrl = `${API_BASE}/quote/random?responseType=svg&mode=${theme}&width=500&height=300`;
  const jsonUrl = `${API_BASE}/quote/random?responseType=json`;

  try {
    // Get JSON for quote text
    const jsonRes = await fetch(jsonUrl);
    const data = await jsonRes.json();

    // Fetch and save SVG
    const svgRes = await fetch(svgUrl);
    const svgText = await svgRes.text();

    // Check for empty response
    if (!svgText || svgText.trim().length < 100) {
      return {
        quote: data.quote,
        character: data.character,
        error: "API returned empty image - please try again",
        avatarUrl: data.character_avatar_url
      };
    }

    const tempSvg = `/tmp/office_quote_${Date.now()}.svg`;
    fs.writeFileSync(tempSvg, svgText);

    if (outputFormat !== 'svg') {
      // Convert using Playwright
      const conversionResult = await convertImage(tempSvg, outputFormat);
      fs.unlinkSync(tempSvg); // Clean up SVG

      if (conversionResult && conversionResult.status === 'error') {
        return {
          quote: data.quote,
          character: data.character,
          error: conversionResult.error,
          avatarUrl: data.character_avatar_url
        };
      }

      return {
        quote: data.quote,
        character: data.character,
        imagePath: conversionResult,
        format: outputFormat,
        avatarUrl: data.character_avatar_url
      };
    }

    return {
      quote: data.quote,
      character: data.character,
      imagePath: tempSvg,
      format: 'svg',
      svgUrl: svgUrl,
      avatarUrl: data.character_avatar_url
    };
  } catch (error) {
    return { error: error.message };
  }
}

async function main() {
  // Handle commands
  if (command === "search") {
    await searchQuotes(commandArgs.join(" "));
    return;
  }
  if (command === "list") {
    await listQuotes(commandArgs.join(" "));
    return;
  }
  if (command === "characters") {
    await listCharacters();
    return;
  }
  if (command === "count") {
    await countQuotes();
    return;
  }

  // Handle default random mode (offline or api)
  let result;
  if (mode === "api") {
    result = await getApiQuote();
  } else {
    // defaults to offline random
    result = await getOfflineQuote();
  }

  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
