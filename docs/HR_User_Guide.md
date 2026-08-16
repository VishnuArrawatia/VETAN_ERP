# VETAN ERP — HR User Guide

## परिचय
यह दस्तावेज़ VETAN ERP सिस्‍टम के लिए HR टीम का आधिकारिक User Guide है। इसमें HR/Payroll प्रक्रियाएँ, Step‑by‑Step निर्देश, और उपयोग के लिए तैयार पत्र (templates) दिए गए हैं — जैसे Increment Letter और Full & Final (F&F) Settlement Letter। यह फ़ाइल रिपॉज़िटरी के `/docs/HR_User_Guide.md` में सुरक्षित की जाएगी।

---

## उद्देश्य और Audience
- उद्देश्य: HR टीम को VETAN ERP में रोज़मर्रा के काम (employee management, salary revisions, increment letters, F&F settlement) को professional और standardized तरीके से करने के लिए मार्गदर्शन देना।
- Audience: Company HR Officers, HODs, Payroll Operators, Accounts Team

---

## दस्तावेज़ संरचना (Table of Contents)
1. Quick Start / System Access
2. Employee Master: Create / Update / Bulk Import
3. Password Management (Reset / Change)
4. Salary Revision (Increment) Workflow — End to End
5. Increment Letter — Template & Example
6. Full & Final (F&F) Settlement — Workflow & Template
7. Approvals & Audit Trail
8. Checklists for HR
9. Templates (copy‑paste ready)
10. Appendix: Commands / How to generate PDFs

---

## 1. Quick Start / System Access
A. Login (HR Desk)
1. Open the VETAN ERP application in browser.
2. Click `Admin / HR Desk` to access HR features.
3. Enter your HR username and password.
4. If first-time login, follow the forced change‑password flow.

B. Roles and Permissions (important)
- SUPER_HR: पूर्ण अधिकार — कंपनी पंजीकरण, PIN परिवर्तन, payroll unlock/restore
- MANAGEMENT: उच्च स्तर के अधिकार (read/approve)
- COMPANY_HR: केवल assigned company employees पर काम कर सकते हैं
- AUDITOR: Read‑only (write requests blocked)

C. Server availability
- अगर frontend पर "Server API missing" जैसा संदेश आ रहा है, backend (server.ts) deployed नहीं है।
- Local testing: `npm install` → `npm run dev:server` (backend) और `npm run dev` (frontend)

---

## 2. Employee Master — Create / Update / Bulk Import
A. Create Single Employee (UI Steps)
1. HR Desk → Employees → Add New Employee
2. Mandatory fields: `id`, `name`, `designation`, `joining_date`, `company`, `department`, `base_salary`
3. For security: set `needs_password_change: true` and do not enter a permanent password.
4. Save. System will create audit log entry.

B. Update Employee
1. Search employee → Edit
2. Only `SUPER_HR` may change `id` (employee code).
3. After update, system logs field-level changes. Verify updated values with the employee.

C. Bulk import (CSV)
1. HR Desk → Import Employees → paste CSV in import tool
2. Map columns correctly (Employee Code, Name, Designation, Base Salary at minimum)
3. Import process sets `needs_password_change: true` for new employees.
4. After import, verify 5–10 random records for accuracy.

Notes: Always keep a backup before mass imports: `Admin → Backup` or `/api/backup-json`.

---

## 3. Password Management
A. Employee Self Service
- Default/temporary password policy: New employees should receive a random temporary password and `needs_password_change` must be set true.
- First-time login: if employee.password not set, the system may accept Employee ID as temporary credential (legacy behaviour). HR must avoid relying on this in production.

B. Admin Reset Password (secure flow)
- Use Admin Reset feature (UI or API: `POST /api/admin/reset-employee-password`).
- Workflow: HR generates a secure temporary password (e.g., `Temp@1234Ab`) → Update employee via reset API → Set `needs_password_change` = true.
- Communicate temp password securely (e.g., official email flagged as confidential).

C. Employee Change Password (self)
- Employee → Change Password screen
- Old password (first-time may be employer-provided temp) → New password (enforce complexity policy)

Security Recommendation (critical)
- Migrate to hashed passwords (bcrypt/argon2). Avoid storing plaintext. If not done yet, schedule immediate migration and enforce password reset for all users.

---

## 4. Salary Revision / Increment Workflow (End‑to‑End)
Objective: Standard process to approve and apply salary increments safely and auditably.

A. Actors
- Requester: Manager / HOD
- Approver: HOD → COMPANY_HR → SUPER_HR (if required)
- Payroll Operator: runs payroll and confirms payments

