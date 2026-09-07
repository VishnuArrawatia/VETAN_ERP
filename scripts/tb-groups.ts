import fs from "fs";
const store = JSON.parse(fs.readFileSync("F:/Financial Report/mis-store.json", "utf-8"));
for (const ent of ["SAKAR", "SVN"]) {
  const pl = new Set<string>(), bs = new Set<string>();
  for (const r of store.tb) {
    if (r.entity !== ent) continue;
    if (r.groupPL) pl.add(r.groupPL);
    if (r.groupBS) bs.add(r.groupBS);
  }
  console.log(`\n${ent} PL groups (${pl.size}):`, [...pl].slice(0, 40).join(" | "));
  console.log(`${ent} BS groups (${bs.size}):`, [...bs].slice(0, 20).join(" | "));
}
// Interest/Rent/Depreciation specific rows
console.log("\n--- rows matching Rent/Interest/Depreciation/Sales ---");
for (const r of store.tb) {
  const n = (r.name || "").toLowerCase();
  if ((n.includes("rent") || n.includes("interest") || n.includes("depreciat") || n.includes("sale")) && (r.groupPL || r.groupBS) && r.entity === "SVN") {
    console.log(`${r.entity} | ${r.code} | ${r.name.slice(0,30)} | PL="${r.groupPL}" BS="${r.groupBS}" | total=${r.total}`);
  }
}
