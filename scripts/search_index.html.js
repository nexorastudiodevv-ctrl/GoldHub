// Targeted search in index.html for wallet-related terms
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'index.html');
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

const patterns = ['محفظ', 'المحفظة', 'محفظتي', 'محفظتك', 'wallet', 'Wallet', 'WALLET', 'fa-wallet', 'purse', 'portfolio', 'Persona', 'الشخصية'];

console.log('=== Searching index.html ===');
console.log('Total lines:', lines.length);

let found = false;
lines.forEach((line, idx) => {
    for (const p of patterns) {
        if (line.includes(p)) {
            found = true;
            const trunc = line.length > 300 ? line.substring(0, 300) + '...' : line;
            console.log(`Line ${idx + 1} [${p}]: ${trunc}`);
            break;
        }
    }
});

if (!found) {
    console.log('NO wallet-related content found in index.html');
}

console.log('=== Also checking section names in index.html ===');
// List all nav/section headings to identify what sections exist
const headingPattern = /(title|heading|aria-label|সection)/i;
lines.forEach((line, idx) => {
    if (line.includes('href="#') && line.includes('class="flex')) {
        console.log(`Line ${idx + 1}: ${line.trim().substring(0, 150)}`);
    }
});

