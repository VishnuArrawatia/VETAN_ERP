' ════════════════════════════════════════════════════════════════
' CUSTOMER ACCOUNT RECONCILIATION — VBA MACRO
' SVN Opto Electronics (Sakar) ↔ Surya Roshni Ltd
' 
' Kaise Use Karein:
'   1. Apni Excel file kholo (Surya Roshni, Ledger reconcilation)
'   2. Alt+F11 → Insert → Module → Paste this code
'   3. Alt+F8 → "RunReconciliation" → Run
'   4. Naya sheet "Reconciliation" ban jayega with all results
'
' Author: Buffy (Codebuff)
' Date: Sep 2026
' ════════════════════════════════════════════════════════════════

Option Explicit

' ─── Main Entry Point ───
Sub RunReconciliation()
    Application.ScreenUpdating = False
    Application.Calculation = xlCalculationManual
    
    Dim startTime As Double
    startTime = Timer
    
    ' Step 1: Read all three ledgers
    Dim salesData() As Variant
    Dim purchaseData() As Variant
    Dim suryaData() As Variant
    
    salesData = ReadSheet("SVN-Sales-Surya Roshni", "Sales")
    purchaseData = ReadSheet("SVN-Purchase from Surya", "Purchase")
    suryaData = ReadSheet("Working", "Surya")
    
    ' Step 2: Build reconciliation
    Dim reconSheet As Worksheet
    Set reconSheet = CreateReconSheet
    
    ' Step 3: Match and write
    Call DoReconciliation(reconSheet, salesData, purchaseData, suryaData)
    
    ' Step 4: Auto-fit and format
    reconSheet.Cells.EntireColumn.AutoFit
    reconSheet.Activate
    reconSheet.Range("A1").Select
    
    Application.ScreenUpdating = True
    Application.Calculation = xlCalculationAutomatic
    
    MsgBox "Reconciliation Complete!" & vbCrLf & vbCrLf & _
           "Sheet: 'Reconciliation'" & vbCrLf & _
           "Time: " & Format(Timer - startTime, "0.0") & " seconds", _
           vbInformation, "Done"
End Sub

' ─── Read Sheet Data ───
Private Function ReadSheet(sheetName As String, ledgerType As String) As Variant()
    Dim ws As Worksheet
    Dim lastRow As Long, lastCol As Long
    Dim data() As Variant
    
    On Error Resume Next
    Set ws = ThisWorkbook.Sheets(sheetName)
    On Error GoTo 0
    
    If ws Is Nothing Then
        MsgBox "Sheet '" & sheetName & "' not found!", vbExclamation
        ReDim data(0 To 0, 0 To 0)
        ReadSheet = data
        Exit Function
    End If
    
    lastRow = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    lastCol = ws.Cells(1, ws.Columns.Count).End(xlToLeft).Column
    
    ' For Working sheet, we need more columns
    If ledgerType = "Surya" Then
        lastCol = Application.Max(lastCol, 22)
    End If
    
    If lastRow < 2 Then
        ReDim data(0 To 0, 0 To 0)
        ReadSheet = data
        Exit Function
    End If
    
    data = ws.Range(ws.Cells(1, 1), ws.Cells(lastRow, lastCol)).Value
    ReadSheet = data
End Function

