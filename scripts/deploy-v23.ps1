$ErrorActionPreference = "Continue"
$xl = [Runtime.InteropServices.Marshal]::GetActiveObject("Excel.Application")
$wb = $null
foreach ($w in $xl.Workbooks) { if ($w.Name -like "*31.08.26*") { $wb = $w; break } }
if (-not $wb) { Write-Output "INFO: workbook user-Excel me khuli nahi hai (band hui thi)"; exit 0 }

# Auto-Check ki asli state kya hai?
$ac = $wb.Worksheets | Where-Object { $_.Name -eq "Auto-Check" }
if (-not $ac) { Write-Output "STATE: Auto-Check sheet hi nahi hai"; exit 0 }
Write-Output "STATE: Auto-Check A3 = [$($ac.Range('A3').Text)]"
Write-Output "STATE: Auto-Check A10 = [$($ac.Range('A10').Text)]"
Write-Output "STATE: Auto-Check A11 = [$($ac.Range('A11').Text)]"

# Dead names state
$dead = @($wb.Names | Where-Object { $_.RefersTo -like "*#REF*" })
Write-Output "STATE: dead names = $($dead.Count)"

# Agar A3 khali hai to builders direct-run karo (bina Application.Run ke - direct method call)
if ([string]::IsNullOrWhiteSpace($ac.Range("A3").Text)) {
    Write-Output "ACTION: Auto-Check khali hai - builders chalata hoon (direct method invocation)"
    $vbp = $wb.VBProject
    foreach ($sub in @("BuildAutoCheckSheet", "BuildDrillDownSheet")) {
        try {
            # direct call via InvokeMember - run-mode bypass nahi hota, par try karta hoon
            $xl.Run($sub)
            Write-Output "OK: $sub"
        } catch {
            Write-Output "FAIL-RUN: $sub (run-mode stuck)"
        }
    }
    $wb.Save()
}
Write-Output "DONE"
