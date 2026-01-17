import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { resourceCategories } from '../lib/resources-data';

// Create icons directory if it doesn't exist
const iconsDir = path.join(process.cwd(), 'public/icons/favicons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Helper function to get domain from URL
function getDomain(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch (e) {
    return null;
  }
}

// Helper function to sanitize filename
function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Download favicon from Google's favicon service
function downloadFavicon(url: string, outputPath: string): Promise<string> {
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

// Generate icon mapping
async function generateIconMapping() {
  const mapping: Record<string, string> = {};
  const allResources: Array<{ name: string; url: string; domain: string | null }> = [];

  // Collect all resources
  resourceCategories.forEach(category => {
    category.items.forEach(resource => {
      allResources.push({
        name: resource.name,
        url: resource.url,
        domain: getDomain(resource.url)
      });
    });
  });

  console.log(`Found ${allResources.length} resources to process...\n`);

  // Download favicons
  let successCount = 0;
  let failCount = 0;

  for (const resource of allResources) {
    if (!resource.domain) {
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
    } catch (error: any) {
      console.log(`✗ ${resource.name}: Failed - ${error.message}`);
      failCount++;
    }
  }

  // Save mapping to JSON file
  const mappingPath = path.join(process.cwd(), 'lib/favicon-mapping.json');
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

