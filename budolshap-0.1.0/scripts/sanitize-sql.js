import fs from 'fs';

const inputFile = '../budolshap_1db_plain.sql';
const outputFile = '../budolshap_1db_vercel_ready.sql';

const content = fs.readFileSync(inputFile, 'utf8');

// 1. Remove OWNER TO postgres
// 2. Remove \restrict
// 3. Remove standard_conforming_strings and other SETs that might fail if redundant
// 4. Remove SELECT pg_catalog.set_config('search_path', '', false);
//    Actually, we should KEEP search_path but maybe set it to public, budolid, budolpay
const lines = content.split('\n');
const filteredLines = lines.filter(line => {
  if (line.includes('OWNER TO postgres')) return false;
  if (line.startsWith('\\')) return false; // Remove \restrict, \connect etc.
  return true;
});

fs.writeFileSync(outputFile, filteredLines.join('\n'));
console.log('Sanitized SQL saved to:', outputFile);
