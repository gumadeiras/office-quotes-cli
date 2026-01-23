# 🎬 office-quotes

> The Office quotes CLI — offline mode (326 quotes) or online mode with SVG cards, character avatars & episode data.

## Install

**One-liner:**
```bash
curl -sSL https://raw.githubusercontent.com/gumadeiras/office-quotes-cli/master/install.sh | bash
```

**Or manually:**
```bash
git clone https://github.com/gumadeiras/office-quotes-cli.git
ln -sf ~/office-quotes-cli/office-quotes ~/bin/office-quotes
office-quotes
```

Requires: `jq` and `curl`

## Usage

### ⚡ Offline Mode
```bash
office-quotes                     # Random quote
office-quotes -q                  # Quote only
office-quotes list dwight         # By character
office-quotes search "bears"      # Search
```

### 🌐 Online Mode
```bash
office-quotes api random          # SVG card
office-quotes api random --light  # Light theme
office-quotes api json            # JSON + avatar
office-quotes --episode 3/10      # Episode info
```

## JavaScript Examples

```javascript
// Run as CLI script
node office-quotes.js --mode api --theme dark --format svg

// Import in your Node.js project
const { execSync } = require('child_process');

// Get a random quote
const result = JSON.parse(execSync('node /path/to/office-quotes.js').toString());
console.log(`${result.character}: "${result.quote}"`);

// Get SVG image path (requires Playwright)
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

*MIT License* 

>Would I rather be feared or loved? Easy. Both. I want people to be afraid of how much they love me. - Michael Scott

🐧
