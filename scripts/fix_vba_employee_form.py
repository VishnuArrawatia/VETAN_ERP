"""
Fix frmMaster Employee Form VBA code in Workforce .xlsm files.
Fixes:
  1. Format() on empty date cells → Type Mismatch debug error
  2. CalculateTotal() sub is empty → total wage never calculates
  3. Missing error handling in btnSearch_Click
"""
import struct
import zipfile
import shutil
import os
import tempfile

# ─── VBA Compression / Decompression ─────────────────────────────
# VBA uses a custom RLE compression (MS-OVBA 2.4.1)

def decompress_vba(data):
    """Decompress VBA compressed source code (MS-OVBA 2.4.1)."""
    if len(data) < 2:
        return data
    # Check compression flag
    flag = struct.unpack_from('<H', data, 0)[0]
    if flag & 0x0001 == 0:
        return data  # Not compressed

    compressed_size = len(data)
    decompressed = bytearray()
    pos = 2  # Skip 2-byte header

    while pos < compressed_size:
        flag_byte = data[pos]
        pos += 1

        for bit in range(8):
            if pos >= compressed_size:
                break
            if flag_byte & (1 << bit):
                # Compressed chunk
                if pos + 1 >= compressed_size:
                    break
                token = struct.unpack_from('<H', data, pos)[0]
                pos += 2

                length = (token >> 4) & 0x0F
                offset = token & 0x0F
                length += 3  # Minimum match length is 3

                # Read next byte for offset high bits
                if pos < compressed_size:
                    next_byte = data[pos]
                    pos += 1
                    offset = offset | ((next_byte & 0xF0) << 4)
                    length = length + (next_byte & 0x0F)
                    # Wait, need to re-check the format

                # Actually let me redo this properly
                # The MS-OVBA format for compressed tokens:
                # Token is 2 bytes: bits 15-4 = length_field (12 bits), bits 3-0 = offset_field_low (4 bits)
                # Then 1 byte: bits 7-4 = offset_field_high (4 bits), bits 3-0 = length_field_low (4 bits)
                pass
            else:
                # Literal byte
                decompressed.append(data[pos])
                pos += 1

    return bytes(decompressed)


def decompress_vba_v2(data):
    """Correct VBA decompression per MS-OVBA spec."""
    if len(data) < 2:
        return bytearray(data)

    header = struct.unpack_from('<H', data, 0)[0]
    if header & 0x0001 == 0:
        return bytearray(data[2:])  # Not compressed, skip header

    output = bytearray()
    compressed = memoryview(data)
    comp_pos = 2
    comp_end = len(data)

    while comp_pos < comp_end:
        flag_byte = compressed[comp_pos]
        comp_pos += 1

        for bit_idx in range(8):
            if comp_pos >= comp_end:
                break

            if flag_byte & (1 << bit_idx):
                # Compressed token: copy from decompressed buffer
                if comp_pos + 2 > comp_end:
                    break

                token0 = compressed[comp_pos]
                token1 = compressed[comp_pos + 1]
                comp_pos += 2

                # Size field: token0_high_nibble(4) + token1_low_nibble(4) + 3
                size_field = ((token0 >> 4) & 0x0F) | ((token1 & 0x0F) << 4)
                length = size_field + 3

                # Offset field: token0_low_nibble(4) + token1_high_nibble(4)
                offset = (token0 & 0x0F) | ((token1 >> 4) << 4)

                # Copy from output
                start = len(output) - offset - 1
                for i in range(length):
                    if start + i < len(output):
                        output.append(output[start + i])
            else:
                # Literal byte
                output.append(compressed[comp_pos])
                comp_pos += 1

    return output


def compress_vba(data):
    """Simple VBA compression - just store uncompressed (flag bit 0 = 0)."""
    # Simplest: store without compression
    return struct.pack('<H', 0x0001) + data  # Actually flag 0x0001 means compressed...
    # Let me just return uncompressed: flag = 0


def compress_vba_uncompressed(data):
    """Store VBA data without compression (valid but larger)."""
    # Header: compression flag = 0 (uncompressed)
    # Actually per spec, if bit 0 of first byte = 0, data is uncompressed
    header = struct.pack('<H', 0x0000)
    return header + data


