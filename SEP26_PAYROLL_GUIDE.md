# VETAN ERP — SEP-26 PAYROLL HR WORKFLOW GUIDE

**Month: September 2026** | System: https://vetan-svn.vercel.app/ | Banaya gaya: 20-Sep-2026

> **Shuru karne se pehle (roz ki aadat):**
> 1. Sirf yehi link — **https://vetan-svn.vercel.app/** (Alpha link kabhi nahi)
> 2. Nayi tab + **Ctrl+Shift+R** → phir login
> 3. Payroll sirf HR/SUPER_HR kare — do log ek saath same month process na karein

---

## 📋 POORA FLOW EK NAZAR ME

```
1. ATTENDANCE FINAL  →  2. PAYROLL CALCULATE (DRAFT)  →  3. REVIEW
→  4. APPROVE + LOCK  →  5. BANK EXPORT  →  6. BANK ME PAYMENT  →  7. MARK PAID
```

**Golden Rule:** Lock ke baad kuch bhi change nahi hoga — isliye **Lock sirf sab kuch verify karne ke BAAD**.

---

## ✅ STEP 1 — ATTENDANCE FINAL KARO (sabse pehle, 1-2 din pehle)

**Kahan:** Attendance module → **Monthly** sub-tab

| Kya karna hai | Kaise |
|---|---|
| Month select | **Sep-26 (2026-09)** chuno |
| Sab employees cover | Har active employee ki entry dikhni chahiye — jo gayab hai wo pehle add karo |
| Manual entry | Attendance → **Daily/Manual** se missing punches bharo |
| Corrections | **Corrections** sub-tab me pending corrections approve/resolve karo |
| Worker attendance | Workforce module me Sep-26 CSV upload + finalize (agar workers aapke scope me hain) |
| LOP/LWP check | Leave wale employees ke LOP days sahi dikh rahe hain? |

> ⚠️ **Attendance = Salary ka base.** Yahan galti = har employee ki salary galat.
> Isliye attendance **lock hone se pehle** hi 100% final karo.

---

## ✅ STEP 2 — PAYROLL CALCULATE (DRAFT)

**Kahan:** Payroll module → Sep-26 → **Calculate / Process Payroll**

- Company-wise ya ALL — apne flow ke hisaab se
- Ye **DRAFT** banata hai — abhi kuch lock nahi hua, galti ho to recalculate ho sakta hai
- Draft banne ke baad **payslips preview** dekho

---

## ✅ STEP 3 — REVIEW (Draft par hi, dhyan se)

Sep-26 draft me ye 7 cheezein check karo:

| # | Check | Kya dekhna hai |
|---|---|---|
| 1 | **Paid Days / LOP** | Attendance se match karta hai? |
| 2 | **Basic** | Sep-26 ka effective Basic (nayi increment/revision wale ke liye revised Basic) |
| 3 | **Loan EMI** | Loan wale employees ki EMI kat rahi hai? |
| 4 | **Arrear** | Manual arrears (agar dale hain) dikh rahe hain? |
| 5 | **Bonus Provision** | Sep-26 provision **auto-generate** hua? (Apr-26 se ye salary sheet se apne-aap banta hai) |
| 6 | **Net Pay** | Koi negative / zero / absurd amount to nahi? |
| 7 | **Bank details** | Account/IFSC missing employees ki list — **bank export se pehle bharwana zaroori** |

> 💡 Galti mili? → Draft par hi recalculate karo (month abhi locked nahi hai).

---

## ✅ STEP 4 — APPROVE + LOCK

**Kahan:** Payroll module → Sep-26 → **Approve/Close (Lock)**

- Iske baad month **LOCKED** — attendance/payslip me koi change nahi hoga
- **Lock ke BAAD galti mili?** → SUPER_HR se hi **Unlock** ho sakta hai (audit-log me record hota hai)
- Isliye: **Lock = "mai confirm karti hoon ki sab sahi hai"** — tabhi dabao

---

## ✅ STEP 5 — BANK EXPORT

**Kahan:** Payroll/Bank section → Sep-26 → Export

- **Bank Transfer Sheet** (Vetan_BankTransfer_Format) — beneficiary, account, IFSC, amount
- **HDFC Salary Upload** format — agar HDFC portal use karte ho
- Company-wise filter bhi hai
- **Missing bank account wale employees export me nahi aayenge** — Step 3 ki list pehle clear karo

> ⚠️ Export ki file **kholkar verify** karo: total amount = payroll ka total net payable.

---

## ✅ STEP 6 — BANK ME PAYMENT (ERP ke bahar)

- Export ki CSV bank portal me upload karo (HDFC/other)
- Bank se payment confirmation/UTR aane do
- Failed/returned entries note karo

---

## ✅ STEP 7 — MARK PAID (ERP me)

**Kahan:** Payroll module → Sep-26 → **Mark Paid** (payment date ke saath)

- Saare payslips **PAID** status me aa jayenge + employees ko notification jaata hai
- Ek-ek employee ko alag mark karna ho to individual payslip par **Mark Paid** (payment date optional)
- Ye step bonus provision register aur MD dashboard ki "Paid" counts ko bhi final karta hai

---

## 📊 STEP 8 — POST-PAYROLL VERIFICATION (5 min)

1. **MD Dashboard** kholo → Sep-26 ke salary cards ab populated dikhne chahiye
2. **Bonus Register** → Sep-26 rows `SALARY AUTO` source ke saath aayi?
3. **MD Weekly Checklist** ke A/B/C checks bharo (ye known-good snapshot ban jayega)
4. Audit-log me entries dikhni chahiye: *Payroll Processed → Approved → Paid*

---

## 🚫 YE KABHI MAT KARNA

| ❌ Nahi karna | Kyun |
|---|---|
| Attendance finalize se pehle Calculate | Salary galat banegi, phir unlock ka jhanjhat |
| Lock ke baad "bas ek chhota change" | Month locked hai — SUPER_HR unlock hi karega (audit me dikhega) |
| Bank details bina verify export | Payment fail/return — dobara kaam |
| Do log ek saath same month process | Duplicate/conflict ka risk |
| Alpha link par payroll | Data do jagah bat jayega |

---

## 🆘 KUCH GALAT HO GAYA?

| Situation | Kya karein |
|---|---|
| Draft me galti | Recalculate karo (abhi locked nahi hai) |
| Lock ke baad galti | SUPER_HR (Vishnu) ko bolo — Unlock → fix → recalculate → dobara Lock |
| Bank me payment fail | ERP me us payslip ko PAID **mat** karo — payment confirm hone par hi mark karo |
| Kuch samajh nahi aa raha | Screenshot + date/time ke saath Vishnu ko report karo — **khud trial-and-error mat karo** |

**Yaad rakho:** Save hua data cloud me awaited-write se jata hai — success banner aaye matlab persist ho gaya. Screen par purani value dikhe to pehle Refresh/hard-refresh karo.
