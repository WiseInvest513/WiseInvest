const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Since we can't easily parse TS files in Node.js, we'll define resources here
// Or better: create a JSON file with all resources
// For now, let's read the TS file and extract URLs manually

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '../public/icons/favicons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Helper function to get domain from URL
function getDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch (e) {
    return null;
  }
}

// Helper function to sanitize filename
function sanitizeFilename(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Download favicon from Google's favicon service
function downloadFavicon(url, outputPath) {
  return new Promise((resolve, reject) => {
    const domain = getDomain(url);
    if (!domain) {
      reject(new Error(`Invalid URL: ${url}`));
      return;
    }

    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    const file = fs.createWriteStream(outputPath);
    
    const protocol = faviconUrl.startsWith('https') ? https : http;
    
    protocol.get(faviconUrl, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(outputPath);
        });
      } else {
        file.close();
        fs.unlink(outputPath, () => {});
        reject(new Error(`Failed to download: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      file.close();
      fs.unlink(outputPath, () => {});
      reject(err);
    });
  });
}

// Read resources from TS file using regex extraction
function extractResourcesFromTS() {
  const resourcesDataPath = path.join(__dirname, '../lib/resources-data.ts');
  const content = fs.readFileSync(resourcesDataPath, 'utf-8');
  
  const resources = [];
  // Extract all URL patterns: url: "https://..."
  const urlMatches = content.matchAll(/url:\s*"([^"]+)"/g);
  
  for (const match of urlMatches) {
    const url = match[1];
    // Find the name before this URL (look backwards)
    const beforeMatch = content.substring(0, match.index);
    const nameMatch = beforeMatch.match(/name:\s*"([^"]+)"[^]*?url:\s*"([^"]+)"/);
    if (nameMatch) {
      resources.push({
        name: nameMatch[1],
        url: url
      });
    }
  }
  
  return resources;
}

// Generate icon mapping
async function generateIconMapping() {
  const mapping = {};
  const allResources = extractResourcesFromTS();

  console.log(`Found ${allResources.length} resources to process...\n`);

  // Download favicons
  let successCount = 0;
  let failCount = 0;

  for (const resource of allResources) {
    const domain = getDomain(resource.url);
    if (!domain) {
      console.log(`⚠️  Skipping ${resource.name}: Invalid URL`);
      failCount++;
      continue;
    }

    const filename = `${sanitizeFilename(resource.name)}.png`;
    const filePath = path.join(iconsDir, filename);

    // Skip if already exists
    if (fs.existsSync(filePath)) {
      console.log(`✓ ${resource.name}: Already exists`);
      mapping[resource.url] = `/icons/favicons/${filename}`;
      successCount++;
      continue;
    }

    try {
      await downloadFavicon(resource.url, filePath);
      mapping[resource.url] = `/icons/favicons/${filename}`;
      console.log(`✓ ${resource.name}: Downloaded`);
      successCount++;
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.log(`✗ ${resource.name}: Failed - ${error.message}`);
      failCount++;
    }
  }

  // Save mapping to JSON file
  const mappingPath = path.join(__dirname, '../lib/favicon-mapping.json');
  fs.writeFileSync(
    mappingPath,
    JSON.stringify(mapping, null, 2),
    'utf-8'
  );

  console.log(`\n✅ Completed!`);
  console.log(`   Success: ${successCount}`);
  console.log(`   Failed: ${failCount}`);
  console.log(`   Mapping saved to: ${mappingPath}`);
}

// Run the script
generateIconMapping().catch(console.error);

