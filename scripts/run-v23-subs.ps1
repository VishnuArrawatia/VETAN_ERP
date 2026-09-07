$ErrorActionPreference = "Stop"
try { $xl = [Runtime.InteropServices.Marshal]::GetActiveObject("Excel.Application") } catch { Write-Output "FAIL-ATTACH"; exit 1 }
$wb = $null
foreach ($w in $xl.Workbooks) { if ($w.Name -like "*31.08.26*") { $wb = $w; break } }
if (-not $wb) { Write-Output "FAIL-WB"; exit 2 }

try { $xl.AutomationSecurity = 1 } catch {}

# 1. Remove OLD module (exact canonical name), keep the imported one
$old = $null; $new = $null
foreach ($c in $wb.VBProject.VBComponents) {
    if ($c.Name -eq "FinancialReport_FixMacros") { $old = $c }
    if ($c.Name -like "FinancialReport_FixMacros*1") { $new = $c }
}
if ($old) {
    $wb.VBProject.VBComponents.Remove($old)
    Write-Output "OK: purana module remove"
} else { Write-Output "INFO: purana module pehle hi nahi hai" }
if (-not $new) { Write-Output "FAIL: naya module nahi mila"; exit 3 }

# 2. Rename to canonical
try { $new.Name = "FinancialReport_FixMacros"; Write-Output "OK: rename => FinancialReport_FixMacros" }
catch { Write-Output "WARN: rename nahi hua - module-qualified run phir bhi try karenge" }

# 3. Run subs module-qualified
$qual = "'" + $wb.Name + "'!FinancialReport_FixMacros."
foreach ($sub in @("CleanBrokenNamedRanges", "BuildAutoCheckSheet", "BuildDrillDownSheet")) {
    try { $xl.Run($qual + $sub); Write-Output "OK: $sub" }
    catch { Write-Output "FAIL-RUN: $sub => $($_.Exception.Message)" }
}

# 4. Save + verify sheets
$wb.Save()
$sheetNames = @($wb.Worksheets | ForEach-Object { $_.Name })
Write-Output ("Sheets: " + ($sheetNames -join ", "))
if ($sheetNames -contains "Drill-Down") { Write-Output "VERIFY: Drill-Down sheet BAN GAYI" } else { Write-Output "VERIFY: Drill-Down abhi bhi missing" }
Write-Output "DONE"
