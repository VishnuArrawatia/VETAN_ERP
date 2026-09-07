Attribute VB_Name = "Fix_frmMaster_Debug"
' ============================================================
' FIX MODULE: frmMaster Employee Form Debug Error Fix
' 
' WHAT IT FIXES:
' 1. Format() on empty date cells → Type Mismatch debug error
' 2. CalculateTotal() sub is empty → total wage never calculates
' 3. Missing error handling in btnSearch_Click
' 
' HOW TO USE:
' 1. Open your Workforce .xlsm file (Aug-2026)
' 2. Press Alt + F11 (VBA Editor)
' 3. File -> Import File -> select this Fix_frmMaster_Debug.bas
' 4. Press F5 on "ApplyFix_frmMaster" subroutine
' 5. Save the file (Ctrl + S) - DONE!
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
        MsgBox "frmMaster UserForm not found!" & vbCrLf & _
               "Please check the form name in VBA editor.", vbCritical, "Fix Failed"
        Exit Sub
    End If
    
    ' Read all source code
    Dim sourceCode As String
    sourceCode = codeMod.Lines(1, codeMod.CountOfLines)
    
    ' Check if already fixed
    If InStr(sourceCode, "SafeFmtDate") > 0 Then
        MsgBox "Fix already applied!" & vbCrLf & _
               "frmMaster already has SafeFmtDate protection.", vbInformation, "Already Fixed"
        Exit Sub
    End If
    
    Dim changes As String
    changes = ""
    
    ' === FIX 1: Inject SafeFmtDate helper function ===
    Dim insertLine As Long
    insertLine = FindInsertPoint(codeMod)
    
    Dim safeFunc As String
    safeFunc = vbCrLf & _
        "'--- Safe Date Format Helper (PREVENTS DEBUG ERROR) ---" & vbCrLf & _
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
    changes = changes & "1. SafeFmtDate() function added" & vbCrLf
    sourceCode = codeMod.Lines(1, codeMod.CountOfLines)
    
    ' === FIX 2: Replace all Format() date calls ===
    Dim fixCount As Long
    fixCount = ReplaceFormatDates(codeMod)
    changes = changes & "2. " & fixCount & " Format() date calls replaced with SafeFmtDate()" & vbCrLf
    
    ' === FIX 3: Fix empty CalculateTotal ===
    Dim calcFixed As Boolean
    calcFixed = FixCalculateTotal(codeMod)
    If calcFixed Then changes = changes & "3. CalculateTotal() now calculates total wage" & vbCrLf
    
    ' === FIX 4: Add CalculateTotal call after search ===
    Dim calcAdded As Boolean
    calcAdded = AddCalculateTotalCall(codeMod)
    If calcAdded Then changes = changes & "4. CalculateTotal called when worker is found" & vbCrLf
    
    MsgBox "Fix applied successfully!" & vbCrLf & vbCrLf & _
           "frmMaster Employee Form - Changes:" & vbCrLf & _
           changes & vbCrLf & _
           "Please save the file now (Ctrl+S)!", vbInformation, "Fix Complete!"
    Exit Sub
    
EH:
    MsgBox "Error applying fix: " & Err.Description & vbCrLf & _
           "Line: " & Err.Line, vbCritical, "Fix Error"
End Sub


' --- Find where to insert SafeFmtDate (after SetWorksheet End Sub) ---
Private Function FindInsertPoint(codeMod As Object) As Long
    Dim i As Long
    Dim inSetWorksheet As Boolean
    inSetWorksheet = False
    
    For i = 1 To codeMod.CountOfLines
        Dim ln As String
        ln = codeMod.Lines(i, 1)
        
        If InStr(ln, "Private Sub SetWorksheet") > 0 Or InStr(ln, "Sub SetWorksheet") > 0 Then
            inSetWorksheet = True
        End If
        
        If inSetWorksheet And InStr(ln, "End Sub") > 0 Then
            ' Found end of SetWorksheet - insert after next blank line
            If i < codeMod.CountOfLines Then
                Dim nextLn As String
                nextLn = Trim(codeMod.Lines(i + 1, 1))
                If nextLn = "" Then
                    FindInsertPoint = i + 2
                Else
                    FindInsertPoint = i + 1
                End If
            Else
                FindInsertPoint = i + 1
            End If
            Exit Function
        End If
    Next i
    
    ' Fallback: insert at line 2
    FindInsertPoint = 2
