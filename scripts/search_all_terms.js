// Final comprehensive search for wallet and similar terms
const fs = require('fs');
const path = require('path');

const patterns = ['محفظ', 'المحفظة', 'محفظتي', 'محفظتك', 'wallet', 'fa-wallet', 'مفضلتي', 'المفضلة', 'رصيد', 'استثمار', 'معدنية', 'الاستثماري'];

function walk(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            if (file === 'node_modules' || file === '.git' || file === 'scripts') continue;
            walk(fullPath, fileList);
        } else if (/\.(html|js|json|md|txt|css|xml)$/i.test(file)) {
            fileList.push(fullPath);
        }
    }
    return fileList;
}

const files = walk(path.join(__dirname, '..'));

let foundAny = false;
for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
        for (const p of patterns) {
            if (line.includes(p)) {
                if (!foundAny) {
                    console.log('=== REFERENCES FOUND ===');
                    foundAny = true;
                }
                const trunc = line.trim().length > 250 ? line.trim().substring(0, 250) + '...' : line.trim();
                console.log(`${path.basename(path.dirname(file))}/${path.basename(file)}:${idx + 1} [${p}] ${trunc}`);
                break;
            }
        }
    });
}
if (!foundAny) {
    console.log('No wallet or similar references found in any project file except search scripts.');
} else {
    console.log('=== SEARCH COMPLETE ===');
}

