#!/usr/bin/env bash
# Exit on error
set -o errexit

cd backend
npm install --legacy-peer-deps
npx puppeteer browsers install chrome