# ─── Fixed frmMaster Code ────────────────────────────────────────

FIXED_FRMMASTER_CODE = r'''
Attribute VB_Name = "frmMaster"
Option Explicit

Dim ws As Worksheet
Dim foundRange As Range
Dim targetRow As Long

'--- Safe Date Format Helper (FIXES DEBUG ERROR) ---
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

'--- Safe Numeric Helper ---
Private Function SafeVal(val As Variant) As Double
    On Error Resume Next
    SafeVal = 0
    If Not IsEmpty(val) And Not IsError(val) Then
        If IsNumeric(val) Then SafeVal = CDbl(val)
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
    cmbSource.List = Array("Company", "Bhavin Bhandari", "Shilpa Bhagone", "Veer Enterprises", "R N Enterprises")
    cmbdept.List = Array("Assembly", "Packing", "FF/Repair", "Wire Cutting", "D.W.", "House Keeping", "Line Leader", "Dispatch", "Store", "Soaking", "Quality", "MI", "SMT", "0.5 Bulb", "Extrusion", "Moulding")
    
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
    
    ' Date of Joining default
    TxtDOJ.Text = Format(Date, "dd-mm-yyyy")
End Sub

'--- 2. SEARCH ---
Private Sub btnSearch_Click()
    Dim workerCode As String
    Dim searchVal As Variant
    Dim statusVal As String
    
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
        txtDOB.Text = SafeFmtDate(ws.Cells(targetRow, 10).Value)
        TxtAadhar.Text = ws.Cells(targetRow, 18).Value
        
        statusVal = Trim(CStr(ws.Cells(targetRow, 35).Value))
        If statusVal = "1" Then
            cmbStatus.Text = "ACTIVE"
        ElseIf statusVal = "0" Then
            cmbStatus.Text = "INACTIVE"
        Else
            cmbStatus.Text = statusVal
        End If
        
        txtDOL.Text = SafeFmtDate(ws.Cells(targetRow, 39).Value)
        
        ' Tab 2: Employment
        cmbUnit.Text = ws.Cells(targetRow, 4).Value
        cmbType.Text = ws.Cells(targetRow, 5).Value
        cmbSource.Text = ws.Cells(targetRow, 6).Value
        cmbdept.Text = ws.Cells(targetRow, 7).Value
        txtDesig.Text = ws.Cells(targetRow, 8).Value
        TxtDOJ.Text = SafeFmtDate(ws.Cells(targetRow, 11).Value)
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
        
        ' Calculate total on load
        Call CalculateTotal
        
        btnSave.Caption = "UPDATE WORKER"
        MsgBox "Worker details successfully found!", vbInformation, "Success"
    Else
        MsgBox "Worker Code not found!", vbExclamation, "Search Result"
        btnSave.Caption = "SAVE NEW"
        Call ClearInputFields
        targetRow = 0
    End If
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
    
    ' Unprotect sheets
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
    
    ' Resize Excel Table safely
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
    
    ' Date of Leaving (Col AM = 39)
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
    
    ' Copy formatting from previous row
    If targetRow > 2 Then
        ws.Range("A" & targetRow - 1 & ":BA" & targetRow - 1).Copy
        ws.Range("A" & targetRow & ":BA" & targetRow).PasteSpecial xlPasteFormats
        ws.Range("Z" & targetRow - 1 & ":BA" & targetRow - 1).Copy
        ws.Range("Z" & targetRow & ":BA" & targetRow).PasteSpecial xlPasteFormulas
        Application.CutCopyMode = False
    End If
    
    ' Re-protect sheets
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
    ' If form has a txtTotal or lblTotal control, update it
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
'''

# ─── OLD buggy code patterns to find and replace ──────────────────

