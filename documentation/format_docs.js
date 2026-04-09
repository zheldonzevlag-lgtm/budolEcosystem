const fs = require('fs');
const path = require('path');

const docDir = path.join(__dirname, 'budolecosystem_docs_2026-03-28_v27');
const targetSidebarPattern = /<ul class="sidebar-nav">[\s\S]*?<li><a href="future_recommendations\.html"[^>]*>Future Recommendations<\/a><\/li>\s*<\/ul>/;

const newSidebar = `<ul class="sidebar-nav">
            <li><a href="index.html">Overview</a></li>
            <li><a href="implementation_plan.html">Implementation Plan</a></li>
            <li><a href="walkthrough.html">Walkthrough</a></li>
            <li><a href="developer_manual.html">Developer Manual</a></li>
            <li><a href="system_admin_manual.html">System Admin</a></li>
            <li><a href="user_manual.html">User Manual</a></li>
            <li><a href="risk_register.html">Risk Register</a></li>
            <li><a href="Mitigation.html">Mitigations</a></li>
            <li><a href="issues & fixes.html">Issues & Fixes</a></li>
            <li><a href="test_results.html">Test Results</a></li>
            <li><a href="future_recommendations.html">Future Recommendations</a></li>
        </ul>`;

// 1. Update all existing HTML files
const files = fs.readdirSync(docDir).filter(f => f.endsWith('.html'));

let templateHtml = '';

