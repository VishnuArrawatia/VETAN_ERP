Attribute VB_Name = "ThisWorkbook"
Attribute VB_Base = "0{00020819-0000-0000-C000-000000000046}"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = True
Attribute VB_TemplateDerived = False
Attribute VB_Customizable = True
Private Sub Workbook_Open()

    Dim ws As Worksheet
    Application.WindowState = xlMaximized
    ActiveWindow.DisplayHeadings = False
    ActiveWindow.DisplayGridlines = False
    Application.DisplayFormulaBar = False
    ActiveWindow.DisplayWorkbookTabs = False
    On Error Resume Next
    ThisWorkbook.Unprotect
    ActiveWorkbook.Unprotect
    On Error GoTo 0
    
    ' === AUTO-FIX: frmMaster Employee Form (silent, no popup) ===
    On Error Resume Next
    AutoFix_frmMaster_OnOpen
    On Error GoTo 0
    
    On Error Resume Next
    Sheets("Dashboard").Visible = xlSheetVisible
    Sheets("Dashboard").Activate
    Start
    On Error GoTo 0
    For Each ws In ThisWorkbook.Worksheets
        If ws.Name <> "Dashboard" Then
            On Error Resume Next
            ws.Visible = xlSheetVeryHidden
            On Error GoTo 0
        End If
    Next ws
End Sub


Private Sub Workbook_SheetFollowHyperlink(ByVal sh As Object, ByVal Target As Hyperlink)
    Dim subAddr As String
    Dim SheetName As String
    Dim pos As Long
    Dim targetWS As Worksheet
    subAddr = Target.SubAddress
    SheetName = ""
    If subAddr <> "" Then
        If Left(subAddr, 1) = "'" Then
            pos = InStr(2, subAddr, "'")
            If pos > 2 Then
                SheetName = Mid(subAddr, 2, pos - 2)
            End If
        Else
            pos = InStr(subAddr, "!")
            If pos > 0 Then
                SheetName = Left(subAddr, pos - 1)
            End If
        End If
    End If
    If SheetName <> "" Then
        On Error Resume Next
        Set targetWS = ThisWorkbook.Sheets(SheetName)
        On Error GoTo 0
        If Not targetWS Is Nothing Then
            On Error Resume Next
            ThisWorkbook.Unprotect
            ActiveWorkbook.Unprotect
            On Error GoTo 0
            On Error Resume Next
            targetWS.Visible = xlSheetVisible
            targetWS.Activate
            On Error GoTo 0
            If sh.Name <> targetWS.Name Then
                On Error Resume Next
                sh.Visible = xlSheetVeryHidden
                On Error GoTo 0
            End If
        End If
    End If
End Sub
