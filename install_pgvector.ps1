# Script to copy pgvector files to PostgreSQL 16
$pgRoot = "C:\Program Files\PostgreSQL\16"
$pkgRoot = "e:\ProofLens\pgvector_pkg"

Write-Host "Installing pgvector into $pgRoot..."

# 1. Copy DLL
Copy-Item -Path "$pkgRoot\lib\*" -Destination "$pgRoot\lib" -Recurse -Force
Write-Host "Copied lib\vector.dll"

# 2. Copy Extensions
Copy-Item -Path "$pkgRoot\share\extension\*" -Destination "$pgRoot\share\extension" -Recurse -Force
Write-Host "Copied share\extension\vector.*"

# 3. Copy Headers
$incDir = "$pgRoot\include\server\extension\vector"
if (!(Test-Path $incDir)) {
    New-Item -ItemType Directory -Path $incDir -Force
}
Copy-Item -Path "$pkgRoot\include\server\extension\vector\*" -Destination $incDir -Recurse -Force
Write-Host "Copied include headers"

Write-Host "pgvector files copied successfully!"
Start-Sleep -Seconds 2
