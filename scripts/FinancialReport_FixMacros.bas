Attribute VB_Name = "FinancialReport_FixMacros"
'==============================================================================
' Financial Report Fix Macros - "Revised Group-Summary as on 31.08.26.xlsb"
' HOW TO RUN:
'   1. Open the workbook in Excel (enable macros if prompted)
'   2. Alt+F11 > File > Import File... > select this .bas file
'   3. Alt+F8 > run  FixAll_FinancialReport
' It creates a timestamped backup BEFORE touching anything.
'==============================================================================
Option Explicit
Public Const FIXMACRO_VERSION As String = "v2.3"

'------------------------------------------------------------------------------
' MASTER: Run this one. Creates backup first, then applies all fixes.
'------------------------------------------------------------------------------
Public Sub FixAll_FinancialReport()
    Dim ts As String
    ts = Format(Now, "yyyy-mm-dd_hhmm")
    Dim backupPath As String
    backupPath = ThisWorkbook.Path & "\BACKUP_pre-fix_" & ts & "_" & ThisWorkbook.Name

    Application.ScreenUpdating = False
    Application.DisplayAlerts = False
    On Error GoTo FailSafe

    'Step 0: timestamped backup
    ThisWorkbook.SaveCopyAs backupPath
    Debug.Print "Backup created: " & backupPath

    CleanBrokenNamedRanges
    FixDSCRSheet
    FixTaxInputCell
    FixTBDateHeaders
    FixSakarDSCRPrincipal
    AutomatePLFormulas
    BuildAutoCheckSheet
    BuildDrillDownSheet

    ThisWorkbook.Save
    Application.ScreenUpdating = True
    Application.DisplayAlerts = True

    MsgBox "All fixes applied and saved. [" & FIXMACRO_VERSION & "]" & vbCrLf & vbCrLf & _
           "Backup: " & backupPath & vbCrLf & vbCrLf & _
           "1) DSCR rebuilt (real EBITDA + Loan-SVN schedule)" & vbCrLf & _
           "2) Broken named ranges removed" & vbCrLf & _
           "3) Tax rate moved to input cell New PL!B65 (edit it anytime)" & vbCrLf & _
           "4) TB/BS dates ab FORMULAS hain (anchor cells se months roll karo)" & vbCrLf & _
           "5) SAKAR DSCR principal = TL decline annualized (review!)" & vbCrLf & _
           "6) New PL: SVN monthly tax/PAT + AC-column #REF! fix" & vbCrLf & _
           "7) 'Auto-Check' sheet added - wahan sab OK hona chahiye" & vbCrLf & _
           "8) 'Drill-Down' sheet: Entity + Group Head dropdown se account breakup" & vbCrLf & vbCrLf & _
           "NOTE: BS Summary D/F columns have manual add-on formulas" & vbCrLf & _
           "(e.g. +421.55 patches). Review them - they may double-count" & vbCrLf & _
           "now that real TB data flows.", _
           vbInformation, "Financial Report Fixes"
    Exit Sub

FailSafe:
    Application.ScreenUpdating = True
    Application.DisplayAlerts = True
    MsgBox "Fix failed - workbook NOT saved." & vbCrLf & _
           "Error " & Err.Number & ": " & Err.Description & vbCrLf & vbCrLf & _
           "Backup was created before any change, so nothing is lost.", _
           vbCritical, "FixAll_FinancialReport"
End Sub

'------------------------------------------------------------------------------
' Step 1: Remove workbook-level names that point to #REF! (deleted sheets)
'------------------------------------------------------------------------------
Public Sub CleanBrokenNamedRanges()
    Dim killList As Collection
    Set killList = New Collection
    Dim n As Name

    For Each n In ThisWorkbook.Names
        'built-ins skip (_xleta., _xlfn., _FilterDatabase...)
        If Left(n.Name, 7) <> "_xleta." And Left(n.Name, 6) <> "_xlfn." And InStr(n.Name, "_FilterDatabase") = 0 Then
            'sheet-scoped names ("Sheet!Name") bhi include -- unme bhi #REF! ho sakta hai
            If InStr(n.RefersTo, "#REF!") > 0 Then killList.Add n
        End If
    Next n

    Dim killed As Long
    On Error Resume Next
    Dim nm As Variant
    For Each nm In killList
        nm.Delete
        If Err.Number = 0 Then killed = killed + 1
        Err.Clear
    Next nm
    On Error GoTo 0

    Debug.Print "Broken named ranges removed: " & killed
