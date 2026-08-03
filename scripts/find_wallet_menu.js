const fs = require('fs');
const c = fs.readFileSync('index.html', 'utf8').split('\n');
c.forEach((l, i) => {
    if (l.includes('محفظ') || l.toLowerCase().includes('wallet') || l.includes('المحفظة')) {
        console.log('L' + (i + 1) + ': ' + l.trim().slice(0, 250));
    }
});
console.log('--- search done ---');
// Also search for sidebar nav items
c.forEach((l, i) => {
    if (l.includes('sidebar-text') && l.includes('span')) {
        console.log('NAV L' + (i + 1) + ': ' + l.trim().slice(0, 150));
    }
});
