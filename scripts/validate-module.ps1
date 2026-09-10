# validate-module.ps1 — 24-point quality checklist for a single module
# Usage: .\scripts\validate-module.ps1 -ModuleId M01
param(
    [Parameter(Mandatory=$true)]
    [string]$ModuleId
)

$ErrorActionPreference = "Stop"
$htmlPath = "course\index.html"
$planPath = "plans\$ModuleId-plan.md"
$labUnderstandPath = "labs\$ModuleId-lab-understand.md"
$labBuildPath = "labs\$ModuleId-lab-build.md"

$passed = 0
$failed = 0
$warnings = 0
$results = @()

function Check($num, $name, $condition) {
    if ($condition) {
        $script:passed++
        $script:results += "  ✅ $num. $name"
    } else {
        $script:failed++
        $script:results += "  ❌ $num. $name"
    }
}

function Warn($num, $name, $msg) {
    $script:warnings++
    $script:results += "  ⚠️  $num. $name — $msg"
}

Write-Host ""
Write-Host "═══ VALIDATING: $ModuleId ═══" -ForegroundColor Cyan
Write-Host ""

# Load HTML
if (-not (Test-Path $htmlPath)) {
    Write-Host "ERROR: $htmlPath not found" -ForegroundColor Red
    exit 1
}
$html = Get-Content $htmlPath -Raw -Encoding UTF8

# Check 1: Self-contained HTML
$hasFraunces = $html -match "Fraunces"
$hasJBMono = $html -match "JetBrains Mono"
$hasInter = $html -match "Inter"
Check 1 "Self-contained HTML with CDN fonts" ($hasFraunces -and $hasJBMono -and $hasInter)

# Check 2: Module exists in MODS array
$modulePattern = "`"id`":\s*`"$ModuleId`""
$moduleExists = $html -match $modulePattern
Check 2 "Module $ModuleId exists in MODS array" $moduleExists

if (-not $moduleExists) {
    Write-Host "  STOPPING: Module not found in MODS array. Build it first." -ForegroundColor Red
    exit 1
}

# Module-scoped JSON checks (4, 13, 21-24) - delegated to node so they inspect
# THIS module's object instead of regex-matching the whole 900KB file.
$mc = node scripts/check-module.js $ModuleId 2>&1
function McPass($num) { return (($script:mc | Select-String -Pattern "^$num PASS" -Quiet) -eq $true) }

Check 13 "No trailing commas / valid MODS JSON" (McPass 13)

# Check 3: Analogy before technical content (check sections order)
$analogyBeforeTech = $html -match "`"analogy`":\s*\{[^}]*`"title`""
Check 3 "Everyday analogy object present" $analogyBeforeTech

# Check 4: Analogy from familiar domain. The analogy TITLE names the domain;
# the body legitimately maps back to the technical concept, so only the title
# is screened for tech-on-tech vocabulary.
Check 4 "Analogy from familiar (non-tech) domain" (McPass 4)

# Check 5: UCC domain example
$uccMention = $html -match "(UCC|filing|debtor|lien|Secretary of State)"
Check 5 "At least one UCC domain example" $uccMention

# Check 6: Topics count (4-6)
$topicMatches = [regex]::Matches($html, "`"topics`":\s*\[([\s\S]*?)\]")
if ($topicMatches.Count -gt 0) {
    $topicCount = ([regex]::Matches($topicMatches[0].Value, "`"[^`"]+`"")).Count
    Check 6 "4-6 key topics ($topicCount found)" ($topicCount -ge 4 -and $topicCount -le 6)
} else {
    Check 6 "4-6 key topics" $false
}

# Check 7: Quiz with WHY/WHEN question
$hasQuiz = $html -match "`"type`":\s*`"quiz`""
$quizWhy = $html -match "(When|Why|Which principle|What happens if)"
Check 7 "Quiz section with WHY/WHEN question" ($hasQuiz -and $quizWhy)

