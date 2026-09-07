$ErrorActionPreference = "Continue"

# 1. Running Excel instances se workbook dhoondo (koi kill nahi karenge)
$xl = $null; $wb = $null
$excelProcs = Get-Process EXCEL -ErrorAction SilentlyContinue
foreach ($p in $excelProcs) {
    try {
        $xlT = [Runtime.InteropServices.Marshal]::GetActiveObject("Excel.Application")
    } catch { continue }
    foreach ($w in $xlT.Workbooks) {
        if ($w.Name -like "*31.08.26*") { $xl = $xlT; $wb = $w; break }
    }
    if ($wb) { break }
}

# 2. Kahin khuli nahi? to read-write kholo
if (-not $wb) {
    $xl = New-Object -ComObject Excel.Application
    $xl.Visible = $true
    $xl.DisplayAlerts = $false
    $path = "E:\Account Master\A-Sakar\7. Management MIS\Monthly MIS\Financial Report\FY-2026-27\Revised Group-Summary as on 31.08.26.xlsm"
    try { $wb = $xl.Workbooks.Open($path, 0, $false) } catch { Write-Output "FAIL-OPEN: $($_.Exception.Message)"; exit 2 }
    Write-Output "INFO: workbook nayi instance me kholi"
}

if ($wb.ReadOnly) {
    Write-Output "FAIL: workbook READ-ONLY khuli hai (koi aur instance/lock hold kar raha hai). Pehle wo band karo."
    exit 3
}
Write-Output "OK: workbook read-write mili [$($wb.Name)]"

# 3. Purani Drill-Down delete
foreach ($ws in @($wb.Worksheets)) { if ($ws.Name -eq "Drill-Down") { $ws.Delete(); Write-Output "OK: purani Drill-Down delete" } }

# 4. Nayi sheet
$after = $wb.Worksheets.Item($wb.Worksheets.Count)
$ws = $wb.Worksheets.Add([Type]::Missing, $after)
$ws.Name = "Drill-Down"

# 5. Group labels (TB SAKAR col G + SVN col B) -> hidden Z
$tbS = $wb.Worksheets.Item("Master-TB-Sakar")
$tbV = $wb.Worksheets.Item("Master-TB-SVN")
$z = 2
$seen = @{}
foreach ($r in 3..650) {
    $v1 = [string]$tbS.Cells.Item($r, 7).Value2
    $v2 = [string]$tbV.Cells.Item($r, 2).Value2
    foreach ($v in @($v1, $v2)) {
        $t = $v.Trim()
        if ($t.Length -gt 0 -and -not $seen.ContainsKey($t)) {
            $seen[$t] = 1
            $ws.Cells.Item($z, 26).Value2 = $t
            $z++
        }
    }
}
$ws.Columns.Item("Z").Hidden = $true
Write-Output "OK: $($z-2) group labels"

# 6. Selectors + dropdowns
$ws.Range("A1").Value2 = "GROUP BREAKUP - Group head chuno, accounts neeche aa jayenge"
$ws.Range("A1").Font.Bold = $true
$ws.Range("A1").Font.Size = 13
$ws.Range("A2").Value2 = "Entity:"
$ws.Range("A3").Value2 = "Group Head:"
$ws.Range("A4").Value2 = "As on:"
$ws.Range("B2").Value2 = "SAKAR"
$ws.Range("B3").Value2 = "Sales"
$ws.Range("B4").Formula = "=TODAY()"
$ws.Range("B4").NumberFormat = "dd-mmm-yy"
$null = $ws.Range("B2").Validation.Add(3, 1, 1, "SAKAR,SVN")
$null = $ws.Range("B3").Validation.Add(3, 1, 1, "=`$Z`$2:`$Z`$100")

