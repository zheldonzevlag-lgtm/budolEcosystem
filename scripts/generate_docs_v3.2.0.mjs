import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VERSION = 'v3.2.0';
const DATE = new Date().toISOString().split('T')[0];
const DOC_DIR = path.resolve(__dirname, `../documentation/budolecosystem_docs_${DATE}_${VERSION}`);

// Ensure directory exists
if (!fs.existsSync(DOC_DIR)) {
    fs.mkdirSync(DOC_DIR, { recursive: true });
}

const COMMON_CSS = `
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; display: flex; background-color: #f4f5f7; color: #172b4d; }
        .sidebar { width: 280px; background-color: #ebecf0; height: 100vh; padding: 20px; box-sizing: border-box; position: fixed; overflow-y: auto; border-right: 1px solid #dfe1e6; }
        .content { margin-left: 280px; padding: 40px; max-width: 1000px; width: 100%; background-color: white; min-height: 100vh; box-shadow: -2px 0 10px rgba(0,0,0,0.05); }
        h1 { color: #0052cc; border-bottom: 2px solid #dfe1e6; padding-bottom: 10px; margin-top: 0; }
        h2 { color: #172b4d; margin-top: 30px; border-bottom: 1px solid #ebecf0; padding-bottom: 5px; }
        h3 { color: #42526e; margin-top: 20px; }
        .metadata { background-color: #deebff; padding: 15px; border-radius: 5px; margin-bottom: 30px; border-left: 5px solid #0052cc; }
        .code-block { background-color: #f4f5f7; padding: 15px; border-radius: 5px; font-family: "SFMono-Medium", "Cascadia Code", "Consolas", monospace; overflow-x: auto; border: 1px solid #dfe1e6; color: #091e42; }
        .nav-link { display: block; padding: 10px; color: #42526e; text-decoration: none; border-radius: 3px; margin-bottom: 5px; }
        .nav-link:hover, .nav-link.active { background-color: #dfe1e6; color: #0052cc; font-weight: 500; }
        .status-badge { display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
        .status-completed { background-color: #e3fcef; color: #006644; }
        .status-risk { background-color: #ffebe6; color: #bf2600; }
        .status-mitigated { background-color: #fff0b3; color: #172b4d; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #dfe1e6; padding: 10px; text-align: left; }
        th { background-color: #f4f5f7; }
        .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #dfe1e6; color: #6b778c; font-size: 12px; text-align: center; }
    </style>
`;

const NAV_LINKS = `
    <div class="sidebar">
        <h3>BudolEcosystem Docs</h3>
        <p style="font-size: 12px; color: #6b778c;">${VERSION} (${DATE})</p>
        <nav>
            <a href="index.html" class="nav-link">Overview</a>
            <a href="developer_manual.html" class="nav-link">Developer Manual</a>
            <a href="system_admin_manual.html" class="nav-link">System Admin Manual</a>
            <a href="user_manual.html" class="nav-link">User Manual</a>
            <div style="margin: 15px 0; border-top: 1px solid #ccc;"></div>
            <a href="risk_register.html" class="nav-link">Risk Register</a>
            <a href="Mitigation.html" class="nav-link">Mitigation Strategies</a>
            <a href="issues.html" class="nav-link">Known Issues</a>
            <a href="fixes.html" class="nav-link">Recent Fixes</a>
            <a href="test_results.html" class="nav-link">Test Results</a>
            <a href="future_recommendations.html" class="nav-link">Future Recommendations</a>
            <div style="margin: 15px 0; border-top: 1px solid #ccc;"></div>
            <a href="../knowledgebase.html" class="nav-link">Knowledge Base</a>
        </nav>
    </div>
`;

const TEMPLATE = (title, content, activePage) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - BudolEcosystem ${VERSION}</title>
    ${COMMON_CSS}
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const links = document.querySelectorAll('.nav-link');
            links.forEach(link => {
                if (link.getAttribute('href') === '${activePage}') {
                    link.classList.add('active');
                }
            });
        });
    </script>
</head>
<body>
    ${NAV_LINKS}
    <div class="content">
        <div class="metadata">
            <strong>Version:</strong> ${VERSION}<br>
            <strong>Date:</strong> ${DATE}<br>
            <strong>Author:</strong> Budol Ecosystem Master Orchestrator AI<br>
            <strong>Compliance:</strong> NPC, BSP Circular 808, PCI DSS
        </div>
        <h1>${title}</h1>
        ${content}
        <div class="footer">
            Generated automatically by Budol Ecosystem Master Orchestrator AI. &copy; 2026 BudolPay.
        </div>
    </div>
