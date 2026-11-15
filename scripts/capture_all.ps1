$outDir = "C:\Users\USER\.gemini\antigravity\brain\281b4160-2fd9-493c-b617-51f93f8bbe53\screenshots"
if (!(Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force }

$pages = @(
  @{ name = "01_home_hero"; url = "http://localhost:3000/" },
  @{ name = "02_courses"; url = "http://localhost:3000/courses" },
  @{ name = "03_login"; url = "http://localhost:3000/login" },
  @{ name = "04_register"; url = "http://localhost:3000/register" },
  @{ name = "05_register_online"; url = "http://localhost:3000/register-online" },
  @{ name = "06_register_onsite"; url = "http://localhost:3000/register-onsite" },
  @{ name = "07_cart"; url = "http://localhost:3000/cart" },
  @{ name = "08_faq"; url = "http://localhost:3000/faq" }
)

foreach ($p in $pages) {
  $target = Join-Path $outDir "$($p.name).png"
  Write-Host "Capturing $($p.name) from $($p.url)..."
  npx playwright screenshot --channel chrome --wait-for-timeout 2000 $p.url $target
}

Write-Host "All screenshots captured!"
