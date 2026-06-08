const fs = require('fs');
const path = require('path');

const dir = 'd:/IT Projects/clone/budolEcosystem/documentation/budolecosystem_docs_2026-06-08_v1_api_upload';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const template = (title, content) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; }
        h1, h2 { color: #2c3e50; }
        .nav { margin-bottom: 20px; padding: 10px; background: #f1f2f6; border-radius: 5px; }
        .nav a { margin-right: 15px; color: #3498db; text-decoration: none; }
        .nav a:hover { text-decoration: underline; }
        .code-block { background: #282c34; color: #abb2bf; padding: 15px; border-radius: 5px; overflow-x: auto; font-family: monospace; }
    </style>
</head>
<body>
    <div class="nav">
        <a href="index.html">Index</a>
        <a href="task.html">Task</a>
        <a href="workflow.html">Workflow</a>
        <a href="developer_manual.html">Dev Manual</a>
        <a href="system_admin_manual.html">Admin Manual</a>
        <a href="user_manual.html">User Manual</a>
        <a href="risk_register.html">Risk Register</a>
        <a href="Mitigation.html">Mitigation</a>
        <a href="issues & fixes.html">Issues & Fixes</a>
        <a href="test_results.html">Test Results</a>
        <a href="future_recommendations.html">Future Recs</a>
    </div>
    <h1>${title}</h1>
    ${content}
</body>
</html>`;

const files = {
    'index.html': `<p>Documentation for the API Upload 500 Error Fix (Vercel Node Runtime).</p>
                   <p>Date: 2026-06-08</p>`,
    'workflow.html': `<p>1. Detect Error via Vercel Logs<br>2. Analyze API Route<br>3. Fix FormData Object validation<br>4. Commit & Deploy.</p>`,
    'developer_manual.html': `<h2>File: <a href="file:///d:/IT%20Projects/clone/budolEcosystem/budolshap-0.1.0/app/api/upload/route.js">budolshap-0.1.0/app/api/upload/route.js</a></h2>
                              <p>Replaced <code>image instanceof File</code> with a more generic duck-typing check for robust FormData parsing in Next.js Serverless runtime.</p>
                              <div class="code-block">
if (image && typeof image === 'object' && typeof image.arrayBuffer === 'function') {
    // Correctly process the Blob/File stream
}
                              </div>`,
    'system_admin_manual.html': `<p>Monitor Vercel Logs for <code>FUNCTION INVOCATION FAILED</code> which indicates an unhandled exception crashing the lambda worker.</p>`,
    'user_manual.html': `<p>Users can now upload product images and store logos without encountering generic 500 server errors.</p>`,
    'risk_register.html': `<p>Risk: Next.js or Undici updates may change how FormData represents Files.</p>`,
    'Mitigation.html': `<p>Mitigation: Duck-typing <code>arrayBuffer</code> is the safest way to ensure stream compatibility across runtimes.</p>`,
    'issues & fixes.html': `<p><strong>Issue:</strong> 500 Error when uploading image via multipart/form-data.</p><p><strong>Fix:</strong> Corrected instance checking and prevented <code>TypeError</code> on non-string payloads.</p>`,
    'test_results.html': `<p>Locally verified string replacement logic. Developer to test on preview deployment.</p>`,
    'future_recommendations.html': `<p>Standardize all FormData parsing using a reliable utility library or strict TypeScript definitions to prevent runtime TypeErrors.</p>`
};

for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), template(name.replace('.html', '').toUpperCase(), content));
}
console.log("Docs generated.");
