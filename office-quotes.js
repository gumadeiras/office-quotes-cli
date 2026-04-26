#!/usr/bin/env node

/**
 * office-quotes CLI tool for Clawdbot
 * 
 * Usage: node office-quotes.js [command] [--mode offline|api] [--source local|api] [--theme dark|light] [--format png|jpg] [-q|--quiet]
 */

const API_BASE = "https://officeapi.akashrajpurohit.com";
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

// Check for Playwright
let playwright;
try {
  playwright = require('playwright-chromium');
} catch {
  try {
    playwright = require('playwright');
  } catch {
    // Playwright is optional if not converting images
  }
}

function parseArgs(args) {
  let command = null;
  let mode = "offline";
  let theme = "dark";
  let outputFormat = null;
  let commandArgs = [];
  let showHelp = false;
  let quiet = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "-h" || arg === "--help") {
      showHelp = true;
    } else if (arg === "-q" || arg === "--quiet") {
      quiet = true;
    } else if (arg === "--episode" && args[i + 1]) {
      command = "episode";
      commandArgs = [args[++i]];
    } else if (arg === "--season" && args[i + 1]) {
      command = "season";
      commandArgs = [args[++i]];
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

  // Force API mode if output format is specified
  if (outputFormat && mode !== "api") {
    if (!quiet) console.error("Note: switching to API mode because --format was specified.");
    mode = "api";
  }

  return { command, mode, theme, outputFormat, commandArgs, showHelp, quiet };
}

function printHelp() {
  console.log(`
office-quotes - The Office quote generator

Usage: office-quotes [command] [options]

Commands:
  random              Show a random quote (default)
  list [character]    List all local quotes, optionally by character
  characters          List all characters (local)
  count               Show quote count
  search <query>      Search quotes (local)
  api                 Fetch from online API
  episode <S/E>       Get episode metadata (API, e.g., 3/10)
  season <S>          Get season metadata (API)
  help                Show this help

Options:
  -h, --help          Show this help
  -q, --quiet         Output only the result text (not JSON)
  --source [local|api] Source to fetch from (default: local)
  --theme [dark|light] Theme for SVG (api mode with image only, default: dark)
  --format [png|jpg]   Output image format. (API quotes only, saves to /tmp/)
  --episode <S/E>     Alias for episode command
  --season <S>        Alias for season command

Note: Image generation (--format) only works with random quotes or API mode.
It is not available for metadata commands (episode/season) or local listing.

Examples:
  office-quotes                     # Random local quote
  office-quotes -q                  # Just the quote text
  office-quotes episode 3/10        # Metadata for S3E10
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
    } catch {
      // ignore
    }
  }
  return null;
}

function getQuotesOrError() {
  const quotes = loadQuotes();
  if (!quotes) {
    throw new Error("Could not find quotes.json. Please check your installation.");
  }
  return quotes;
}

function searchQuotes(query) {
  if (!query) throw new Error("Usage: office-quotes search <query>");
  const quotes = getQuotesOrError();
  return quotes
    .filter(q => q.content.toLowerCase().includes(query.toLowerCase()))
    .map(q => `[${q.character}]: ${q.content}`);
}

function listQuotes(character) {
  const quotes = getQuotesOrError();
  let results = character
    ? quotes.filter(q => q.character.toLowerCase().includes(character.toLowerCase()))
    : quotes;
  return results.map(q => `${q.character}: ${q.content}`);
}

function listCharacters() {
  const quotes = getQuotesOrError();
  return [...new Set(quotes.map(q => q.character))].sort();
}

function countQuotes() {
  const quotes = getQuotesOrError();
  return quotes.length;
}

function getOfflineQuote(quotesInput) {
  const quotes = quotesInput || getQuotesOrError();
  if (!quotes || quotes.length === 0) throw new Error("No quotes available.");
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  return { quote: quote.content, character: quote.character };
}

async function fetchApiMetadata(type, identifier) {
  let url;
  if (type === 'episode') {
    const parts = identifier.split('/');
    if (parts.length !== 2) throw new Error("Usage: office-quotes episode S/E (e.g., 3/10)");
    url = `${API_BASE}/season/${parts[0]}/episode/${parts[1]}`;
  } else if (type === 'season') {
    url = `${API_BASE}/season/${identifier}`;
  } else {
    throw new Error("Invalid metadata type");
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status} - ${type} not found.`);
  return await res.json();
}

function isMissingBrowserExecutableError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Executable doesn't exist") ||
    message.includes("browserType.launch") ||
    message.includes("playwright install")
  );
}

function installChromiumBrowser() {
  const result = spawnSync("npx", ["playwright", "install", "chromium"], {
    stdio: "inherit"
  });

  if (result.error) {
    throw new Error(
      `Chromium install failed: ${result.error.message}. Run 'npx playwright install chromium' and retry.`
    );
  }

  if (result.status !== 0) {
    throw new Error(
      "Chromium install failed. Run 'npx playwright install chromium' and retry."
    );
  }
}

async function launchChromiumBrowser() {
  if (!playwright) throw new Error('Playwright not installed. Try: npm install playwright');

  try {
    return await playwright.chromium.launch();
  } catch (error) {
    if (!isMissingBrowserExecutableError(error)) {
      throw error;
    }

    console.error("Chromium browser missing. Installing it now...");
    installChromiumBrowser();
    return playwright.chromium.launch();
  }
}

