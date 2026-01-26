# 🎬 office-quotes

> **"Dunder Mifflin, this is Pam."** 📞

A simple CLI for *The Office* fans. Get instant access to 326 curated quotes offline, or hit the live API for beautiful SVG cards and metadata.

## 🚀 Get Started

**Recommended (Node.js):**
```bash
npm install -g office-quotes-cli
```

**Fastest (Bash/Zsh One-liner):**
```bash
curl -sSL https://raw.githubusercontent.com/gumadeiras/office-quotes-cli/master/install.sh | bash
```

---

## 📠 Usage

### ⚡ The Basics (Offline)
```bash
office-quotes                # Random local quote
office-quotes search "bears" # Search for specific wisdom
office-quotes characters     # Who said what?
```

### 🌐 The "Fancy" Mode (API)
Connect to the Dunder Mifflin cloud for cards and metadata.
```bash
office-quotes --source api           # Fresh quote from the cloud
office-quotes --format png           # Boom! PNG card (saved to /tmp/)
office-quotes --format jpg --theme light # For those who like the light mode
```

---

## 📊 Which one should I use?

| | Node.js (mapped to `office-quotes`) | Shell Script |
| --- | --- | --- |
| **Why?** | Images, JSON, API Power | Speed, Simplicity |
| **Output** | JSON | Plain Text |
| **Needs** | Node.js | `jq`, `curl` |


## Credits

- **Offline quotes:** [Raycast Office Quotes](https://github.com/raycast/extensions/tree/main/extensions/office-quotes)
- **Online API:** [the-office-api](https://github.com/AkashRajpurohit/the-office-quotes-api) by Akash Rajpurohit


---

<p align="center">
  <i>"I'm not superstitious, but I am a little stitious."</i> — <b>Michael Scott</b>
</p>

*MIT License.*

🐧