# 7. Headers
$ws.Range("A6").Value2 = "Total:"
$ws.Range("A6").Font.Bold = $true
$ws.Range("A7").Value2 = "#"
$ws.Range("B7").Value2 = "G/L Code"
$ws.Range("C7").Value2 = "Account Name"
$ws.Range("D7").Value2 = "Balance"
$ws.Range("E7").Value2 = "Share %"
$hdr = $ws.Range("A7:E7")
$hdr.Font.Bold = $true
$hdr.Font.Color = 16777215
$hdr.Interior.Color = 7907359

# 8. FILTER formulas
$fEnt = 'MATCH($B$2,{"SAKAR","SVN"},0)'
$fCrit = "CHOOSE($fEnt,'Master-TB-Sakar'!`$G`$3:`$G`$650,'Master-TB-SVN'!`$B`$3:`$B`$650)=`$B`$3"
try {
    $ws.Range("B8").Formula = "=IFERROR(FILTER(CHOOSE($fEnt,'Master-TB-Sakar'!`$D`$3:`$D`$650,'Master-TB-SVN'!`$C`$3:`$C`$650),$fCrit),"""")"
    $ws.Range("C8").Formula = "=IFERROR(FILTER(CHOOSE($fEnt,'Master-TB-Sakar'!`$E`$3:`$E`$650,'Master-TB-SVN'!`$D`$3:`$D`$650),$fCrit),"""")"
    $ws.Range("D8").Formula = "=IFERROR(FILTER(CHOOSE($fEnt,INDEX('Master-TB-Sakar'!`$G`$3:`$V`$650,0,MATCH(`$B`$4,'Master-TB-Sakar'!`$G`$1:`$V`$1,1)),INDEX('Master-TB-SVN'!`$H`$3:`$S`$650,0,MATCH(`$B`$4,'Master-TB-SVN'!`$H`$1:`$S`$1,1))),$fCrit),"""")"
    $ws.Range("E8").Formula = "=IFERROR(D8#/SUM(ABS(D8#)),0)"
    $ws.Range("D6").Formula = "=SUM(D8#)"
    Write-Output "OK: FILTER formulas"
} catch { Write-Output "FAIL-FORMULA: $($_.Exception.Message)" }

# 9. Note + formats
$ws.Range("A5").Value2 = "Note:"
$ws.Range("B5").Value2 = "As-on date ke hisaab se month column TB me se MATCH hota hai. Balance blank? To group label TB grouping column me set nahi hai."
$ws.Range("B5").Font.Italic = $true
$ws.Range("B5").Font.Size = 9
$ws.Range("D6").NumberFormat = "#,##0.00;(#,##0.00)"
$ws.Range("D8").NumberFormat = "#,##0.00;(#,##0.00)"
$ws.Range("E8").NumberFormat = "0.0%"
$ws.Columns.Item("A").ColumnWidth = 12
$ws.Columns.Item("B").ColumnWidth = 16
$ws.Columns.Item("C").ColumnWidth = 50
$ws.Columns.Item("D").ColumnWidth = 16
$ws.Columns.Item("E").ColumnWidth = 10
try { $ws.Activate(); $ws.Range("A8").Select() | Out-Null; $xl.ActiveWindow.FreezePanes = $true } catch {}

# 10. SAVE (read-only recheck + explicit error report)
if ($wb.ReadOnly) { Write-Output "FAIL-SAVE: ab bhi read-only hai - save nahi hoga"; exit 4 }
try { $wb.Save(); Write-Output "OK: SAVED" } catch { Write-Output "FAIL-SAVE: $($_.Exception.Message)"; exit 5 }

# 11. Verify SAVED FILE via reload check (Saved flag + sheet exists)
$dd = $wb.Worksheets.Item("Drill-Down")
Write-Output "VERIFY: sheet exists, B2=$($dd.Range('B2').Value2) B3=$($dd.Range('B3').Value2) B8formula=$($dd.Range('B8').HasFormula) saved-flag=$($wb.Saved)"
Write-Output "DONE"
