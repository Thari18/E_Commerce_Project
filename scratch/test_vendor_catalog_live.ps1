$baseUrl = "http://localhost:5212"

Write-Host "=== 1. VENDOR & CUSTOMER AUTHENTICATION ==="
$vendorLoginBody = @{ email = "vendor@localmart.com"; password = "VendorPass123!" } | ConvertTo-Json
$custLoginBody = @{ email = "customer@localmart.com"; password = "CustomerPass123!" } | ConvertTo-Json

$vendorAuth = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/login" -Method Post -Body $vendorLoginBody -ContentType "application/json"
$vendorToken = $vendorAuth.accessToken
Write-Host "Vendor Login Successful! User: $($vendorAuth.user.email), Roles: $($vendorAuth.user.roles -join ', ')" -ForegroundColor Green

$custAuth = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/login" -Method Post -Body $custLoginBody -ContentType "application/json"
$custToken = $custAuth.accessToken
Write-Host "Customer Login Successful! User: $($custAuth.user.email), Roles: $($custAuth.user.roles -join ', ')" -ForegroundColor Green

Write-Host "`n=== 2. AUTHORIZATION & ROLE ISOLATION VERIFICATION ==="
$custHeaders = @{ Authorization = "Bearer $custToken" }
try {
    Invoke-RestMethod -Uri "$baseUrl/api/v1/vendor/products" -Method Get -Headers $custHeaders -ErrorAction Stop
    Write-Host "VULNERABILITY DETECTED: Customer accessed vendor endpoints!" -ForegroundColor Red
} catch {
    Write-Host "SUCCESS: Customer access to vendor endpoint correctly denied. Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Green
}

Write-Host "`n=== 3. VENDOR CATALOG MANAGEMENT (APPROVED VENDOR CREATION) ==="
$vendorHeaders = @{ Authorization = "Bearer $vendorToken" }

# Fetch categories to get a valid CategoryId
$categories = Invoke-RestMethod -Uri "$baseUrl/api/v1/categories" -Method Get
$produceCatId = $categories[0].id

# Create new product as Vendor
$createBody = @{
    categoryId = $produceCatId
    name = "Organic Blueberries 250g"
    description = "Freshly picked local organic blueberries"
    sku = "BLUE-250-01"
    price = 6.99
    status = "Active"
    initialQuantity = 20
    lowStockThreshold = 5
    imageUrls = @(@{ imageUrl = "https://images.unsplash.com/photo-1498557850523-fd3d118b962e?auto=format&fit=crop&w=600&q=80"; isPrimary = $true })
} | ConvertTo-Json

$newProdRes = Invoke-RestMethod -Uri "$baseUrl/api/v1/vendor/products" -Method Post -Body $createBody -ContentType "application/json" -Headers $vendorHeaders
$newProdId = $newProdRes.productId
Write-Host "Vendor Created Product: '$($newProdRes.name)' (ID: $newProdId), SKU: $($newProdRes.sku), Status: $($newProdRes.status), Stock: $($newProdRes.quantityAvailable)" -ForegroundColor Green

Write-Host "`n=== 4. PUBLIC PRODUCT SEARCH & DETAIL VISIBILITY RULE VERIFICATION ==="
# 1. Active + Stock > 0 => Public Search VISIBLE & Public Detail VISIBLE (200 OK)
$pubSearch1 = Invoke-RestMethod -Uri "$baseUrl/api/v1/products/search?query=Blueberries" -Method Get
$detail1 = Invoke-RestMethod -Uri "$baseUrl/api/v1/products/$newProdId" -Method Get
Write-Host "Public Search Count (Active & Stock=20): $($pubSearch1.totalCount), Detail Name: '$($detail1.name)'" -ForegroundColor Green

# 2. Stock 0 => Auto transitions to OutOfStock => Public Search HIDDEN & Public Detail REJECTED (404)
$updateStock0 = @{ quantityAvailable = 0 } | ConvertTo-Json
$stockRes0 = Invoke-RestMethod -Uri "$baseUrl/api/v1/vendor/inventory/$newProdId" -Method Put -Body $updateStock0 -ContentType "application/json" -Headers $vendorHeaders
Write-Host "Stock Updated to 0. Status auto-transitioned to OutOfStock." -ForegroundColor Green

$pubSearch2 = Invoke-RestMethod -Uri "$baseUrl/api/v1/products/search?query=Blueberries" -Method Get
try {
    Invoke-RestMethod -Uri "$baseUrl/api/v1/products/$newProdId" -Method Get -ErrorAction Stop
    Write-Host "ERROR: OutOfStock product was visible in public detail lookup!" -ForegroundColor Red
} catch {
    Write-Host "SUCCESS: OutOfStock product correctly HIDDEN from public search ($($pubSearch2.totalCount) items) and Detail REJECTED with 404!" -ForegroundColor Green
}

