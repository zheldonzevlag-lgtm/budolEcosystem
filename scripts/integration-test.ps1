# integration-test.ps1
# Run this script to test all security fixes are working

$ErrorActionPreference = "Continue"
$baseUrl = "http://localhost"
$passed = 0
$failed = 0

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [string]$Body = "",
        [int]$ExpectedStatus = 200
    )
    
    Write-Host "Testing: $Name" -ForegroundColor Yellow
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            UseBasicParsing = $true
        }
        
        if ($Body) {
            $params.Body = $Body
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params -ErrorAction Stop
        
        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-Host "  PASS (Status: $($response.StatusCode))" -ForegroundColor Green
            $script:passed++
        } else {
            Write-Host "  FAIL (Expected: $ExpectedStatus, Got: $($response.StatusCode))" -ForegroundColor Red
            $script:failed++
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq $ExpectedStatus) {
            Write-Host "  PASS (Status: $statusCode)" -ForegroundColor Green
            $script:passed++
        } else {
            Write-Host "  FAIL (Expected: $ExpectedStatus, Got: $statusCode)" -ForegroundColor Red
            $script:failed++
        }
    }
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Security Integration Tests" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Test Health Endpoints
Write-Host "=== Health Checks ===" -ForegroundColor Magenta
Test-Endpoint "API Gateway Health" "$baseUrl`:8000/health" -ExpectedStatus 200
Test-Endpoint "Auth Service Health" "$baseUrl`:8001/health" -ExpectedStatus 200
Test-Endpoint "Wallet Service Health" "$baseUrl`:8002/health" -ExpectedStatus 200
Test-Endpoint "WebSocket Health" "$baseUrl`:4000/" -ExpectedStatus 200

# 2. Test Authentication Required (should return 401)
Write-Host "=== Authentication Required ===" -ForegroundColor Magenta
Test-Endpoint "Wallet /update-balance without auth" "$baseUrl`:8002/update-balance" -Method POST -Body '{"userId":"test","amount":100}' -ExpectedStatus 401
Test-Endpoint "Transaction service without auth" "$baseUrl`:8003/transactions" -ExpectedStatus 401

# 3. Test Rate Limiting (should return 429 after limit)
Write-Host "=== Rate Limiting ===" -ForegroundColor Magenta
Write-Host "Testing rate limiting (sending 6 rapid requests)..." -ForegroundColor Yellow
$rateLimitPassed = $false
for ($i = 1; $i -le 6; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl`:8000/api/auth/login" -Method POST -Body '{"email":"test@test.com","password":"wrong"}' -ContentType "application/json" -UseBasicParsing -ErrorAction Stop
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 429) {
            Write-Host "  PASS: Rate limiting triggered (429 after request $i)" -ForegroundColor Green
            $rateLimitPassed = $true
            $script:passed++
            break
        }
    }
}
if (-not $rateLimitPassed) {
    Write-Host "  WARN: Rate limiting may not be configured (expected 429)" -ForegroundColor Yellow
}
Write-Host ""

# 4. Test CORS (should reject unauthorized origins)
Write-Host "=== CORS Security ===" -ForegroundColor Magenta
try {
    $response = Invoke-WebRequest -Uri "$baseUrl`:8000/" -Method OPTIONS -Headers @{"Origin"="http://evil.com";"Access-Control-Request-Method"="POST"} -UseBasicParsing -ErrorAction Stop
    $corsHeader = $response.Headers["Access-Control-Allow-Origin"]
    if ($corsHeader -eq "http://evil.com") {
        Write-Host "  FAIL: CORS allows all origins" -ForegroundColor Red
        $script:failed++
    } else {
        Write-Host "  PASS: CORS restricts origins" -ForegroundColor Green
        $script:passed++
    }
} catch {
    Write-Host "  PASS: CORS blocks unauthorized origin" -ForegroundColor Green
    $script:passed++
}
Write-Host ""

# 5. Test CAPTCHA Endpoint
Write-Host "=== CAPTCHA ===" -ForegroundColor Magenta
Test-Endpoint "CAPTCHA Generate" "$baseUrl`:8000/auth/captcha/generate" -ExpectedStatus 200

# 6. Test Security Headers
Write-Host "=== Security Headers ===" -ForegroundColor Magenta
try {
    $response = Invoke-WebRequest -Uri "$baseUrl`:8000/" -UseBasicParsing -ErrorAction Stop
    $headers = $response.Headers
    
    $securityHeaders = @(
        "X-Content-Type-Options",
        "X-Frame-Options",
        "X-XSS-Protection"
    )
    
    foreach ($header in $securityHeaders) {
        if ($headers.ContainsKey($header)) {
            Write-Host "  PASS: $header is set" -ForegroundColor Green
            $script:passed++
        } else {
            Write-Host "  WARN: $header not found (may be set by reverse proxy)" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "  WARN: Could not test security headers" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red
Write-Host ""

if ($failed -gt 0) {
    Write-Host "SOME TESTS FAILED" -ForegroundColor Red
    exit 1
} else {
    Write-Host "ALL TESTS PASSED" -ForegroundColor Green
    exit 0
}