B. Steps (detailed)
1. Initiation (Manager)
   - Manager requests increment via internal form (email/internal HR ticket) with reason and recommended amount.
2. HR Entry (Create Salary Revision)
   - HR → Salary Revisions → Add Revision
   - Required fields: `employee_code`, `new_salary`, `effective_date`, `approved_by`, `reason`.
   - Optional fields: hra, conveyance_allowance, da, special_allowance, increment_amount, new_structure.
   - System checks: payroll month must not be locked for `effective_date`.
3. Approval
   - Approvals logged in audit. Email/notification sent to approver chain.
4. Payroll Application
   - Payroll operator runs `POST /api/payroll-runs/calculate { month, company }`.
   - Review slips: `GET /api/payslips/month/:month`.
   - If ok, `POST /api/payroll-runs/close` to lock and `POST /api/payroll-runs/pay` to disburse.
5. Communication
   - Generate Increment Letter (template provided) and send to employee.
   - Attach payslip and update HR record.

C. Important validations
- Do not apply retroactive changes to closed/locked months.
- Keep audit trail for who changed what.

---

## 5. Increment Letter — Template & Example
Use company letterhead. Save as `INCREMENT_{EMP_ID}_{EFFECTIVE_DATE}.pdf` and store in `/docs/hr-letters/` and attach in employee record.

**Authorised Signatory**
- Every letter must include the Authorised Signatory name and designation.
- Default authorised signatory: `Vishnu Arrawatia` (or HR Officer). HR can edit the name per requirement before generating the letter.
- How to edit: replace the `{SIGNATORY_NAME}` placeholder in the template with desired authorised signatory name (e.g., the HR Officer or Managing Director). In future, this can be stored in system settings (e.g., `authorised_signatory_name`) and exposed in Admin UI.

Template (copy‑paste ready):

```text
[COMPANY LETTERHEAD]
Date: {DATE}

To,
{Employee Name}
Employee ID: {EMP_ID}
Designation: {DESIGNATION}
Department: {DEPARTMENT}

Subject: Salary Increment Notification — Effective {EFFECTIVE_DATE}

Dear {Employee Name},

We are pleased to inform you that your salary has been revised with effect from {EFFECTIVE_DATE} as per the details below:

- Previous Basic Salary : ₹ {OLD_BASIC}
- New Basic Salary      : ₹ {NEW_BASIC}
- HRA                  : ₹ {NEW_HRA}
- Other Allowances     : ₹ {NEW_OTHER_ALLOW}
- Gross Salary         : ₹ {NEW_GROSS}
- Net Salary (approx)  : ₹ {NEW_NET}

This revision is approved by {APPROVER_NAME} on {APPROVAL_DATE}. Your new CTC will be ₹ {NEW_CTC} per annum. All statutory deductions will apply as per law.

Please sign below to acknowledge receipt of this communication.

Regards,
{HR_NAME}
HR Officer — {COMPANY_NAME}

Authorised Signatory:
{SIGNATORY_NAME}
{SIGNATORY_DESIGNATION}

Acknowledgement: I, {Employee Name}, acknowledge receipt of the above revision.
Employee Signature: __________ Date: __________
```

Formatting: use 12‑point Inter / Arial with 1.5 line height. Convert to PDF before sending.

---

## 6. Full & Final (F&F) Settlement — Workflow & Template
Goal: Professional, auditable settlement and documentation on employee separation.

A. Initiation
1. When employee resigns or is terminated, update employee `exit_date` and status.
2. HR creates F&F record in system: `POST /api/ff` or via UI → Full & Final → New Settlement.

B. Data required
- Employee details, last working day, leave balances, outstanding loans/advances, gratuity eligibility, pending reimbursements, notice period status.

C. Calculation Checklist
1. Salary up to last working day (pro‑rata)
2. Leave encashment = EarnedLeaveBalance × PerDaySalary
3. Gratuity (if eligible) = (Last drawn Basic + DA) × 15/26 × Years of Service (follow statutory rules)
4. Add reimbursements and arrears
5. Subtract outstanding loans/advances, notice recovery, TDS
6. Net payable amount = Sum(payments) − Sum(deductions)

D. Approvals
- HOD → COMPANY_HR → Accounts → SUPER_HR (if required)
- Each approval must be recorded with timestamp and user.

E. Communication & Payment
1. Generate F&F Letter (template below) + Calculation Summary.
2. Employee signs acknowledgement on receipt.
3. Accounts disburse via bank transfer and store payment proof.

