#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install project dependencies
npm install --legacy-peer-deps

# Download Chrome into project cache directory
npx puppeteer browsers install chrome
