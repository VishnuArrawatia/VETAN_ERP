$p = Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -like '*mis/server.ts*' } | Select-Object -First 1
if ($p) { Write-Host $p.ProcessId } else { Write-Host "NOT_FOUND" }
