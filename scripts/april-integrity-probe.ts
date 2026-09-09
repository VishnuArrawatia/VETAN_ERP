/** READ-ONLY April-2026 data-integrity probe of the local Payroll.db mirror (sqlite3, file mode). */
import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('Payroll.db', sqlite3.OPEN_READONLY);
const qc = (sql: string): Promise<any> => new Promise((res) => {
  db.get(sql, (err: any, row: any) => res(err ? 'ERR:' + err.message.slice(0, 60) : row?.c ?? row));
});
(async () => {
  console.log('attendance 2026-04:', await qc(`SELECT COUNT(*) c FROM attendance WHERE month LIKE '2026-04%'`));
  console.log('payslips 2026-04:', await qc(`SELECT COUNT(*) c FROM payslips WHERE month LIKE '2026-04%'`));
  console.log('payroll_runs 2026-04:', await qc(`SELECT COUNT(*) c FROM payroll_runs WHERE month LIKE '2026-04%'`));
  console.log('leave_applications 2026-04:', await qc(`SELECT COUNT(*) c FROM leave_applications WHERE start_date LIKE '2026-04%'`));
  console.log('employees total:', await qc(`SELECT COUNT(*) c FROM employees`));
  db.close();
})();