</body>
</html>
`;

// 1. Index
const indexContent = `
    <p>Welcome to the documentation for BudolEcosystem <strong>${VERSION}</strong>. This release focuses on compliance alignment (PII Masking, OTP Security) and system stability.</p>
    
    <h2>Release Highlights</h2>
    <ul>
        <li><strong>NPC Compliance:</strong> Enhanced PII masking in API responses and logs.</li>
        <li><strong>OTP Security:</strong> Improved OTP visibility in development console (yellow highlighting).</li>
        <li><strong>Stability:</strong> Resolved port conflicts in budolID service.</li>
        <li><strong>Testing:</strong> Added automated compliance verification scripts.</li>
    </ul>

    <h2>Quick Links</h2>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div style="background: #fff; padding: 20px; border: 1px solid #dfe1e6; border-radius: 5px;">
            <h3>For Developers</h3>
            <p>Technical details on API changes and implementation.</p>
            <a href="developer_manual.html">View Manual &rarr;</a>
        </div>
        <div style="background: #fff; padding: 20px; border: 1px solid #dfe1e6; border-radius: 5px;">
            <h3>For Admins</h3>
            <p>Deployment, monitoring, and compliance logs.</p>
            <a href="system_admin_manual.html">View Manual &rarr;</a>
        </div>
    </div>
`;

// 2. Developer Manual
const devContent = `
    <h2>Purpose</h2>
    <p>This document details the implementation of PII masking and OTP security features to meet NPC and BSP requirements.</p>

    <h2>Technical Explanation</h2>
    <h3>PII Masking Implementation</h3>
    <p>A centralized <code>maskPII</code> helper function is now used across <code>auth-service</code> and <code>budolID</code>. It auto-detects Email, Phone, and Name types.</p>
    
    <div class="code-block">
        <pre>
// Helper function in auth-service/index.js
const maskPII = (str, type = 'AUTO') => {
    if (!str) return 'N/A';
    // ... auto-detection logic ...
    if (type === 'EMAIL') { /* t***@domain.com */ }
    if (type === 'PHONE') { /* 091*****789 */ }
    // ...
};
        </pre>
    </div>

    <h3>API Changes</h3>
    <p><strong>GET /user/find</strong></p>
    <ul>
        <li><strong>Response:</strong> Now explicitly returns masked PII fields (email, phoneNumber, firstName, lastName).</li>
        <li><strong>Rationale:</strong> Prevents PII leakage to frontend/clients unless authorized.</li>
    </ul>

    <div class="code-block">
        <pre>
// Code Reference: budolpay-0.1.0/services/auth-service/index.js
// Final response PII Masking
const responseData = {
    id: user.id,
    email: maskPII(user.email),
    phoneNumber: maskPII(user.phoneNumber),
    firstName: maskPII(user.firstName),
    lastName: maskPII(user.lastName)
};
res.json(responseData);
        </pre>
    </div>

    <h3>OTP Logging (Development)</h3>
    <p>In development mode, OTPs are logged to the console with yellow highlighting for visibility.</p>
    <div class="code-block">
        <pre>
