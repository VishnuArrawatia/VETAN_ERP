Attribute VB_Name = "frmMaster"
Option Explicit

' ============================================================
' frmMaster - Employee Form (FIXED VERSION)
' 
' FIXES APPLIED:
' 1. SafeFmtDate() helper - prevents Type Mismatch on empty dates
' 2. CalculateTotal() - now calculates Basic+HRA+Other
' 3. Error handling added to btnSearch_Click
' ============================================================

Dim ws As Worksheet
Dim foundRange As Range
Dim targetRow As Long

'--- Safe Date Format Helper (PREVENTS DEBUG ERROR) ---
Private Function SafeFmtDate(val As Variant) As String
    On Error Resume Next
    SafeFmtDate = ""
    If Not IsEmpty(val) And Not IsError(val) Then
        If CStr(val) <> "" Then
            If IsDate(val) Then
                SafeFmtDate = Format(CDate(val), "dd-mmm-yy")
            Else
                SafeFmtDate = CStr(val)
            End If
        End If
    End If
    On Error GoTo 0
End Function

'--- Worksheet Setup ---
Private Sub SetWorksheet()
    If ws Is Nothing Then
        On Error Resume Next
        Set ws = ThisWorkbook.Sheets("MASTER_Workers")
        If ws Is Nothing Then
            Set ws = ThisWorkbook.Sheets("Worker_Master")
        End If
        On Error GoTo 0
    End If
End Sub

'--- 1. USERFORM INITIALIZE ---
Private Sub UserForm_Initialize()
    Call SetWorksheet
    
    On Error Resume Next
    
    ' Tab 1: Personal Info
    cmbGender.List = Array("M", "F")
    cmbStatus.List = Array("ACTIVE", "INACTIVE")
    
    ' Tab 2: Employment
    cmbUnit.List = Array("Sakar-I", "Sakar-III", "SVN-II", "SVN-I")
    cmbType.List = Array("Company", "Contractor", "Contractor-PF")
    cmbSource.List = Array("Company", "Bhavin Bhandari", "Shilpa Bhagone", _
                           "Veer Enterprises", "R N Enterprises")
    cmbdept.List = Array("Assembly", "Packing", "FF/Repair", "Wire Cutting", _
                         "D.W.", "House Keeping", "Line Leader", "Dispatch", _
                         "Store", "Soaking", "Quality", "MI", "SMT", _
                         "0.5 Bulb", "Extrusion", "Moulding")
    
    ' Working Hour
    cmbHours.List = Array("8 Hours", "10 Hours", "12 Hours")
    cmbCategory.List = Array("SK-I", "SK-III", "SV2")
    
    ' Tab 3: Statutory & Bank
    cmbPFFlag.List = Array("Yes", "No")
    cmbESICFlag.List = Array("Yes", "No")
    cmbRoute.List = Array("HDFC NEFT", "Cheque Payment", "Contractor", "Bank", "Cash")
    
    ' Tab 4: Salary Details
    cmbTransMode.List = Array("Company Bus", "Own", "Public Transport")
    cmbTransBy.List = Array("Company", "Own")

    On Error GoTo 0
    
    TxtDOJ.Text = Format(Date, "dd-mm-yyyy")
End Sub