' ─── Create Reconciliation Sheet ───
Private Function CreateReconSheet() As Worksheet
    Dim ws As Worksheet
    
    ' Delete old if exists
    On Error Resume Next
    Application.DisplayAlerts = False
    ThisWorkbook.Sheets("Reconciliation").Delete
    Application.DisplayAlerts = True
    On Error GoTo 0
    
    Set ws = ThisWorkbook.Sheets.Add(After:=ThisWorkbook.Sheets(ThisWorkbook.Sheets.Count))
    ws.Name = "Reconciliation"
    
    ' Headers
    ws.Range("A1").Value = "CUSTOMER ACCOUNT RECONCILIATION"
    ws.Range("A1").Font.Size = 14
    ws.Range("A1").Font.Bold = True
    
    ws.Range("A2").Value = "SVN Opto Electronics (Sakar) ↔ Surya Roshni Ltd | Period: August 2026"
    ws.Range("A2").Font.Size = 11
    ws.Range("A2").Font.Color = RGB(100, 100, 100)
    
    ws.Range("A4").Value = "Date"
    ws.Range("B4").Value = "Ref / Bill No"
    ws.Range("C4").Value = "Description"
    ws.Range("D4").Value = "Sakar Amount (₹)"
    ws.Range("E4").Value = "Surya Amount (₹)"
    ws.Range("F4").Value = "Status"
    ws.Range("G4").Value = "Remarks"
    ws.Range("H4").Value = "Doc Type"
    ws.Range("I4").Value = "Category"
    
    ' Format headers
    With ws.Range("A4:I4")
        .Font.Bold = True
        .Interior.Color = RGB(30, 64, 175)
        .Font.Color = RGB(255, 255, 255)
        .Borders(xlEdgeBottom).LineStyle = xlContinuous
    End With
    
    Set CreateReconSheet = ws
End Function

