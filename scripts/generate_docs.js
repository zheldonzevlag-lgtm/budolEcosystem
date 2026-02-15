const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '../documentation/budolecosystem_docs_2026-02-16_v3.3.0');
const VERSION = 'v3.3.0';
const DATE = '2026-02-16';

if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true });
}

const TEMPLATE = (title, content, activeLink) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Budol Ecosystem ${VERSION}</title>
    <style>
        :root {
            --primary: #0052CC;
            --sidebar-bg: #FAFBFC;
            --sidebar-border: #EBECF0;
            --text-main: #172B4D;
            --text-secondary: #6B778C;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
            margin: 0;
            display: flex;
            height: 100vh;
            color: var(--text-main);
        }
        .sidebar {
            width: 280px;
            background: var(--sidebar-bg);
            border-right: 1px solid var(--sidebar-border);
            padding: 24px 16px;
            overflow-y: auto;
            flex-shrink: 0;
        }
        .main-content {
            flex: 1;
            padding: 40px 60px;
            overflow-y: auto;
            max-width: 1000px;
        }
        .brand {
            font-size: 18px;
            font-weight: bold;
            color: var(--primary);
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .nav-item {
            display: block;
            padding: 8px 12px;
            color: var(--text-main);
            text-decoration: none;
            border-radius: 4px;
            margin-bottom: 4px;
            font-size: 14px;
        }
        .nav-item:hover {
            background: rgba(9, 30, 66, 0.08);
        }
        .nav-item.active {
            background: #E6EFFC;
            color: var(--primary);
            font-weight: 500;
        }
        .nav-section {
            font-size: 11px;
            text-transform: uppercase;
            color: var(--text-secondary);
            font-weight: 700;
            margin-top: 24px;
            margin-bottom: 8px;
            padding-left: 12px;
        }
        h1 { font-size: 32px; margin-bottom: 16px; letter-spacing: -0.01em; }
        h2 { font-size: 24px; margin-top: 32px; margin-bottom: 16px; border-bottom: 1px solid var(--sidebar-border); padding-bottom: 8px; }
        h3 { font-size: 18px; margin-top: 24px; margin-bottom: 12px; font-weight: 600; }
        p { line-height: 1.6; margin-bottom: 16px; color: #42526E; }
        
        .card {
            background: white;
            border: 1px solid var(--sidebar-border);
            border-radius: 8px;
            padding: 24px;
            margin-bottom: 24px;
            box-shadow: 0 1px 2px rgba(9, 30, 66, 0.08);
        }
        
        .status-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-success { background: #E3FCEF; color: #006644; }
        .status-warning { background: #FFFAE6; color: #FF8B00; }
        .status-danger { background: #FFEBE6; color: #BF2600; }

        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        th, td { text-align: left; padding: 12px; border-bottom: 1px solid var(--sidebar-border); }
        th { color: var(--text-secondary); font-size: 12px; text-transform: uppercase; }
        
        code {
            font-family: 'SFMono-Medium', 'SF Mono', 'Segoe UI Mono', 'Roboto Mono', monospace;
            font-size: 12px;
            background: #F4F5F7;
            padding: 2px 4px;
            border-radius: 3px;
            color: #D6336C;
        }
        pre {
            background: #091E42;
            color: #FFFFFF;
            padding: 16px;
            border-radius: 8px;
            overflow-x: auto;
            font-size: 13px;
            line-height: 1.5;
        }
        pre code {
            background: transparent;
            color: inherit;
            padding: 0;
        }

        .todo-list { list-style: none; padding: 0; }
        .todo-item { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .todo-checkbox { width: 16px; height: 16px; accent-color: var(--primary); }
        .todo-done { text-decoration: line-through; color: var(--text-secondary); }

        .metadata {
            font-size: 12px;
            color: var(--text-secondary);
            margin-top: 60px;
            padding-top: 20px;
            border-top: 1px solid var(--sidebar-border);
        }
    </style>
</head>
<body>
    <div class="sidebar">
        <div class="brand">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            Budol Ecosystem
        </div>
        
        <div class="nav-section">General</div>
        <a href="index.html" class="nav-item ${activeLink === 'index' ? 'active' : ''}">Overview</a>
        <a href="knowledgebase.html" class="nav-item ${activeLink === 'knowledgebase' ? 'active' : ''}">Knowledge Base</a>

        <div class="nav-section">Manuals</div>
        <a href="developer_manual.html" class="nav-item ${activeLink === 'developer_manual' ? 'active' : ''}">Developer Manual</a>
        <a href="system_admin_manual.html" class="nav-item ${activeLink === 'system_admin_manual' ? 'active' : ''}">System Admin Manual</a>
        <a href="user_manual.html" class="nav-item ${activeLink === 'user_manual' ? 'active' : ''}">User Manual</a>

        <div class="nav-section">Risk & Compliance</div>
        <a href="risk_register.html" class="nav-item ${activeLink === 'risk_register' ? 'active' : ''}">Risk Register</a>
        <a href="Mitigation.html" class="nav-item ${activeLink === 'mitigation' ? 'active' : ''}">Mitigation Strategies</a>
        <a href="test_results.html" class="nav-item ${activeLink === 'test_results' ? 'active' : ''}">Test Results</a>

        <div class="nav-section">Changelog</div>
        <a href="issues.html" class="nav-item ${activeLink === 'issues' ? 'active' : ''}">Known Issues</a>
        <a href="fixes.html" class="nav-item ${activeLink === 'fixes' ? 'active' : ''}">Recent Fixes</a>
        <a href="future_recommendations.html" class="nav-item ${activeLink === 'future' ? 'active' : ''}">Roadmap</a>
    </div>

    <div class="main-content">
        ${content}
        
        <div class="metadata">
            Generated on ${DATE} • Version ${VERSION} • Status: <span class="status-badge status-success">COMPLIANT</span>
        </div>
    </div>
</body>
</html>
`;

// 1. INDEX.HTML
const indexContent = `
    <h1>Budol Ecosystem Documentation ${VERSION}</h1>
    <p class="lead">Comprehensive documentation for the Budol Ecosystem platform, covering security compliance, architecture, and operational procedures.</p>

    <div class="card">
        <h3>Release Highlights (${VERSION})</h3>
        <ul>
            <li><strong>Security Compliance Dashboard:</strong> Real-time monitoring of PCI DSS, BSP, and Data Privacy compliance.</li>
            <li><strong>Forensic Audit Trails:</strong> Immutable, SHA-256 hashed activity logs for fraud detection.</li>
            <li><strong>DoS/DDoS Mitigation:</strong> Automated rate limiting and IP blocking (L7-SHIELD).</li>
            <li><strong>Role-Based Access Control (RBAC):</strong> Strict enforcement of admin privileges with audit logging.</li>
        </ul>
    </div>

    <div class="card">
        <h3>Task Completion Status</h3>
        <ul class="todo-list">
            <li class="todo-item"><input type="checkbox" checked disabled class="todo-checkbox"> <span class="todo-done">Phase 0: Baseline & Risk Analysis</span></li>
            <li class="todo-item"><input type="checkbox" checked disabled class="todo-checkbox"> <span class="todo-done">Phase 1: Architecture & Data Contracts</span></li>
            <li class="todo-item"><input type="checkbox" checked disabled class="todo-checkbox"> <span class="todo-done">Phase 2: Backend & API Implementation</span></li>
            <li class="todo-item"><input type="checkbox" checked disabled class="todo-checkbox"> <span class="todo-done">Phase 3: Frontend / App Implementation</span></li>
            <li class="todo-item"><input type="checkbox" checked disabled class="todo-checkbox"> <span class="todo-done">Phase 4: Integration & Security (Current Focus)</span></li>
            <li class="todo-item"><input type="checkbox" checked disabled class="todo-checkbox"> <span class="todo-done">Phase 5: End-to-End Testing</span></li>
            <li class="todo-item"><input type="checkbox" checked disabled class="todo-checkbox"> <span class="todo-done">Phase 6: Documentation & Audit</span></li>
            <li class="todo-item"><input type="checkbox" class="todo-checkbox"> <span>Phase 7: Release & Monitoring</span></li>
        </ul>
    </div>
`;

// 2. DEVELOPER MANUAL
const developerContent = `
    <h1>Developer Manual</h1>
    <p>Technical implementation details for security features and core modules.</p>

    <h2>1. Forensic Audit Logging</h2>
    <p>The audit logging system uses SHA-256 hashing to ensure log integrity. Every sensitive action is recorded.</p>
    
    <div class="card">
        <h3>Implementation: lib/audit.js</h3>
        <p>Core function for creating tamper-evident logs.</p>
        <pre><code>// lib/audit.js
export async function createAuditLog(userId, action, request, options = {}) {
    // ... metadata extraction ...

    // Shopee-like Integrity Hashing
    const timestamp = new Date().toISOString();
    const hashInput = \`\${userId}:\${action}:\${entityId}:\${status}:\${timestamp}:\${JSON.stringify(metadata)}\`;
    const integrityHash = crypto.createHash('sha256').update(hashInput).digest('hex');

    // ... database insertion ...
}</code></pre>
        <p><a href="../budolshap-0.1.0/lib/audit.js">View Full Source Code</a></p>
    </div>

    <h2>2. Security Dashboard API</h2>
    <p>Provides real-time compliance status and threat mitigation trends.</p>
    <div class="card">
        <h3>Implementation: app/api/admin/security-dashboard/route.js</h3>
        <p>Dynamic status calculation based on recent audit logs.</p>
        <pre><code>// app/api/admin/security-dashboard/route.js
// Dynamic Status Logic
const ddosCount = incidentMap['DDOS_MITIGATED'] || 0;
const rbacCount = incidentMap['UNAUTHORIZED_ACCESS'] || 0;

const compliance = {
    ddos: { 
        status: ddosCount > 0 ? 'Mitigating' : 'Monitoring', 
        type: ddosCount > 0 ? \`\${ddosCount} IP BLOCKED\` : 'L7-SHIELD' 
    },
    // ... other checks
};</code></pre>
        <p><a href="../budolshap-0.1.0/app/api/admin/security-dashboard/route.js">View Full Source Code</a></p>
    </div>

    <h2>3. Admin Authentication Middleware</h2>
    <p>Centralized RBAC verification for API routes.</p>
    <div class="card">
        <h3>Implementation: lib/adminAuth.js</h3>
        <pre><code>// lib/adminAuth.js
export async function requireAdmin(request, permission = null) {
    const { isAdmin, user, error } = await verifyAdminAccess(request, permission)

    if (!isAdmin) {
        // Log unauthorized attempt
        await createAuditLog(null, 'UNAUTHORIZED_ACCESS', request, {
            status: 'FAILURE',
            details: \`Blocked admin access: \${error}\`
        });
        return { authorized: false, ... }
    }
    // ...
}</code></pre>
        <p><a href="../budolshap-0.1.0/lib/adminAuth.js">View Full Source Code</a></p>
    </div>
`;

// 3. SYSTEM ADMIN MANUAL
const adminContent = `
    <h1>System Administrator Manual</h1>
    <p>Guide for managing security settings, monitoring threats, and handling incidents.</p>

    <h2>Security Dashboard</h2>
    <p>The Security & Compliance Dashboard provides a high-level view of the system's health.</p>
    <ul>
        <li><strong>Compliance Hardening:</strong> Shows the status of active protections (SSL, RBAC, DDoS). Green means active/good.</li>
        <li><strong>Threat Mitigation Trend:</strong> Visualizes the volume of blocked threats over the last 7 days.</li>
        <li><strong>Vulnerability Scan:</strong> Displays the integrity score of the system core files.</li>
    </ul>

    <h2>Forensic Audit Trails</h2>
    <p>Access the Audit Trails via <code>Admin > Settings > Forensic Audit Trails</code>.</p>
    <div class="card">
        <h3>How to Interpret Logs</h3>
        <table>
            <tr>
                <th>Action</th>
                <th>Description</th>
                <th>Severity</th>
            </tr>
            <tr>
                <td>LOGIN_FAILED</td>
                <td>User failed to log in (wrong password/user). High volume indicates brute force.</td>
                <td><span class="status-badge status-warning">Medium</span></td>
            </tr>
            <tr>
                <td>UNAUTHORIZED_ACCESS</td>
                <td>Non-admin tried to access admin API. Potential privilege escalation attempt.</td>
                <td><span class="status-badge status-danger">High</span></td>
            </tr>
            <tr>
                <td>DDOS_MITIGATED</td>
                <td>Rate limiter blocked a request due to traffic volume.</td>
                <td><span class="status-badge status-success">Blocked</span></td>
            </tr>
        </table>
    </div>
`;

// 4. USER MANUAL (Brief)
const userContent = `
    <h1>User Manual</h1>
    <p>Information for end-users regarding account security and data protection.</p>

    <h2>Account Security</h2>
    <p>Your account is protected by multi-factor authentication and real-time fraud detection.</p>
    <ul>
        <li><strong>Login Alerts:</strong> You will be notified of suspicious login attempts.</li>
        <li><strong>Session Management:</strong> Sessions automatically expire for your protection.</li>
    </ul>

    <h2>Data Privacy</h2>
    <p>We comply with the Data Privacy Act. Your personal data is encrypted and only accessed for legitimate transaction purposes.</p>
`;

// 5. RISK REGISTER
const riskContent = `
    <h1>Risk Register</h1>
    <p>Current identified risks and their mitigation status.</p>

    <table>
        <tr>
            <th>Risk ID</th>
            <th>Description</th>
            <th>Impact</th>
            <th>Likelihood</th>
            <th>Mitigation Strategy</th>
            <th>Status</th>
        </tr>
        <tr>
            <td>R-001</td>
            <td>DDoS Attack</td>
            <td>High</td>
            <td>Medium</td>
            <td>Rate limiting (L7-Shield) implemented on all auth and public APIs.</td>
            <td><span class="status-badge status-success">Mitigated</span></td>
        </tr>
        <tr>
            <td>R-002</td>
            <td>Admin Account Takeover</td>
            <td>Critical</td>
            <td>Low</td>
            <td>RBAC enforcement, mandatory logging, session timeouts.</td>
            <td><span class="status-badge status-success">Mitigated</span></td>
        </tr>
        <tr>
            <td>R-003</td>
            <td>Insider Threat</td>
            <td>High</td>
            <td>Low</td>
            <td>Forensic Audit Trails with SHA-256 integrity hashing.</td>
            <td><span class="status-badge status-success">Monitored</span></td>
        </tr>
        <tr>
            <td>R-004</td>
            <td>Spam Registration</td>
            <td>Low</td>
            <td>High</td>
            <td>Honeypot fields and IP-based rate limiting.</td>
            <td><span class="status-badge status-success">Mitigated</span></td>
        </tr>
    </table>
`;

// 6. MITIGATION
const mitigationContent = `
    <h1>Mitigation Strategies</h1>
    <p>Detailed breakdown of security controls implemented in v3.3.0.</p>

    <h2>1. Denial of Service (DoS) Protection</h2>
    <p>We utilize a token bucket algorithm backed by Redis/Database to limit request rates per IP address.</p>
    <ul>
        <li><strong>Login:</strong> 5 attempts per 15 minutes.</li>
        <li><strong>Registration:</strong> 3 accounts per hour per IP.</li>
        <li><strong>API General:</strong> 100 requests per minute.</li>
    </ul>

    <h2>2. Log Integrity</h2>
    <p>To prevent tampering with audit logs, each log entry includes a cryptographic hash of its contents (User ID, Action, Timestamp, Details) generated at the time of creation. This ensures that any direct database modification can be detected.</p>
`;

// 7. ISSUES
const issuesContent = `
    <h1>Known Issues</h1>
    <p>Current limitations and bugs tracked in this release.</p>

    <ul>
        <li><strong>Realtime Latency:</strong> In extreme high-load scenarios, the dashboard live telemetry may lag by 1-2 seconds.</li>
        <li><strong>Geolocation:</strong> IP geolocation fallback service may be rate-limited, defaulting location to "Unknown".</li>
    </ul>
`;

// 8. FIXES
const fixesContent = `
    <h1>Recent Fixes (v3.3.0)</h1>
    
    <div class="card">
        <h3>Resolved Items</h3>
        <ul>
            <li><strong>[FIXED] Dashboard Rendering Error:</strong> Resolved collision in History component and ES module import issues.</li>
            <li><strong>[FIXED] Audit List Display:</strong> Fixed caching issue where new logs were not appearing immediately in the admin list. Added <code>cache: 'no-store'</code> headers.</li>
            <li><strong>[FIXED] Missing Logs:</strong> Implemented comprehensive logging for Login Failures, Unauthorized Access, and Store Verification events.</li>
            <li><strong>[FIXED] UI Layout:</strong> Optimized dashboard for 3-column layout and reduced visual compactness as requested.</li>
        </ul>
    </div>
`;

// 9. TEST RESULTS
const testResultsContent = `
    <h1>Test Results</h1>
    <p>Verification of security controls for v3.3.0.</p>

    <div class="card">
        <h3>Security Simulation (Test ID: SEC-2026-001)</h3>
        <p><strong>Date:</strong> 2026-02-16<br><strong>Tester:</strong> Trae AI<br><strong>Result:</strong> PASSED</p>
        
        <table>
            <tr>
                <th>Test Case</th>
                <th>Expected Outcome</th>
                <th>Actual Outcome</th>
                <th>Status</th>
            </tr>
            <tr>
                <td>Simulate DDoS (Rate Limit)</td>
                <td>Block requests, Log DDOS_MITIGATED</td>
                <td>Requests blocked, 3 logs created</td>
                <td><span class="status-badge status-success">PASS</span></td>
            </tr>
            <tr>
                <td>Unauthorized Admin Access</td>
                <td>Block access (403), Log UNAUTHORIZED_ACCESS</td>
                <td>Access denied, Logged successfully</td>
                <td><span class="status-badge status-success">PASS</span></td>
            </tr>
            <tr>
                <td>Spam Registration</td>
                <td>Block (Honeypot), Log SPAM_ATTEMPT</td>
                <td>Blocked, Logged successfully</td>
                <td><span class="status-badge status-success">PASS</span></td>
            </tr>
            <tr>
                <td>Audit Log Integrity</td>
                <td>Logs must have SHA-256 hash</td>
                <td>All new logs contain integrity hash</td>
                <td><span class="status-badge status-success">PASS</span></td>
            </tr>
        </table>
    </div>
`;

// 10. FUTURE RECOMMENDATIONS & KNOWLEDGE BASE
const futureContent = `
    <h1>Future Recommendations & Roadmap</h1>
    <p>Strategic enhancements planned for v4.0 and beyond.</p>

    <div class="card">
        <h3>Security</h3>
        <ul>
            <li><strong>Biometric Auth:</strong> Implement WebAuthn for passwordless admin login.</li>
            <li><strong>AI Threat Analysis:</strong> Integrate TensorFlow.js for client-side behavioral analysis.</li>
            <li><strong>Hardware Key Support:</strong> YubiKey support for critical admin actions.</li>
        </ul>
    </div>

    <div class="card">
        <h3>Scalability</h3>
        <ul>
            <li><strong>Log Archival:</strong> Move logs older than 90 days to cold storage (S3/Glacier).</li>
            <li><strong>Read Replicas:</strong> Offload analytics queries to a read-only database replica.</li>
        </ul>
    </div>
`;

const kbContent = `
    <h1>Knowledge Base</h1>
    <p>Central repository for all documentation, best practices, and guides.</p>

    <div class="card">
        <h3>Quick Links</h3>
        <ul>
            <li><a href="developer_manual.html">Developer Manual</a> - For engineers and contributors.</li>
            <li><a href="system_admin_manual.html">System Admin Manual</a> - For operational staff.</li>
            <li><a href="risk_register.html">Risk Register</a> - Current security posture.</li>
        </ul>
    </div>

    <div class="card">
        <h3>Consolidated Recommendations</h3>
        <p>From <strong>Future Recommendations</strong> page:</p>
        <ul>
            <li>Implement Biometric Auth (WebAuthn)</li>
            <li>Integrate AI Threat Analysis</li>
            <li>Log Archival Strategy</li>
        </ul>
    </div>
`;

// WRITE FILES
const files = [
    { name: 'index.html', content: indexContent, link: 'index' },
    { name: 'developer_manual.html', content: developerContent, link: 'developer_manual' },
    { name: 'system_admin_manual.html', content: adminContent, link: 'system_admin_manual' },
    { name: 'user_manual.html', content: userContent, link: 'user_manual' },
    { name: 'risk_register.html', content: riskContent, link: 'risk_register' },
    { name: 'Mitigation.html', content: mitigationContent, link: 'mitigation' },
    { name: 'issues.html', content: issuesContent, link: 'issues' },
    { name: 'fixes.html', content: fixesContent, link: 'fixes' },
    { name: 'test_results.html', content: testResultsContent, link: 'test_results' },
    { name: 'future_recommendations.html', content: futureContent, link: 'future' },
    { name: 'knowledgebase.html', content: kbContent, link: 'knowledgebase' },
];

files.forEach(file => {
    fs.writeFileSync(path.join(DOCS_DIR, file.name), TEMPLATE(file.name.replace('.html', ''), file.content, file.link));
    console.log(`Generated ${file.name}`);
});
