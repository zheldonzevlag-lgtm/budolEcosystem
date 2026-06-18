const fs = require('fs');
const file = 'app/api/upload/route.js';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
    /if \(image instanceof File\)/g, 
    "if (image && typeof image === 'object' && typeof image.arrayBuffer === 'function')"
);

code = code.replace(
    /const isSVG = image && \(image\.startsWith\('data:image\/svg'\) \|\| image\.includes\('data:image\/svg\+xml'\)\);/g,
    "const isSVG = typeof image === 'string' && (image.startsWith('data:image/svg') || image.includes('data:image/svg+xml'));"
);

code = code.replace(
    /image = `data:\$\{image\.type\};base64,\$\{buffer\.toString\('base64'\)\}`;/g,
    "const mimeType = image.type || 'application/octet-stream';\n                image = `data:${mimeType};base64,${buffer.toString('base64')}`;"
);

fs.writeFileSync(file, code);
console.log("File updated successfully.");