'--- 2. SEARCH ---
Private Sub btnSearch_Click()
    Dim workerCode As String
    Dim searchVal As Variant
    Dim statusVal As String
    
    On Error GoTo SearchEH
    
    Call SetWorksheet
    
    If ws Is Nothing Then
        MsgBox "MASTER_Workers sheet nahi mili!", vbCritical, "Error"
        Exit Sub
    End If
    
    workerCode = UCase(Trim(txtcode.Text))
    If workerCode = "" Then
        MsgBox "Kripya search karne ke liye Worker Code darj karein!", vbExclamation, "Required"
        Exit Sub
    End If
    
    If IsNumeric(workerCode) Then
        searchVal = Val(workerCode)
    Else
        searchVal = workerCode
    End If
    
    Set foundRange = ws.Columns("B").Find(What:=searchVal, LookIn:=xlValues, LookAt:=xlWhole)
    
    If foundRange Is Nothing And IsNumeric(workerCode) Then
        Set foundRange = ws.Columns("B").Find(What:=workerCode, LookIn:=xlValues, LookAt:=xlWhole)
    End If
    
    If Not foundRange Is Nothing Then
        targetRow = foundRange.Row
        
        On Error Resume Next
        
        ' Tab 1: Personal Info
        TxtName.Text = ws.Cells(targetRow, 3).Value
        cmbGender.Text = ws.Cells(targetRow, 9).Value
        txtDOB.Text = SafeFmtDate(ws.Cells(targetRow, 10).Value)  ' Col J - FIXED
        TxtAadhar.Text = ws.Cells(targetRow, 18).Value
        
        statusVal = Trim(CStr(ws.Cells(targetRow, 35).Value))
        If statusVal = "1" Then
            cmbStatus.Text = "ACTIVE"
        ElseIf statusVal = "0" Then
            cmbStatus.Text = "INACTIVE"
        Else
            cmbStatus.Text = statusVal
        End If
        
        txtDOL.Text = SafeFmtDate(ws.Cells(targetRow, 39).Value)  ' Col AM - FIXED
        
        ' Tab 2: Employment
        cmbUnit.Text = ws.Cells(targetRow, 4).Value
        cmbType.Text = ws.Cells(targetRow, 5).Value
        cmbSource.Text = ws.Cells(targetRow, 6).Value
        cmbdept.Text = ws.Cells(targetRow, 7).Value
        txtDesig.Text = ws.Cells(targetRow, 8).Value
        TxtDOJ.Text = SafeFmtDate(ws.Cells(targetRow, 11).Value)  ' Col K - FIXED
        cmbHours.Text = ws.Cells(targetRow, 12).Value
        cmbCategory.Text = ws.Cells(targetRow, 13).Value
        txtOldCode.Text = ws.Cells(targetRow, 42).Value
        txtPayGroup.Text = ws.Cells(targetRow, 37).Value
        txtCritical.Text = ws.Cells(targetRow, 38).Value
        
        ' Tab 3: Statutory & Bank
        cmbPFFlag.Text = ws.Cells(targetRow, 14).Value
        cmbESICFlag.Text = ws.Cells(targetRow, 15).Value
        txtUAN.Text = ws.Cells(targetRow, 16).Value
        txtESICNo.Text = ws.Cells(targetRow, 17).Value
        cmbRoute.Text = ws.Cells(targetRow, 19).Value
        
        txtBankName.Text = ws.Cells(targetRow, 20).Value
        txtBankAcc.Text = ws.Cells(targetRow, 21).Value
        txtIFSC.Text = ws.Cells(targetRow, 22).Value
        
        ' Tab 4: Salary Details
        txtBasicRate.Text = ws.Cells(targetRow, 23).Value
        txtHRARate.Text = ws.Cells(targetRow, 24).Value
        txtOtherAllow.Text = ws.Cells(targetRow, 25).Value
        cmbTransMode.Text = ws.Cells(targetRow, 31).Value
        cmbTransBy.Text = ws.Cells(targetRow, 32).Value
        txtLocSource.Text = ws.Cells(targetRow, 33).Value
        
        On Error GoTo 0
        
        ' Calculate total wage immediately
        Call CalculateTotal
        
        btnSave.Caption = "UPDATE WORKER"
        MsgBox "Worker details successfully found!", vbInformation, "Success"
    Else
        MsgBox "Worker Code not found!", vbExclamation, "Search Result"
        btnSave.Caption = "SAVE NEW"
        Call ClearInputFields
        targetRow = 0
    End If
    Exit Sub

SearchEH:
    On Error Resume Next
    MsgBox "Search error: " & Err.Description, vbCritical, "Error"
    On Error GoTo 0
End Sub