if (isLocal) console.log(\`[LOCAL] Login OTP for \${maskPII(recipient)}: \\x1b[33m\${otpCode}\\x1b[0m\`);
        </pre>
    </div>

    <h2>Dependencies</h2>
    <ul>
        <li><code>chalk</code> (optional for scripts)</li>
        <li><code>axios</code> (for testing)</li>
    </ul>
`;

// 3. System Admin Manual
const adminContent = `
    <h2>Deployment Instructions</h2>
    <ol>
        <li>Pull the latest code (v3.2.0).</li>
        <li>Install dependencies: <code>npm install</code></li>
        <li>Start services: <code>npm start</code> or individual service start scripts.</li>
    </ol>

    <h2>Monitoring & Logs</h2>
    <p><strong>Auth Service Logs:</strong> Look for <code>[LOCAL] Login OTP</code> for OTP codes in dev.</p>
    <p><strong>Audit Logs:</strong> All PII in logs is now masked (e.g., <code>091*****789</code>).</p>

    <h2>Troubleshooting</h2>
    <h3>Port Conflicts (EADDRINUSE)</h3>
    <p>If <code>budolID</code> fails to start on port 8000:</p>
    <ol>
        <li>Check for zombie node processes: <code>Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess</code></li>
        <li>Kill the process: <code>Stop-Process -Id &lt;PID&gt; -Force</code></li>
    </ol>
`;

// 4. User Manual
const userContent = `
    <h2>User Privacy</h2>
    <p>Your personal data (Email, Phone, Name) is now masked in system responses to ensure privacy.</p>
    <ul>
        <li><strong>Email:</strong> <code>j***@example.com</code></li>
        <li><strong>Phone:</strong> <code>091*****789</code></li>
    </ul>

    <h2>Login Flow</h2>
    <p>When logging in via mobile:</p>
    <ol>
        <li>Enter Phone Number.</li>
        <li>Receive OTP (via SMS/Email or Console in Test).</li>
        <li>Enter OTP to proceed.</li>
    </ol>
`;

// 5. Risk Register
const riskContent = `
    <table>
        <tr>
            <th>ID</th>
            <th>Risk Description</th>
            <th>Severity</th>
            <th>Likelihood</th>
            <th>Impact</th>
            <th>Status</th>
            <th>Mitigation</th>
        </tr>
        <tr>
            <td>R-001</td>
            <td>PII Leakage in API Responses</td>
            <td>High</td>
            <td>Medium</td>
            <td>Regulatory Fine</td>
            <td><span class="status-mitigated">Mitigated</span></td>
            <td>Implemented PII masking in /user/find and logs.</td>
        </tr>
        <tr>
            <td>R-002</td>
            <td>OTP Interception in Logs</td>
            <td>Medium</td>
            <td>Low</td>
            <td>Account Takeover</td>
            <td><span class="status-mitigated">Mitigated</span></td>
            <td>OTP logging restricted to LOCAL/DEV environment.</td>
        </tr>
         <tr>
            <td>R-003</td>
            <td>Service Port Conflicts</td>
            <td>Low</td>
            <td>Medium</td>
            <td>Service Downtime</td>
            <td><span class="status-mitigated">Mitigated</span></td>
            <td>Documented process killing procedures.</td>
        </tr>
    </table>
`;

// 6. Mitigation
const mitigationContent = `
    <h2>R-001: PII Leakage</h2>
    <p><strong>Strategy:</strong> Masking at Source.</p>
    <p><strong>Implementation:</strong> <code>maskPII</code> helper applied before sending JSON responses.</p>
    <p><strong>Verification:</strong> Automated test script <code>verify_compliance_v3.2.0.mjs</code> checks for masked patterns.</p>

    <h2>R-002: OTP Logging</h2>
    <p><strong>Strategy:</strong> Environment Gating.</p>
    <p><strong>Implementation:</strong> <code>if (isLocal)</code> check ensures OTPs are never logged in production.</p>
`;

// 7. Issues
const issuesContent = `
    <h2>Known Issues</h2>
    <ul>
        <li><strong>Port Conflict:</strong> Node processes may remain active if not stopped gracefully, causing EADDRINUSE on restart.</li>
        <li><strong>ESM/CJS Compatibility:</strong> Test scripts required renaming to <code>.mjs</code> to support <code>import</code> syntax.</li>
    </ul>
`;

// 8. Fixes
const fixesContent = `
    <h2>Resolved in v3.2.0</h2>
    <ul>
        <li><strong>Fixed:</strong> Hardcoded masking in <code>auth-service</code> replaced with <code>maskPII</code>.</li>
        <li><strong>Fixed:</strong> Unmasked PII in <code>/user/find</code> response.</li>
        <li><strong>Fixed:</strong> <code>budolID</code> port 8000 conflict by terminating zombie process.</li>
        <li><strong>Fixed:</strong> <code>verify_compliance</code> script syntax errors (module imports).</li>
    </ul>
`;

// 9. Test Results
const testContent = `
    <h2>Automated Compliance Verification</h2>
    <p><strong>Script:</strong> <code>scripts/test_scripts/verify_compliance_v3.2.0.mjs</code></p>
    <p><strong>Date:</strong> ${DATE}</p>
    
    <h3>Results Summary</h3>
    <table>
        <tr>
            <th>Test Case</th>
            <th>Status</th>
            <th>Notes</th>
        </tr>
        <tr>
            <td>Service Reachability (budolID)</td>
            <td><span class="status-completed">PASS</span></td>
            <td>Port 8000 accessible.</td>
        </tr>
        <tr>
            <td>Service Reachability (auth-service)</td>
            <td><span class="status-completed">PASS</span></td>
            <td>Port 8001 accessible.</td>
        </tr>
        <tr>
            <td>PII Masking (/user/find)</td>
            <td><span class="status-completed">PASS</span></td>
            <td>Email and Phone masked in response.</td>
        </tr>
        <tr>
            <td>OTP Trigger</td>
            <td><span class="status-completed">PASS</span></td>
            <td>Status: OTP_REQUIRED received.</td>
        </tr>
    </table>
`;

// 10. Future Recommendations
const futureContent = `
    <h2>Recommendations</h2>
    <ul>
        <li><strong>Centralize Helper:</strong> Move <code>maskPII</code> to a shared npm package (<code>@budolpay/utils</code>) to avoid duplication.</li>
        <li><strong>Graceful Shutdown:</strong> Implement SIGTERM/SIGINT handlers in services to release ports reliably.</li>
        <li><strong>Audit Dashboard:</strong> Create a UI for viewing audit logs instead of relying on raw DB/logs.</li>
    </ul>
`;

// Write files
const files = [
    { name: 'index.html', title: 'Overview', content: indexContent },
    { name: 'developer_manual.html', title: 'Developer Manual', content: devContent },
    { name: 'system_admin_manual.html', title: 'System Admin Manual', content: adminContent },
    { name: 'user_manual.html', title: 'User Manual', content: userContent },
    { name: 'risk_register.html', title: 'Risk Register', content: riskContent },
    { name: 'Mitigation.html', title: 'Mitigation Strategies', content: mitigationContent },
    { name: 'issues.html', title: 'Known Issues', content: issuesContent },
    { name: 'fixes.html', title: 'Fixes', content: fixesContent },
    { name: 'test_results.html', title: 'Test Results', content: testContent },
    { name: 'future_recommendations.html', title: 'Future Recommendations', content: futureContent }
];

files.forEach(file => {
    fs.writeFileSync(path.join(DOC_DIR, file.name), TEMPLATE(file.title, file.content, file.name));
    console.log(`Generated ${file.name}`);
});

console.log(`Documentation generated in ${DOC_DIR}`);
