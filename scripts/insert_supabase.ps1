$url = "https://bxdfmlqzstwcsujdgejn.supabase.co/rest/v1/institutions"
$key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4ZGZtbHF6c3R3Y3N1amRnZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTY5NDI1NSwiZXhwIjoyMDk3MjcwMjU1fQ.fjEetR8U5JIz3YuFpz6m7TJK6gifRGhHiJxd7A8d1dM"

$headers = @{
    "apikey" = $key
    "Authorization" = "Bearer $key"
    "Content-Type" = "application/json"
    "Prefer" = "resolution=merge-duplicates,return=representation"
}

$body = @(
    @{
        id = "11111111-1111-1111-1111-111111111111"
        name = "Harvard University"
        type = "university"
        address = "Cambridge"
        city = "Cambridge"
        state = "MA"
        phone = "+1-617-495-1000"
        email = "admin@harvard.edu"
        plan_tier = "Enterprise"
        is_active = $true
    },
    @{
        id = "22222222-2222-2222-2222-222222222222"
        name = "MIT"
        type = "university"
        address = "77 Massachusetts Ave"
        city = "Cambridge"
        state = "MA"
        phone = "+1-617-253-1000"
        email = "admin@mit.edu"
        plan_tier = "Campus"
        is_active = $true
    },
    @{
        id = "33333333-3333-3333-3333-333333333333"
        name = "Stanford University"
        type = "university"
        address = "450 Serra Mall"
        city = "Stanford"
        state = "CA"
        phone = "+1-650-723-2300"
        email = "admin@stanford.edu"
        plan_tier = "Enterprise"
        is_active = $true
    }
) | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body
    Write-Output "Successfully inserted institutions."
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Error $_.Exception.Message
}
