Attribute VB_Name = "AutoFix_frmMaster"
' ============================================================
' AUTO-FIX MODULE: frmMaster Employee Form
' 
' Runs silently on Workbook_Open. No manual import needed!
' Fixes frmMaster debug errors automatically in background.
'
' FIRST TIME SETUP (one-time only):
'   1. Open your .xlsm file
'   2. Alt+F11 -> File -> Import File -> select this .bas
'   3. Press F5 on "SetupAutoFix" (hook into Workbook_Open)
'   4. Save file (Ctrl+S) - DONE!
'   5. From next time, fix runs automatically on open!
' ============================================================


' ============================================================
' SETUP: Hook auto-fix into Workbook_Open (run once!)
' ============================================================
Sub SetupAutoFix()
    On Error GoTo EH
    
    Dim wbCodeMod As Object
    Set wbCodeMod = ThisWorkbook.VBProject.VBComponents("ThisWorkbook").CodeModule
    
    Dim src As String
    src = wbCodeMod.Lines(1, wbCodeMod.CountOfLines)
    
    ' Check if already hooked
    If InStr(src, "AutoFix_frmMaster_OnOpen") > 0 Then
        MsgBox "Auto-fix is already hooked into Workbook_Open!" & vbCrLf & _
               "frmMaster will be fixed automatically from next open.", _
               vbInformation, "Already Setup"
        Exit Sub
    End If
    
    ' Find Workbook_Open and inject our call
    Dim i As Long
    For i = 1 To wbCodeMod.CountOfLines
        If InStr(wbCodeMod.Lines(i, 1), "Private Sub Workbook_Open") > 0 Then
            ' Find the first "On Error GoTo 0" after the existing setup code
            Dim j As Long
            For j = i + 1 To wbCodeMod.CountOfLines
                Dim ln As String
                ln = wbCodeMod.Lines(j, 1)
                
                ' Insert after the first On Error GoTo 0 (end of setup block)
                If InStr(ln, "On Error GoTo 0") > 0 Then
                    Dim hookCode As String
                    hookCode = vbCrLf & _
                        "    ' === AUTO-FIX: frmMaster (silent, background) ===" & vbCrLf & _
                        "    On Error Resume Next" & vbCrLf & _
                        "    AutoFix_frmMaster_OnOpen" & vbCrLf & _
                        "    On Error GoTo 0" & vbCrLf
                    wbCodeMod.InsertLines j + 1, hookCode
                    
                    MsgBox "Auto-fix hooked into Workbook_Open!" & vbCrLf & vbCrLf & _
                           "frmMaster will be fixed automatically from next open." & vbCrLf & _
                           "Save the file now (Ctrl+S).", vbInformation, "Setup Complete!"
                    Exit Sub
                End If
            Next j
            
            MsgBox "Could not find injection point in Workbook_Open." & vbCrLf & _
                   "Please add 'AutoFix_frmMaster_OnOpen' manually.", vbExclamation, "Setup Partial"
            Exit Sub
        End If
    Next i
    
    MsgBox "Workbook_Open not found in ThisWorkbook!", vbCritical, "Setup Failed"
    Exit Sub
    
EH:
    MsgBox "Error during setup: " & Err.Description, vbCritical, "Setup Error"
End Sub


