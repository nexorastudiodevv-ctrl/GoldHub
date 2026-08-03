// Node.js script to search for wallet-related content with proper UTF-8 handling
const fs = require('fs');
const path = require('path');

const patterns = ['محفظ', 'المحفظة', 'wallet', 'Wallet', 'WALLET', 'محفظتي', 'محفظتك', 'رصيد', 'balance', 'Balance', 'portfolio', 'Portfolio'];

function walk(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            if (file === 'node_modules' || file === '.git') continue;
            walk(fullPath, fileList);
        } else if (/\.(html|js|json|md|txt|css|xml)$/i.test(file)) {
            fileList.push(fullPath);
        }
    }
    return fileList;
}

const files = walk(__dirname + '/..'); // project root

let foundAny = false;
for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
        for (const p of patterns) {
            if (line.includes(p)) {
                if (!foundAny) {
                    console.log('=== FOUND REFERENCES ===');
                    foundAny = true;
                }
                const trunc = line.length > 300 ? line.substring(0, 300) + '...' : line;
                console.log(`${file}:${idx + 1} [${p}] ${trunc}`);
                break;
            }
        }
    });
}
if (!foundAny) {
    console.log('No wallet-related references found.');
} else {
    console.log('=== SEARCH COMPLETE ===');
}

