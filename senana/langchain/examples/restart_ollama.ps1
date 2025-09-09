# PowerShell script for restarting Ollama with new settings

Write-Host "Stopping Ollama..." -ForegroundColor Yellow
ollama kill

Write-Host "Setting environment variables..." -ForegroundColor Yellow
$env:OLLAMA_HOST="127.0.0.1"
$env:OLLAMA_PORT="11434"
$env:NO_PROXY="localhost,127.0.0.1"

# Pause to ensure processes are terminated
Start-Sleep -Seconds 3

Write-Host "Starting Ollama on $env:OLLAMA_HOST:$env:OLLAMA_PORT..." -ForegroundColor Green
Start-Process -NoNewWindow -FilePath "ollama" -ArgumentList "serve"

Write-Host "Waiting a few seconds for server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "Checking server availability..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://$env:OLLAMA_HOST`:$env:OLLAMA_PORT/" -UseBasicParsing
    Write-Host "Server is accessible! Status: $($response.StatusCode)" -ForegroundColor Green
}
catch {
    Write-Host "Could not connect to server: $_" -ForegroundColor Red
}

Write-Host "Done! Now run the direct_ollama_test.py script for additional testing." -ForegroundColor Cyan