const { join } = require("path");

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Changes the cache location for Puppeteer to a directory inside the project repository
  // so the downloaded Chrome binary is preserved across Render build & runtime containers.
  cacheDirectory: join(__dirname, ".cache", "puppeteer"),
};