End Sub

'------------------------------------------------------------------------------
' Step 2: Rebuild DSCR sheet
'
'   Bugs fixed:
'   - I8/I9 hold =#REF! formulas (cached 23 hides breakage until recalc)
'   - SVN EBITDA was PBT*82.5% instead of real EBITDA
'   - Principal repayment was not sourced from the Loan-SVN schedule
'
'   Layout (rows 5..15, cols F..J):
'     F7 = SAKAR EBITDA (New PL P51, lakhs)     I7 = SVN EBITDA (New PL AE51)
'     F12 = SAKAR interest MSME (1.99, hardcoded) F13 = SAKAR interest other (4.18)
'     F11 = SAKAR principal (BS-based proxy, kept as-is)
'     G13 = SAKAR debt service (SUM F11:F13)    G9  = SAKAR EBITDA sum
'     I11 = SVN principal (Loan-SVN rows 68:80 = next 12 months Sep-26..Aug-27,
'           cols E,I,M,Q,U per month; row 75 blank year-separator, SUM handles it)
'     I9  = SVN interest  (same rows, cols F,J,N,R,V per month)
'     I12 = SVN interest (=I9); J12 = SUM(I11:I12) = total debt service
'     G13 = SUM(F11:F13) = SAKAR total debt service (kept as-is)
'     G15 = SAKAR DSCR  |  J15 = SVN DSCR
'------------------------------------------------------------------------------
Public Sub FixDSCRSheet()
    Dim ws As Worksheet, pl As Worksheet
    Set ws = ThisWorkbook.Worksheets("DSCR")
    Set pl = ThisWorkbook.Worksheets("New PL")

    'EBITDA from P&L (real YTD, lakhs)
    ws.Range("F7").Formula = "='New PL'!P51"
    ws.Range("I7").Formula = "='New PL'!AE51"

    'Interest (lakhs) - SVN, next 12 months from loan schedule (Sep-26..Aug-27)
    ws.Range("I9").Formula = _
        "=(SUM('Loan-SVN'!$F$68:$F$80,'Loan-SVN'!$J$68:$J$80,'Loan-SVN'!$N$68:$N$80," & _
        "'Loan-SVN'!$R$68:$R$80,'Loan-SVN'!$V$68:$V$80))/100000"
    ws.Range("I12").Formula = "=I9"

    'Principal next 12 months (lakhs) - SVN from loan schedule
    ws.Range("I11").Formula = _
        "=(SUM('Loan-SVN'!$E$68:$E$80,'Loan-SVN'!$I$68:$I$80,'Loan-SVN'!$M$68:$M$80," & _
        "'Loan-SVN'!$Q$68:$Q$80,'Loan-SVN'!$U$68:$U$80))/100000"

    'SVN debt-service cell I12 (=I9) and J12 (=SUM(I11:I12)) are left untouched:
    'J12 = principal(I11) + interest(I12) = total debt service. Same for SAKAR:
    'G13 = SUM(F11:F13) already = principal(F11) + interest(F12,F13).

    'Ratios
    ws.Range("G15").Formula = "=G9/G13"
    ws.Range("J15").Formula = "=J9/J12"

    'Remove the leftover #REF! cell completely
    ws.Range("I8").ClearContents

    'Header labels (in case they were lost)
    ws.Range("F5").Value = "Sakar"
    ws.Range("I5").Value = "SVN"

    Debug.Print "DSCR sheet rebuilt."
End Sub

