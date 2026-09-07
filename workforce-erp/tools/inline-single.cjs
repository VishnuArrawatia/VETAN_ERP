// Builds a single-file WORKFORCE-2026.html from the Vite dist output.
// Usage: node tools/inline-single.cjs
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const OUT = path.join(ROOT, '..', 'WORKFORCE-2026.html');

const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');

// Inline CSS
let out = html.replace(
  /<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g,
  (m, href) => {
    const file = path.join(DIST, href.replace(/^\/+/, ''));
    const css = fs.readFileSync(file, 'utf8');
    return `<style>\n${css}\n</style>`;
  }
);

// Inline the entry JS (module script) — keep module so localStorage/seed work offline.
out = out.replace(
  /<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g,
  (m, src) => {
    const file = path.join(DIST, src.replace(/^\/+/, ''));
    const js = fs.readFileSync(file, 'utf8');
    return `<script type="module">\n${js}\n</script>`;
  }
);

// Better title
out = out.replace(/<title>[^<]*<\/title>/, '<title>WORKFORCE-2026 — Workforce ERP</title>');

// Inline the SheetJS/XLSX library (offline Excel import support) before the app.
const XLSX = path.join(ROOT, '..', 'worker-erp', 'node_modules', 'xlsx', 'dist', 'xlsx.full.min.js');
if (fs.existsSync(XLSX)) {
  const lib = fs.readFileSync(XLSX, 'utf8');
  out = out.replace(
    '</body>',
    `<script>\n/* SheetJS (inline for offline Excel import) */\ntry { ${lib.replace(/<\/script>/gi, '<\\/script>')} } catch (e) { console.error('XLSX inline failed', e); }\n</script>\n</body>`
  );
  console.log('XLSX library inlined:', (lib.length / 1024).toFixed(1), 'KB');
} else {
  console.log('XLSX library NOT found — Excel (.xlsx) import will need internet.');
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, out);
console.log('Written:', OUT);
console.log('Size:', (fs.statSync(OUT).size / 1024).toFixed(1), 'KB');