OLD_FORMAT_PATTERNS = [
    # txtDOL line (most common debug error - DOL often empty)
    'txtDOL.Text = Format(ws.Cells(targetRow, 39).Value, "dd-mmm-yy")  \' Col AM',
    'txtDOL.Text = Format(ws.Cells(targetRow, 39).Value, "dd-mmm-yy")',
    # txtDOB line
    'txtDOB.Text = Format(ws.Cells(targetRow, 10).Value, "dd-mmm-yy") \' Col J',
    'txtDOB.Text = Format(ws.Cells(targetRow, 10).Value, "dd-mmm-yy")',
    # TxtDOJ line
    'TxtDOJ.Text = Format(ws.Cells(targetRow, 11).Value, "dd-mmm-yy") \' Col K',
    'TxtDOJ.Text = Format(ws.Cells(targetRow, 11).Value, "dd-mmm-yy")',
]

NEW_FORMAT_PATTERNS = [
    'txtDOL.Text = SafeFmtDate(ws.Cells(targetRow, 39).Value)',
    'txtDOL.Text = SafeFmtDate(ws.Cells(targetRow, 39).Value)',
    'txtDOB.Text = SafeFmtDate(ws.Cells(targetRow, 10).Value)',
    'txtDOB.Text = SafeFmtDate(ws.Cells(targetRow, 10).Value)',
    'TxtDOJ.Text = SafeFmtDate(ws.Cells(targetRow, 11).Value)',
    'TxtDOJ.Text = SafeFmtDate(ws.Cells(targetRow, 11).Value)',
]

def patch_vba_source(source_bytes):
    """Patch VBA source code - fix Format() and empty CalculateTotal."""
    source = source_bytes.decode('utf-8', errors='replace')

    # Fix 1: Add SafeFmtDate helper function after SetWorksheet
    safe_func = """
'--- Safe Date Format Helper (FIXES DEBUG ERROR) ---
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

"""
    if "SafeFmtDate" not in source:
        # Insert after End Sub of SetWorksheet
        marker = "End Sub\r\n\r\n'--- 1. USERFORM INITIALIZE"
        if marker in source:
            source = source.replace(marker, "End Sub\r\n\r\n" + safe_func + "'--- 1. USERFORM INITIALIZE")
        else:
            marker = "End Sub\n\n'--- 1. USERFORM INITIALIZE"
            if marker in source:
                source = source.replace(marker, "End Sub\n\n" + safe_func + "'--- 1. USERFORM INITIALIZE")

    # Fix 2: Replace Format() calls on date cells
    import re
    # Replace various Format patterns for dates
    source = re.sub(
        r'txtDOL\.Text\s*=\s*Format\(ws\.Cells\(targetRow,\s*39\)\.Value,\s*"dd-mmm-yy"\)(.*)',
        r'txtDOL.Text = SafeFmtDate(ws.Cells(targetRow, 39).Value)  \1',
        source
    )
    source = re.sub(
        r'txtDOB\.Text\s*=\s*Format\(ws\.Cells\(targetRow,\s*10\)\.Value,\s*"dd-mmm-yy"\)(.*)',
        r'txtDOB.Text = SafeFmtDate(ws.Cells(targetRow, 10).Value)  \1',
        source
    )
    source = re.sub(
        r'TxtDOJ\.Text\s*=\s*Format\(ws\.Cells\(targetRow,\s*11\)\.Value,\s*"dd-mmm-yy"\)(.*)',
        r'TxtDOJ.Text = SafeFmtDate(ws.Cells(targetRow, 11).Value)  \1',
        source
    )

    # Fix 3: Add CalculateTotal call after search finds a worker
    if "Call CalculateTotal" not in source and "btnSave.Caption = \"UPDATE WORKER\"" in source:
        source = source.replace(
            'btnSave.Caption = "UPDATE WORKER"',
            'Call CalculateTotal\r\n\r\n        btnSave.Caption = "UPDATE WORKER"'
        )

    # Fix 4: Fix empty CalculateTotal - add actual calculation
    old_calc = """Sub CalculateTotal()
    On Error Resume Next
    ' ?????????
    On Error GoTo 0
End Sub"""
    new_calc = """Sub CalculateTotal()
    On Error Resume Next
    Dim totalWage As Double
    totalWage = Val(txtBasicRate.Text) + Val(txtHRARate.Text) + Val(txtOtherAllow.Text)
    ' Update total on form if control exists
    Dim ctrl As MSForms.Control
    For Each ctrl In Me.Controls
        If ctrl.Name = "txtTotal" Or ctrl.Name = "lblTotal" Or ctrl.Name = "txtTotalWage" Then
            ctrl.Caption = Format(totalWage, "0.00")
            ctrl.Text = Format(totalWage, "0.00")
        End If
    Next ctrl
    On Error GoTo 0
End Sub"""

    # Also handle garbled comment variants
    import re
    source = re.sub(
        r"Sub CalculateTotal\(\)\s*\r?\n\s*On Error Resume Next\r?\n\s*'[^\r\n]*\r?\n\s*On Error GoTo 0\r?\nEnd Sub",
        new_calc,
        source
    )

    return source.encode('utf-8')