async function renderWithPlaywright(svgPath, outputFormat) {
  const ext = outputFormat.toLowerCase();

  if (ext !== 'png' && ext !== 'jpg' && ext !== 'jpeg' && ext !== 'svg') {
    throw new Error("Supported formats: png, jpg, svg.");
  }

  const outputPath = svgPath.replace(/\.[^.]+$/, `.${ext}`);
  if (ext === 'svg') return svgPath;

  const svgContent = fs.readFileSync(svgPath, 'utf8');
  const htmlPath = svgPath.replace(/\.svg$/, '.html');
  const htmlContent = `<!DOCTYPE html><html><head><style>
    body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #111827; } 
    svg { max-width: 100%; height: auto; display: block; }
  </style></head><body>${svgContent}</body></html>`;

  fs.writeFileSync(htmlPath, htmlContent);
  const browser = await launchChromiumBrowser();
  try {
    const page = await browser.newPage({
      viewport: { width: 600, height: 400 },
      deviceScaleFactor: 2
    });

    await page.goto('file://' + htmlPath, { waitUntil: 'networkidle' });
    // Additional wait to be safe with font rendering
    await page.waitForTimeout(500);

    const svgElement = page.locator('svg');
    await svgElement.screenshot({
      path: outputPath,
      omitBackground: true
    });
  } finally {
    await browser.close();
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
  const { theme = "dark", outputFormat = null, quiet = false } = options;
  const jsonUrl = `${API_BASE}/quote/random?responseType=json`;

  const jsonRes = await fetch(jsonUrl);
  if (!jsonRes.ok) throw new Error(`API error: ${jsonRes.status}`);
  const data = await jsonRes.json();

  if (!outputFormat) {
    return {
      quote: data.quote,
      character: data.character,
      character_avatar_url: data.character_avatar_url,
      episode: data.episode,
      season: data.season
    };
  }

  if (!quiet) console.error("🎨 Fetching quote card from API...");
  const svgUrl = `${API_BASE}/quote/${data.id}?responseType=svg&mode=${theme}&width=500&height=300`;
  const svgRes = await fetch(svgUrl);
  if (!svgRes.ok) throw new Error(`API image error: ${svgRes.status}`);
  let svgText = await svgRes.text();

  if (!svgText || svgText.trim().length < 100) {
    return { quote: data.quote, character: data.character, error: "API returned invalid image" };
  }

  // Force high-contrast colors and disable animations to ensure text is fully opaque for screenshot
  const textColor = theme === 'light' ? '#111827' : '#ffffff';
  const styleOverride = `<style>
    :root { --text-color: ${textColor} !important; }
    .character-info { fill: ${textColor} !important; opacity: 1 !important; animation: none !important; }
    .quote-text { color: ${textColor} !important; opacity: 1 !important; animation: none !important; }
    .avatar { opacity: 1 !important; animation: none !important; clip-path: none !important; }
  </style>`;
  svgText = svgText.replace('</svg>', `${styleOverride}</svg>`);

  const tempSvg = path.join(os.tmpdir(), `office_quote_${Date.now()}.svg`);
  fs.writeFileSync(tempSvg, svgText);

  if (outputFormat === 'svg') {
    return { quote: data.quote, character: data.character, imagePath: tempSvg, format: 'svg' };
  }

  if (!quiet) console.error("📸 Converting SVG to image...");
  try {
    const conversionResult = await convertImage(tempSvg, outputFormat);
    if (fs.existsSync(tempSvg)) fs.unlinkSync(tempSvg);

    if (conversionResult && conversionResult.status === 'error') {
      return { quote: data.quote, character: data.character, error: conversionResult.error };
    }

    return {
      quote: data.quote,
      character: data.character,
      imagePath: conversionResult,
      format: outputFormat,
      avatarUrl: data.character_avatar_url
    };
  } catch (error) {
    return { quote: data.quote, character: data.character, error: error.message };
  }
}

async function main() {
  const { command, mode, theme, outputFormat, commandArgs, showHelp, quiet } = parseArgs(process.argv.slice(2));

  if (showHelp) return printHelp();

  try {
    const VALID_COMMANDS = [null, "random", "shuffle", "list", "characters", "count", "search", "api", "episode", "season", "help"];
    if (!VALID_COMMANDS.includes(command)) {
      throw new Error(`Unknown command: ${command}\nRun 'office-quotes --help' for usage`);
    }

    // Check for incompatible flags
    if (outputFormat && (command === "episode" || command === "season" || command === "list" || command === "search" || command === "characters" || command === "count")) {
      if (!quiet) console.error("⚠️  Note: Image generation (--format) is only available for quotes from the API. Ignoring image request for this command.");
    }

    if (command === "episode") {
      const metadata = await fetchApiMetadata('episode', commandArgs[0]);
      console.log(JSON.stringify(metadata, null, 2));
      return;
    }
    if (command === "season") {
      const metadata = await fetchApiMetadata('season', commandArgs[0]);
      console.log(JSON.stringify(metadata, null, 2));
      return;
    }
    if (command === "search") {
      const results = searchQuotes(commandArgs.join(" "));
      results.length === 0 ? console.log("No matches found.") : results.forEach(r => console.log(r));
      return;
    }
    if (command === "list") {
      const results = listQuotes(commandArgs.join(" "));
      results.forEach(r => console.log(r));
      return;
    }
    if (command === "characters") {
      listCharacters().forEach(c => console.log(c));
      return;
    }
    if (command === "count") {
      console.log(`Total quotes: ${countQuotes()}`);
      return;
    }

    let result;
    if (mode === "api") {
      result = await getApiQuote({ theme, outputFormat, quiet });
    } else {
      result = getOfflineQuote();
    }

    if (quiet) {
      console.log(result.quote);
    } else {
      console.log(JSON.stringify(result, null, 2));
    }

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
  fetchApiMetadata,
  convertImage
};
