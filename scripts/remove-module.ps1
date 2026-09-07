$ErrorActionPreference = "Continue"

# 1. Koi modal (compile-error popup) khula ho to Enter se dismiss karo
$wshell = New-Object -ComObject WScript.Shell
for ($i = 1; $i -le 3; $i++) {
    $ok = $wshell.AppActivate("Microsoft Visual Basic")
    if ($ok) { $wshell.SendKeys("{ENTER}"); Start-Sleep -Milliseconds 600 }
}
Start-Sleep -Seconds 1

# 2. Excel instance se attach (jis me workbook khuli hai)
$xl = $null
try { $xl = [Runtime.InteropServices.Marshal]::GetActiveObject("Excel.Application") } catch {}
$wb = $null
if ($xl) {
    foreach ($w in $xl.Workbooks) { if ($w.Name -like "*31.08.26*") { $wb = $w; break } }
}

# 3. Workbook khuli nahi? nayi instance me kholo
if (-not $wb) {
    $xl = New-Object -ComObject Excel.Application
    $xl.Visible = $true
    $xl.DisplayAlerts = $false
    $path = "E:\Account Master\A-Sakar\7. Management MIS\Monthly MIS\Financial Report\FY-2026-27\Revised Group-Summary as on 31.08.26.xlsm"
    try { $wb = $xl.Workbooks.Open($path, 0, $false) } catch { Write-Output "FAIL-OPEN: $($_.Exception.Message)"; exit 2 }
    Write-Output "INFO: workbook nayi instance me kholi"
}
if ($wb.ReadOnly) { Write-Output "FAIL: workbook read-only hai - pehle dusri window me se band karo"; exit 3 }
Write-Output "OK: workbook mili [$($wb.Name)]"

# 4. Saare fix-macro standard modules REMOVE (ab zaroorat nahi - sab fixes file me hain)
$removed = 0
$toRemove = @()
foreach ($c in $wb.VBProject.VBComponents) {
    if ($c.Type -eq 1) {
        $n = $c.Name
        if ($n -like "FinancialReport_FixMacros*" -or $n -eq "FinFix" -or [string]::IsNullOrWhiteSpace($n)) { $toRemove += $c }
    }
}
foreach ($c in $toRemove) {
    try { $wb.VBProject.VBComponents.Remove($c); $removed++; Write-Output "OK: module removed [$($c.Name)]" }
    catch { Write-Output "WARN: remove fail [$($c.Name)] => $($_.Exception.Message)" }
}
if ($removed -eq 0) { Write-Output "INFO: koi fix-macro module nahi mila (pehle hi saaf)" }

# 5. Save + verify
$wb.Save()
$still = 0
foreach ($c in $wb.VBProject.VBComponents) { if ($c.Type -eq 1) { $still++ } }
Write-Output "VERIFY: bache hue standard modules = $still"
Write-Output "VERIFY: Drill-Down = $($wb.Worksheets | Where-Object { $_.Name -eq 'Drill-Down' } | Measure-Object | ForEach-Object { $_.Count }) (1 hona chahiye)"
Write-Output "VERIFY: Auto-Check = $($wb.Worksheets | Where-Object { $_.Name -eq 'Auto-Check' } | Measure-Object | ForEach-Object { $_.Count }) (1 hona chahiye)"
$dead = @($wb.Names | Where-Object { $_.RefersTo -like "*#REF*" })
Write-Output "VERIFY: dead names = $($dead.Count)"
Write-Output "DONE"
