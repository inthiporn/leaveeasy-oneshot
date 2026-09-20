# serve.ps1 — เซิร์ฟไฟล์ static ธรรมดาในโฟลเดอร์นี้ ไม่ต้องติดตั้ง Node.js/Python
# จำเป็นเพราะ ES module (import/export) ใช้งานผ่าน file:// ตรงๆ ไม่ได้ (เบราว์เซอร์บล็อกด้วย CORS)

$port = 3002
$root = $PSScriptRoot
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Serving $root at http://localhost:$port/"

$mime = @{
  ".html" = "text/html"; ".js" = "text/javascript"; ".css" = "text/css";
  ".json" = "application/json"; ".md" = "text/plain"; ".svg" = "image/svg+xml"
}

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $req = $context.Request
    $res = $context.Response
    try {
      $relPath = [System.Uri]::UnescapeDataString($req.Url.AbsolutePath.TrimStart('/'))
      if ([string]::IsNullOrEmpty($relPath)) { $relPath = "index.html" }
      $fullPath = Join-Path $root $relPath

      if (Test-Path $fullPath -PathType Leaf) {
        $ext = [System.IO.Path]::GetExtension($fullPath)
        $contentType = $mime[$ext]
        if (-not $contentType) { $contentType = "application/octet-stream" }
        $bytes = [System.IO.File]::ReadAllBytes($fullPath)
        $res.ContentType = $contentType
        $res.ContentLength64 = $bytes.Length
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
      } else {
        $res.StatusCode = 404
        $notFound = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $relPath")
        $res.OutputStream.Write($notFound, 0, $notFound.Length)
      }
    } finally {
      $res.OutputStream.Close()
    }
  }
} finally {
  $listener.Stop()
}
