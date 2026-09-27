/** Live check: Supabase-backed production endpoints of VETAN ERP. */
const BASE = 'https://vetan-svn.vercel.app';
const H = { 'x-operator-username': 'vishnu', 'x-operator-role': 'SUPER_HR' };

async function probe(path: string) {
  try {
    const r = await fetch(BASE + path, { headers: H });
    const txt = await r.text();
    let body: any = txt;
    try { body = JSON.parse(txt); } catch { /* keep text */ }
    return { path, status: r.status, size: txt.length, body };
  } catch (e: any) {
    return { path, status: 'FETCH-ERR', size: 0, body: String(e?.message || e) };
  }
}

async function main() {
  const targets = ['/api/health', '/api/supabase-diag', '/api/version', '/api/employees'];
  for (const t of targets) {
    const res = await probe(t);
    console.log(`\n=== ${res.path} -> HTTP ${res.status} (${(res.size / 1024).toFixed(0)} KB) ===`);
    const b = res.body;
    if (t === '/api/employees' && Array.isArray(b)) {
      console.log('employees:', b.length);
    } else if (typeof b === 'object' && b !== null) {
      console.log(JSON.stringify(b, null, 2).slice(0, 1200));
    } else {
      console.log(String(b).slice(0, 400));
    }
  }
}
main();
