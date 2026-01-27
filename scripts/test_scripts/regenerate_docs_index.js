const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, '../../documentation');
const indexFile = path.join(docsDir, 'index.html');

// Header template
const headerHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>budolEcosystem Documentation Index</title>
    <style>
        :root {
            --primary: #3498db;
            --secondary: #2c3e50;
            --bg: #f4f7f6;
            --card-bg: #ffffff;
            --text: #333;
            --muted: #7f8c8d;
        }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            max-width: 1000px; 
            margin: 0 auto; 
            padding: 40px 20px; 
            background: var(--bg); 
            color: var(--text);
        }
        header {
            text-align: center;
            margin-bottom: 50px;
        }
        h1 { 
            color: var(--secondary); 
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        .subtitle {
            color: var(--muted);
            font-size: 1.1em;
        }
        .doc-section {
            margin-bottom: 40px;
        }
        .doc-section h2 {
            color: var(--secondary);
            border-bottom: 2px solid var(--primary);
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .doc-grid { 
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        .doc-item { 
            background: var(--card-bg); 
            padding: 25px; 
            border-radius: 12px; 
            box-shadow: 0 2px 8px rgba(0,0,0,0.06); 
            transition: all 0.3s ease;
            border-left: 6px solid var(--primary);
            display: grid;
            grid-template-columns: 120px 1fr 140px;
            align-items: center;
            gap: 25px;
        }
        .doc-item:hover { 
            transform: translateX(8px);
            box-shadow: 0 8px 20px rgba(0,0,0,0.1);
        }
        .doc-content {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .doc-item a { 
            text-decoration: none; 
            color: var(--primary); 
            font-weight: 700; 
            font-size: 1.2em; 
            margin: 0;
            line-height: 1.2;
        }
        .doc-item p { 
            margin: 0; 
            color: var(--muted); 
            font-size: 1em; 
            line-height: 1.5;
        }
        .version-tag { 
            display: inline-block;
            background: var(--primary); 
            color: white; 
            padding: 4px 12px; 
            border-radius: 20px; 
            font-size: 0.75em; 
            text-align: center;
            justify-self: end;
        }
        .date {
            font-size: 0.9em;
            font-weight: bold;
            color: var(--secondary);
        }
        .recommendation-btn {
            display: inline-block;
            background: #9333ea;
            color: white;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 8px;
            font-weight: bold;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <header>
        <h1>budolEcosystem Documentation Index</h1>
        <p class="subtitle">Central repository for technical documentation, system manuals, and project updates.</p>
        <div style="margin-top: 20px;">
            <a href="recommendations.html" style="background: #f43f5e; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold;">View Future Enhancements & Recommendations</a>
        </div>
    </header>
`;

const footerHTML = `
</body>
</html>`;

function getDocs() {
    const files = fs.readdirSync(docsDir);
    const docs = [];

    files.forEach(file => {
        if (!file.startsWith('budolecosystem_docs_')) return;
        
        // Format: budolecosystem_docs_YYYY-MM-DD_vXXX
        const parts = file.split('_');
        if (parts.length < 4) return;

        const dateStr = parts[2];
        const versionStr = parts[3];
        const versionMatch = versionStr.match(/v(\d+)/);
        
        if (!versionMatch) return;
        
        const version = parseInt(versionMatch[1]);
        const fullPath = path.join(docsDir, file);
        const indexPath = path.join(fullPath, 'index.html');

        if (!fs.existsSync(indexPath)) return;

        // Read index.html to extract title and description
        let content = fs.readFileSync(indexPath, 'utf-8');
        
        // Extract Title
        let title = file;
        const titleMatch = content.match(/<title>(.*?)<\/title>/i);
        if (titleMatch) {
            title = titleMatch[1].replace(/budolPay Ecosystem Documentation - /i, '').replace(/v\d+:\s*/i, '');
            // Clean up common prefixes if any
        } else {
             const h1Match = content.match(/<h1>(.*?)<\/h1>/i);
             if (h1Match) {
                 title = h1Match[1].replace(/<[^>]*>/g, ''); // Remove tags like span
             }
        }

        // Extract Description
        let description = 'No description available.';
        // Look for the first <p> after <h1> or header
        // Simple regex to find <p> content
        const pMatch = content.match(/<p>(.*?)<\/p>/i);
        if (pMatch) {
            description = pMatch[1];
        }

        docs.push({
            version,
            date: dateStr,
            folder: file,
            title: title.trim(),
            description: description.trim()
        });
    });

    return docs.sort((a, b) => b.version - a.version);
}

function generateHTML() {
    const docs = getDocs();
    let html = headerHTML;
    
    // Group by date
    const grouped = {};
    docs.forEach(doc => {
        if (!grouped[doc.date]) grouped[doc.date] = [];
        grouped[doc.date].push(doc);
    });

    // Sort dates descending
    const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    dates.forEach(date => {
        html += `    <div class="doc-section">\n`;
        html += `        <h2>${date}</h2>\n`;
        html += `        <div class="doc-grid">\n`;

        grouped[date].forEach(doc => {
            // Heuristic for color
            let style = '';
            const lowerTitle = doc.title.toLowerCase();
            if (lowerTitle.includes('fix') || lowerTitle.includes('error') || lowerTitle.includes('issue')) {
                style = 'style="border-left-color: #f43f5e; background: #fff1f2;"'; // Red
            } else if (lowerTitle.includes('release') || lowerTitle.includes('mobile')) {
                style = 'style="border-left-color: #27ae60; background: #eafaf1;"'; // Green
            } else if (lowerTitle.includes('lan') || lowerTitle.includes('network')) {
                style = 'style="border-left-color: #8b5cf6; background: #f5f3ff;"'; // Purple
            } else {
                 style = 'style="border-left-color: #3498db; background: #ebf5fb;"'; // Blue (Default)
            }

            html += `            <div class="doc-item" ${style}>\n`;
            html += `                <span class="date">${doc.date}</span>\n`;
            html += `                <div class="doc-content">\n`;
            html += `                    <a href="${doc.folder}/index.html" ${style.includes('#f43f5e') ? 'style="color: #f43f5e;"' : style.includes('#27ae60') ? 'style="color: #27ae60;"' : style.includes('#8b5cf6') ? 'style="color: #8b5cf6;"' : 'style="color: #3498db;"'}>${doc.title}</a>\n`;
            html += `                    <p>${doc.description}</p>\n`;
            html += `                </div>\n`;
            html += `                <span class="version-tag" ${style.includes('#f43f5e') ? 'style="background: #f43f5e;"' : style.includes('#27ae60') ? 'style="background: #27ae60;"' : style.includes('#8b5cf6') ? 'style="background: #8b5cf6;"' : 'style="background: #3498db;"'}>v${doc.version}</span>\n`;
            html += `            </div>\n`;
        });

        html += `        </div>\n`;
        html += `    </div>\n\n`;
    });

    html += footerHTML;
    
    fs.writeFileSync(indexFile, html);
    console.log(`Regenerated index.html with ${docs.length} versions.`);
}

generateHTML();