**Authorised Signatory**
- F&F letters must explicitly include the Authorised Signatory name and designation.
- Default signatory: `Vishnu Arrawatia` (can be edited as required by HR).

Template (F&F letter):

```text
[COMPANY LETTERHEAD]
Date: {DATE}
To,
{Employee Name}
Employee ID: {EMP_ID}

Subject: Full & Final Settlement — {EMP_ID} — {LAST_WORKING_DAY}

Dear {Employee Name},

This is to confirm your Full & Final Settlement with {COMPANY_NAME} for employment ending on {LAST_WORKING_DAY}. The settlement details are below:

Payments:
1. Salary upto {LAST_WORKING_DAY} (Pro‑rata): ₹ {AMOUNT}
2. Leave encashment: ₹ {AMOUNT}
3. Gratuity (if applicable): ₹ {AMOUNT}
4. Reimbursements: ₹ {AMOUNT}
5. Other payments: ₹ {AMOUNT}
Subtotal (A): ₹ {SUBTOTAL_A}

Deductions:
1. Outstanding loan/advance: ₹ {AMOUNT}
2. Notice period recovery: ₹ {AMOUNT}
3. TDS / Tax: ₹ {AMOUNT}
4. Statutory deductions adjustments: ₹ {AMOUNT}
Subtotal Deductions (B): ₹ {SUBTOTAL_B}

Net Payable (A − B): ₹ {NET_PAYABLE}

The above amount will be paid to your bank account ending with {BANK_LAST4} on or before {PAYMENT_DATE}.

Regards,
{HR_NAME}
HR — {COMPANY_NAME}

Authorised Signatory:
{SIGNATORY_NAME}
{SIGNATORY_DESIGNATION}

Please sign the acknowledgement below to confirm acceptance of settlement and receipt of payment.

Acknowledgement:
I, {EMPLOYEE_NAME}, accept the Full & Final Settlement and confirm receipt of ₹ {NET_PAYABLE}.
Signature: ______  Date: ______
```

Attach: Calculation Summary Table (rows for each component) and payment proof.

---

## 7. Approvals & Audit Trail
- System uses `db.logAudit(event, details, operator)` for every critical change. Ensure:
  - Salary revisions, payroll close/pay, password resets, F&F creation and approval, employee deletions are logged.
- Keep monthly backups: `GET /api/backup-json` and store securely.

---

## 8. HR Checklists (Quick Reference)
A. Before applying increment:
- [ ] Approval email/ticket attached
- [ ] Employee bank & PAN details verified
- [ ] Payroll month unlocked or scheduled
- [ ] Update HR record and generate increment letter

B. Before closing payroll:
- [ ] Validate TDS and loan recoveries
- [ ] Export PF / bank files and cross-check counts
- [ ] Approve and lock payroll

C. Before F&F payout:
- [ ] Verify loans/advances and attach receipts
- [ ] Obtain signed acknowledgement
- [ ] Ensure tax and statutory computations correct

---

## 9. Templates (Files to add in repo /docs/hr-templates)
- Increment Letter: `INCREMENT_TEMPLATE.txt` (use the template from Section 5)
- Increment Acknowledgement: `INCREMENT_ACK.txt`
- F&F Letter: `FFS_TEMPLATE.txt` (use template from Section 6)
- F&F Calculation Summary: `FFS_CALCULATION_{EMP_ID}.csv` (tabular CSV)

Add these files as plain text / .docx and store in `/docs/hr-templates/` for HR to download and use.

---

## 10. Appendix: Commands / How to generate PDFs
A. Local server (for testing templates & auto-generation):
1. Install: `npm install`
2. Start backend for APIs: `npm run dev:server`
3. Start frontend: `npm run dev`

B. Convert template to PDF manually:
- Open the template in MS Word or Google Docs → Replace placeholders → Save/Export as PDF
- Or use pandoc: `pandoc INCREMENT_{EMP_ID}.md -o INCREMENT_{EMP_ID}.pdf`

C. (Optional) Automation idea (future): implement an endpoint `/api/hr/generate-increment-letter` which fills template and returns a PDF. I can implement this upon request.

---

## Next steps I will perform (if you confirm)
- Create this file `/docs/HR_User_Guide.md` in repository (done).
- Optionally add `/docs/hr-templates/INCREMENT_TEMPLATE.txt` and `FFS_TEMPLATE.txt` as separate files.

---

If आपको कोई विशेष बदलाव चाहिए (language tone, Hindi/English mix, add company letterhead example, or .docx templates), बताइए — मैं उसी के अनुसार guide को update कर दूँगा और PDF बनाकर PR में attach कर दूँगा.
