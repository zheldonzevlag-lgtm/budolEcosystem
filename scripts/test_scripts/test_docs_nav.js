const fs = require('fs');
const path = require('path');

const docsRoot = path.join(__dirname, '..', '..', 'documentation');

function getDocFolders() {
    const entries = fs.readdirSync(docsRoot, { withFileTypes: true });
    const docs = [];

    for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const name = entry.name;
        if (!name.startsWith('budolecosystem_docs_')) continue;

        const match = name.match(/_v(\d+)$/);
        if (!match) continue;

        const version = parseInt(match[1], 10);
        if (Number.isNaN(version)) continue;

        docs.push({ folder: name, version });
    }

    docs.sort((a, b) => a.version - b.version);
    return docs;
}

function validateNav() {
    const docs = getDocFolders();
    const failures = [];

    for (const doc of docs) {
        const indexPath = path.join(docsRoot, doc.folder, 'index.html');
        if (!fs.existsSync(indexPath)) {
            failures.push({ doc, reason: 'missing index.html' });
            continue;
        }

        const content = fs.readFileSync(indexPath, 'utf8');

        if (!content.includes('../index.html')) {
            failures.push({ doc, reason: 'missing Main Index link' });
        }
    }

    if (failures.length === 0) {
        console.log(`All ${docs.length} documentation versions have navigation links.`);
        process.exit(0);
    }

    console.error('Navigation validation failures:');
    for (const failure of failures) {
        console.error(`- ${failure.doc.folder}: ${failure.reason}`);
    }

    process.exit(1);
}

validateNav();
