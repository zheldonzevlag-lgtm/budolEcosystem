
import re
import os

index_path = r"d:\IT Projects\budolEcosystem\documentation\index.html"
kb_path = r"d:\IT Projects\budolEcosystem\documentation\knowledgebase.html"

def extract_versions(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Regex to find version items
    # <a href="budolecosystem_docs_2026-02-17_v1/index.html" class="version-item">
    #     <div class="version-info">
    #         <span class="version-badge">Version 3.5.0</span>
    #         <span class="version-date">2026-02-17</span>
    #         <p class="version-desc">Fix: Partial Payment Cart Deletion Logic & Webhook Safety.</p>
    #     </div>
    #     <div class="arrow">→</div>
    # </a>
    
    pattern = re.compile(r'<a href="([^"]+)" class="version-item">\s*<div class="version-info">\s*<span class="version-badge">([^<]+)</span>\s*<span class="version-date">([^<]+)</span>\s*<p class="version-desc">([^<]+)</p>', re.DOTALL)
    
    matches = pattern.findall(content)
    versions = []
    for href, badge, date, desc in matches:
        versions.append({
            'href': href,
            'version': badge.replace('Version ', 'v').strip(),
            'date': date.strip(),
            'desc': desc.strip()
        })
    return versions

def generate_sidebar_html(versions):
    html = '<div class="nav-section">\n<div class="nav-title">VERSION HISTORY</div>\n'
    # Limit to top 20 or so to avoid huge sidebar? The user said "all the previous versions".
    # But the screenshot shows a scrollable sidebar.
    for v in versions:
        # Format: v3.3.27 Security Fix...
        # Truncate desc if too long?
        desc = v['desc']
        if len(desc) > 50:
            desc = desc[:47] + "..."
            
        html += f'<a href="{v["href"]}" class="nav-link" title="{v["desc"]}">\n'
        html += f'  <div style="font-weight:600; color:#42526E;">{v["version"]}</div>\n'
        html += f'  <div style="font-size:0.8rem; color:#6B778C; line-height:1.2;">{desc}</div>\n'
        html += '</a>\n'
    html += '</div>'
    return html

def reconstruct_kb():
    versions = extract_versions(index_path)
    sidebar_html = generate_sidebar_html(versions)
    
    with open(kb_path, 'r', encoding='utf-8') as f:
        kb_content = f.read()
        
    # 1. Insert Sidebar content
    # Look for the last nav-section and append after it
    # or just before the closing </div> of .sidebar
    
    # We'll look for <div class="nav-section">...</div> ... </div> (sidebar end)
    # Easier: find the last </div> before <div class="main-content">
    
    sidebar_end_idx = kb_content.find('<div class="main-content">')
    # Search backwards for the closing div of sidebar
    last_div_before_main = kb_content.rfind('</div>', 0, sidebar_end_idx)
    
    # Inject before the last div of sidebar
    new_content = kb_content[:last_div_before_main] + '\n' + sidebar_html + '\n' + kb_content[last_div_before_main:]
    
    # 2. Add Task Implementation Status section in main content
    # Just after <div class="page-header">...</div>
    
    task_status_html = """
        <h2 id="status">Task Implementation Status</h2>
        <p>Status v1.7.0 Documentation Verified</p>
        
        <div style="background:#fff; border:1px solid #dfe1e6; border-radius:3px; padding:20px; margin-bottom:30px;">
            <ul style="list-style:none; padding:0;">
                <li style="margin-bottom:10px;">✓ <strong>Implement AI Anti-Spam Engine</strong> with pattern matching and risk scoring (v1.7.0)</li>
                <li style="margin-bottom:10px;">✓ <strong>Integrate AI scoring into /register endpoint</strong> with real-time blocking</li>
                <li style="margin-bottom:10px;">✓ <strong>Update Security Dashboard</strong> with spam block metrics and telemetry</li>
                <li style="margin-bottom:10px;">✓ <strong>Validate BSP Circular 808 compliance</strong> for automated risk-based blocking</li>
            </ul>
            
            <h3 style="font-size:1rem; color:#6b778c; text-transform:uppercase; margin-top:20px;">Historical Release Tasks</h3>
            <ul style="list-style:none; padding:0; color:#5E6C84;">
                <li style="margin-bottom:8px;">✓ v1.3.8: UX: KYC Refactor & OCR Transparency Panel</li>
                <li style="margin-bottom:8px;">✓ v1.3.7: Compliance: KYC Standards Alignment & Seller Tier Architecture</li>
                <li style="margin-bottom:8px;">✓ v540: Database Audit & Webhook PaymentStatus Fix</li>
                <li style="margin-bottom:8px;">✓ v494: Realtime Order Tab Sync & User-Friendly Notifications</li>
                 <li style="margin-bottom:8px;">✓ v491: Backend Implementation - Realtime event triggers integrated in PayMongo, BudolPay, and Lalamove webhooks</li>
            </ul>
        </div>
    """
    
    # Insert after page-header closing div
    header_end = new_content.find('</div>', new_content.find('class="page-header"')) + 6
    new_content = new_content[:header_end] + '\n' + task_status_html + '\n' + new_content[header_end:]
    
    with open(kb_path, 'w', encoding='utf-8') as f:
        f.write(new_content)

if __name__ == "__main__":
    reconstruct_kb()
