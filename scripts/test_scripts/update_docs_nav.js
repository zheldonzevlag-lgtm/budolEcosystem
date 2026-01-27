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

function buildNavBlock(prevDoc, currentDoc, nextDoc) {
    const parts = [];

    const prevLabel = prevDoc ? `Previous: v${prevDoc.version}` : 'Previous: None';
    const nextLabel = nextDoc ? `Next: v${nextDoc.version}` : 'Next: None';

    const prevHref = prevDoc
        ? `../${prevDoc.folder}/index.html`
        : null;
    const nextHref = nextDoc
        ? `../${nextDoc.folder}/index.html`
        : null;

    parts.push('        <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">');
    parts.push('            <a href="../index.html" style="text-decoration: none; color: #3b82f6; font-weight: bold;">&larr; Main Index</a>');
    parts.push('            <div style="display: flex; gap: 20px;">');

    if (prevHref) {
        parts.push(`                <a href="${prevHref}" style="text-decoration: none; color: #64748b; font-weight: bold;">&larr; ${prevLabel}</a>`);
    } else {
        parts.push(`                <span style="color: #64748b;">&larr; ${prevLabel}</span>`);
    }

    if (nextHref) {
        parts.push(`                <a href="${nextHref}" style="text-decoration: none; color: #3b82f6; font-weight: bold;">${nextLabel} &rarr;</a>`);
    } else {
        parts.push(`                <span style="color: #64748b;">${nextLabel} &rarr;</span>`);
    }

    parts.push('            </div>');
    parts.push('        </div>');

    return parts.join('\n');
}

