const fs = require('fs');
const path = require('path');

describe('BudolPay v2.5.0 Release Verification', () => {
    const rootDir = path.join(__dirname, '../../');
    const docsDir = path.join(rootDir, 'documentation/budolecosystem_docs_2026-04-13_v2.5.0');
    
    test('Should have all required v2.5.0 documentation files', () => {
        const requiredFiles = [
            'index.html',
            'task.html',
            'workflow.html',
            'developer_manual.html',
            'system_admin_manual.html',
            'user_manual.html',
            'risk_register.html',
            'mitigation.html',
            'issues_fixes.html',
            'test_results.html',
            'future_recommendations.html'
        ];
        
        requiredFiles.forEach(file => {
            const filePath = path.join(docsDir, file);
            expect(fs.existsSync(filePath)).toBe(true);
        });
    });

    test('Knowledgebase.html should contain v2.5.0 Latest Release entry', () => {
        const kbPath = path.join(rootDir, 'knowledgebase.html');
        const content = fs.readFileSync(kbPath, 'utf8');
        expect(content).toContain('v2.5.0');
        expect(content).toContain('Adaptive UI & Theme Stabilization');
    });

    test('Mobile project should have initialized assets', () => {
        const assetPath = path.join(rootDir, 'budolPayMobile/assets/app_icon.png');
        expect(fs.existsSync(assetPath)).toBe(true);
    });
});
