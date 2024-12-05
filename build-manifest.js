const fs = require('fs');
const path = require('path');

// Define browser-specific settings
const firefoxSettings = `
  "background": {
    "scripts": ["background.bundle.js"]
  },
  "browser_specific_settings": {
    "gecko": {
      "id": "email@temporary.com",
      "strict_min_version": "91.0"
    }
  },
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'; connect-src 'self' https://ime.dubaicustoms.network https://dev-wallet-api.dubaicustoms.network;"
  }
`;

const chromeSettings = `
  "background": {
    "service_worker": "background.bundle.js",
    "type": "module"
  },
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'; connect-src 'self' https://ime.dubaicustoms.network https://dev-wallet-api.dubaicustoms.network; frame-src 'none';"
  }
`;

// Determine the target browser
const targetBrowser = process.argv[2]; // 'firefox' or 'chrome'

// Input and output file paths
const inputFilePath = path.join(__dirname, 'manifest.template.json');
const outputDir = path.join(__dirname, 'src');
const outputFilePath = path.join(outputDir, 'manifest.json');

// Ensure the output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Load the template manifest
let manifest = fs.readFileSync(inputFilePath, 'utf8');

// Replace the placeholder with the appropriate settings
if (targetBrowser === 'firefox') {
  manifest = manifest.replace('{{BROWSER_SPECIFIC_SETTINGS}}', firefoxSettings);
} else if (targetBrowser === 'chrome') {
  manifest = manifest.replace('{{BROWSER_SPECIFIC_SETTINGS}}', chromeSettings);
} else {
  console.error('Please specify a valid target browser: "firefox" or "chrome".');
  process.exit(1);
}

// Write the output manifest
fs.writeFileSync(outputFilePath, manifest);
console.log(`Manifest generated for ${targetBrowser} at ${outputFilePath}`);
