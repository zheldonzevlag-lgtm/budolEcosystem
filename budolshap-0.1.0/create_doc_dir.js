
const fs = require('fs');
const path = "d:\\IT Projects\\budolEcosystem\\documentation\\budolecosystem_docs_2026-02-17_v1";
if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
    console.log('Directory created');
} else {
    console.log('Directory exists');
}