'--- 3. SAVE / UPDATE ---
Private Sub btnSave_Click()
    Dim workerCode As String
    Dim isNew As Boolean
    Dim searchVal As Variant
    Dim tbl As ListObject
    
    Call SetWorksheet
    
    If ws Is Nothing Then
        MsgBox "MASTER_Workers sheet nahi mili!", vbCritical
        Exit Sub
    End If
    
    workerCode = UCase(Trim(txtcode.Text))
    If workerCode = "" Or Trim(TxtName.Text) = "" Then
        MsgBox "Worker Code aur Name likhna compulsory hai!", vbCritical
        Exit Sub
    End If
    
    On Error GoTo EH
    
    Call Workforce_FIX_Protection.Payroll_Unprotect_All
    
    If IsNumeric(workerCode) Then
        searchVal = Val(workerCode)
    Else
        searchVal = workerCode
    End If
    
    Set foundRange = ws.Columns("B").Find(What:=searchVal, LookIn:=xlValues, LookAt:=xlWhole)
    
    If foundRange Is Nothing And IsNumeric(workerCode) Then
        Set foundRange = ws.Columns("B").Find(What:=workerCode, LookIn:=xlValues, LookAt:=xlWhole)
    End If
    
    If Not foundRange Is Nothing Then
        targetRow = foundRange.Row
        isNew = False
    Else
        targetRow = ws.Cells(ws.Rows.Count, "B").End(xlUp).Row + 1
        ws.Cells(targetRow, 1).Value = targetRow - 1
        ws.Cells(targetRow, 2).Value = workerCode
        isNew = True
    End If
    
    On Error Resume Next
    If ws.ListObjects.Count > 0 Then
        Set tbl = ws.ListObjects(1)
        tbl.Resize ws.Range("A1:BA" & targetRow)
    End If
    On Error GoTo EH
    
    ' Tab 1: Personal Info
    ws.Cells(targetRow, 3).Value = TxtName.Text
    ws.Cells(targetRow, 9).Value = cmbGender.Text
    If IsDate(txtDOB.Text) Then ws.Cells(targetRow, 10).Value = CDate(txtDOB.Text)
    ws.Cells(targetRow, 18).Value = TxtAadhar.Text
    
    If IsDate(txtDOL.Text) Then
        ws.Cells(targetRow, 39).Value = CDate(txtDOL.Text)
    Else
        ws.Cells(targetRow, 39).Value = ""
    End If
    
    ' Tab 2: Employment
    ws.Cells(targetRow, 4).Value = cmbUnit.Text
    ws.Cells(targetRow, 5).Value = cmbType.Text
    ws.Cells(targetRow, 6).Value = cmbSource.Text
    ws.Cells(targetRow, 7).Value = cmbdept.Text
    ws.Cells(targetRow, 8).Value = txtDesig.Text
    If IsDate(TxtDOJ.Text) Then ws.Cells(targetRow, 11).Value = CDate(TxtDOJ.Text)
    ws.Cells(targetRow, 12).Value = cmbHours.Text
    ws.Cells(targetRow, 13).Value = cmbCategory.Text
    ws.Cells(targetRow, 42).Value = txtOldCode.Text
    ws.Cells(targetRow, 37).Value = txtPayGroup.Text
    ws.Cells(targetRow, 38).Value = txtCritical.Text
    
    ' Tab 3: Statutory & Bank
    ws.Cells(targetRow, 14).Value = cmbPFFlag.Text
    ws.Cells(targetRow, 15).Value = cmbESICFlag.Text
    ws.Cells(targetRow, 16).Value = txtUAN.Text
    ws.Cells(targetRow, 17).Value = txtESICNo.Text
    ws.Cells(targetRow, 19).Value = cmbRoute.Text
    ws.Cells(targetRow, 20).Value = txtBankName.Text
    ws.Cells(targetRow, 21).Value = txtBankAcc.Text
    ws.Cells(targetRow, 22).Value = txtIFSC.Text
    
    ' Tab 4: Salary Details
    ws.Cells(targetRow, 23).Value = Val(txtBasicRate.Text)
    ws.Cells(targetRow, 24).Value = Val(txtHRARate.Text)
    ws.Cells(targetRow, 25).Value = Val(txtOtherAllow.Text)
    ws.Cells(targetRow, 31).Value = cmbTransMode.Text
    ws.Cells(targetRow, 32).Value = cmbTransBy.Text
    ws.Cells(targetRow, 33).Value = txtLocSource.Text
    
    If targetRow > 2 Then
        ws.Range("A" & targetRow - 1 & ":BA" & targetRow - 1).Copy
        ws.Range("A" & targetRow & ":BA" & targetRow).PasteSpecial xlPasteFormats
        ws.Range("Z" & targetRow - 1 & ":BA" & targetRow - 1).Copy
        ws.Range("Z" & targetRow & ":BA" & targetRow).PasteSpecial xlPasteFormulas
        Application.CutCopyMode = False
    End If
    
    Call Workforce_FIX_Protection.Payroll_Protect_All
    
    MsgBox "Worker details successfully saved/updated!", vbInformation, "Success"
    Call ClearInputFields
    btnSave.Caption = "SAVE / UPDATE"
    Exit Sub
    
