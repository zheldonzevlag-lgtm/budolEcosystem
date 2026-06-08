const fs = require('fs');

function convertToJSONPayload(filePath, pattern, fileVarName, typeVarName) {
    if (!fs.existsSync(filePath)) {
        console.log(`Skipping ${filePath} (not found)`);
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Create the replacement string
    const replacement = `
            const base64 = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(${fileVarName});
            });
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64, type: '${typeVarName}' })
            });
    `.trim();

    const originalContent = content;
    
    // Use regex to replace the FormData block
    // We match the creation of FormData and the fetch call
    content = content.replace(pattern, replacement);
    
    if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
        console.log(`Updated ${filePath}`);
    } else {
        console.log(`No changes made to ${filePath}`);
    }
}

// 1. components/store/StoreSidebar.jsx
convertToJSONPayload(
    'budolshap-0.1.0/components/store/StoreSidebar.jsx',
    /const formData = new FormData\(\)[\s\S]*?formData\.append\('file', file\)[\s\S]*?formData\.append\('type', 'store'\)[\s\S]*?const uploadRes = await fetch\('\/api\/upload', {\s*method: 'POST',\s*body: formData\s*}\)/g,
    'file',
    'store'
);

// We'll also just replace "const uploadRes" with "const uploadRes" inside the replacement so variable name matches
function customReplace(filePath, regex, replacement) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(regex, replacement);
    fs.writeFileSync(filePath, content);
}

// 1. components/store/StoreSidebar.jsx
customReplace(
    'budolshap-0.1.0/components/store/StoreSidebar.jsx',
    /const formData = new FormData\(\)[\s\S]*?formData\.append\('file', file\)[\s\S]*?formData\.append\('type', 'store'\)[\s\S]*?const uploadRes = await fetch\('\/api\/upload', {\s*method: 'POST',\s*body: formData\s*}\)/g,
    `const base64 = await new Promise((resolve) => { const reader = new FileReader(); reader.onload = (e) => resolve(e.target.result); reader.readAsDataURL(file); });
            const uploadRes = await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: base64, type: 'store' }) })`
);

// 2. components/payment/PaymentProofUpload.jsx
customReplace(
    'budolshap-0.1.0/components/payment/PaymentProofUpload.jsx',
    /const formData = new FormData\(\)[\s\S]*?formData\.append\('file', selectedFile\)[\s\S]*?formData\.append\('type', 'order'\)[\s\S]*?const uploadRes = await fetch\('\/api\/upload', {\s*method: 'POST',\s*body: formData\s*}\)/g,
    `const base64 = await new Promise((resolve) => { const reader = new FileReader(); reader.onload = (e) => resolve(e.target.result); reader.readAsDataURL(selectedFile); });
            const uploadRes = await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: base64, type: 'order' }) })`
);

// 3. components/orders/ReturnRequestModal.jsx
customReplace(
    'budolshap-0.1.0/components/orders/ReturnRequestModal.jsx',
    /const formData = new FormData\(\)[\s\S]*?formData\.append\('file', file\)[\s\S]*?formData\.append\('type', 'order'\)[\s\S]*?const res = await fetch\('\/api\/upload', {\s*method: 'POST',\s*body: formData\s*}\)/g,
    `const base64 = await new Promise((resolve) => { const reader = new FileReader(); reader.onload = (e) => resolve(e.target.result); reader.readAsDataURL(file); });
                const res = await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: base64, type: 'order' }) })`
);

// 4. components/admin/AdminSidebar.jsx
customReplace(
    'budolshap-0.1.0/components/admin/AdminSidebar.jsx',
    /const formData = new FormData\(\)[\s\S]*?formData\.append\('file', file\)[\s\S]*?formData\.append\('type', 'profile'\)[\s\S]*?const response = await fetch\('\/api\/upload', {\s*method: 'POST',\s*body: formData\s*}\)/g,
    `const base64 = await new Promise((resolve) => { const reader = new FileReader(); reader.onload = (e) => resolve(e.target.result); reader.readAsDataURL(file); });
            const response = await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: base64, type: 'profile' }) })`
);

// 5. components/admin/VariationMatrixManager.jsx
customReplace(
    'budolshap-0.1.0/components/admin/VariationMatrixManager.jsx',
    /const formData = new FormData\(\)[\s\S]*?formData\.append\('file', file\)[\s\S]*?formData\.append\('type', 'product'\)[\s\S]*?const response = await fetch\('\/api\/upload', {\s*method: 'POST',\s*body: formData\s*}\)/g,
    `const base64 = await new Promise((resolve) => { const reader = new FileReader(); reader.onload = (e) => resolve(e.target.result); reader.readAsDataURL(file); });
            const response = await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: base64, type: 'product' }) })`
);

// 6. app/store/settings/page.jsx
customReplace(
    'budolshap-0.1.0/app/store/settings/page.jsx',
    /const formData = new FormData\(\)[\s\S]*?formData\.append\('file', file\)[\s\S]*?formData\.append\('type', 'store'\)[\s\S]*?const uploadResponse = await fetch\('\/api\/upload', {\s*method: 'POST',\s*body: formData\s*}\)/g,
    `const base64 = await new Promise((resolve) => { const reader = new FileReader(); reader.onload = (e) => resolve(e.target.result); reader.readAsDataURL(file); });
                    const uploadResponse = await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: base64, type: 'store' }) })`
);

// 7. app/admin/settings/marketing-ads/page.jsx
customReplace(
    'budolshap-0.1.0/app/admin/settings/marketing-ads/page.jsx',
    /const fd = new FormData\(\)[\s\S]*?fd\.append\('file', file\)[\s\S]*?fd\.append\('type', 'marketing'\)[\s\S]*?const res = await fetch\('\/api\/upload', \{ method: 'POST', body: fd \}\)/g,
    `const base64 = await new Promise((resolve) => { const reader = new FileReader(); reader.onload = (e) => resolve(e.target.result); reader.readAsDataURL(file); });
                                                const res = await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: base64, type: 'marketing' }) })`
);

// 8. app/(public)/profile/page.jsx
customReplace(
    'budolshap-0.1.0/app/(public)/profile/page.jsx',
    /const formData = new FormData\(\)[\s\S]*?formData\.append\('file', file\)[\s\S]*?formData\.append\('type', 'profile'\)[\s\S]*?const uploadResponse = await fetch\('\/api\/upload', {\s*method: 'POST',\s*body: formData\s*}\)/g,
    `const base64 = await new Promise((resolve) => { const reader = new FileReader(); reader.onload = (e) => resolve(e.target.result); reader.readAsDataURL(file); });
        const uploadResponse = await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: base64, type: 'profile' }) })`
);

console.log("Replacements complete.");
