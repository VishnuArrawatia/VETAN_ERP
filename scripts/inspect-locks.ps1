$ErrorActionPreference = "Continue"
$procs = Get-Process EXCEL -ErrorAction SilentlyContinue
if (-not $procs) { Write-Output "koi Excel nahi chal raha"; exit 0 }
foreach ($p in $procs) {
    Write-Output "PID $($p.Id) | title=[$($p.MainWindowTitle)] | start=$($p.StartTime)"
}
