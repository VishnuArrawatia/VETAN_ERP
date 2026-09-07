# Load v2.3 macro into the OPEN Excel workbook and run pending subs
$ErrorActionPreference = "Stop"

# 1. Attach to running Excel
try {
    $xl = [Runtime.InteropServices.Marshal]::GetActiveObject("Excel.Application")
    Write-Output "OK: Excel session attach ho gaya (running workbooks: $($xl.Workbooks.Count))"
} catch {
    Write-Output "FAIL-ATTACH: Excel chal nahi raha ya session access nahi mila: $($_.Exception.Message)"
    exit 1
}

# 2. Find the target workbook
$wb = $null
foreach ($w in $xl.Workbooks) {
    if ($w.Name -like "*31.08.26*") { $wb = $w; break }
}
if (-not $wb) {
    Write-Output "FAIL-WB: 31.08.26 wali workbook open nahi mili. Open hain: $(($xl.Workbooks | ForEach-Object { $_.Name }) -join ' | ')"
    exit 2
}
Write-Output "OK: Workbook mili => $($wb.FullName)"

# 3. Trust-access probe
try {
    $names = @($wb.VBProject.VBComponents | ForEach-Object { $_.Name })
    Write-Output "OK: VBProject access hai. Modules: $($names -join ', ')"
} catch {
    Write-Output "FAIL-TRUST: 'Trust access to the VBA project object model' band hai (Excel Trust Center). Excel me: File > Options > Trust Center > Trust Center Settings > Macro Settings > check karo."
    exit 3
}

# 4. Remove old module if exists
$old = $wb.VBProject.VBComponents | Where-Object { $_.Name -eq "FinancialReport_FixMacros" }
if ($old) {
    $wb.VBProject.VBComponents.Remove($old)
    Write-Output "OK: Purana module remove kiya"
}

# 5. Import v2.3 from E: copy
$bas = "E:\Account Master\A-Sakar\7. Management MIS\Monthly MIS\Financial Report\FY-2026-27\FinancialReport_FixMacros.bas"
if (-not (Test-Path $bas)) { Write-Output "FAIL-BAS: $bas nahi mila"; exit 4 }
$comp = $wb.VBProject.VBComponents.Import($bas)
Write-Output "OK: v2.3 import hua => module '$($comp.Name)'"

# 6. Run the 3 pending subs individually
foreach ($sub in @("CleanBrokenNamedRanges", "BuildAutoCheckSheet", "BuildDrillDownSheet")) {
    try {
        $xl.Run($wb.Name + "!" + $sub)
        Write-Output "OK: $sub chala"
    } catch {
        Write-Output "FAIL-RUN: $sub => $($_.Exception.Message)"
    }
}

# 7. Save
try {
    $wb.Save()
    Write-Output "OK: Workbook save ho gayi ($($wb.FullName))"
} catch {
    Write-Output "FAIL-SAVE: $($_.Exception.Message)"
    exit 5
}
Write-Output "DONE"
