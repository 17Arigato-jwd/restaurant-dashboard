$baseUrl = "http://127.0.0.1:8000/api/webhooks"
# IMPORTANT: Update $restaurantId to match your actual restaurant ID from the DB
# (You can find this in the 'restaurants' table in SQLite)
$restaurantId = "res_22ed49f41871423ba518e21578f7ce75"

function Send-JsonPost {
    param([string]$endpoint, [hashtable]$body)
    $json = $body | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/$endpoint" -Method Post -Body $json -ContentType "application/json" | Out-Null
    Write-Host "POST $endpoint -> Success"
}

Write-Host "--- Initiating Live API Simulation ---"

Write-Host "1. Initializing Tables..."
Send-JsonPost -endpoint "tables" -body @{ restaurant_id = $restaurantId; id = "T1"; name = "T-01"; capacity = 2; state = "available" }
Send-JsonPost -endpoint "tables" -body @{ restaurant_id = $restaurantId; id = "T2"; name = "T-02"; capacity = 2; state = "seated"; waiter = "Rahul" }
Send-JsonPost -endpoint "tables" -body @{ restaurant_id = $restaurantId; id = "T3"; name = "T-03"; capacity = 4; state = "ordered"; waiter = "Amit" }

Write-Host "2. Adding Orders to T3..."
Send-JsonPost -endpoint "orders" -body @{ id = "O1"; table_id = "T3"; name = "Butter Chicken"; price = 340; qty = 1 }
Send-JsonPost -endpoint "orders" -body @{ id = "O2"; table_id = "T3"; name = "Garlic Naan"; price = 60; qty = 3 }

Write-Host "3. Simulating Live Fleet Driver Coordinates..."
Send-JsonPost -endpoint "fleet" -body @{
    driver_id = "driver-1"
    restaurant_id = $restaurantId
    driver_lat = 12.9355
    driver_lng = 77.6250
    status = "out_for_delivery"
    customer_lat = 12.9360
    customer_lng = 77.6230
}
Send-JsonPost -endpoint "fleet" -body @{
    driver_id = "driver-2"
    restaurant_id = $restaurantId
    driver_lat = 12.9300
    driver_lng = 77.6210
    status = "out_for_delivery"
    customer_lat = 12.9320
    customer_lng = 77.6290
}

Write-Host "4. Pushing Customer Analytics for Charts..."
Send-JsonPost -endpoint "analytics" -body @{ date = (Get-Date).AddDays(-2).ToString("yyyy-MM-dd"); restaurant_id = $restaurantId; dine_in_count = 150; delivery_count = 200 }
Send-JsonPost -endpoint "analytics" -body @{ date = (Get-Date).AddDays(-1).ToString("yyyy-MM-dd"); restaurant_id = $restaurantId; dine_in_count = 180; delivery_count = 220 }
Send-JsonPost -endpoint "analytics" -body @{ date = (Get-Date).ToString("yyyy-MM-dd"); restaurant_id = $restaurantId; dine_in_count = 210; delivery_count = 250 }

Write-Host "Done! Check the dashboard to see live updates."
