# VETAN ERP — APR-26 → AUG-26 PAYROLL ROLLBACK PLAN (Sab Units)

**Units:** SVN-I · SVN-II · Sakar-I · Sakar-III (+ Zenivo/Flare single HR employees) | System: https://vetan-svn.vercel.app/
**Banaya gaya:** 20-Sep-2026 | Live state: Apr-26 = 3 DRAFT runs (purane duplicates), May-26 = CLOSED

> **Golden Rule (har phase par):** Lock = "sab verify ho gaya". Lock ke BAAD koi change nahi — galti ho to pehle hi pakdo. Ek time par SIRF EK month + SIRF EK unit pe kaam.

---

## 🗺️ POORA ROADMAP EK NAZAR ME

```
PHASE 0  One-time prep: masters + missing-data list          (1-2 din)
PHASE 1  Attendance Apr→Aug, unit-wise import                (3-4 din)
PHASE 2  Leave utilization Apr→Aug + opening balances        (2 din)
PHASE 3  APR-26 payroll: calc → deductions detail → lock     (1-2 din/unit)
PHASE 4  MAY-26: increment entry (effective 1-May) → calc → lock
PHASE 5  JUN-26: straight month → calc → lock
PHASE 6  JUL-26: bache increments (effective 1-Jul) → calc → lock
PHASE 7  AUG-26: NEW salary structure sab employees → calc → lock
PHASE 8  Final verification: MD checklist + audit trail
```

---

## 📌 PHASE 0 — ONE-TIME PREP (sabse pehle, 1-2 din)

| # | Kaam | Kyun zaroori |
|---|---|---|
| 1 | **Employee master audit:** har unit ki active list, exit dates, bank+IFSC, UAN/PAN missing list | Bank missing = bank export fail; UAN missing = PF register fail |
| 2 | **Purane Apr/May runs ka hisaab:** Apr-26 ke 3 DRAFT runs me se valid wala pehchano (company-specific), May-26 CLOSED hai — usko kisi bhi haal me change nahi karna | Duplicate/stale runs confusion karte hain |
| 3 | **Attendance source fix:** biometric export / manual register — kis unit ka data kahan se aayega (Apr-Aug) | Phase-1 ka input |
| 4 | **Deduction source lists ready:** Loan EMIs (Loan module se), Salary Advances, TDS declarations, Other deductions — Excel me employee-wise | Phase-3+ me per-payslip dalna hai |
| 5 | **Increment list ready:** kis-ka increment, kitna, **effective date** (May-26 wale vs Jul-26 wale alag list) | Phase-4/6 ka input |

---

## 📅 PHASE 1 — ATTENDANCE APR→AUG (3-4 din, unit-wise)

**Order: Apr → May → Jun → Jul → Aug. Har month me 4 units (SVN-I pehle — pilot, fir baaki).**

| # | Kaam | Kahan |
|---|---|---|
| 1 | Month select (Apr-26) → CSV/biometric import ya manual entry | Attendance → Monthly |
| 2 | **Count verify:** imported rows = unit ke active employees | Import summary |
| 3 | Missing punches manual bharo | Attendance → Daily/Manual |
| 4 | LOP/LWP leave wale par sahi ho | Leave records se match |
| 5 | Corrections resolve | Attendance → Corrections |
| 6 | Ye 6 steps **har month × har unit** repeat | — |

> ⚠️ **Business rule:** No-punch ≠ Present. Jo employee ka data hi nahi, wo apne-aap Present nahi banega — missing data pehle bharo.
> ⚠️ Har unit ke baad ek chhota review: kisi ka paid-days absurd (30 jab 26 hue) to turant fix.

---

## 🍃 PHASE 2 — LEAVE UTILIZATION APR→AUG (2 din)

| # | Kaam | Kahan |
|---|---|---|
| 1 | **Opening balances** import (har employee: PL/CL/SL opening) | Leave Master → opening balance import |
| 2 | **Historical leave records** Apr–Aug import (route already hai) | Leave → historical import |
| 3 | **Leave Register verify:** Opening + Credit − Consumed = Closing, employee-wise | Leave Register |
| 4 | LWP days attendance ke LOP se match karo | Register vs Attendance |

> Ye Phase-3 se pehle zaroori hai — warna Apr salary me LOP galat katenga.

---

## 💰 PHASE 3 — APR-26 PAYROLL (unit-wise lock)

**Kahan:** Payroll → Apr-26 → Calculate (per company)

