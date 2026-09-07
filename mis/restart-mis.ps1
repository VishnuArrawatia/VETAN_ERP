# Kill all MIS server node processes, then start one fresh
$procs = Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -like '*mis/server.ts*' }
foreach ($p in $procs) {
  Write-Host ("Killing " + $p.ProcessId)
  Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
}
Start-Sleep 2
Start-Process -WindowStyle Hidden -FilePath "npx.cmd" -ArgumentList "tsx","mis/server.ts" -WorkingDirectory "C:\Users\SAKAR\VETAN_ERP_Freebuff" -RedirectStandardOutput "C:\Users\SAKAR\VETAN_ERP_Freebuff\mis\server.log" -RedirectStandardError "C:\Users\SAKAR\VETAN_ERP_Freebuff\mis\server.err"
Start-Sleep 10

$up = $false
try { Invoke-WebRequest -UseBasicParsing http://localhost:3001/api/mis/summary -TimeoutSec 3 | Out-Null; $up = $true } catch {}
if ($up) { Write-Host "SERVER UP on http://localhost:3001/mis" } else {
  Write-Host "SERVER FAILED - log:"
  Get-Content "C:\Users\SAKAR\VETAN_ERP_Freebuff\mis\server.err" -ErrorAction SilentlyContinue | Select-Object -First 15
}
