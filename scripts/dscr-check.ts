const res = await fetch("http://localhost:3001/api/mis/dscr?fy=FY-2026-27");
const d: any = await res.json();
for (const comp of ["SVN", "SAKAR"]) {
  const m = d.result[comp]?.monthly || {};
  console.log(`\n${comp}:`);
  for (const mn of ["April", "May", "June", "July", "August"]) {
    const x = m[mn];
    if (x) console.log(`  ${mn}: P=${Math.round(x.principal)} I=${Math.round(x.interest)} DS=${Math.round(x.debtService)} DSCR=${x.dscr}`);
  }
  console.log("  loans:", JSON.stringify(d.result[comp]?.loans));
}
