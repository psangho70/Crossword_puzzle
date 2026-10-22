Add-Type -AssemblyName System.Drawing

$projectRoot = "c:\Antigravity\Crossword_puzzle"
$sourcePath = Join-Path $projectRoot "icon_512_round_GHAILab.png"

Write-Host "소스 아이콘 로드 중: $sourcePath"
$srcBmp = [System.Drawing.Bitmap]::FromFile($sourcePath)
$w = $srcBmp.Width
$h = $srcBmp.Height

# 1. 2048x2048 원형 투명 마스킹 처리된 마스터 비트맵 생성
$maskedMaster = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gMaster = [System.Drawing.Graphics]::FromImage($maskedMaster)
$gMaster.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$gMaster.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gMaster.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$gMaster.Clear([System.Drawing.Color]::Transparent)

# 원형 패스 생성 (중심 1024, 1024, 직경 약 2038)
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$margin = 5
$path.AddEllipse($margin, $margin, $w - ($margin * 2), $h - ($margin * 2))
$gMaster.SetClip($path)
$gMaster.DrawImage($srcBmp, 0, 0, $w, $h)
$gMaster.Dispose()
$srcBmp.Dispose()

Write-Host "마스터 원형 마스킹 완료 (2048x2048)"

# 리사이징 헬퍼 함수
function Save-ResizedPng($srcImage, $destPath, $targetWidth, $targetHeight, $innerRatio = 1.0) {
    $parentDir = Split-Path -Parent $destPath
    if (-not (Test-Path $parentDir)) {
        New-Item -ItemType Directory -Path $parentDir -Force | Out-Null
    }

    $bmp = New-Object System.Drawing.Bitmap($targetWidth, $targetHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    if ($innerRatio -ge 0.99) {
        $g.DrawImage($srcImage, 0, 0, $targetWidth, $targetHeight)
    } else {
        $drawW = [int]($targetWidth * $innerRatio)
        $drawH = [int]($targetHeight * $innerRatio)
        $offsetX = [int](($targetWidth - $drawW) / 2)
        $offsetY = [int](($targetHeight - $drawH) / 2)
        $g.DrawImage($srcImage, $offsetX, $offsetY, $drawW, $drawH)
    }

    $g.Dispose()

    # 기존 파일이 있다면 덮어쓰기 위해 임시 저장 후 교체
    $tempPath = $destPath + ".tmp.png"
    $bmp.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()

    if (Test-Path $destPath) {
        Remove-Item $destPath -Force
    }
    Move-Item -Path $tempPath -Destination $destPath -Force
    Write-Host "생성 완료: $destPath ($targetWidth x $targetHeight, ratio=$innerRatio)"
}

# 2. Adaptive Icon 포그라운드 생성 (Safe Zone 적용: 중앙 72% 크기)
$safeRatio = 0.72
$drawableConfigs = @(
    @{ Dir = "drawable-mdpi"; Size = 108 },
    @{ Dir = "drawable-hdpi"; Size = 162 },
    @{ Dir = "drawable-xhdpi"; Size = 216 },
    @{ Dir = "drawable-xxhdpi"; Size = 324 },
    @{ Dir = "drawable-xxxhdpi"; Size = 432 }
)

foreach ($cfg in $drawableConfigs) {
    $outPath = Join-Path $projectRoot "android\app\src\main\res\$($cfg.Dir)\ic_launcher_foreground.png"
    Save-ResizedPng -srcImage $maskedMaster -destPath $outPath -targetWidth $cfg.Size -targetHeight $cfg.Size -innerRatio $safeRatio
}

# 3. Legacy mipmap 런처 아이콘 생성 (ic_launcher.png & ic_launcher_round.png)
$mipmapConfigs = @(
    @{ Dir = "mipmap-mdpi"; Size = 48 },
    @{ Dir = "mipmap-hdpi"; Size = 72 },
    @{ Dir = "mipmap-xhdpi"; Size = 96 },
    @{ Dir = "mipmap-xxhdpi"; Size = 144 },
    @{ Dir = "mipmap-xxxhdpi"; Size = 192 }
)

foreach ($cfg in $mipmapConfigs) {
    $outLauncher = Join-Path $projectRoot "android\app\src\main\res\$($cfg.Dir)\ic_launcher.png"
    $outRound = Join-Path $projectRoot "android\app\src\main\res\$($cfg.Dir)\ic_launcher_round.png"
    
    Save-ResizedPng -srcImage $maskedMaster -destPath $outLauncher -targetWidth $cfg.Size -targetHeight $cfg.Size -innerRatio 1.0
    Save-ResizedPng -srcImage $maskedMaster -destPath $outRound -targetWidth $cfg.Size -targetHeight $cfg.Size -innerRatio 1.0
}

# 4. 앱 및 웹 에셋 동기화 (512x512)
$assetIcon = Join-Path $projectRoot "android\app\src\main\assets\icon.png"
Save-ResizedPng -srcImage $maskedMaster -destPath $assetIcon -targetWidth 512 -targetHeight 512 -innerRatio 1.0

$rootIcon512Round = Join-Path $projectRoot "icon_512_round.png"
Save-ResizedPng -srcImage $maskedMaster -destPath $rootIcon512Round -targetWidth 512 -targetHeight 512 -innerRatio 1.0

$rootIcon512 = Join-Path $projectRoot "icon_512.png"
Save-ResizedPng -srcImage $maskedMaster -destPath $rootIcon512 -targetWidth 512 -targetHeight 512 -innerRatio 1.0

$maskedMaster.Dispose()
Write-Host "모든 아이콘 리소스 생성 완료!"