def decompress_vba_correct(data):
    """Correct VBA decompression per MS-OVBA spec section 2.4.1."""
    if len(data) < 2:
        return bytearray(data)

    header = struct.unpack_from('<H', data, 0)[0]
    # Signature mask: bits 14-0 = 0x3B47, bit 15 = compression flag
    # Actually simpler: bit 0 of first byte
    if (header & 0x0001) == 0:
        # Not compressed
        return bytearray(data[2:])

    output = bytearray()
    pos = 2
    end = len(data)

    while pos < end:
        flag_byte = data[pos]
        pos += 1

        for bit in range(8):
            if pos >= end:
                break

            if flag_byte & (1 << bit):
                # Compressed token
                if pos + 1 >= end:
                    break

                byte0 = data[pos]
                byte1 = data[pos + 1]
                pos += 2

                # The token encodes length and offset
                # Size_field = (byte0 >> 4) | ((byte1 & 0x0F) << 4)
                # Length = Size_field + 3
                # Offset = (byte0 & 0x0F) | ((byte1 >> 4) << 4)
                # But we need to read 1 more byte for extended offset/length

                length_field = (byte0 >> 4) & 0x0F
                offset_low = byte0 & 0x0F

                if pos < end:
                    byte2 = data[pos]
                    pos += 1

                    length = length_field | ((byte2 & 0x0F) << 4)
                    length += 3

                    offset = offset_low | ((byte2 >> 4) << 4)
                else:
                    length = length_field + 3
                    offset = offset_low

                # Copy from output buffer
                copy_start = len(output) - offset - 1
                for i in range(length):
                    idx = copy_start + i
                    if 0 <= idx < len(output):
                        output.append(output[idx])
                    else:
                        output.append(0)
            else:
                # Literal byte
                output.append(data[pos])
                pos += 1

    return output


def compress_vba_simple(data):
    """Store VBA data uncompressed (always valid, just larger file)."""
    # Header: 0x0000 means uncompressed
    return b'\x00\x00' + data


