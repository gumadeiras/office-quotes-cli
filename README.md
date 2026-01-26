# 🎬 office-quotes

> The Office quotes CLI — offline mode (326 quotes) or online mode with SVG cards, character avatars & episode data. Node.js version supports PNG/JPG/WebP conversion.

## Two Versions

| Feature | `office-quotes` (shell) | `office-quotes.js` (Node.js) |
|---------|------------------------|------------------------------|
| Output | Plain text | JSON |
| Image conversion | ❌ | ✅ (Playwright) |
| Dependencies | `jq`, `curl` | Node.js, Playwright |

Use the **shell script** for quick quotes in terminal. Use **Node.js version** for programmatic access + image generation.

## Install
 
### Option 1: Shell CLI (Bash/Zsh)
**One-liner:**
```bash
curl -sSL https://raw.githubusercontent.com/gumadeiras/office-quotes-cli/master/install.sh | bash
```
Requires: `jq` and `curl`

### Option 2: Node.js CLI
**From Source:**
```bash
git clone https://github.com/gumadeiras/office-quotes-cli.git
cd office-quotes-cli
npm install
npm link
```
Now you can run `office-quotes` from anywhere.
*Note: This will override the shell script version if both are installed.*

**Dependencies:**
- Node.js (v14+)
- Playwright (installed via npm)


## Shell Script Usage

### ⚡ Offline Mode
```bash
$ office-quotes
Michael Scott: Dwight, you ignorant slut!

$ office-quotes -q
Bears. Beets. Battlestar Galactica.

$ office-quotes search "bears"
[Jim Halpert]: Bears. Beets. Battlestar Galactica.

$ office-quotes list dwight | head -3
Dwight Schrute: Whenever I'm about to do something...
Dwight Schrute: How would I describe myself?...
Dwight Schrute: 'R' is among the most menacing of sounds...
```

### 🌐 Online Mode
```bash
$ office-quotes api random
<SVG card with quote rendered as image>

$ office-quotes api random --image
https://officeapi.akashrajpurohit.com/quote/random?responseType=svg&mode=dark&width=400&height=200

$ office-quotes api random --light --width 600
<Light theme SVG, 600px wide>

$ office-quotes --episode 3/10 | jq '.title'
"A Benihana Christmas"

$ office-quotes api json | jq '.character'
"Michael Scott"
```

## Node.js Script Usage (`office-quotes.js`)

```bash
# CLI usage
node office-quotes.js                        # Random quote (JSON)
node office-quotes.js count                  # Show total valid quotes
node office-quotes.js search "bears"         # Search quotes
node office-quotes.js list "Dwight"          # List quotes by character
node office-quotes.js characters             # List all characters

# API usage (Online)
node office-quotes.js --mode api --theme dark --format svg

```

### In Node.js Projects
```javascript
const { execSync } = require('child_process');

// Get a random quote
const result = JSON.parse(execSync('node /path/to/office-quotes.js').toString());
console.log(`${result.character}: "${result.quote}"`);

// Get PNG image path (requires Playwright)
const svgResult = JSON.parse(execSync('node office-quotes.js --mode api --theme light --format png').toString());
console.log('Image saved to:', svgResult.imagePath);
```

## Features

| Feature | Offline | Online |
|---------|:-------:|:------:|
| Random quotes | ✅ (326) | ✅ |
| Search | ✅ | — |
| SVG cards | — | ✅ |
| Character avatars | — | ✅ |
| Episode metadata | — | ✅ |

## Credits

- **Offline quotes:** [Raycast Office Quotes](https://github.com/raycast/extensions/tree/main/extensions/office-quotes)
- **Online API:** [the-office-api](https://github.com/AkashRajpurohit/the-office-quotes-api) by Akash Rajpurohit

---

*MIT License — "Would I rather be feared or loved? Easy. Both. I want people to be afraid of how much they love me." — Michael Scott* 🐧
