#!/usr/bin/env node

/**
 * office-quotes CLI tool for Clawdbot
 * 
 * Usage: node office-quotes.js [--mode offline|api] [--source local|api] [--theme dark|light] [--format png|jpg]
 */

const API_BASE = "https://officeapi.akashrajpurohit.com";
const fs = require('fs');
const path = require('path');
const os = require('os');

// Check for Playwright
let playwright;
try {
  playwright = require('playwright');
} catch (e) {
  // Playwright is optional if not converting images, specific check done later
}

function parseArgs(args) {
  let command = null;
  let mode = "offline";
  let theme = "dark";
  let outputFormat = null; // Default null means no image requested
  let commandArgs = [];
  let showHelp = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "-h" || arg === "--help") {
      showHelp = true;
    } else if (arg.startsWith("--")) {
      if ((arg === "--mode" || arg === "--source") && args[i + 1]) {
        let val = args[++i].toLowerCase();
        mode = (val === 'local' || val === 'offline') ? 'offline' : 'api';
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

  if (command === "help") showHelp = true;
  if (command === "api") mode = "api";

  // Force API mode if output format is specified (since offline mode has no images)
  if (outputFormat && mode !== "api") {
    console.error("Note: switching to API mode because --format was specified (offline mode does not support images).");
    mode = "api";
  }

  // Set default output format if in API mode but no format specified.
  // We keep it null unless they explicitly asked for it or used a command that implies it.
  // Actually, let's keep it null. If it's null, getApiQuote won't save images.

  return { command, mode, theme, outputFormat, commandArgs, showHelp };
}

function printHelp() {
  console.log(`
office-quotes - The Office quote generator (Node.js version)

Usage: office-quotes [command] [options]

Commands:
  random              Show a random quote (default)
  list [character]    List all local quotes, optionally by character
  characters          List all characters (local)
  count               Show quote count
  search <query>      Search quotes (local)
  api                 Fetch from online API
  help                Show this help

Options:
  -h, --help          Show this help
  --source [local|api] Source to fetch from (default: local)
  --theme [dark|light] Theme for SVG (api mode with image only, default: dark)
  --format [png|jpg]   Output image format. If specified, saves image to /tmp/

Examples:
  office-quotes                     # Random local quote
  office-quotes list dwight         # List Dwight quotes
  office-quotes search "bears"      # Search quotes
  office-quotes --source api        # Get random quote from API (no image)
  office-quotes api --format png    # Get random quote + PNG image
`);
}

function loadQuotes() {
  const paths = [
    path.join(__dirname, 'data', 'quotes.json'),
    path.join(process.cwd(), 'data', 'quotes.json'),
    path.join(os.homedir(), '.local/share/office-quotes-cli/data/quotes.json')
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

function getQuotesOrError() {
  const quotes = loadQuotes();
  if (!quotes) {
    throw new Error("Could not find quotes.json in any expected location.");
  }
  return quotes;
}

function searchQuotes(query) {
  if (!query) {
    throw new Error("Usage: office-quotes search <query>");
  }
  const quotes = getQuotesOrError();
  const results = quotes
    .filter(q => q.content.toLowerCase().includes(query.toLowerCase()))
    .map(q => `[${q.character}]: ${q.content}`);

  return results;
}

function listQuotes(character) {
  const quotes = getQuotesOrError();
  let results;
  if (character) {
    results = quotes.filter(q => q.character.toLowerCase().includes(character.toLowerCase()));
  } else {
    results = quotes;
  }
  return results.map(q => `${q.character}: ${q.content}`);
}

function listCharacters() {
  const quotes = getQuotesOrError();
  const chars = [...new Set(quotes.map(q => q.character))].sort();
  return chars;
}

function countQuotes() {
  const quotes = getQuotesOrError();
  return quotes.length;
}

function getOfflineQuote(quotesInput) {
  const quotes = quotesInput || getQuotesOrError();
  if (!quotes || quotes.length === 0) {
    throw new Error("No quotes available in offline database.");
  }
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const quote = quotes[randomIndex];
  return { quote: quote.content, character: quote.character };
}

async function renderWithPlaywright(svgPath, outputFormat) {
  if (!playwright) {
    throw new Error('Playwright not installed. Run: npm install playwright && npx playwright install chromium');
  }
  const ext = outputFormat.toLowerCase();

  if (ext !== 'png' && ext !== 'jpg' && ext !== 'jpeg' && ext !== 'svg') {
    throw new Error("Supported formats: png, jpg, svg.");
  }

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

  try {
    await page.goto('file://' + htmlPath);
    await page.waitForTimeout(1500);

    // Screenshot the SVG element
    await page.locator('svg').screenshot({ path: outputPath });
  } finally {
    await browser.close();
    // Cleanup HTML
    if (fs.existsSync(htmlPath)) fs.unlinkSync(htmlPath);
  }

  return outputPath;
}

async function convertImage(svgPath, outputFormat) {
  try {
    return await renderWithPlaywright(svgPath, outputFormat);
  } catch (error) {
    return { error: error.message, status: 'error' };
  }
}

async function getApiQuote(options = {}) {
  const { theme = "dark", outputFormat = null } = options;
  const jsonUrl = `${API_BASE}/quote/random?responseType=json`;

  try {
    // Get JSON for quote text
    const jsonRes = await fetch(jsonUrl);
    if (!jsonRes.ok) {
      throw new Error(`API error: ${jsonRes.status} ${jsonRes.statusText}`);
    }
    const data = await jsonRes.json();

    // If no format requested, just return the JSON data
    if (!outputFormat) {
      return {
        quote: data.quote,
        character: data.character,
        character_avatar_url: data.character_avatar_url,
        episode: data.episode,
        season: data.season
      };
    }

    // Otherwise, fetch and save image
    const svgUrl = `${API_BASE}/quote/random?responseType=svg&mode=${theme}&width=500&height=300`;
    const svgRes = await fetch(svgUrl);
    if (!svgRes.ok) {
      throw new Error(`API image error: ${svgRes.status}`);
    }
    const svgText = await svgRes.text();

    // Check for empty/invalid response
    if (!svgText || svgText.trim().length < 100) {
      return {
        quote: data.quote,
        character: data.character,
        error: "API returned empty/invalid image - please try again later",
        avatarUrl: data.character_avatar_url
      };
    }

    const timestamp = Date.now();
    const tempSvg = path.join(os.tmpdir(), `office_quote_${timestamp}.svg`);
    fs.writeFileSync(tempSvg, svgText);

    if (outputFormat && outputFormat !== 'svg') {
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
      avatarUrl: data.character_avatar_url
    };
  } catch (error) {
    return { error: `Failed to fetch quote from API: ${error.message}` };
  }
}

async function main() {
  const { command, mode, theme, outputFormat, commandArgs, showHelp } = parseArgs(process.argv.slice(2));

  if (showHelp) {
    printHelp();
    return;
  }

  try {
    if (command === "search") {
      const results = searchQuotes(commandArgs.join(" "));
      if (results.length === 0) console.log("No matches found.");
      else results.forEach(r => console.log(r));
      return;
    }
    if (command === "list") {
      const results = listQuotes(commandArgs.join(" "));
      results.forEach(r => console.log(r));
      return;
    }
    if (command === "characters") {
      const results = listCharacters();
      results.forEach(c => console.log(c));
      return;
    }
    if (command === "count") {
      console.log(`Total quotes: ${countQuotes()}`);
      return;
    }

    let result;
    if (mode === "api") {
      result = await getApiQuote({ theme, outputFormat });
    } else {
      result = getOfflineQuote();
    }

    console.log(JSON.stringify(result, null, 2));

  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  parseArgs,
  loadQuotes,
  searchQuotes,
  listQuotes,
  listCharacters,
  countQuotes,
  getOfflineQuote,
  getApiQuote,
  convertImage
};