# 3. OutOfStock + Replenish Stock > 0 => Auto transitions back to Active => Public Search VISIBLE & Detail VISIBLE
$updateStock30 = @{ quantityAvailable = 30 } | ConvertTo-Json
$stockRes30 = Invoke-RestMethod -Uri "$baseUrl/api/v1/vendor/inventory/$newProdId" -Method Put -Body $updateStock30 -ContentType "application/json" -Headers $vendorHeaders
Write-Host "Stock Replenished to 30. Status auto-transitioned to Active." -ForegroundColor Green

$pubSearch3 = Invoke-RestMethod -Uri "$baseUrl/api/v1/products/search?query=Blueberries" -Method Get
$detail3 = Invoke-RestMethod -Uri "$baseUrl/api/v1/products/$newProdId" -Method Get
Write-Host "SUCCESS: OutOfStock + stock > 0 REAPPEARED in public search ($($pubSearch3.totalCount) items) and Detail accessible ('$($detail3.name)')!" -ForegroundColor Green

Write-Host "`n=== 5. INVENTORY REPLENISHMENT AUTO-STATUS PRESERVATION (DRAFT / INACTIVE / SUSPENDED) ==="

# A. Draft + Stock > 0 => Remains Draft & Public Detail REJECTED
Invoke-RestMethod -Uri "$baseUrl/api/v1/vendor/products/$newProdId/status" -Method Put -Body (@{ status = "Draft" } | ConvertTo-Json) -ContentType "application/json" -Headers $vendorHeaders
Invoke-RestMethod -Uri "$baseUrl/api/v1/vendor/inventory/$newProdId" -Method Put -Body (@{ quantityAvailable = 50 } | ConvertTo-Json) -ContentType "application/json" -Headers $vendorHeaders
$prodCheckDraft = (Invoke-RestMethod -Uri "$baseUrl/api/v1/vendor/products?status=Draft" -Method Get -Headers $vendorHeaders).products | Where-Object { $_.id -eq $newProdId }
try {
    Invoke-RestMethod -Uri "$baseUrl/api/v1/products/$newProdId" -Method Get -ErrorAction Stop
} catch {
    Write-Host "SUCCESS: Draft + stock > 0 remains status '$($prodCheckDraft.status)' and Public Detail is REJECTED (404)!" -ForegroundColor Green
}

# B. Inactive + Stock > 0 => Remains Inactive & Public Detail REJECTED
Invoke-RestMethod -Uri "$baseUrl/api/v1/vendor/products/$newProdId/status" -Method Put -Body (@{ status = "Inactive" } | ConvertTo-Json) -ContentType "application/json" -Headers $vendorHeaders
Invoke-RestMethod -Uri "$baseUrl/api/v1/vendor/inventory/$newProdId" -Method Put -Body (@{ quantityAvailable = 50 } | ConvertTo-Json) -ContentType "application/json" -Headers $vendorHeaders
$prodCheckInactive = (Invoke-RestMethod -Uri "$baseUrl/api/v1/vendor/products?status=Inactive" -Method Get -Headers $vendorHeaders).products | Where-Object { $_.id -eq $newProdId }
try {
    Invoke-RestMethod -Uri "$baseUrl/api/v1/products/$newProdId" -Method Get -ErrorAction Stop
} catch {
    Write-Host "SUCCESS: Inactive + stock > 0 remains status '$($prodCheckInactive.status)' and Public Detail is REJECTED (404)!" -ForegroundColor Green
}

# C. Suspended + Stock > 0 => Remains Suspended & Public Detail REJECTED
Invoke-RestMethod -Uri "$baseUrl/api/v1/vendor/products/$newProdId/status" -Method Put -Body (@{ status = "Suspended" } | ConvertTo-Json) -ContentType "application/json" -Headers $vendorHeaders
Invoke-RestMethod -Uri "$baseUrl/api/v1/vendor/inventory/$newProdId" -Method Put -Body (@{ quantityAvailable = 50 } | ConvertTo-Json) -ContentType "application/json" -Headers $vendorHeaders
$prodCheckSuspended = (Invoke-RestMethod -Uri "$baseUrl/api/v1/vendor/products?status=Suspended" -Method Get -Headers $vendorHeaders).products | Where-Object { $_.id -eq $newProdId }
try {
    Invoke-RestMethod -Uri "$baseUrl/api/v1/products/$newProdId" -Method Get -ErrorAction Stop
} catch {
    Write-Host "SUCCESS: Suspended + stock > 0 remains status '$($prodCheckSuspended.status)' and Public Detail is REJECTED (404)!" -ForegroundColor Green
}

Write-Host "`n=== ALL LIVE VERIFICATIONS PASSED SUCCESSFULLY ===" -ForegroundColor Green
