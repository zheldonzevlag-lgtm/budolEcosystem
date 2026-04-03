const fs = require('fs');
const { execSync } = require('child_process');

const envs = {
  'DATABASE_URL': 'postgres://c0999becfdd24a3fdf0c431059e54af5b7f61cedbdd336a0c0b9ead004aa22bc:sk_m8mN6a7H1RaICj0gOw19i@db.prisma.io:5432/postgres?sslmode=require',
  'DIRECT_URL': 'postgres://c0999becfdd24a3fdf0c431059e54af5b7f61cedbdd336a0c0b9ead004aa22bc:sk_m8mN6a7H1RaICj0gOw19i@db.prisma.io:5432/postgres?sslmode=require',
  'CLOUDINARY_API_KEY': '537684148625265',
  'CLOUDINARY_API_SECRET': 'USb6SDEDehMLyw9_HlFC1wDqlDE',
  'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME': 'dasfwpg7x'
};

for (const [key, value] of Object.entries(envs)) {
  console.log(`Removing ${key}...`);
  try {
    execSync(`vercel env rm ${key} production -y`, { stdio: 'inherit' });
  } catch(e) {}
  
  console.log(`Adding ${key}...`);
  fs.writeFileSync('temp_env_val.txt', value, 'utf8');
  execSync(`cmd.exe /c "vercel env add ${key} production < temp_env_val.txt"`, { stdio: 'inherit' });
}
fs.unlinkSync('temp_env_val.txt');
console.log('Done!');