'------------------------------------------------------------------------------
' Step 3: Make the income-tax rate an editable input instead of a hardcoded %
'   - New PL B65 becomes the input cell (default 25.17% = SAKAR YTD current)
'   - O63 formula now points to it; monthly PAT rows C64:N64 get proper chain
'------------------------------------------------------------------------------
Public Sub FixTaxInputCell()
    Dim pl As Worksheet
    Set pl = ThisWorkbook.Worksheets("New PL")

    pl.Range("B65").Value = 0.2517
    pl.Range("B65").NumberFormat = "0.00%"
    pl.Range("A65").Value = "Tax Rate (input cell - edit here)"

    'YTD tax + PAT now driven by the input cell
    pl.Range("O63").Formula = "=O62*$B$65"
    pl.Range("O64").Formula = "=O62-O63"

    'SAKAR monthly PAT chain: tax per month then PAT
    pl.Range("C63:N63").Formula = "=C62*$B$65"
    pl.Range("C64:N64").Formula = "=C62-C63"

    'SVN monthly chain already has "="-formulas pointing to AD; align with input cell too
    pl.Range("AD63").Formula = "=AD62*$B$65"
    pl.Range("AD64").Formula = "=AD62-AD63"

    Debug.Print "Tax input cell added at New PL!B65."
End Sub

'------------------------------------------------------------------------------
' Step 4: Fix TB date headers so BS Summary date-MATCH works
'
'   Root cause: BS Summary named ranges do MATCH('BS Summary'!A$2, TB row1).
'   BS uses month-end dates; TB headers were 1st-of-month (SKR) or missing
'   (SVN), so every MATCH failed and BS showed stale cached 42s.
'
'   ALL DATES ARE FORMULAS (user requirement: sab kuch editable Excel formulas):
'   - Anchor cells: Master-TB-Sakar!K1 (=DATE(2026,5,31)) aur Master-TB-SVN!H1
'     (=DATE(2026,4,30)). Baaki months EDATE chain se auto-derive hote hain.
'   - Naya month aane par: TB me agli cell par =EDATE(prev,1) aur balances paste.
'   - BS Summary row-2 dates ab TB date-cells ko REFERENCE karte hain (D2='...U$1
'     etc.), isliye BS bhi TB anchors edit karte hi update ho jata hai.
'   SAKAR (Master-TB-Sakar row 1): K=May, L=Jun, M=Jul, N=Aug (FY26-27),
'   U=Mar-26 (prior FY month-end). Month-end dates.
'   SVN (Master-TB-SVN row 1): G1:L1 me dates pehle se sahi the (Mar..Aug);
'   macro unhe EDATE-chain formulas me convert karta hai (same values) aur
'   future months M1:S1 (Sep..Mar) ke dates bhi bana deta hai. T column ko
'   MAT chhedna - wo hidden helper columns (XFK:XFW) se current-month total
'   hai aur pehle se sahi hai.
'------------------------------------------------------------------------------
Public Sub FixTBDateHeaders()
    Dim skr As Worksheet, svn As Worksheet
    Set skr = ThisWorkbook.Worksheets("Master-TB-Sakar")
    Set svn = ThisWorkbook.Worksheets("Master-TB-SVN")

    'SAKAR: month-end dates as FORMULAS (anchor = K1; edit K1 to roll the year)
    skr.Range("K1").Formula = "=DATE(2026,5,31)"      'anchor: May-26
    skr.Range("L1").Formula = "=EDATE($K$1,1)"        'Jun-26
    skr.Range("M1").Formula = "=EDATE($L$1,1)"        'Jul-26
    skr.Range("N1").Formula = "=EDATE($M$1,1)"        'Aug-26
    skr.Range("U1").Formula = "=EOMONTH($K$1,-2)"     'Mar-26 opening (derived)
    skr.Range("I1:U1").NumberFormat = "dd-mmm-yy"

    'SVN: month-end dates as FORMULAS (anchor = H1; edit H1 to roll the year)
    svn.Range("H1").Formula = "=DATE(2026,4,30)"      'anchor: Apr-26
    svn.Range("I1").Formula = "=EDATE($H$1,1)"        'May-26
    svn.Range("J1").Formula = "=EDATE($I$1,1)"        'Jun-26
    svn.Range("K1").Formula = "=EDATE($J$1,1)"        'Jul-26
    svn.Range("L1").Formula = "=EDATE($K$1,1)"        'Aug-26
    svn.Range("M1").Formula = "=EDATE($L$1,1)"        'Sep-26
    svn.Range("N1").Formula = "=EDATE($M$1,1)"        'Oct-26
    svn.Range("O1").Formula = "=EDATE($N$1,1)"        'Nov-26
    svn.Range("P1").Formula = "=EDATE($O$1,1)"        'Dec-26
    svn.Range("Q1").Formula = "=EDATE($P$1,1)"        'Jan-27
    svn.Range("R1").Formula = "=EDATE($Q$1,1)"        'Feb-27
    svn.Range("S1").Formula = "=EDATE($R$1,1)"        'Mar-27
    svn.Range("G1").Formula = "=EOMONTH($H$1,-1)"     'Mar-26 opening (derived)
    svn.Range("G1:S1").NumberFormat = "dd-mmm-yy"

    'T column: DO NOT TOUCH - T1 date (46265) aur T3:T620 formulas
    '(=SUM(XFK:XFW) hidden helpers se current-month total) pehle se sahi hain.

    'BS Summary row-2 dates: REFERENCE the TB date cells so BS auto-follows.
    'D/K = opening (Mar-26). F/L = LATEST completed FY month via LOOKUP formula
    '(>= 1-Apr-2026 aur <= TODAY) - TB me naya month aate hi BS current column
    'khud update ho jata hai. E2 untouched (E column manual entries hai).
    'NOTE: K2 pehle galti se May-26 map hua tha - ab Mar-26 (G1) hai, jaisa
    'original me tha.
    Dim bs As Worksheet
    Set bs = ThisWorkbook.Worksheets("BS Summary")
    bs.Range("D2").Formula = "='Master-TB-Sakar'!$U$1"   'Mar-26 opening
    bs.Range("F2").Formula = _
        "=LOOKUP(2,1/(('Master-TB-Sakar'!$K$1:$V$1>=DATE(2026,4,1))*('Master-TB-Sakar'!$K$1:$V$1<=TODAY())),'Master-TB-Sakar'!$K$1:$V$1)"
    bs.Range("K2").Formula = "='Master-TB-SVN'!$G$1"     'Mar-26 opening
    bs.Range("L2").Formula = _
        "=LOOKUP(2,1/(('Master-TB-SVN'!$H$1:$S$1>=DATE(2026,4,1))*('Master-TB-SVN'!$H$1:$S$1<=TODAY())),'Master-TB-SVN'!$H$1:$S$1)"
    bs.Range("D2:L2").NumberFormat = "dd-mmm-yy"

    Debug.Print "TB date headers fixed (formula-based)."