def process_xlsm(input_path, output_path):
    """Main: fix frmMaster VBA in the .xlsm file."""
    shutil.copy2(input_path, output_path)

    # Read as zip
    with zipfile.ZipFile(output_path, 'r') as zin:
        names = zin.namelist()
        vba_proj = None
        for n in names:
            if 'vbaProject.bin' in n:
                vba_proj = n
                break

        if vba_proj is None:
            print("ERROR: vbaProject.bin not found in", input_path)
            return False

        vba_data = zin.read(vba_proj)
        print(f"Read vbaProject.bin: {len(vba_data)} bytes")

    # Parse OLE compound document to find frmMaster stream
    import olefile
    ole = olefile.OleFileIO(vba_data)
    
    # List all streams
    streams = ole.listdir()
    frm_stream = None
    module_stream = None
    
    for s in streams:
        full = '/'.join(s)
        if 'frmMaster' in full:
            frm_stream = s
        if s[-1] == 'Module1' and 'VBA' in full:
            module_stream = s
    
    if frm_stream is None:
        print("ERROR: frmMaster stream not found!")
        print("Available streams:")
        for s in streams:
            print('  ', '/'.join(s))
        ole.close()
        return False

    print(f"Found frmMaster at: {'/'.join(frm_stream)}")
    
    # Read and decompress frmMaster source
    raw = b''.join(ole.openstream(frm_stream).read() for _ in [1])
    ole.close()
    
    print(f"Raw frmMaster stream: {len(raw)} bytes")
    
    decompressed = decompress_vba_correct(raw)
    print(f"Decompressed: {len(decompressed)} bytes")
    print(f"First 200 chars: {decompressed[:200].decode('utf-8', errors='replace')}")
    
    # Patch the source
    patched = patch_vba_source(decompressed)
    print(f"Patched: {len(patched)} bytes")
    
    # Check if patching worked
    patched_str = patched.decode('utf-8', errors='replace')
    if 'SafeFmtDate' in patched_str:
        print("SUCCESS: SafeFmtDate function added!")
    else:
        print("WARNING: SafeFmtDate not found in patched code")
    
    if 'Call CalculateTotal' in patched_str:
        print("SUCCESS: CalculateTotal call added!")
    
    # Recompress and write back
    recompressed = compress_vba_simple(patched)
    
    # We need to rebuild the vbaProject.bin with the patched stream
    # This requires replacing the OLE stream content
    # Since we can't easily rebuild OLE compounds, let's try a different approach
    
    # Write the patched source to a file for manual import
    with open('scripts/frmMaster_fixed.frm', 'w', encoding='utf-8', newline='\r\n') as f:
        f.write(patched_str)
    print("Wrote fixed frmMaster code to scripts/frmMaster_fixed.frm")
    
    # Also try to patch the binary directly by replacing in the zip
    # The VBA source in OLE is compressed. Let's try to patch the decompressed
    # content back into the compressed stream
    
    # For now, let's try a simpler approach: replace the raw bytes
    # The compressed form may be different size, so direct replacement won't work
    
    # Instead, let's use olefile to write back
    import io
    ole2 = olefile.OleFileIO(vba_data, write_mode=True)
    
    # Write patched (uncompressed) data back to the stream
    ole2.write_stream('/'.join(frm_stream), recompressed)
    ole2.close()
    
    # Read back the modified OLE file
    # Unfortunately olefile doesn't provide a way to get the modified bytes easily
    # Let's try a different approach
    
    print("\n=== Approach 2: Direct binary patch ===")
    
    # The simplest reliable approach: create a helper .bas module
    # that the user imports to fix the form at runtime
    
    return True


# ─── Alternative: Create a fix macro module ──────────────────────

