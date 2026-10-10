<#
.SYNOPSIS
    Seeds demo data (tables, orders, fleet, analytics) into the Easy Restaurant
    backend through its webhook endpoints.

.DESCRIPTION
    The backend must be running first. Provide either the target restaurant id
    directly, or an account's email/password so it can be discovered by login.

.EXAMPLE
    ./test_live_api.ps1 -Email owner@test.com -Password secret

.EXAMPLE
    ./test_live_api.ps1 -RestaurantId res_22ed49f41871423ba518e21578f7ce75
#>
param(
    [string]$BaseUrl = "http://127.0.0.1:8000",
    [string]$RestaurantId = "",
    [string]$Email = "",
    [string]$Password = ""
)

$ErrorActionPreference = "Stop"

# 1. Fail fast (and clearly) when the backend is not running.
try {
    Invoke-RestMethod -Uri "$BaseUrl/api/health" -Method Get -TimeoutSec 5 | Out-Null
}
catch {
    Write-Host "Cannot reach the backend at $BaseUrl." -ForegroundColor Red
    Write-Host "Start it first in another terminal:  cd backend; cargo run" -ForegroundColor Yellow
    exit 1
}

# 2. Resolve the restaurant id (from a login when credentials are supplied).
if (-not $RestaurantId) {
    if (-not ($Email -and $Password)) {
        Write-Host "No target restaurant given. Pass -Email and -Password, or -RestaurantId." -ForegroundColor Red
        Write-Host ""
        Write-Host "Examples:" -ForegroundColor Yellow
        Write-Host "  ./test_live_api.ps1 -Email you@example.com -Password yourpassword"
        Write-Host "  ./test_live_api.ps1 -RestaurantId res_xxxxxxxx"
        Write-Host ""
        Write-Host "Note: registering in the web app already seeds tables T-01..T-08." -ForegroundColor DarkGray
        Write-Host "This script only adds extra demo data (fleet drivers + analytics)." -ForegroundColor DarkGray
        exit 1
    }
    $login = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method Post -TimeoutSec 10 `
        -ContentType "application/json" `
        -Body (@{ email = $Email; password = $Password } | ConvertTo-Json)
    $RestaurantId = $login.user.restaurantId
}
Write-Host "Seeding restaurant $RestaurantId" -ForegroundColor Cyan

function Send-JsonPost {
    param([string]$Endpoint, [hashtable]$Body)
    try {
        Invoke-RestMethod -Uri "$BaseUrl/api/webhooks/$Endpoint" -Method Post -TimeoutSec 10 `
            -Body ($Body | ConvertTo-Json) -ContentType "application/json" | Out-Null
        Write-Host "  POST $Endpoint -> OK" -ForegroundColor Green
    }
    catch {
        Write-Host "  POST $Endpoint -> FAILED: $($_.Exception.Message)" -ForegroundColor Red
        throw
    }
}

# Ids are prefixed with the restaurant id so re-running never collides with the
# tables/orders of a different outlet.
$t1 = "$RestaurantId-T1"
$t2 = "$RestaurantId-T2"
$t3 = "$RestaurantId-T3"

Write-Host "1. Initializing tables..."
Send-JsonPost -Endpoint "tables" -Body @{ restaurant_id = $RestaurantId; id = $t1; name = "T-01"; capacity = 2; state = "available" }
Send-JsonPost -Endpoint "tables" -Body @{ restaurant_id = $RestaurantId; id = $t2; name = "T-02"; capacity = 2; state = "seated"; waiter = "Rahul" }
Send-JsonPost -Endpoint "tables" -Body @{ restaurant_id = $RestaurantId; id = $t3; name = "T-03"; capacity = 4; state = "ordered"; waiter = "Amit" }

Write-Host "2. Adding orders to T-03..."
Send-JsonPost -Endpoint "orders" -Body @{ id = "$RestaurantId-O1"; table_id = $t3; name = "Butter Chicken"; price = 340; qty = 1 }
Send-JsonPost -Endpoint "orders" -Body @{ id = "$RestaurantId-O2"; table_id = $t3; name = "Garlic Naan"; price = 60; qty = 3 }

Write-Host "3. Simulating live fleet drivers..."
Send-JsonPost -Endpoint "fleet" -Body @{ driver_id = "$RestaurantId-driver-1"; restaurant_id = $RestaurantId; driver_lat = 12.9355; driver_lng = 77.6250; status = "out_for_delivery"; customer_lat = 12.9360; customer_lng = 77.6230 }
Send-JsonPost -Endpoint "fleet" -Body @{ driver_id = "$RestaurantId-driver-2"; restaurant_id = $RestaurantId; driver_lat = 12.9300; driver_lng = 77.6210; status = "out_for_delivery"; customer_lat = 12.9320; customer_lng = 77.6290 }

Write-Host "4. Pushing customer analytics..."
Send-JsonPost -Endpoint "analytics" -Body @{ date = (Get-Date).AddDays(-2).ToString("yyyy-MM-dd"); restaurant_id = $RestaurantId; dine_in_count = 150; delivery_count = 200 }
Send-JsonPost -Endpoint "analytics" -Body @{ date = (Get-Date).AddDays(-1).ToString("yyyy-MM-dd"); restaurant_id = $RestaurantId; dine_in_count = 180; delivery_count = 220 }
Send-JsonPost -Endpoint "analytics" -Body @{ date = (Get-Date).ToString("yyyy-MM-dd"); restaurant_id = $RestaurantId; dine_in_count = 210; delivery_count = 250 }

Write-Host "Done. Open the Dashboard, Tables and Delivery map to see the live data." -ForegroundColor Cyan
