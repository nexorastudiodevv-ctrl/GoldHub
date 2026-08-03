# Search for wallet-related content across project files
$patterns = 'محفظ', 'wallet', 'Wallet', 'WALLET', 'محفظتي', 'محفظتك', 'رصيد', 'balance', 'Balance'

# Get all html and js files
$files = Get-ChildItem -Path . -Recurse -Include *.html, *.js -File | Where-Object { $_.FullName -notmatch 'node_modules' }

foreach ($file in $files) {
    Write-Output "===== FILE: $($file.FullName) ====="
    $lineNum = 0
    Get-Content -Path $file.FullName -Encoding UTF8 | ForEach-Object {
        $lineNum++
        $line = $_
        foreach ($p in $patterns) {
            if ($line.Contains($p)) {
                $trunc = if ($line.Length -gt 250) { $line.Substring(0, 250) + "..." } else { $line }
                Write-Output ("  Line {0}: {1}" -f $lineNum, $trunc)
                break
            }
        }
    }
}
Write-Output "===== SEARCH COMPLETE ====="