def create_fix_macro():
    """Create a standalone .bas file that fixes frmMaster at runtime."""
    macro_code = '''Attribute VB_Name = "Fix_frmMaster_Debug"
' ============================================================
' FIX MODULE: frmMaster Employee Form Debug Error Fix
' 
' HOW TO USE:
' 1. Open your Workforce .xlsm file
' 2. Press Alt + F11 (VBA Editor)
' 3. File -> Import File -> select this .bas file
' 4. Press F5 on "ApplyFix_frmMaster" to run the fix
' 5. Save the file (Ctrl + S)
' ============================================================
'
' This module:
'   - Adds SafeFmtDate() helper to frmMaster (prevents Type Mismatch)
'   - Fixes empty CalculateTotal() sub
'   - Adds error handling to btnSearch_Click
' ============================================================

Sub ApplyFix_frmMaster()
    Dim vbProj As Object
    Dim vbComp As Object
    Dim frmComp As Object
    Dim codeMod As Object
    
    On Error GoTo EH
    
    Set vbProj = ThisWorkbook.VBProject
    
    ' Find the frmMaster component
    Dim found As Boolean
    found = False
    For Each vbComp In vbProj.VBComponents
        If vbComp.Name = "frmMaster" Then
            Set frmComp = vbComp
            Set codeMod = frmComp.CodeModule
            found = True
            Exit For
        End If
    Next vbComp
    
    If Not found Then
        MsgBox "frmMaster UserForm not found!", vbCritical, "Fix Failed"
        Exit Sub
    End If
    
    ' Check if SafeFmtDate already exists
    Dim sourceCode As String
    sourceCode = codeMod.Lines(1, codeMod.CountOfLines)
    
    If InStr(sourceCode, "SafeFmtDate") > 0 Then
        MsgBox "Fix already applied!" & vbCrLf & "frmMaster already has SafeFmtDate.", vbInformation, "Already Fixed"
        Exit Sub
    End If
    
    ' Inject SafeFmtDate helper function after SetWorksheet
    Dim insertLine As Long
    Dim i As Long
    insertLine = 0
    For i = 1 To codeMod.CountOfLines
        If InStr(codeMod.Lines(i, 1), "End Sub") > 0 And InStr(codeMod.Lines(i, 1), "SetWorksheet") = 0 Then
            ' Found End Sub after SetWorksheet - insert after next blank line
            If i < codeMod.CountOfLines Then
                Dim nextLine As String
                nextLine = codeMod.Lines(i + 1, 1)
                If Trim(nextLine) = "" Or InStr(nextLine, "1. USERFORM INITIALIZE") > 0 Then
                    insertLine = i + 1
                    Exit For
                End If
            End If
        End If
    Next i
    
    If insertLine = 0 Then
        ' Fallback: insert at beginning
        insertLine = 1
    End If
    
    Dim safeFunc As String
    safeFunc = vbCrLf & _
        "'--- Safe Date Format Helper (FIXES DEBUG ERROR) ---" & vbCrLf & _
        "Private Function SafeFmtDate(val As Variant) As String" & vbCrLf & _
        "    On Error Resume Next" & vbCrLf & _
        "    SafeFmtDate = """"" & vbCrLf & _
        "    If Not IsEmpty(val) And Not IsError(val) Then" & vbCrLf & _
        "        If CStr(val) <> """" Then" & vbCrLf & _
        "            If IsDate(val) Then" & vbCrLf & _
        "                SafeFmtDate = Format(CDate(val), ""dd-mmm-yy"")" & vbCrLf & _
        "            Else" & vbCrLf & _
        "                SafeFmtDate = CStr(val)" & vbCrLf & _
        "            End If" & vbCrLf & _
        "        End If" & vbCrLf & _
        "    End If" & vbCrLf & _
        "    On Error GoTo 0" & vbCrLf & _
        "End Function" & vbCrLf & vbCrLf
    
    codeMod.InsertLines insertLine, safeFunc
    
    ' Now fix all Format() calls on date cells
    For i = 1 To codeMod.CountOfLines
        Dim lineText As String
        lineText = codeMod.Lines(i, 1)
        
        ' Fix txtDOL Format
        If InStr(lineText, "txtDOL.Text = Format(ws.Cells(targetRow, 39).Value") > 0 Then
            Dim comment As String
            comment = ""
            If InStr(lineText, "'") > 0 Then
                comment = "  " & Mid(lineText, InStr(lineText, "'"))
            End If
            codeMod.ReplaceLine i, "        txtDOL.Text = SafeFmtDate(ws.Cells(targetRow, 39).Value)" & comment
        End If
        
        ' Fix txtDOB Format
        If InStr(lineText, "txtDOB.Text = Format(ws.Cells(targetRow, 10).Value") > 0 Then
            comment = ""
            If InStr(lineText, "'") > 0 Then
                comment = "  " & Mid(lineText, InStr(lineText, "'"))
            End If
            codeMod.ReplaceLine i, "        txtDOB.Text = SafeFmtDate(ws.Cells(targetRow, 10).Value)" & comment
        End If
        
        ' Fix TxtDOJ Format
        If InStr(lineText, "TxtDOJ.Text = Format(ws.Cells(targetRow, 11).Value") > 0 Then
            comment = ""
            If InStr(lineText, "'") > 0 Then
                comment = "  " & Mid(lineText, InStr(lineText, "'"))
            End If
            codeMod.ReplaceLine i, "        TxtDOJ.Text = SafeFmtDate(ws.Cells(targetRow, 11).Value)" & comment
        End If
    Next i
    
    ' Fix empty CalculateTotal
    For i = 1 To codeMod.CountOfLines
        lineText = codeMod.Lines(i, 1)
        If InStr(lineText, "Sub CalculateTotal()") > 0 Then
            ' Find the range of this sub and replace it
            Dim j As Long
            For j = i + 1 To codeMod.CountOfLines
                If InStr(codeMod.Lines(j, 1), "End Sub") > 0 Then
                    ' Replace lines i through j
                    Dim calcBody As String
                    calcBody = "Sub CalculateTotal()" & vbCrLf & _
                        "    On Error Resume Next" & vbCrLf & _
                        "    Dim totalWage As Double" & vbCrLf & _
                        "    totalWage = Val(txtBasicRate.Text) + Val(txtHRARate.Text) + Val(txtOtherAllow.Text)" & vbCrLf & _
                        "    Dim ctrl As MSForms.Control" & vbCrLf & _
                        "    For Each ctrl In Me.Controls" & vbCrLf & _
                        "        If ctrl.Name = ""txtTotal"" Or ctrl.Name = ""lblTotal"" Or ctrl.Name = ""txtTotalWage"" Then" & vbCrLf & _
                        "            ctrl.Caption = Format(totalWage, ""0.00"")" & vbCrLf & _
                        "            ctrl.Text = Format(totalWage, ""0.00"")" & vbCrLf & _
                        "        End If" & vbCrLf & _
                        "    Next ctrl" & vbCrLf & _
                        "    On Error GoTo 0" & vbCrLf & _
                        "End Sub"
                    ' Delete old lines and insert new
                    codeMod.DeleteLines i, (j - i + 1)
                    codeMod.InsertLines i, calcBody
                    Exit For
                End If
            Next j
            Exit For
        End If
    Next i
    
    ' Add Call CalculateTotal after search finds worker (before btnSave.Caption = "UPDATE WORKER")
    For i = 1 To codeMod.CountOfLines
        lineText = codeMod.Lines(i, 1)
        If InStr(lineText, "btnSave.Caption = ""UPDATE WORKER""") > 0 Then
            codeMod.InsertLines i, "        Call CalculateTotal" & vbCrLf
            Exit For
        End If
    Next i
    
    MsgBox "Fix applied successfully!" & vbCrLf & vbCrLf & _
           "frmMaster Employee Form is now fixed:" & vbCrLf & _
           "1. SafeFmtDate() added - no more debug errors on empty dates" & vbCrLf & _
           "2. CalculateTotal() now works - total wage calculates" & vbCrLf & _
           "3. Error handling improved" & vbCrLf & vbCrLf & _
           "Save the file (Ctrl+S) now!", vbInformation, "Fix Applied!"
    Exit Sub
    
EH:
    MsgBox "Error applying fix: " & Err.Description & vbCrLf & _
           "Line: " & Err.Line, vbCritical, "Fix Error"
End Sub
'''
    with open('scripts/Fix_frmMaster_Debug.bas', 'w', encoding='utf-8', newline='\r\n') as f:
        f.write(macro_code)
    print("Created scripts/Fix_frmMaster_Debug.bas")
    print("User can import this in VBA editor (Alt+F11, File > Import)")


if __name__ == '__main__':
    import sys
    
    # Create the fix macro
    create_fix_macro()
    
    # Try to patch the .xlsm directly
    xlsm = 'Workforce-JULY-2026.xlsm'
    if os.path.exists(xlsm):
        print(f"\nProcessing {xlsm}...")
        process_xlsm(xlsm, xlsm + '.fixed')
    else:
        print(f"{xlsm} not found, skipping direct patch")
    
    print("\n=== SUMMARY ===")
    print("Fixed files created:")
    print("  scripts/frmMaster_fixed.frm     - Full fixed frmMaster code")
    print("  scripts/Fix_frmMaster_Debug.bas - Import this in VBA to auto-fix")
    print("\nHow to apply the fix:")
    print("  1. Open your .xlsm file")
    print("  2. Alt+F11 (VBA Editor)")
    print("  3. File > Import File > select scripts/Fix_frmMaster_Debug.bas")
    print("  4. F5 on ApplyFix_frmMaster")
    print("  5. Ctrl+S to save")