EH:
    On Error Resume Next
    Call Workforce_FIX_Protection.Payroll_Protect_All
    On Error GoTo 0
    MsgBox "Error occurred: " & Err.Description, vbCritical, "Error"
End Sub

'--- 4. RESET ---
Private Sub btnReset_Click()
    Call ClearInputFields
    txtcode.Text = ""
    btnSave.Caption = "SAVE / UPDATE"
End Sub

'--- 5. CALCULATE TOTAL WAGE (FIXED - was empty!) ---
Private Sub txtBasicRate_Change(): CalculateTotal: End Sub
Private Sub txtHRARate_Change(): CalculateTotal: End Sub
Private Sub txtOtherAllow_Change(): CalculateTotal: End Sub

Sub CalculateTotal()
    On Error Resume Next
    Dim totalWage As Double
    totalWage = Val(txtBasicRate.Text) + Val(txtHRARate.Text) + Val(txtOtherAllow.Text)
    Dim ctrl As MSForms.Control
    For Each ctrl In Me.Controls
        If ctrl.Name = "txtTotal" Or ctrl.Name = "lblTotal" Or ctrl.Name = "txtTotalWage" Then
            ctrl.Caption = Format(totalWage, "0.00")
            ctrl.Text = Format(totalWage, "0.00")
        End If
    Next ctrl
    On Error GoTo 0
End Sub

'--- 6. CLEAR ALL FIELDS ---
Sub ClearInputFields()
    On Error Resume Next
    TxtName.Text = ""
    cmbGender.ListIndex = -1
    txtDOB.Text = ""
    TxtAadhar.Text = ""
    cmbStatus.ListIndex = -1
    txtDOL.Text = ""
    
    cmbUnit.ListIndex = -1
    cmbType.ListIndex = -1
    cmbSource.ListIndex = -1
    cmbdept.ListIndex = -1
    txtDesig.Text = ""
    TxtDOJ.Text = Format(Date, "dd-mm-yyyy")
    cmbHours.ListIndex = -1
    cmbCategory.ListIndex = -1
    txtOldCode.Text = ""
    txtPayGroup.Text = ""
    txtCritical.Text = ""
    
    cmbPFFlag.ListIndex = -1
    cmbESICFlag.ListIndex = -1
    txtUAN.Text = ""
    txtESICNo.Text = ""
    cmbRoute.ListIndex = -1
    txtBankName.Text = ""
    txtBankAcc.Text = ""
    txtIFSC.Text = ""
    
    txtBasicRate.Text = ""
    txtHRARate.Text = ""
    txtOtherAllow.Text = ""
    cmbTransMode.ListIndex = -1
    cmbTransBy.ListIndex = -1
    txtLocSource.Text = ""
    
    targetRow = 0
    On Error GoTo 0
End Sub

Private Sub UpdateDisbursementRoute()
    If cmbType.Text = "" Then Exit Sub
    
    If cmbType.Text <> "Company" Then
        cmbRoute.Text = "Contractor"
    Else
        If UCase(Trim(txtBankName.Text)) = "HDFC BANK" Then
            cmbRoute.Text = "HDFC NEFT"
        Else
            cmbRoute.Text = "Cheque Payment"
        End If
    End If
End Sub

Private Sub cmbType_Change()
    Call UpdateDisbursementRoute
End Sub

Private Sub txtBankName_Change()
    Call UpdateDisbursementRoute
End Sub