files.forEach(file => {
    const filePath = path.join(docDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Save as template for our new files
    if (file === 'developer_manual.html') {
        templateHtml = content;
    }
    
    // Replace sidebar
    if (targetSidebarPattern.test(content)) {
        content = content.replace(targetSidebarPattern, newSidebar);
        
        // Fix active class issue
        content = content.replace(/class="active"/g, ''); // remove all active classes
        content = content.replace(new RegExp(`href="${file}"`), `href="${file}" class="active"`);
        
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated sidebar in ${file}`);
    } else {
        console.log(`Sidebar pattern not found in ${file}`);
    }
});

// 2. Generate Implementation Plan HTML
const impPlanHtml = templateHtml
    .replace('<title>Developer Manual - v27 Database Mirroring</title>', '<title>Implementation Plan - v27 Gateway Recovery</title>')
    .replace('<h1>Developer Manual</h1>', '<h1>Implementation Plan</h1>')
    .replace('<div class="metadata">\n                <span>Version: 27.0.0</span>\n                <span>Component: Database Migration Cluster</span>\n            </div>', '<div class="metadata">\n                <span>Version: 27.3.0</span>\n                <span>Component: Gateway Recovery</span>\n            </div>')
    .replace(/<div class="card">[\s\S]*<\/div>\s*<\/div>/, `<div class="card">
            <h3>Ecosystem Recovery & Gateway Zero Config (v27.3)</h3>
            <p>Resolve the persistent <code>FUNCTION_INVOCATION_FAILED</code> error in the payment gateway by moving to a standard Vercel <code>api/</code> structure and applying the environment variable trimming hack.</p>
        </div>

        <div class="card">
            <h3>User Review Required</h3>
            <p><strong>GATEWAY URL:</strong> <code>https://payment-gateway-service-two.vercel.app</code> is the primary endpoint.</p>
            <p><strong>DATABASE_URL</strong> synchronization in Vercel sometimes introduces trailing whitespace. The v27.3 update includes a code-level fix to trim these values.</p>
        </div>

        <div class="card">
            <h3>Proposed Changes</h3>
            
            <h4>Payment Gateway (budolpay)</h4>
            <h5>[NEW] api/index.js</h5>
            <ul>
                <li>Relocate the Express application to the <code>api/</code> directory for Vercel Zero Config support.</li>
                <li>Update require paths: <code>require('./packages/...')</code> -> <code>require('../packages/...')</code>.</li>
                <li>Change export signature to <code>module.exports = app</code> for serverless compatibility.</li>
            </ul>

            <h5>[MODIFY] @budolpay/database/index.js</h5>
            <ul>
                <li>Implement <code>DATABASE_URL.trim()</code> to sanitize values from Vercel's environment synchronization.</li>
            </ul>

            <h5>[MODIFY] vercel.json</h5>
            <ul>
                <li>Add <code>rewrites</code> to map all traffic to <code>/api/index.js</code>.</li>
                <li>Add <code>functions</code> config to explicitly <code>includeFiles: ["packages/**"]</code>.</li>
            </ul>

            <h5>[MODIFY] Vercel Environment Variables</h5>
            <ul>
                <li><strong>Synchronize Database URL</strong>: Overwrite the gateway's <code>DATABASE_URL</code> and <code>DIRECT_URL</code> in Vercel settings with the <code>db.prisma.io</code> connection string actively used by <code>budolshap</code>. This ensures the gateway and frontend query the exact same live database instance, bypassing the connection pool timeout occurring on the isolated <code>ep-bitter-wildflower</code> database.</li>
            </ul>
        </div>

        <div class="card">
            <h3>Verification Plan</h3>
            <h4>Manual Verification</h4>
            <ol>
                <li>Verify <code>https://payment-gateway-service-two.vercel.app/health</code> returns 200 OK.</li>
                <li>Perform a live checkout on <code>https://budolshap.vercel.app/cart</code> and verify "Place Order" successfully initializes a transaction via the synchronized database connection.</li>
            </ol>
        </div>
    </div>`)
    .replace(targetSidebarPattern, newSidebar)
    .replace(/href="[^"]+" class="active"/g, 'href="$&"'.replace(' class="active"', ''))
    .replace(`href="implementation_plan.html"`, `href="implementation_plan.html" class="active"`);

fs.writeFileSync(path.join(docDir, 'implementation_plan.html'), impPlanHtml, 'utf8');
console.log('Created implementation_plan.html');

// 3. Generate Walkthrough HTML
const walkHtml = templateHtml
    .replace('<title>Developer Manual - v27 Database Mirroring</title>', '<title>Walkthrough - Ecosystem Recovery</title>')
    .replace('<h1>Developer Manual</h1>', '<h1>Walkthrough</h1>')
    .replace('<div class="metadata">\n                <span>Version: 27.0.0</span>\n                <span>Component: Database Migration Cluster</span>\n            </div>', '<div class="metadata">\n                <span>Version: 27.3.0</span>\n                <span>Component: Gateway Synchronization</span>\n            </div>')
    .replace(/<div class="card">[\s\S]*<\/div>\s*<\/div>/, `<div class="card">
            <h3>Ecosystem Recovery (v27.3)</h3>
            <p>This walkthrough documents the final stabilization of the <code>budolpay</code> Payment Gateway Service and its synchronization with the <code>budolshap</code> frontend on Vercel.</p>
        </div>

        <div class="card">
            <h3>The Issue: "Payment Initiation Failed" (500 Error)</h3>
            <p>During End-to-End browser verification, the <code>budolshap</code> checkout flow consistently failed with <code>Failed to create payment intent [ENV VERCEL: 1]</code>.</p>
            <img src="../../C:/Users/Administrator/.gemini/antigravity/brain/400363fd-fe2a-4fba-b319-05749bbaccca/final_v27_3_success_checkout_1774645510935.webp" alt="Checkout Failure Capture" style="max-width: 100%; border: 1px solid #dfe1e6; border-radius: 4px; margin: 16px 0;">
            <p>By executing a low-level Node.js fetch script, we bypassed the frontend adapter's error swallowing and captured the raw gateway output:</p>
            <blockquote><code>Can't reach database server at 'ep-bitter-wildflower-a1y0z1id-pooler.ap-southeast-1.aws.neon.tech:5432'</code></blockquote>
            
            <h4>Root Cause Analysis</h4>
            <ol>
                <li><strong>Isolated Database Asleep:</strong> The gateway was pointing to <code>ep-bitter-wildflower</code>, an isolated Neon database created during Phase 8. However, Vercel Serverless instances failed to establish connection pools to this endpoint.</li>
                <li><strong>Asymmetric Connections:</strong> Concurrently, the <code>budolshap</code> frontend remained functional because its Vercel environment variables were actively pointing to Prisma Accelerate (<code>db.prisma.io</code>), completely bypassing the dead server.</li>
                <li><strong>Invalid Vercel Bundling:</strong> The legacy gateway was experiencing sporadic <code>Invalid export</code> function invocation failures because Vercel struggle to bundle its Express setup inside a nested <code>packages/</code> directory.</li>
            </ol>
        </div>

        <div class="card">
            <h3>System Fixes Applied</h3>
            
            <h4>1. Database Connection Synchronization</h4>
            <ul>
                <li><strong>Action:</strong> Synchronized the Gateway's Environment Variables.</li>
                <li><strong>Details:</strong> Overwrote the gateway's isolated <code>DATABASE_URL</code> in Vercel with the exact <code>postgres://...db.prisma.io</code> string used by active frontend connections.</li>
                <li><strong>Result:</strong> The gateway now queries the active database, permanently resolving the connection pool timeouts.</li>
            </ul>

            <h4>2. Vercel Zero Config Serverless Transition</h4>
            <ul>
                <li><strong>Action:</strong> Refactored the entry point from <code>index.js</code> to <code>api/index.js</code>.</li>
                <li><strong>Details:</strong> Inlined the <code>PrismaClient</code> initialization and changed the Node export signature to <code>module.exports = app</code>.</li>
                <li><strong>Result:</strong> Resolves the "Invalid export" routing ambiguity, empowering Vercel's Node File Trace (NFT) to successfully bundle the Express routing layer.</li>
            </ul>

            <h4>3. Environment Sanitization</h4>
            <ul>
                <li><strong>Action:</strong> Implemented trailing whitespace sanitization.</li>
                <li><strong>Details:</strong> <code>process.env.DATABASE_URL.trim()</code></li>
                <li><strong>Rationale:</strong> Vercel environment synchronization periodically introduces un-parsable CRLF whitespace into database strings.</li>
            </ul>
        </div>

        <div class="card">
            <h3>Final Verification</h3>
            <p>The checkout intent creation endpoint was tested via Node.js fetch directly following the sync:</p>
            <pre><code>STATUS: 201
BODY: {"success":true,"paymentIntentId":"ef2d8f9d-1cdd-4d2c-afa4-e3546cfa4f27","checkoutUrl":"https://payment-gateway-service-two.vercel.app/checkout/JON-20260327214949-AD4086EC"}</code></pre>
            <p>The ecosystem is now synchronized on a unified connection string and functionally stabilized.</p>
        </div>
    </div>`)
    .replace(targetSidebarPattern, newSidebar)
    .replace(/href="[^"]+" class="active"/g, 'href="$&"'.replace(' class="active"', ''))
    .replace(`href="walkthrough.html"`, `href="walkthrough.html" class="active"`);

fs.writeFileSync(path.join(docDir, 'walkthrough.html'), walkHtml, 'utf8');
console.log('Created walkthrough.html');
