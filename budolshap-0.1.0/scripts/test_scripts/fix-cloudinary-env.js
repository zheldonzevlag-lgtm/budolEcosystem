const fs = require('fs');
const path = require('path');

// Correct Cloudinary credentials
const correctCredentials = {
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: 'dasfwpg7x',
  CLOUDINARY_API_KEY: '537684148625265',
  CLOUDINARY_API_SECRET: 'USb6SDEDehMLyw9_HlFC1wDqlDE'
};

// Files to update
const envFiles = ['.env.local', '.env'];

envFiles.forEach(fileName => {
  const filePath = path.join(__dirname, fileName);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  ${fileName} does not exist, skipping...`);
    return;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    // Update each credential
    Object.entries(correctCredentials).forEach(([key, value]) => {
      const regex = new RegExp(`^${key}=.*$`, 'gm');
      if (regex.test(content)) {
        content = content.replace(regex, `${key}=${value}`);
        updated = true;
        console.log(`✅ Updated ${key} in ${fileName}`);
      } else {
        // Add if not exists
        content += `\n${key}=${value}`;
        updated = true;
        console.log(`➕ Added ${key} to ${fileName}`);
      }
    });

    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Successfully updated ${fileName}\n`);
    } else {
      console.log(`ℹ️  No changes needed for ${fileName}\n`);
    }
  } catch (error) {
    console.error(`❌ Error updating ${fileName}:`, error.message);
  }
});

console.log('\n🎉 Done! Please restart your dev server for changes to take effect.');
console.log('Run: npm run dev');
