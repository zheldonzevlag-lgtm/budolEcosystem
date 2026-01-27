import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../..');

const destinations = {
    budolShapLegacy: path.join(rootDir, 'scripts/test_scripts/budolShap/legacy'),
    budolShapV2: path.join(rootDir, 'scripts/test_scripts/budolShap/v2'),
    budolID: path.join(rootDir, 'scripts/test_scripts/budolID'),
    budolPay: path.join(rootDir, 'scripts/test_scripts/budolPay'),
};

// Ensure directories exist
Object.values(destinations).forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

function moveFiles(srcDir, destDir, pattern) {
    if (!fs.existsSync(srcDir)) return;
    const files = fs.readdirSync(srcDir);
    files.forEach(file => {
        if (pattern.test(file)) {
            const srcPath = path.join(srcDir, file);
            const destPath = path.join(destDir, file);
            try {
                fs.renameSync(srcPath, destPath);
                console.log(`Moved: ${file} -> ${path.relative(rootDir, destDir)}`);
            } catch (err) {
                console.error(`Error moving ${file}: ${err.message}`);
            }
        }
    });
}

console.log('--- Organizing Test Scripts ---');

// Move from budolshap-0.1.0
moveFiles(
    path.join(rootDir, 'budolshap-0.1.0/scripts/test_scripts'),
    destinations.budolShapLegacy,
    /^test-.*\.m?js$/
);
moveFiles(
    path.join(rootDir, 'budolshap-0.1.0/scripts/test_scripts_2'),
    destinations.budolShapV2,
    /^test-.*\.m?js$/
);

// Move from budolID-0.1.0
moveFiles(
    path.join(rootDir, 'budolID-0.1.0'),
    destinations.budolID,
    /^test-.*\.m?js$/
);

// Move from budolpay-0.1.0
moveFiles(
    path.join(rootDir, 'budolpay-0.1.0'),
    destinations.budolPay,
    /^test-.*\.m?js$/
);
moveFiles(
    path.join(rootDir, 'budolpay-0.1.0/services/auth-service'),
    destinations.budolPay,
    /^test-.*\.m?js$/
);

console.log('--- Organization Complete ---');