End Sub

'------------------------------------------------------------------------------
' Step 5: SAKAR DSCR principal input from BS loan balances
'
'   Loan-SVN sheet covers SVN only. SAKAR loan schedule is NOT in this
'   workbook, so principal = term-loan balance decline (Mar-26 vs Aug-26
'   from BS Summary rows 10-11) annualized over the 5 elapsed months.
'   If TL data is missing (balance rose), MAX(0,...) gives 0 -> review.
'   Replace with the real SAKAR loan schedule when available.
'------------------------------------------------------------------------------
Public Sub FixSakarDSCRPrincipal()
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Worksheets("DSCR")

    ws.Range("F11").Formula = _
        "=MAX(0,(('BS Summary'!D10+'BS Summary'!D11)-('BS Summary'!F10+'BS Summary'!F11))*12/5)"
    ws.Range("E11").Value = "Principal (TL decline Mar26-Aug26 annualized - replace with SAKAR loan schedule)"

    Debug.Print "SAKAR DSCR principal input updated."
End Sub

'------------------------------------------------------------------------------
' Step 6: New PL remaining automation fixes (formula-only)
'   - AC51 (SVN Mar-27 EBITDA) me #REF! tha -> sahi sum-chain
'   - SVN monthly tax/PAT chain R63:AC64 (pehle sirf YTD AD63/AD64 tha)
'------------------------------------------------------------------------------
Public Sub AutomatePLFormulas()
    Dim pl As Worksheet
    Set pl = ThisWorkbook.Worksheets("New PL")

    pl.Range("AC51").Formula = "=+AC14+AC9-AC49"
    pl.Range("R63:AC63").Formula = "=R62*$B$65"
    pl.Range("R64:AC64").Formula = "=R62-R63"

    Debug.Print "New PL automated: AC51 fixed, SVN monthly tax/PAT chain added."
