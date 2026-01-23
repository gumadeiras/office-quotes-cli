# 🎬 office-quotes

> The Office quotes CLI — offline mode with 326 quotes, or online mode with SVG cards, character avatars, and full episode metadata.

[![GitHub stars](https://img.shields.io/github/stars/gumadeiras/office-quotes-cli)](https://github.com/gumadeiras/office-quotes-cli)
[![GitHub license](https://img.shields.io/github/license/gumadeiras/office-quotes-cli)](https://github.com/gumadeiras/office-quotes-cli)

## Install

```bash
# Clone the repo
git clone https://github.com/gumadeiras/office-quotes-cli.git

# Symlink to your PATH
ln -sf ~/office-quotes-cli/office-quotes ~/bin/office-quotes

# Verify it works
office-quotes
```

Requires: `jq` and `curl`

## Usage

### ⚡ Offline Mode (326 local quotes)

```bash
office-quotes                     # Random quote
office-quotes random              # Same
office-quotes -q                  # Quote only (no character)
office-quotes list dwight         # Dwight quotes only
office-quotes list michael        # Michael quotes only
office-quotes characters          # List all characters
office-quotes count               # Show quote count
office-quotes search "bears"      # Search quotes
```

### 🌐 Online Mode (API + SVG cards + Episode data)

```bash
# Random quote as SVG card
office-quotes api random

# Get SVG image URL for embedding
office-quotes api random --image
https://officeapi.akashrajpurohit.com/quote/random?responseType=svg&mode=dark&width=400&height=200

# Light theme SVG
office-quotes api random --light

# Custom size SVG
office-quotes api random --width 600 --height 300

# JSON response with character avatar
office-quotes api json
# {"id":45,"character":"Michael Scott","quote":"...","character_avatar_url":"..."}

# Episode metadata
office-quotes --episode 3/10
# {"season":3,"episode":10,"title":"A Benihana Christmas","airDate":"2006-12-14","imdbRating":8.8,...}

# Season overview
office-quotes --season 1
```

## Features

| Feature | Offline | Online |
|---------|:-------:|:------:|
| Random quotes | ✅ (326) | ✅ (unlimited) |
| Search | ✅ | — |
| SVG cards | — | ✅ |
| Character avatars | — | ✅ |
| Episode metadata | — | ✅ |
| IMDB ratings | — | ✅ |

## Data Sources

### Offline Quotes
Based on the excellent **[Raycast Office Quotes](https://github.com/raycast/extensions/tree/main/extensions/office-quotes)** extension by the Raycast team.

### Online API
Powered by **[the-office-api](https://github.com/AkashRajpurohit/the-office-quotes-api)** by [Akash Rajpurohit](https://github.com/AkashRajpurohit) — a fantastic REST API with SVG card generation, character avatars, and complete episode data.

## Examples

```bash
$ office-quotes
Michael Scott: Dwight, you ignorant slut!

$ office-quotes -q
Bears. Beets. Battlestar Galactica.

$ office-quotes search "that's what she said"
[Michael Scott]: That's what she said!

$ office-quotes --episode 3/10 | jq '.title'
"A Benihana Christmas"
```

## License

MIT — feel free to use, modify, and share.

---

> "Would I rather be feared or loved? Easy. Both. I want people to be afraid of how much they love me." — Michael Scott
