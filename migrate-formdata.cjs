const fs = require('fs');

const uploadUtilsFile = 'budolshap-0.1.0/lib/uploadUtils.js';
let uploadUtils = fs.readFileSync(uploadUtilsFile, 'utf8');

// Replace image upload logic
uploadUtils = uploadUtils.replace(
    /const compressedFile = await dataUrlToFile\(base64Data, fileOrString\.name \|\| 'upload\.webp'\);\s*const formData = new FormData\(\);\s*formData\.append\('file', compressedFile\);\s*formData\.append\('type', 'product'\);\s*uploadBody = formData;/g,
    "// Send base64 JSON instead of FormData to prevent Vercel 500 error"
);

uploadUtils = uploadUtils.replace(
    /const response = await fetch\('\/api\/upload', {\s*method: 'POST',\s*\.\.\.\(uploadBody\s*\?\s*{\s*body:\s*uploadBody\s*}\s*:\s*{\s*headers:\s*{\s*'Content-Type':\s*'application\/json'\s*},\s*body:\s*JSON\.stringify\({\s*image:\s*base64Data\s*}\)\s*}\)\s*}\);/g,
    "const response = await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: base64Data, type: 'product' }) });"
);

// Replace video upload logic
uploadUtils = uploadUtils.replace(
    /const formData = new FormData\(\);\s*formData\.append\('file', fileOrString\);\s*formData\.append\('type', 'video'\);\s*uploadBody = formData;/g,
    "// Send base64 JSON instead of FormData\n        base64Data = await new Promise((resolve) => {\n            const reader = new FileReader();\n            reader.onload = (e) => resolve(e.target.result);\n            reader.readAsDataURL(fileOrString);\n        });"
);

uploadUtils = uploadUtils.replace(
    /const response = await fetch\('\/api\/upload', {\s*method: 'POST',\s*\.\.\.\(uploadBody\s*\?\s*{\s*body:\s*uploadBody\s*}\s*:\s*{\s*headers:\s*{\s*'Content-Type':\s*'application\/json'\s*},\s*body:\s*JSON\.stringify\({\s*image:\s*base64Data,\s*type:\s*'video'\s*}\)\s*}\)\s*}\);/g,
    "const response = await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: base64Data, type: 'video' }) });"
);

fs.writeFileSync(uploadUtilsFile, uploadUtils);

const dragDropFile = 'budolshap-0.1.0/components/store/add-product/DragDropImageUpload.jsx';
let dragDrop = fs.readFileSync(dragDropFile, 'utf8');

dragDrop = dragDrop.replace(
    /const formData = new FormData\(\);\s*formData\.append\('file', imageObj\.file\);\s*formData\.append\('removeBackground', 'true'\);\s*formData\.append\('type', 'product'\);\s*const response = await fetch\('\/api\/upload', {\s*method: 'POST',\s*body: formData,\s*}\);/g,
    "const base64 = await new Promise((resolve) => {\n            const reader = new FileReader();\n            reader.onload = (e) => resolve(e.target.result);\n            reader.readAsDataURL(imageObj.file);\n          });\n          const response = await fetch('/api/upload', {\n            method: 'POST',\n            headers: { 'Content-Type': 'application/json' },\n            body: JSON.stringify({ image: base64, removeBackground: true, type: 'product' }),\n          });"
);

fs.writeFileSync(dragDropFile, dragDrop);
console.log("Updated files to use JSON instead of FormData.");