' ─── Main Reconciliation Logic ───
Private Sub DoReconciliation(ws As Worksheet, salesData As Variant, purchaseData As Variant, suryaData As Variant)
    Dim rowNum As Long
    rowNum = 5
    
    ' ── Counters ──
    Dim matchCount As Long, sakarOnly As Long, suryaOnly As Long, mismatch As Long
    matchCount = 0: sakarOnly = 0: suryaOnly = 0: mismatch = 0
    
    ' ── Build Surya Lookup (by Reference) ──
    Dim suryaLookup As Object
    Set suryaLookup = CreateObject("Scripting.Dictionary")
    Dim suryaInvUsed() As Boolean
    
    Dim suryaRows As Long
    suryaRows = UBound(suryaData, 1) - LBound(suryaData, 1)
    ReDim suryaInvUsed(1 To suryaRows)
    
    Dim i As Long, j As Long
    For i = 2 To UBound(suryaData, 1)
        Dim sAccount As String
        sAccount = Trim(CStr(suryaData(i, 6))) ' Account column
        
        If sAccount = "4001472" Then
            Dim sRef As String
            sRef = Normalize(Trim(CStr(suryaData(i, 13)))) ' Reference column (col 13)
            If Len(sRef) > 3 Then
                If Not suryaLookup.Exists(sRef) Then
                    suryaLookup.Add sRef, i
                End If
            End If
        End If
    Next i
    
    ' ════════════════════════════════════════
    ' PHASE 1: Match Purchase Invoices ↔ Surya Invoices
    ' ════════════════════════════════════════
    
    For i = 2 To UBound(purchaseData, 1)
        Dim pOrigin As String
        pOrigin = UCase(Trim(CStr(purchaseData(i, 3)))) ' Origin
        
        If pOrigin = "PU" Then
            Dim pDate As String
            pDate = FormatSAPDate(purchaseData(i, 2)) ' Posting Date
            
            Dim pRef1 As String
            pRef1 = Trim(CStr(purchaseData(i, 5))) ' Ref 1
            
            Dim pBill As String
            pBill = Trim(CStr(purchaseData(i, 6))) ' Bill No
            
            Dim pAmt As Double
            pAmt = ParseAmount(purchaseData(i, 10)) ' Amount
            
            Dim pDetails As String
            pDetails = Trim(CStr(purchaseData(i, 9))) ' Details
            
            ' Match key = Bill No (normalized)
            Dim matchKey As String
            matchKey = Normalize(pBill)
            If Len(matchKey) < 4 Then matchKey = Normalize(pRef1)
            
            ' Look up in Surya
            Dim foundMatch As Boolean
            foundMatch = False
            
            If suryaLookup.Exists(matchKey) Then
                Dim sIdx As Long
                sIdx = suryaLookup(matchKey)
                
                ' Check if Surya entry is an invoice (RV/RE)
                Dim sDocType As String
                sDocType = UCase(Trim(CStr(suryaData(sIdx, 2)))) ' Document Type
                
                If (sDocType = "RV" Or sDocType = "RE") And Not suryaInvUsed(sIdx) Then
                    Dim sAmt As Double
                    sAmt = ParseAmount(suryaData(sIdx, 6)) ' Amount
                    
                    Dim sDate As String
                    sDate = FormatSAPDate(suryaData(sIdx, 1))
                    
                    Dim sRef2 As String
                    sRef2 = Trim(CStr(suryaData(sIdx, 4))) ' Reference
                    
                    suryaInvUsed(sIdx) = True
                    foundMatch = True
                    
                    If Abs(Abs(pAmt) - Abs(sAmt)) < 0.01 Then
                        ' Perfect match
                        matchCount = matchCount + 1
                        Call WriteRow(ws, rowNum, pDate, pBill, _
                            "Purchase: " & pDetails, pAmt, sAmt, _
                            "MATCHED", "Both books agree. Ref: " & pBill, _
                            "PU → RV", "Purchase ↔ Surya Sale")
                        rowNum = rowNum + 1
                    Else
                        ' Amount mismatch
                        mismatch = mismatch + 1
                        Call WriteRow(ws, rowNum, pDate, pBill, _
                            "Purchase: " & pDetails, pAmt, sAmt, _
                            "MISMATCH", "Sakar: " & FormatCurrency(pAmt) & " vs Surya: " & FormatCurrency(sAmt), _
                            "PU → RV", "Amount Difference")
                        rowNum = rowNum + 1
                    End If
                End If
            End If
            
            If Not foundMatch Then
                sakarOnly = sakarOnly + 1
                Call WriteRow(ws, rowNum, pDate, pBill, _
                    "Purchase: " & pDetails, pAmt, 0, _
                    "SAKAR ONLY", "Bill " & pBill & " not in Surya books", _
                    "PU", "Purchase (Sakar Only)")
                rowNum = rowNum + 1
            End If
        End If
    Next i
    
    ' ════════════════════════════════════════
    ' PHASE 2: Unmatched Surya Invoices
    ' ════════════════════════════════════════
    
    For i = 2 To UBound(suryaData, 1)
        Dim sAcct As String
        sAcct = Trim(CStr(suryaData(i, 6)))
        
        If sAcct = "4001472" And i <= UBound(suryaInvUsed) Then
            If Not suryaInvUsed(i) Then
                Dim sDocType2 As String
                sDocType2 = UCase(Trim(CStr(suryaData(i, 2))))
                
                If sDocType2 = "RV" Or sDocType2 = "RE" Then
                    Dim sAmt2 As Double
                    sAmt2 = ParseAmount(suryaData(i, 6))
                    Dim sDate2 As String
                    sDate2 = FormatSAPDate(suryaData(i, 1))
                    Dim sRef3 As String
                    sRef3 = Trim(CStr(suryaData(i, 4)))
                    Dim sDocNo As String
                    sDocNo = Trim(CStr(suryaData(i, 3)))
                    
                    suryaOnly = suryaOnly + 1
                    Call WriteRow(ws, rowNum, sDate2, sRef3, _
                        "Surya Invoice Doc: " & sDocNo, 0, sAmt2, _
                        "SURYA ONLY", "Invoice in Surya books, not in Sakar Purchase", _
                        sDocType2, "Surya Only (Invoice)")
                    rowNum = rowNum + 1
                End If
            End If
        End If
    Next i
    
    ' ════════════════════════════════════════
    ' PHASE 3: Sakar Sales entries (Payments, TDS, Cancellations, etc.)
    ' ════════════════════════════════════════
    
    For i = 2 To UBound(salesData, 1)
        Dim sOrig As String
        sOrig = UCase(Trim(CStr(salesData(i, 3)))) ' Origin
        
        Dim sDate3 As String
        sDate3 = FormatSAPDate(salesData(i, 2)) ' Posting Date
        
        Dim sRef4 As String
        sRef4 = Trim(CStr(salesData(i, 5))) ' Ref 1
        
        Dim sBill As String
        sBill = Trim(CStr(salesData(i, 6))) ' Bill No
        
        Dim sAmt3 As Double
        sAmt3 = ParseAmount(salesData(i, 10)) ' Amount
        
        Dim sDet As String
        sDet = Trim(CStr(salesData(i, 9))) ' Details
        
        Dim cat As String
        cat = ClassifyEntry(sOrig, sDet)
        
        Dim refDisplay As String
        refDisplay = sBill
        If Len(refDisplay) < 2 Then refDisplay = sRef4
        
        sakarOnly = sakarOnly + 1
        Call WriteRow(ws, rowNum, sDate3, refDisplay, _
            cat & ": " & sDet, sAmt3, 0, _
            "SAKAR ONLY", cat & " — verify if in Surya books", _
            sOrig, cat & " (Sakar Sales)")
        rowNum = rowNum + 1
    Next i
    
    ' ════════════════════════════════════════
    ' PHASE 4: Surya Payments & Others
    ' ════════════════════════════════════════
    
    For i = 2 To UBound(suryaData, 1)
        Dim sAcct2 As String
        sAcct2 = Trim(CStr(suryaData(i, 6)))
        
        If sAcct2 = "4001472" Then
            Dim sDocType3 As String
            sDocType3 = UCase(Trim(CStr(suryaData(i, 2))))
            
            ' Payments (KZ) and other non-invoice entries
            If sDocType3 <> "RV" And sDocType3 <> "RE" And sDocType3 <> "UE" Then
                Dim sIdx2 As Long
                sIdx2 = i
                
                ' Check if already matched (for payments)
                If sDocType3 = "KZ" Then
                    Dim alreadyUsed As Boolean
                    alreadyUsed = False
                    ' Check if this KZ was already matched as a payment
                    ' (We'll mark it as Surya-only for now)
                    If Not alreadyUsed Then
                        Dim sAmt4 As Double
                        sAmt4 = ParseAmount(suryaData(sIdx2, 6))
                        Dim sDate4 As String
                        sDate4 = FormatSAPDate(suryaData(sIdx2, 1))
                        Dim sDocNo2 As String
                        sDocNo2 = Trim(CStr(suryaData(sIdx2, 3)))
                        Dim sText As String
                        sText = Trim(CStr(suryaData(sIdx2, 22)))
                        
                        suryaOnly = suryaOnly + 1
                        Call WriteRow(ws, rowNum, sDate4, sDocNo2, _
                            "Payment/Transfer: " & sText, 0, sAmt4, _
                            "SURYA ONLY", "Payment/Transfer in Surya, verify in Sakar", _
                            sDocType3, "Payment (Surya Only)")
                        rowNum = rowNum + 1
                    End If
                ElseIf sDocType3 = "DA" Or sDocType3 = "DG" Then
                    Dim sAmt5 As Double
                    sAmt5 = ParseAmount(suryaData(sIdx2, 6))
                    Dim sDate5 As String
                    sDate5 = FormatSAPDate(suryaData(sIdx2, 1))
                    Dim sDocNo3 As String
                    sDocNo3 = Trim(CStr(suryaData(sIdx2, 3)))
                    Dim sRef5 As String
                    sRef5 = Trim(CStr(suryaData(sIdx2, 4)))
                    
                    suryaOnly = suryaOnly + 1
                    Call WriteRow(ws, rowNum, sDate5, sRef5, _
                        "Debit Note Doc: " & sDocNo3, 0, sAmt5, _
                        "SURYA ONLY", "Debit Note in Surya, verify in Sakar", _
                        sDocType3, "Debit Note (Surya Only)")
                    rowNum = rowNum + 1
                End If
            End If
        End If
    Next i
    
    ' ════════════════════════════════════════
    ' SUMMARY SECTION
    ' ════════════════════════════════════════
    
    rowNum = rowNum + 2
    
    ws.Cells(rowNum, 1).Value = "═══ SUMMARY ═══"
    ws.Cells(rowNum, 1).Font.Bold = True
    ws.Cells(rowNum, 1).Font.Size = 12
    rowNum = rowNum + 1
    
    ws.Cells(rowNum, 1).Value = "Total Entries:"
    ws.Cells(rowNum, 2).Value = matchCount + sakarOnly + suryaOnly + mismatch
    ws.Cells(rowNum, 1).Font.Bold = True
    rowNum = rowNum + 1
    
    ws.Cells(rowNum, 1).Value = "✅ Matched:"
    ws.Cells(rowNum, 2).Value = matchCount
    ws.Cells(rowNum, 2).Interior.Color = RGB(220, 252, 231)
    ws.Cells(rowNum, 2).Font.Bold = True
    rowNum = rowNum + 1
    
    ws.Cells(rowNum, 1).Value = "❌ Sakar Only:"
    ws.Cells(rowNum, 2).Value = sakarOnly
    ws.Cells(rowNum, 2).Interior.Color = RGB(254, 226, 226)
    ws.Cells(rowNum, 2).Font.Bold = True
    rowNum = rowNum + 1
    
    ws.Cells(rowNum, 1).Value = "⚠️ Surya Only:"
    ws.Cells(rowNum, 2).Value = suryaOnly
    ws.Cells(rowNum, 2).Interior.Color = RGB(254, 243, 199)
    ws.Cells(rowNum, 2).Font.Bold = True
    rowNum = rowNum + 1
    
    ws.Cells(rowNum, 1).Value = "🔄 Mismatch:"
    ws.Cells(rowNum, 2).Value = mismatch
    ws.Cells(rowNum, 2).Interior.Color = RGB(243, 232, 255)
    ws.Cells(rowNum, 2).Font.Bold = True
    rowNum = rowNum + 2
    
    ' Sign-off
    ws.Cells(rowNum, 1).Value = "═══ SIGN-OFF ═══"
    ws.Cells(rowNum, 1).Font.Bold = True
    rowNum = rowNum + 1
    ws.Cells(rowNum, 1).Value = "Prepared by:"
    ws.Cells(rowNum, 3).Value = "Date:"
    rowNum = rowNum + 1
    ws.Cells(rowNum, 1).Value = "Reviewed by:"
    ws.Cells(rowNum, 3).Value = "Date:"
    rowNum = rowNum + 1
    ws.Cells(rowNum, 1).Value = "Approved by:"
    ws.Cells(rowNum, 3).Value = "Date:"
    
    ' Auto-filter on headers
    ws.Range("A4:I4").AutoFilter
    
    ' Conditional formatting for status column
    Dim lastDataRow As Long
    lastDataRow = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    
    ' Green for MATCHED
    ws.Range("F5:F" & lastDataRow).FormatConditions.Add Type:=xlTextString, String:="MATCHED", TextOperator:=xlContains
    ws.Range("F5:F" & lastDataRow).FormatConditions(ws.Range("F5:F" & lastDataRow).FormatConditions.Count).Interior.Color = RGB(220, 252, 231)
    
    ' Red for SAKAR ONLY
    ws.Range("F5:F" & lastDataRow).FormatConditions.Add Type:=xlTextString, String:="SAKAR ONLY", TextOperator:=xlContains
    ws.Range("F5:F" & lastDataRow).FormatConditions(ws.Range("F5:F" & lastDataRow).FormatConditions.Count).Interior.Color = RGB(254, 226, 226)
    
    ' Yellow for SURYA ONLY
    ws.Range("F5:F" & lastDataRow).FormatConditions.Add Type:=xlTextString, String:="SURYA ONLY", TextOperator:=xlContains
    ws.Range("F5:F" & lastDataRow).FormatConditions(ws.Range("F5:F" & lastDataRow).FormatConditions.Count).Interior.Color = RGB(254, 243, 199)
    
    ' Purple for MISMATCH
    ws.Range("F5:F" & lastDataRow).FormatConditions.Add Type:=xlTextString, String:="MISMATCH", TextOperator:=xlContains
    ws.Range("F5:F" & lastDataRow).FormatConditions(ws.Range("F5:F" & lastDataRow).FormatConditions.Count).Interior.Color = RGB(243, 232, 255)
    