End Sub

'------------------------------------------------------------------------------
' Step 7: Auto-Check sheet - formula-driven validation dashboard
'   Naya TB paste karte hi sab formulas recalc hote hain; CHECK/REVIEW dikhata
'   hai jahan dhyan dena hai. Koi VBA runtime calculation nahi - sab cell
'   formulas hain, user edit bhi kar sakta hai.
'------------------------------------------------------------------------------
Public Sub BuildAutoCheckSheet()
    Dim ws As Worksheet
    On Error Resume Next
    Set ws = ThisWorkbook.Worksheets("Auto-Check")
    On Error GoTo 0
    If ws Is Nothing Then
        Set ws = ThisWorkbook.Worksheets.Add(After:=ThisWorkbook.Worksheets(ThisWorkbook.Worksheets.Count))
        ws.Name = "Auto-Check"
    End If
    ws.Cells.Clear

    ws.Range("A1").Value = "AUTO-CHECK - naya TB paste karne ke baad sab OK hona chahiye (100% formulas)"

    ws.Range("A3").Value = "SAKAR TB net, latest month (lakhs) - ~0 hona chahiye"
    ws.Range("C3").Formula = _
        "=ROUND(SUM(INDEX('Master-TB-Sakar'!$K$3:$V$620,0,MATCH('BS Summary'!$F$2,'Master-TB-Sakar'!$K$1:$V$1,0)))/100000,2)"
    ws.Range("D3").Formula = "=IF(ABS(C3)<0.05,""OK"",""CHECK"")"

    ws.Range("A4").Value = "SVN TB net, latest month (lakhs) - ~0 hona chahiye"
    ws.Range("C4").Formula = _
        "=ROUND(SUM(INDEX('Master-TB-SVN'!$H$3:$S$620,0,MATCH('BS Summary'!$L$2,'Master-TB-SVN'!$H$1:$S$1,0)))/100000,2)"
    ws.Range("D4").Formula = "=IF(ABS(C4)<0.05,""OK"",""CHECK"")"

    ws.Range("A5").Value = "SAKAR R&S movement vs PAT YTD (diff, lakhs) - appropriation ho to diff legit"
    ws.Range("C5").Formula = "=ROUND('BS Summary'!F4-('BS Summary'!D4+'New PL'!$O$64/100000),2)"
    ws.Range("D5").Formula = "=IF(ABS(C5)<1,""OK"",""REVIEW"")"

    ws.Range("A6").Value = "SVN R&S movement vs PAT YTD (diff, lakhs)"
    ws.Range("C6").Formula = "=ROUND('BS Summary'!L4-('BS Summary'!K4+'New PL'!$AD$64/100000),2)"
    ws.Range("D6").Formula = "=IF(ABS(C6)<1,""OK"",""REVIEW"")"

    ws.Range("A7").Value = "DSCR SAKAR (>=1 hona chahiye)"
    ws.Range("C7").Formula = "=DSCR!G15"
    ws.Range("D7").Formula = "=IF(ISERROR(C7),""ERROR"",IF(C7>=1,""OK"",""REVIEW""))"

    ws.Range("A8").Value = "DSCR SVN (>=1 hona chahiye)"
    ws.Range("C8").Formula = "=DSCR!J15"
    ws.Range("D8").Formula = "=IF(ISERROR(C8),""ERROR"",IF(C8>=1,""OK"",""REVIEW""))"

    ws.Range("A9").Value = "Tax chain check: O62 x B65 - O63 = 0"
    ws.Range("C9").Formula = "=ROUND('New PL'!O62*'New PL'!B65-'New PL'!O63,2)"
    ws.Range("D9").Formula = "=IF(ABS(C9)<0.01,""OK"",""CHECK"")"

    ws.Range("A10").Value = "BS D4 patch (manual formula - review karke hatana)"
    ws.Range("C10").Formula = "=IFERROR(FORMULATEXT('BS Summary'!D4),""n/a"")"

    ws.Range("A11").Value = "BS K4 patch (manual formula - review karke hatana)"
    ws.Range("C11").Formula = "=IFERROR(FORMULATEXT('BS Summary'!K4),""n/a"")"

    ws.Range("C7:C8").NumberFormat = "0.00"
    ws.Columns("A").ColumnWidth = 62
    ws.Columns("C").ColumnWidth = 18
    ws.Columns("D").ColumnWidth = 12

    Debug.Print "Auto-Check sheet ready."
