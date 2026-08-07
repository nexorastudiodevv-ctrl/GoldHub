// Simple HTML validation script for index.html
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(filePath, 'utf8');
const issues = [];

// 1. Check for duplicate attributes
const tagRe = /<([a-zA-Z0-9]+)([^>]*?)>/g;
let m;
while ((m = tagRe.exec(html)) !== null) {
    const attrs = m[2].match(/([a-zA-Z-]+)\s*=/g);
    if (attrs) {
        const seen = {};
        attrs.forEach(a => {
            const name = a.replace(/\s*=\s*$/, '').trim();
            if (seen[name]) {
                issues.push(`DUPLICATE ATTRIBUTE: "${name}" in <${m[1]}> at index ${m.index}`);
            }
            seen[name] = true;
        });
    }
}

// 2. Check for unclosed tags for key elements
const voidTags = new Set(['img', 'br', 'hr', 'input', 'meta', 'link', 'source', 'area', 'base', 'col', 'embed', 'track', 'wbr']);
const stack = [];
const fullTagRe = /<\/?([a-zA-Z0-9]+)((?:"[^"]*"|'[^']*'|[^'">])*)>/g;
let tm;
while ((tm = fullTagRe.exec(html)) !== null) {
    const tag = tm[1].toLowerCase();
    const isClosing = tm[0].startsWith('</');
    const isSelfClosing = /\/>$/.test(tm[0]) || voidTags.has(tag);
    if (isClosing) {
        const lastIdx = stack.map(x => x.tag).lastIndexOf(tag);
        if (lastIdx === -1) {
            issues.push(`STRAY CLOSING TAG: </${tag}> at index ${tm.index}`);
        } else {
            // Pop everything after the match
            for (let i = stack.length - 1; i > lastIdx; i--) {
                issues.push(`MISMATCHED TAG: <${stack[i].tag}> opened at ${stack[i].index} closed by </${tag}> at ${tm.index}`);
            }
            stack.length = lastIdx;
        }
    } else if (!isSelfClosing) {
        stack.push({ tag, index: tm.index });
    }
}

// Report unclosed tags
stack.forEach(item => {
    issues.push(`UNCLOSED TAG: <${item.tag}> opened at index ${item.index}`);
});

// 3. Check for duplicate IDs
const idRe = /id="([^"]+)"/g;
const ids = {};
let idm;
while ((idm = idRe.exec(html)) !== null) {
    const id = idm[1];
    if (ids[id]) {
        issues.push(`DUPLICATE ID: "${id}" first seen at index ${ids[id]}, also at index ${idm.index}`);
    } else {
        ids[id] = idm.index;
    }
}

// 4. Check for duplicate href attributes (social links)
const hrefRe = /href="([^"]+)"/g;
const hrefs = {};
let hm;
while ((hm = hrefRe.exec(html)) !== null) {
    const href = hm[1];
    if (hrefs[href]) {
        issues.push(`DUPLICATE HREF: "${href}" at index ${hm.index} (also at index ${hrefs[href]})`);
    } else {
        hrefs[href] = hm.index;
    }
}

// 5. Check nested quotes in inline handlers (like onerror with quotes inside)
const onEventRe = /on[a-z]+\s*=\s*"[^"]*"[^"]*"[^"]*"/g;
// Note: this is a heuristic - find attributes that appear to have broken quoting
// Find onerror attributes that contain nested double quotes incorrectly
const errorHandlerRe = /onerror\s*=\s*"([^"]*")[^>]*"/g;
let em;
while ((em = errorHandlerRe.exec(html)) !== null) {
    issues.push(`POSSIBLE BROKEN QUOTING in onerror at index ${em.index}: ${em[0].substring(0, 120)}...`);
}

// 6. Check for consecutive duplicate attributes (e.g., href twice in same tag)
// We already handle this above.

// 7. Check unescaped quotes in attribute values
const attrValueRe = /<[^>]+[a-z-]+\s*=\s*"[^"]*"[^>]*"[^>]*>/gi;
let am;
while ((am = attrValueRe.exec(html)) !== null) {
    // Heuristic: attribute with 3+ double quotes in a tag is suspicious
    const tagContent = am[0];
    const quoteCount = (tagContent.match(/"/g) || []).length;
    if (quoteCount > 2) {
        issues.push(`SUSPICIOUS QUOTING (${quoteCount} quotes) at index ${am.index}: ${tagContent.substring(0, 150)}`);
    }
}

// Summary
if (issues.length === 0) {
    console.log('✅ No issues found.');
} else {
    console.log(`⚠️ Found ${issues.length} potential issue(s):\n`);
    issues.forEach(issue => console.log(issue));
}