End Sub

' ─── Write a Row ───
Private Sub WriteRow(ws As Worksheet, row As Long, dateVal As String, refNo As String, _
    description As String, sakarAmt As Double, suryaAmt As Double, _
    status As String, remarks As String, docType As String, category As String)
    
    ws.Cells(row, 1).Value = dateVal
    ws.Cells(row, 2).Value = refNo
    ws.Cells(row, 3).Value = description
    
    If sakarAmt <> 0 Then
        ws.Cells(row, 4).Value = sakarAmt
        ws.Cells(row, 4).NumberFormat = "#,##0.00"
    End If
    
    If suryaAmt <> 0 Then
        ws.Cells(row, 5).Value = suryaAmt
        ws.Cells(row, 5).NumberFormat = "#,##0.00"
    End If
    
    ws.Cells(row, 6).Value = status
    ws.Cells(row, 7).Value = remarks
    ws.Cells(row, 8).Value = docType
    ws.Cells(row, 9).Value = category
End Sub

' ─── Helpers ───

Private Function Normalize(val As String) As String
    Dim result As String, ch As String
    val = LCase(Trim(val))
    Dim i As Long
    For i = 1 To Len(val)
        ch = Mid(val, i, 1)
        If ch >= "a" And ch <= "z" Then result = result & ch
        If ch >= "0" And ch <= "9" Then result = result & ch
    Next i
    Normalize = result