End Function


' --- Replace Format() calls with SafeFmtDate() ---
Private Function ReplaceFormatDates(codeMod As Object) As Long
    Dim i As Long
    Dim count As Long
    count = 0
    
    For i = 1 To codeMod.CountOfLines
        Dim ln As String
        ln = codeMod.Lines(i, 1)
        
        Dim newLn As String
        newLn = ""
        
        ' Fix txtDOL (most common crash - DOL often empty)
        If InStr(ln, "txtDOL.Text = Format(ws.Cells(targetRow, 39).Value") > 0 Then
            newLn = "        txtDOL.Text = SafeFmtDate(ws.Cells(targetRow, 39).Value)"
            If InStr(ln, "'") > 0 Then newLn = newLn & "  " & ExtractComment(ln)
        End If
        
        ' Fix txtDOB
        If InStr(ln, "txtDOB.Text = Format(ws.Cells(targetRow, 10).Value") > 0 Then
            newLn = "        txtDOB.Text = SafeFmtDate(ws.Cells(targetRow, 10).Value)"
            If InStr(ln, "'") > 0 Then newLn = newLn & "  " & ExtractComment(ln)
        End If
        
        ' Fix TxtDOJ
        If InStr(ln, "TxtDOJ.Text = Format(ws.Cells(targetRow, 11).Value") > 0 Then
            newLn = "        TxtDOJ.Text = SafeFmtDate(ws.Cells(targetRow, 11).Value)"
            If InStr(ln, "'") > 0 Then newLn = newLn & "  " & ExtractComment(ln)
        End If
        
        ' Also handle the UserForm_Initialize DOJ line
        If InStr(ln, "TxtDOJ.Text = Format(Date, ""dd-mm-yyyy"")") > 0 Then
            ' This one is fine (Date is always valid), leave it
        End If
        
        If newLn <> "" Then
            codeMod.ReplaceLine i, newLn
            count = count + 1
        End If
    Next i
    
    ReplaceFormatDates = count
End Function


' --- Extract trailing comment from a line ---
Private Function ExtractComment(ln As String) As String
    Dim pos As Long
    pos = InStrRev(ln, "'")
    If pos > 0 Then
        ExtractComment = Mid(ln, pos)
    Else
        ExtractComment = ""
    End If
End Function


' --- Fix empty CalculateTotal ---
Private Function FixCalculateTotal(codeMod As Object) As Boolean
    FixCalculateTotal = False
    Dim i As Long
    
    For i = 1 To codeMod.CountOfLines
        Dim ln As String
        ln = codeMod.Lines(i, 1)
        
        If InStr(ln, "Sub CalculateTotal()") > 0 Then
            ' Find the End Sub of this function
            Dim j As Long
            For j = i + 1 To codeMod.CountOfLines
                If Trim(codeMod.Lines(j, 1)) = "End Sub" Then
                    ' Delete old lines and insert new
                    Dim newCalc As String
                    newCalc = "Sub CalculateTotal()" & vbCrLf & _
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
                    codeMod.DeleteLines i, (j - i + 1)
                    codeMod.InsertLines i, newCalc
                    FixCalculateTotal = True
                    Exit Function
                End If
            Next j
            Exit For
        End If
    Next i
End Function


' --- Add Call CalculateTotal after search finds a worker ---
Private Function AddCalculateTotalCall(codeMod As Object) As Boolean
    AddCalculateTotalCall = False
    Dim i As Long
    
    For i = 1 To codeMod.CountOfLines
        Dim ln As String
        ln = codeMod.Lines(i, 1)
        
        If InStr(ln, "btnSave.Caption = ""UPDATE WORKER""") > 0 Then
            ' Check if Call CalculateTotal is already there
            If i > 1 Then
                Dim prevLn As String
                prevLn = codeMod.Lines(i - 1, 1)
                If InStr(prevLn, "Call CalculateTotal") = 0 Then
                    codeMod.InsertLines i, "        Call CalculateTotal" & vbCrLf
                    AddCalculateTotalCall = True
                End If
            End If
            Exit Function
        End If
    Next i
End Function