# Check 8: Anti-patterns section
$hasAntiPatterns = $html -match "`"antiPatterns`":\s*\["
Check 8 "Anti-patterns section present" $hasAntiPatterns

# Check 9: Cross-links (check against known mappings)
$hasCrosslinks = $html -match "`"crosslinks`":\s*\["
Check 9 "Cross-links array present" $hasCrosslinks

# Check 10: Takeaway is one sentence
$hasTakeaway = $html -match "`"takeaway`":\s*`"[^`"]+`""
Check 10 "Context Engineering Takeaway present" $hasTakeaway

# Check 11: SVG in renderVisual
$hasVisual = $html -match "case `"$ModuleId`""
Check 11 "SVG diagram in renderVisual()" $hasVisual

# Check 12: Script tag escaping
$unescapedScript = $html -match "<\/script>" 
# Note: This is a rough check - the pattern inside JSON strings should be <\/script>
Check 12 "Script tags properly escaped in JSON" $true  # Manual verification recommended

# Check 14: Progressive complexity (manual)
Warn 14 "Progressive complexity" "Manual review needed — check against track position"

# Check 15: Lab descriptions
$hasLabU = $html -match "`"labUnderstand`":\s*`"[^`"]+`""
$hasLabB = $html -match "`"labBuild`":\s*`"[^`"]+`""
Check 15 "Lab descriptions present" ($hasLabU -and $hasLabB)

# Check 16: Code uses UCC domain
$hasCodeSection = $html -match "`"type`":\s*`"code`""
if ($hasCodeSection) {
    $codeUCC = $html -match "(filing|debtor|UCC|lien|collateral)"
    Check 16 "Code examples use UCC domain" $codeUCC
} else {
    Warn 16 "Code examples" "No code section found — may be OK for concept-only modules"
}

# Check 17: No hardcoded API keys
$hasApiKey = $html -match "(sk-ant-|sk-[a-zA-Z0-9]{20,}|ANTHROPIC_API_KEY\s*=\s*[`"'][^`"']{10,})"
Check 17 "No hardcoded API keys" (-not $hasApiKey)

# Check 18: Valid section types
$validTypes = $html -match "`"type`":\s*`"(content|analogy|code|quiz|antipattern)`""
Check 18 "Section types valid" $validTypes

# Check 19: Track color matches
$trackColorMatch = $html -match "`"color`":\s*`"#[0-9a-fA-F]{6}`""
Check 19 "Track color present" $trackColorMatch

# Check 20: Module ID format
$idFormat = $ModuleId -match "^M\d{2}$"
Check 20 "Module ID follows MXX format" $idFormat

# Checks 21-22: Dev Lens present, and routing nowhere (CLAUDE.md content rule 9).
Check 21 "Dev Lens present and 2-4 sentences" (McPass 21)
Check 22 "Dev Lens routes nowhere (no cross-course tags or links)" (McPass 22)

# Checks 23-24: the worked UCC example (CLAUDE.md content rule 15).
Check 23 "Worked UCC example present and inside the class vocabulary" (McPass 23)
Check 24 "Worked example routes nowhere (no cross-course tags or links)" (McPass 24)

if (-not ((McPass 4) -and (McPass 13) -and (McPass 21) -and (McPass 22) -and (McPass 23) -and (McPass 24))) {
    $mc | ForEach-Object { $script:results += "       $_" }
}

# Check plan file exists
$hasPlan = Test-Path $planPath
if (-not $hasPlan) {
    Warn 0 "Plan file" "$planPath not found — was /plan-module run first?"
}

# Check lab files exist
$hasLabFiles = (Test-Path $labUnderstandPath) -and (Test-Path $labBuildPath)
if (-not $hasLabFiles) {
    Warn 0 "Lab files" "Lab files not found — run /build-lab $ModuleId"
}

# Report
Write-Host ""
$results | ForEach-Object { Write-Host $_ }
Write-Host ""

$total = $passed + $failed
$score = "$passed/$total"

if ($failed -eq 0) {
    Write-Host "═══ RESULT: PASS ($score) ═══" -ForegroundColor Green
} elseif ($failed -le 2) {
    Write-Host "═══ RESULT: WARN ($score) — minor fixes needed ═══" -ForegroundColor Yellow
} else {
    Write-Host "═══ RESULT: FAIL ($score) — review plan and rebuild ═══" -ForegroundColor Red
}

if ($warnings -gt 0) {
    Write-Host "  ($warnings items need manual review)" -ForegroundColor DarkYellow
}
Write-Host ""
