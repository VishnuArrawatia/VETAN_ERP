import fs from "fs";

const src = fs.readFileSync("scripts/FinancialReport_FixMacros.bas", "utf8");
const joined = src.replace(/_\r?\n/g, " ");

// collect simple string-variable assignments: name = "..." & name & "..."
const vars = new Map<string, string>();
for (const m of joined.matchAll(/^\s*(f\w+)\s*=\s*(.+)$/gm)) {
  const rhs = m[2].trim();
  if (!rhs.includes(`"`)) continue;
  // parse literal / identifier sequence
  let val = "";
  let ok = true;
  for (const tok of rhs.matchAll(/"(?:[^"]|"")*"|[A-Za-z_]\w*/g)) {
    const t = tok[0];
    if (t.startsWith(`"`)) val += t.slice(1, -1).replace(/""/g, `"`);
    else if (vars.has(t)) val += vars.get(t);
    else { ok = false; break; }
  }
  if (ok) vars.set(m[1], val);
}

// now check every .Formula = RHS
const re = /\.(Formula|FormulaArray)\s*=\s*(.+)$/gm;
let bad = 0, total = 0;
for (const m of joined.matchAll(re)) {
  const rhs = m[2].trim();
  let f = "", ok = true;
  for (const tok of rhs.matchAll(/"(?:[^"]|"")*"|[A-Za-z_]\w*/g)) {
    const t = tok[0];
    if (t.startsWith(`"`)) f += t.slice(1, -1).replace(/""/g, `"`);
    else if (vars.has(t)) f += vars.get(t);
    else if (/^(Formula|FormulaArray)$/.test(t)) continue;
    else { ok = false; break; }
  }
  if (!ok || !f) continue;
  total++;
  let bal = 0;
  for (const ch of f) {
    if (ch === `(`) bal++;
    if (ch === `)`) bal--;
  }
  if (bal !== 0) {
    bad++;
    console.log(`UNBALANCED (${bal}): ${f.slice(0, 160)}`);
  }
}
console.log(`\nChecked ${total} formulas, ${bad} unbalanced. Variables resolved: ${[...vars.keys()].join(", ")}`);
