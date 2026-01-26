#!/usr/bin/env bash
set -e

REPO_URL="https://github.com/gumadeiras/office-quotes-cli.git"
INSTALL_DIR="${HOME}/.local/bin"
BIN_NAME="office-quotes"

echo "📦 Installing office-quotes..."

# Clone if not exists
if [ ! -d "${INSTALL_DIR}" ]; then
    mkdir -p "${INSTALL_DIR}"
fi

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMP_DIR=$(mktemp -d)

# Clone repo
git clone --quiet --depth 1 "${REPO_URL}" "${TEMP_DIR}/office-quotes-cli"

# Copy executable (instead of symlink to temp dir)
rm -f "${INSTALL_DIR}/${BIN_NAME}"
cp "${TEMP_DIR}/office-quotes-cli/office-quotes" "${INSTALL_DIR}/${BIN_NAME}"
chmod +x "${INSTALL_DIR}/${BIN_NAME}"

# Install data files
SHARE_DIR="${HOME}/.local/share/office-quotes-cli"
mkdir -p "${SHARE_DIR}"
rm -rf "${SHARE_DIR}/data"
cp -r "${TEMP_DIR}/office-quotes-cli/data" "${SHARE_DIR}/"

# Cleanup
rm -rf "${TEMP_DIR}"

# PATH check - add to both bashrc and zshrc if they exist
if [[ ":${PATH}:" != *":${INSTALL_DIR}:"* ]]; then
    echo "⚠️  Adding ${INSTALL_DIR} to PATH..."
    for rc in "$HOME/.bashrc" "$HOME/.zshrc"; do
        if [ -f "$rc" ]; then
            if ! grep -q "${INSTALL_DIR}" "$rc" 2>/dev/null; then
                echo "export PATH=\"${INSTALL_DIR}:\$PATH\"" >> "$rc"
            fi
        fi
    done
fi

echo "✅ Installed! Run: office-quotes"