| # | Kaam | Note |
|---|---|---|
| 1 | Calculate per unit (SVN-I, SVN-II, Sakar-I, Sakar-III, Zenivo, Flare) | DRAFT banega — galti ho to recalc |
| 2 | **PF/ESIC apne-aap katega** (engine automatic) — sirf verify karo: PF = Basic-based, ESIC gross cap | Manual kuch nahi dalna |
| 3 | **Manual details per payslip:** TDS · Loan EMI · Salary Advance · Other Deduction | Payslip variable-inputs me edit |
| 4 | 7-point review per unit: Paid Days · Basic · Loan · Arrear · Net Pay · Bank details · totals | Phase-3 ke review table se |
| 5 | **Lock unit-wise** — pehle SVN-I (pilot), sab theek lage to baaki | Payroll → Close/Lock |

> 💡 Pehle sirf SVN-I lock karo — 1-2 din chalne do, koi issue na aaye to baaki units lock karo. Isse galti ka blast-radius chhota rehta hai.

---

## 📈 PHASE 4 — MAY-26: INCREMENT + SALARY

| # | Kaam | Kahan |
|---|---|---|
| 1 | **Increment entries:** har May-increment wale employee ke liye Revision dalo — old salary, new salary, **effective date = 01-May-2026**, reason | Salary → Revisions |
| 2 | May calculate (unit-wise) — engine **effective-date se** nayi salary lega (entry-date se nahi — ye verified hai) | Payroll → Calculate |
| 3 | Verify: increment wale ke payslip me new Basic; baaki me purana | Draft review |
| 4 | Deductions detail (TDS/Loan/Advance/Other) — May figures | Payslip edits |
| 5 | Lock unit-wise | Close/Lock |

> ⚠️ Revision me **effective date hi sach hai** — galti se aaj ki date mat dalo warna Apr me bhi asar padega.

---

## 📆 PHASE 5 — JUN-26 (straight month)

Calculate → verify → deductions detail → lock unit-wise. Koi increment nahi — bas month ka routine.

---

## 📈 PHASE 6 — JUL-26: BACHE INCREMENTS

| # | Kaam |
|---|---|
| 1 | Phase-0 ki doosri increment list (jo May me nahi thi) — **effective date = 01-Jul-2026** ke saath dalo |
| 2 | Jul calculate → verify (naye increment wale sahi, baaki untouched) |
| 3 | Deductions detail → lock unit-wise |

---

## 🏗️ PHASE 7 — AUG-26: NAYI SALARY STRUCTURE (sab employees)

| # | Kaam | Kahan |
|---|---|---|
| 1 | **Har employee ki new structure** dalo — Aug-26 se effective (Revisions ya Salary Master me, structure change ke hisaab se) | Salary module |
| 2 | Verify: Basic/HRA/sab components Aug se naye; **Apr-Jul payslips historical snapshot wale hi rahenge** (untouched) | — |
| 3 | Aug calculate → pura 7-point review (ye sabse bada structural month hai — double-check) | Payroll |
| 4 | Deductions detail → lock unit-wise | Close/Lock |

> ⚠️ Structure change me PF-Applicable/ESIC-Applicable flags bhi check karo — naye structure me galat flag = galat statutory deduction.

---

## ✅ PHASE 8 — FINAL VERIFICATION (aadha din)

1. **MD Dashboard:** Apr→Aug sab cards populated, per-unit numbers sahi
2. **PF Register + ESIC Register:** month-wise totals payslips se match
3. **Loan Register:** Opening + New − Recovery = Closing (EMI deduction se reconcile)
4. **Bonus Provision:** Apr→Aug rows SALARY_AUTO source ke saath, total sahi
5. **Audit trail:** har month ka Processed → Approved (lock) dikhna chahiye
6. **MD Weekly Checklist** ke A-F checks bharo

---

## 🚫 HAR PHASE ME YE KABHI MAT KARNA

| ❌ | Kyun |
|---|---|
| Attendance finalize se pehle Calculate | Salary galat, phir unlock jhanjhat |
| Lock ke baad "bas ek chhota change" | Locked hai — SUPER_HR unlock (audit me dikhega) |
| Effective date ki jagah entry date | Historical months me galat salary lag jayegi |
| Bank details bina verify export | Payment fail/return |
| Do log ek saath same month/unit | Conflict risk |
| Alpha link | Data do jagah bat jayega |

---

## 🗓️ TENTATIVE TIMELINE (aapki team ki speed par depend)

| Hafta | Kaam |
|---|---|
| Week 1 | Phase 0 + 1 (attendance Apr-Aug) + Phase 2 (leave) |
| Week 2 | Phase 3 (Apr payroll + lock, SVN-I pilot fir baaki) |
| Week 3 | Phase 4 (May + increments) + Phase 5 (Jun) |
| Week 4 | Phase 6 (Jul + bache increments) + Phase 7 (Aug new structure) |
| Week 5 | Phase 8 verification + Sep-26 normal cycle (SEP26_PAYROLL_GUIDE se) |

**Sep-26 wali monthly routine isi plan ke Phase 3-4 jaisi hi hai — ek baar Apr→Aug saaf chal gaya, to aage har month routine ban jayega.**
