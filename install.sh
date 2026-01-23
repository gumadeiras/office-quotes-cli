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

# Symlink
rm -f "${INSTALL_DIR}/${BIN_NAME}"
ln -sf "${TEMP_DIR}/office-quotes-cli/office-quotes" "${INSTALL_DIR}/${BIN_NAME}"

# Cleanup
rm -rf "${TEMP_DIR}"

# Ensure in PATH
if [[ ":${PATH}:" != *":${INSTALL_DIR}:"* ]]; then
    echo "⚠️  Add ${INSTALL_DIR} to your PATH:"
    echo "   echo 'export PATH=\"${INSTALL_DIR}:\$PATH\"' >> ~/.bashrc"
fi

echo "✅ Installed! Run: office-quotes"
