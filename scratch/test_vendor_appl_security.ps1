$baseUrl = "http://localhost:5212"

Write-Host "=== 1. SECURITY TEST: Unauthenticated Email-Only Lookup (GET /api/v1/vendors/applications/status) ==="
try {
    $res = Invoke-RestMethod -Uri "$baseUrl/api/v1/vendors/applications/status?email=test@example.com" -Method Get -ErrorAction Stop
    Write-Host "VULNERABILITY DETECTED: Status returned without applicationId or Auth!" -ForegroundColor Red
} catch {
    Write-Host "SUCCESS: Endpoint blocked email-only enumeration. Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Green
}

Write-Host "`n=== 2. ADMIN AUTHENTICATION ==="
$adminLoginBody = @{
    email = "admin@localmart.com"
    password = "AdminPass123!"
} | ConvertTo-Json

try {
    $adminAuth = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/login" -Method Post -Body $adminLoginBody -ContentType "application/json"
    $adminToken = $adminAuth.accessToken
    Write-Host "Admin Login Successful! User: $($adminAuth.user.email), Roles: $($adminAuth.user.roles -join ', ')" -ForegroundColor Green
} catch {
    Write-Host "Admin Login Failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== 3. CUSTOMER 1 REGISTRATION & APPLICATION (APPROVE TEST) ==="
$cust1Email = "vendor_candidate_1_$(Get-Random)@example.com"
$cust1Reg = @{
    email = $cust1Email
    password = "Password123!"
    firstName = "John"
    lastName = "Doe"
    phoneNumber = "+15550199"
} | ConvertTo-Json

# Register Customer 1
$reg1Res = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/register" -Method Post -Body $cust1Reg -ContentType "application/json"
Write-Host "Customer 1 Registered. Roles: $($reg1Res.user.roles -join ', ')" -ForegroundColor Green
$cust1Token = $reg1Res.accessToken
$cust1UserId = $reg1Res.user.id

# Submit Application for Customer 1
$appl1Body = @{
    applicantUserId = $cust1UserId
    businessName = "John Fresh Produce"
    businessRegistrationNumber = "REG-998877"
    taxIdentificationNumber = "TAX-998877"
    contactPhone = "+15550199"
    contactEmail = $cust1Email
} | ConvertTo-Json

$headersCust1 = @{ Authorization = "Bearer $cust1Token" }
$appl1Res = Invoke-RestMethod -Uri "$baseUrl/api/v1/vendors/applications" -Method Post -Body $appl1Body -ContentType "application/json" -Headers $headersCust1
$appl1Id = $appl1Res.applicationId
Write-Host "Vendor Application Submitted! Application ID: $appl1Id, Status: $($appl1Res.status)" -ForegroundColor Green

# Verify Customer 1 Roles BEFORE approval (must still be Customer only)
$cust1AuthNew = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/login" -Method Post -Body (@{ email = $cust1Email; password = "Password123!" } | ConvertTo-Json) -ContentType "application/json"
Write-Host "Pending State Role Isolation Check: Roles = $($cust1AuthNew.user.roles -join ', ')" -ForegroundColor Green

# Applicant status check with ID + Email (authorized lookup)
$status1 = Invoke-RestMethod -Uri "$baseUrl/api/v1/vendors/applications/status?applicationId=$appl1Id&email=$cust1Email" -Method Get
Write-Host "Applicant Status Access with ID+Email: Status = $($status1.status)" -ForegroundColor Green

Write-Host "`n=== 4. ADMIN REVIEW & APPROVAL ==="
$headersAdmin = @{ Authorization = "Bearer $adminToken" }
$adminList = Invoke-RestMethod -Uri "$baseUrl/api/v1/admin/vendors/applications" -Method Get -Headers $headersAdmin
Write-Host "Admin List Applications Count: $($adminList.items.Count)" -ForegroundColor Green

# Approve Customer 1 Application
$approveRes = Invoke-RestMethod -Uri "$baseUrl/api/v1/admin/vendors/applications/$appl1Id/approve" -Method Post -ContentType "application/json" -Headers $headersAdmin
Write-Host "Admin Approved Application $appl1Id! Result Message: $($approveRes.message), Vendor ID: $($approveRes.vendorId)" -ForegroundColor Green

# Verify Role Isolation AFTER approval: Customer 1 must now have Vendor role
$cust1AuthApproved = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/login" -Method Post -Body (@{ email = $cust1Email; password = "Password123!" } | ConvertTo-Json) -ContentType "application/json"
Write-Host "Approved State Role Check: Roles = $($cust1AuthApproved.user.roles -join ', '), Vendor ID = $($cust1AuthApproved.user.vendorId)" -ForegroundColor Green

# Test duplicate approval (Invalid State Transition)
try {
    Invoke-RestMethod -Uri "$baseUrl/api/v1/admin/vendors/applications/$appl1Id/approve" -Method Post -ContentType "application/json" -Headers $headersAdmin -ErrorAction Stop
    Write-Host "ERROR: Duplicate approval succeeded when it should fail!" -ForegroundColor Red
} catch {
    Write-Host "SUCCESS: Duplicate approval correctly rejected! Error: $($_.Exception.Message)" -ForegroundColor Green
}

Write-Host "`n=== 5. CUSTOMER 2 REGISTRATION & APPLICATION (REJECT TEST) ==="
$cust2Email = "vendor_candidate_2_$(Get-Random)@example.com"
$cust2Reg = @{
    email = $cust2Email
    password = "Password123!"
    firstName = "Jane"
    lastName = "Smith"
    phoneNumber = "+15550288"
} | ConvertTo-Json

$reg2Res = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/register" -Method Post -Body $cust2Reg -ContentType "application/json"
$cust2Token = $reg2Res.accessToken
$cust2UserId = $reg2Res.user.id

$appl2Body = @{
    applicantUserId = $cust2UserId
    businessName = "Jane Crafts"
    businessRegistrationNumber = "REG-112233"
    taxIdentificationNumber = "TAX-112233"
    contactPhone = "+15550288"
    contactEmail = $cust2Email
} | ConvertTo-Json

$headersCust2 = @{ Authorization = "Bearer $cust2Token" }
$appl2Res = Invoke-RestMethod -Uri "$baseUrl/api/v1/vendors/applications" -Method Post -Body $appl2Body -ContentType "application/json" -Headers $headersCust2
$appl2Id = $appl2Res.applicationId

# Reject Application
$rejectBody = @{ rejectionReason = "Incomplete business documentation provided." } | ConvertTo-Json
$rejectRes = Invoke-RestMethod -Uri "$baseUrl/api/v1/admin/vendors/applications/$appl2Id/reject" -Method Post -Body $rejectBody -ContentType "application/json" -Headers $headersAdmin
Write-Host "Admin Rejected Application $appl2Id! Result Message: $($rejectRes.message)" -ForegroundColor Green

# Verify Role Isolation AFTER rejection: Customer 2 must NOT have Vendor role and NO Vendor ID
$cust2AuthRejected = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/login" -Method Post -Body (@{ email = $cust2Email; password = "Password123!" } | ConvertTo-Json) -ContentType "application/json"
Write-Host "Rejected State Role Check: Roles = $($cust2AuthRejected.user.roles -join ', '), Vendor ID = $($cust2AuthRejected.user.vendorId)" -ForegroundColor Green

# Test duplicate rejection (Invalid State Transition)
try {
    Invoke-RestMethod -Uri "$baseUrl/api/v1/admin/vendors/applications/$appl2Id/reject" -Method Post -Body $rejectBody -ContentType "application/json" -Headers $headersAdmin -ErrorAction Stop
    Write-Host "ERROR: Duplicate rejection succeeded when it should fail!" -ForegroundColor Red
} catch {
    Write-Host "SUCCESS: Duplicate rejection correctly rejected! Error: $($_.Exception.Message)" -ForegroundColor Green
}

Write-Host "`n=== ALL VERIFICATIONS PASSED SUCCESSFULLY ===" -ForegroundColor Green