End Function

Private Function ParseAmount(val As Variant) As Double
    If IsEmpty(val) Or IsNull(val) Then ParseAmount = 0: Exit Function
    
    Dim s As String
    s = CStr(val)
    
    ' Remove currency symbols
    s = Replace(s, "INR", "")
    s = Replace(s, "USD", "")
    s = Replace(s, ",", "")
    s = Trim(s)
    
    ' Check for negative in parentheses
    Dim isNegative As Boolean
    If Left(s, 1) = "(" And Right(s, 1) = ")" Then
        isNegative = True
        s = Mid(s, 2, Len(s) - 2)
    End If
    
    On Error Resume Next
    Dim d As Double
    d = CDbl(s)
    On Error GoTo 0
    
    If isNegative Then d = -d
    ParseAmount = d
End Function

Private Function FormatSAPDate(val As Variant) As String
    If IsEmpty(val) Or IsNull(val) Then FormatSAPDate = "": Exit Function
    
    If IsNumeric(val) Then
        Dim serial As Double
        serial = CDbl(val)
        If serial > 40000 And serial < 50000 Then
            Dim d As Date
            d = serial ' Excel serial date
            FormatSAPDate = Format(d, "DD-MMM-YYYY")
            Exit Function
        End If
    End If
    
    FormatSAPDate = CStr(val)
End Function

Private Function ClassifyEntry(origin As String, details As String) As String
    origin = UCase(Trim(origin))
    details = LCase(Trim(details))
    
    Select Case origin
        Case "RC"
            ClassifyEntry = "Payment"
        Case "JE", "JR"
            If InStr(details, "rounding") > 0 Then
                ClassifyEntry = "Rounding"
            ElseIf InStr(details, "reconciliation") > 0 Then
                ClassifyEntry = "Reconciliation"
            ElseIf InStr(details, "tds") > 0 Then
                ClassifyEntry = "TDS"
            ElseIf InStr(details, "rejection") > 0 Or InStr(details, "transfer") > 0 Then
                ClassifyEntry = "Transfer"
            Else
                ClassifyEntry = "Journal Entry"
            End If
        Case "IN"
            If InStr(details, "cancellation") > 0 Then
                ClassifyEntry = "Cancellation"
            Else
                ClassifyEntry = "Sales Invoice"
            End If
        Case Else
            ClassifyEntry = "Other"
    End Select
End Function
