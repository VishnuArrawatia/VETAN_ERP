# VETAN ERP — Opening Balance Template (As of 1-Apr-2026)

## STEP 1: LOAN OPENING BALANCE

Excel mein ye columns fill karo:

| Employee Code | Employee Name | Company | Loan Type | Opening Balance (₹) | Monthly EMI (₹) | Loan Given Date | Reason |
|---|---|---|---|---|---|---|---|
| SV1ST0033 | Panchal Viraj | Sakar-I | Salary Advance | 15000 | 2500 | Jan-26 | Cash advance |
| SV1ST0046 | Ravindra Patel | SVN-1 | Personal Loan | 50000 | 5000 | Mar-26 | Emergency |

**Rules:**
- Opening Balance = 1-Apr-2026 ko kitna pending hai (chahe loan Jan mein diya ho ya Apr mein)
- Monthly EMI = Kitna har mahine katna hai
- Status = Automatically ACTIVE ho jayega

---

## STEP 2: LEAVE OPENING BALANCE

| Employee Code | Employee Name | Company | PL Opening (1-Apr) | CL Opening (1-Apr) | SL Opening (1-Apr) | CompOff Opening (1-Apr) |
|---|---|---|---|---|---|---|
| SV1ST0033 | Panchal Viraj | Sakar-I | 12 | 4 | 5 | 1 |
| SV1ST0046 | Ravindra Patel | SVN-1 | 15 | 6 | 6 | 0 |

**Rules:**
- PL = Privilege Leave (annual 18 days)
- CL = Casual Leave (annual 6 days)
- SL = Sick Leave (annual 6 days)
- CompOff = Sundays/Holidays pe kaam karke kitne din bache hain
- Ye 1-Apr-2026 ka USED ke baad BALANCE hona chahiye
- Agar kisi ne 3 CL use ki April se pehle, toh CL = 6-3 = 3

---

## STEP 3: HOW TO FILL

### Loan Opening Balance:
1. Apni Excel/Ledger se check karo — 1-Apr-2026 ko kitne employees ka loan pending hai
2. Har employee ka Employee Code, Opening Balance aur Monthly EMI likho
3. File mujhe do — main import kar dunga

### Leave Opening Balance:
1. FY 2025-26 mein kitni leave use hui thi check karo
2. Annual allotment se used ghatana = Opening Balance as of 1-Apr-2026
3. PL: 18/year, CL: 6/year, SL: 6/year
4. Agar kisi employee ne Apr-25 to Mar-26 mein 5 CL use ki → CL Opening = 6-5 = 1
5. File mujhe do — main update kar dunga

### CompOff:
1. Sundays/Holidays pe jo employees ne kaam kiya — unka count likho
2. Agar 2 Sundays pe kaam kiya → CompOff = 2
3. Abhi ke liye 0 rakh sakte ho — baad mein monthly add hoga

---

## SEND ME:

**Option A: Direct Excel/CSV bhejo**
Columns: Employee Code, Loan Opening, Loan EMI, PL, CL, SL, CompOff

**Option B: Screenshot/Text mein list bhejo**
Main format kar dunga

**Option C: Agar Excel file hai toh path do**
Main read karke import kar dunga