function ensureNavForDoc(prevDoc, currentDoc, nextDoc) {
    const folderPath = path.join(docsRoot, currentDoc.folder);
    const indexPath = path.join(folderPath, 'index.html');

    if (!fs.existsSync(indexPath)) {
        return;
    }

    let content = fs.readFileSync(indexPath, 'utf8');

    // Case 1: page already has a link back to the main index.
    if (content.includes('../index.html')) {
        // 1a: classic "All Versions" nav style (v2–v70 range).
        if (content.includes('All Versions') && nextDoc && !content.includes('Next Version')) {
            const nextHref = `../${nextDoc.folder}/index.html`;
            const nextLabel = `Next Version (v${nextDoc.version})`;

            // Find the closing tag of the nav container (</div> for v62-style docs).
            const allVersionsIndex = content.indexOf('All Versions');
            if (allVersionsIndex !== -1) {
                let closeIndex = content.indexOf('</div>', allVersionsIndex);
                let closeTag = '</div>';

                if (closeIndex === -1) {
                    closeIndex = content.indexOf('</p>', allVersionsIndex);
                    closeTag = '</p>';
                }

                if (closeIndex !== -1) {
                    const insertPos = closeIndex;
                    const fragment = ` | <a href="${nextHref}">${nextLabel} &rarr;</a>`;
                    content = content.slice(0, insertPos) + fragment + content.slice(insertPos);
                    fs.writeFileSync(indexPath, content, 'utf8');
                    console.log(`Added Next Version link for ${currentDoc.folder}`);
                }
            }
        }

        // 1b: newer "Main Index" header nav (v90+ range).
        // Always ensure the FIRST .nav block (the header menu) has
        // explicit Previous/Next links, regardless of what exists lower
        // in the page.
        if (content.includes('Main Index')) {
            const navIndex = content.indexOf('<div class="nav">');
            if (navIndex !== -1) {
                const openEnd = content.indexOf('>', navIndex);
                const closeDivIndex = content.indexOf('</div>', navIndex);

                if (openEnd !== -1 && closeDivIndex !== -1 && closeDivIndex > openEnd) {
                    const innerStart = openEnd + 1;
                    const innerEnd = closeDivIndex;
                    const navInner = content.slice(innerStart, innerEnd);

                    const hasPrevLink = navInner.includes('Previous') || navInner.includes('← v');
                    const hasNextLink = navInner.includes('Next') || /Next \(v\d+\)/.test(navInner);

                    let fragment = '';

                    if (!hasPrevLink && prevDoc) {
                        const prevHref = `../${prevDoc.folder}/index.html`;
                        fragment += `        <a href="${prevHref}">← Previous (v${prevDoc.version})</a>\n`;
                    }

                    if (!hasNextLink && nextDoc) {
                        const nextHref = `../${nextDoc.folder}/index.html`;
                        fragment += `        <a href="${nextHref}">Next (v${nextDoc.version}) →</a>\n`;
                    }

                    if (fragment) {
                        const insertPos = innerEnd;
                        content = content.slice(0, insertPos) + '\n' + fragment + content.slice(insertPos);
                        fs.writeFileSync(indexPath, content, 'utf8');
                        console.log(`Augmented header nav for ${currentDoc.folder}`);
                    }
                }
            }
        }

        // 1c: generic layouts that only have a bottom "Previous / Index / Next"
        // block (like v122). For these, inject a simple top-level nav just
        // under the <body> tag if it does not already exist.
        if (!content.includes('ecosystem-docs-top-nav')) {
            const prevHref = prevDoc ? `../${prevDoc.folder}/index.html` : null;
            const nextHref = nextDoc ? `../${nextDoc.folder}/index.html` : null;

            const lines = [];
            lines.push('    <div class="nav-links ecosystem-docs-top-nav">');
            if (prevHref) {
                lines.push(`        <a href="${prevHref}">← Previous (v${prevDoc.version})</a>`);
            } else {
                lines.push('        <span>← Previous (none)</span>');
            }
            lines.push('        <a href="../index.html">Index</a>');
            if (nextHref) {
                lines.push(`        <a href="${nextHref}">Next (v${nextDoc.version}) →</a>`);
            } else {
                lines.push('        <span>Next (none) →</span>');
            }
            lines.push('    </div>');

            const topNav = '\n' + lines.join('\n') + '\n';

            const bodyIndex = content.indexOf('<body');
            if (bodyIndex !== -1) {
                const closeIndex = content.indexOf('>', bodyIndex);
                if (closeIndex !== -1) {
                    const insertPos = closeIndex + 1;
                    content = content.slice(0, insertPos) + topNav + content.slice(insertPos);
                    fs.writeFileSync(indexPath, content, 'utf8');
                    console.log(`Inserted top prev/index/next nav for ${currentDoc.folder}`);
                }
            }
        }

        return;
    }

    // Case 2: no main index link at all, inject a full navigation block.
    const navBlock = buildNavBlock(prevDoc, currentDoc, nextDoc);

    const containerMarker = '<div class="container">';
    const bodyMarker = '<body';

    if (content.includes(containerMarker)) {
        const idx = content.indexOf(containerMarker) + containerMarker.length;
        content = content.slice(0, idx) + '\n' + navBlock + content.slice(idx);
    } else {
        const bodyIndex = content.indexOf(bodyMarker);
        if (bodyIndex !== -1) {
            const closeIndex = content.indexOf('>', bodyIndex);
            if (closeIndex !== -1) {
                const insertPos = closeIndex + 1;
                content = content.slice(0, insertPos) + '\n' + navBlock + content.slice(insertPos);
            } else {
                content = navBlock + '\n' + content;
            }
        } else {
            content = navBlock + '\n' + content;
        }
    }

    fs.writeFileSync(indexPath, content, 'utf8');
    console.log(`Updated navigation for ${currentDoc.folder}`);
}

function main() {
    const docs = getDocFolders();

    for (let i = 0; i < docs.length; i++) {
        const prevDoc = i > 0 ? docs[i - 1] : null;
        const currentDoc = docs[i];
        const nextDoc = i < docs.length - 1 ? docs[i + 1] : null;

        ensureNavForDoc(prevDoc, currentDoc, nextDoc);
    }

    console.log(`Processed ${docs.length} documentation versions.`);
}

main();
