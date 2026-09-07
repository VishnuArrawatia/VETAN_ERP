# MIS server start + health check
$root = "C:\Users\SAKAR\VETAN_ERP_Freebuff"
Set-Location $root

# Start server if not already up
$up = $false
try { Invoke-WebRequest -UseBasicParsing http://localhost:3001/api/mis/summary -TimeoutSec 2 | Out-Null; $up = $true } catch {}

if (-not $up) {
  Start-Process -WindowStyle Hidden -FilePath "npx.cmd" -ArgumentList "tsx","mis/server.ts" -WorkingDirectory $root
  for ($i = 0; $i -lt 15; $i++) {
    Start-Sleep 3
    try { Invoke-WebRequest -UseBasicParsing http://localhost:3001/api/mis/summary -TimeoutSec 2 | Out-Null; $up = $true; break } catch {}
  }
}

if ($up) { Write-Host "SERVER UP on http://localhost:3001/mis" } else { Write-Host "SERVER FAILED to start" }

# Health: test key APIs
foreach ($ep in @("summary","sales?entity=ALL&groupBy=item","matrix?entity=ALL","fg-analysis?entity=ALL","rejections?entity=ALL","customer360?code=C00057")) {
  try {
    $r = Invoke-WebRequest -UseBasicParsing ("http://localhost:3001/api/mis/" + $ep) -TimeoutSec 10
    Write-Host ("API OK  " + $ep.Substring(0, [Math]::Min(30, $ep.Length)) + "  -> " + $r.Content.Substring(0, 80))
  } catch {
    Write-Host ("API FAIL " + $ep + " : " + $_.Exception.Message)
  }
}