' ============================================================
' MAIN AUTO-FIX: Runs on Workbook_Open (silent)
' ============================================================
Sub AutoFix_frmMaster_OnOpen()
    On Error GoTo EH
    
    Dim vbProj As Object
    Set vbProj = ThisWorkbook.VBProject
    
    ' Find frmMaster
    Dim vbComp As Object
    Dim frmComp As Object
    Dim codeMod As Object
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
    
    If Not found Then Exit Sub
    
    ' Check if already fixed
    Dim src As String
    src = codeMod.Lines(1, codeMod.CountOfLines)
    If InStr(src, "SafeFmtDate") > 0 Then Exit Sub
    
    ' === Apply fixes silently ===
    
    ' FIX 1: Inject SafeFmtDate helper
    Dim insertAt As Long
    insertAt = FindAutoFixInsertPoint(codeMod)
    
    Dim safeFunc As String
    safeFunc = vbCrLf & _
        "'--- Safe Date Format Helper (AUTO-FIXED) ---" & vbCrLf & _
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
    
    codeMod.InsertLines insertAt, safeFunc
    
    ' FIX 2: Replace Format() date calls
    Dim i As Long
    For i = 1 To codeMod.CountOfLines
        Dim ln As String
        ln = codeMod.Lines(i, 1)
        Dim newLn As String
        newLn = ""
        
        If InStr(ln, "txtDOL.Text = Format(ws.Cells(targetRow, 39).Value") > 0 Then
            newLn = "        txtDOL.Text = SafeFmtDate(ws.Cells(targetRow, 39).Value)"
            If InStr(ln, "'") > 0 Then newLn = newLn & "  " & Mid(ln, InStrRev(ln, "'"))
        ElseIf InStr(ln, "txtDOB.Text = Format(ws.Cells(targetRow, 10).Value") > 0 Then
            newLn = "        txtDOB.Text = SafeFmtDate(ws.Cells(targetRow, 10).Value)"
            If InStr(ln, "'") > 0 Then newLn = newLn & "  " & Mid(ln, InStrRev(ln, "'"))
        ElseIf InStr(ln, "TxtDOJ.Text = Format(ws.Cells(targetRow, 11).Value") > 0 Then
            newLn = "        TxtDOJ.Text = SafeFmtDate(ws.Cells(targetRow, 11).Value)"
            If InStr(ln, "'") > 0 Then newLn = newLn & "  " & Mid(ln, InStrRev(ln, "'"))
        End If
        
        If newLn <> "" Then codeMod.ReplaceLine i, newLn
    Next i
    
    ' FIX 3: Fix empty CalculateTotal
    For i = 1 To codeMod.CountOfLines
        If InStr(codeMod.Lines(i, 1), "Sub CalculateTotal()") > 0 Then
            Dim j As Long
            For j = i + 1 To codeMod.CountOfLines
                If Trim(codeMod.Lines(j, 1)) = "End Sub" Then
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
                    Exit For
                End If
            Next j
            Exit For
        End If
    Next i
    
    ' FIX 4: Add Call CalculateTotal after search
    For i = 1 To codeMod.CountOfLines
        If InStr(codeMod.Lines(i, 1), "btnSave.Caption = ""UPDATE WORKER""") > 0 Then
            If i > 1 Then
                If InStr(codeMod.Lines(i - 1, 1), "Call CalculateTotal") = 0 Then
                    codeMod.InsertLines i, "        Call CalculateTotal" & vbCrLf
                End If
            End If
            Exit For
        End If
    Next i
    
    ' Save silently
    ThisWorkbook.Save
    Exit Sub
    
EH:
    ' Silent fail - user won't notice, fix applied next time
End Sub


' --- Find insertion point (after SetWorksheet End Sub) ---
Private Function FindAutoFixInsertPoint(codeMod As Object) As Long
    Dim i As Long
    Dim inSub As Boolean
    inSub = False
    
    For i = 1 To codeMod.CountOfLines
        Dim ln As String
        ln = codeMod.Lines(i, 1)
        
        If InStr(ln, "Sub SetWorksheet") > 0 Then inSub = True
        
        If inSub And InStr(ln, "End Sub") > 0 Then
            If i < codeMod.CountOfLines Then
                If Trim(codeMod.Lines(i + 1, 1)) = "" Then
                    FindAutoFixInsertPoint = i + 2
                Else
                    FindAutoFixInsertPoint = i + 1
                End If
            Else
                FindAutoFixInsertPoint = i + 1
            End If
            Exit Function
        End If
    Next i
    
    FindAutoFixInsertPoint = 2
End Function