End Sub

'------------------------------------------------------------------------------
' STEP 8: Drill-Down sheet -- statement ke kisi bhi group head ka account breakup
'   100% FORMULA-DRIVEN: VBA sirf sheet + dropdowns + 4 formulas install karta hai.
'   Baad me aap khud edit kar sakte ho.
'   B2 = Entity (SAKAR/SVN) | B3 = Group Head (dropdown, TB groups se) | B4 = As-on date
'   Row 8 se dynamic spill (Excel 365 FILTER): code, account name, balance, share %
'   SAKAR TB: D=GL code, E=GL name, G..V = month columns (G1:V1 dates)
'   SVN   TB: C=GL code, D=GL name, H..S = month columns (H1:S1 dates; G = OB)
'------------------------------------------------------------------------------
Public Sub BuildDrillDownSheet()
    Dim ws As Worksheet, pl As Worksheet, bs As Worksheet
    Dim tbS As Worksheet, tbV As Worksheet
    Dim r As Long, lbl As String
    Dim d As Object, tbGroups As Object
    Dim fCrit As String, fEnt As String
    Dim legacy As Boolean

    Set pl = ThisWorkbook.Worksheets("New PL")
    Set bs = ThisWorkbook.Worksheets("BS Summary")
    Set tbS = ThisWorkbook.Worksheets("Master-TB-Sakar")
    Set tbV = ThisWorkbook.Worksheets("Master-TB-SVN")

    Application.DisplayAlerts = False
    On Error Resume Next
    ThisWorkbook.Worksheets("Drill-Down").Delete
    On Error GoTo 0
    Application.DisplayAlerts = True

    Set ws = ThisWorkbook.Worksheets.Add(After:=ThisWorkbook.Worksheets(ThisWorkbook.Worksheets.Count))
    ws.Name = "Drill-Down"
    ws.Tab.Color = RGB(31, 78, 120)

    ' --- TB group labels collect karo (dropdown me sirf wahi heads jo TB me exist karte hain) ---
    Set tbGroups = CreateObject("Scripting.Dictionary")
    tbGroups.CompareMode = 1
    For r = 3 To 650
        lbl = Trim$(CStr(tbS.Range("G" & r).Value))
        If Len(lbl) > 0 Then tbGroups(lbl) = 1
        lbl = Trim$(CStr(tbV.Range("B" & r).Value))
        If Len(lbl) > 0 Then tbGroups(lbl) = 1
    Next r

    ' --- statement labels jo TB group se match karte hain, dropdown list me daalo (col Z helper) ---
    Set d = CreateObject("Scripting.Dictionary")
    d.CompareMode = 1
    Dim z As Long
    z = 2
    For r = 3 To 48
        lbl = Trim$(CStr(pl.Range("B" & r).Value))
        If Len(lbl) > 0 And tbGroups.Exists(lbl) And Not d.Exists(lbl) Then
            d.Add lbl, 1
            ws.Range("Z" & z).Value = lbl
            z = z + 1
        End If
    Next r
    For r = 3 To 40
        lbl = Trim$(CStr(bs.Range("C" & r).Value))
        If Len(lbl) > 0 And tbGroups.Exists(lbl) And Not d.Exists(lbl) Then
            d.Add lbl, 1
            ws.Range("Z" & z).Value = lbl
            z = z + 1
        End If
    Next r
    ws.Columns("Z").Hidden = True

    ' --- title + selectors ---
    ws.Range("A1").Value = "GROUP BREAKUP -- Group head chuno, accounts neeche aa jayenge"
    ws.Range("A1").Font.Bold = True
    ws.Range("A1").Font.Size = 13
    ws.Range("A2").Value = "Entity:"
    ws.Range("A3").Value = "Group Head:"
    ws.Range("A4").Value = "As on:"
    ws.Range("B2").Value = "SAKAR"
    ws.Range("B3").Value = "Sales"
    ws.Range("B4").Formula = "=TODAY()"
    ws.Range("B4").NumberFormat = "dd-mmm-yy"
    With ws.Range("B2").Validation
        .Delete
        .Add Type:=xlValidateList, AlertStyle:=xlValidAlertStop, Formula1:="SAKAR,SVN"
        .IgnoreBlank = True
        .InCellDropdown = True
    End With
    ' group dropdown range-based hai (255-char inline limit se bachne ke liye)
    With ws.Range("B3").Validation
        .Delete
        .Add Type:=xlValidateList, AlertStyle:=xlValidAlertStop, Formula1:="=$Z$2:$Z$100"
        .IgnoreBlank = True
        .InCellDropdown = True
    End With
    ws.Range("A6").Value = "Total:"
    ws.Range("A6").Font.Bold = True

    ' --- table headers (row 7) ---
    ws.Range("A7").Value = "#"
    ws.Range("B7").Value = "G/L Code"
    ws.Range("C7").Value = "Account Name"
    ws.Range("D7").Value = "Balance"
    ws.Range("E7").Value = "Share %"
    With ws.Range("A7:E7")
        .Font.Bold = True
        .Font.Color = vbWhite
        .Interior.Color = RGB(31, 78, 120)
    End With

    ' --- dynamic formulas (Excel 365) -- inhe aap edit kar sakte ho ---
    fEnt = "MATCH($B$2,{""SAKAR"",""SVN""},0)"
    fCrit = "CHOOSE(" & fEnt & ",'Master-TB-Sakar'!$G$3:$G$650,'Master-TB-SVN'!$B$3:$B$650)=$B$3"

    On Error Resume Next
    ws.Range("B8").Formula = "=IFERROR(FILTER(CHOOSE(" & fEnt & ",'Master-TB-Sakar'!$D$3:$D$650,'Master-TB-SVN'!$C$3:$C$650)," & fCrit & "),"""")"

    ws.Range("C8").Formula = "=IFERROR(FILTER(CHOOSE(" & fEnt & ",'Master-TB-Sakar'!$E$3:$E$650,'Master-TB-SVN'!$D$3:$D$650)," & fCrit & "),"""")"
    ws.Range("D8").Formula = "=IFERROR(FILTER(CHOOSE(" & fEnt & ",INDEX('Master-TB-Sakar'!$G$3:$V$650,0,MATCH($B$4,'Master-TB-Sakar'!$G$1:$V$1,1)),INDEX('Master-TB-SVN'!$H$3:$S$650,0,MATCH($B$4,'Master-TB-SVN'!$H$1:$S$1,1)))," & fCrit & "),"""")"
    ws.Range("E8").Formula = "=IFERROR(D8#/SUM(ABS(D8#)),0)"
    ws.Range("D6").Formula = "=SUM(D8#)"
    legacy = Not ws.Range("B8").HasFormula
    On Error GoTo 0

    If legacy Then
        ws.Range("B8").Value = "Ye sheet Excel 365 ke FILTER function par hai - purane Excel me dropdown only."
    End If

    ' --- note + formatting ---
    ws.Range("A5").Value = "Note:"
    ws.Range("B5").Value = "As-on date ke hisaab se month column TB me se MATCH hota hai. Balance blank? To group label TB grouping column me set nahi hai."
    ws.Range("B5").Font.Italic = True
    ws.Range("B5").Font.Size = 9
    ws.Range("D6").NumberFormat = "#,##0.00;(#,##0.00)"
    ws.Range("D8").NumberFormat = "#,##0.00;(#,##0.00)"
    ws.Range("E8").NumberFormat = "0.0%"
    ws.Columns("A").ColumnWidth = 12
    ws.Columns("B").ColumnWidth = 16
    ws.Columns("C").ColumnWidth = 50
    ws.Columns("D").ColumnWidth = 16
    ws.Columns("E").ColumnWidth = 10
    On Error Resume Next
    ws.Activate
    ws.Range("A8").Select
    ActiveWindow.FreezePanes = True
    On Error GoTo 0

    Debug.Print "Drill-Down sheet ready (entity + group dropdowns, FILTER-based breakup)."
End Sub
