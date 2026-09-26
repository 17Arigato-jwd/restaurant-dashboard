#!/bin/bash
# Remove the old get_delivery_tracking function
sed -i '/async fn get_delivery_tracking/,+15d' backend/src/main.rs

# Append the new time-based animated version
cat << 'INNER_EOF' >> backend/src/main.rs

async fn get_delivery_tracking() -> impl IntoResponse {
    let route = vec![
        [12.9360, 77.6230], // Random Biker Start
        [12.9350, 77.6250],
        [12.9345, 77.6265], // Restaurant
        [12.9330, 77.6266],
        [12.9312, 77.6268],
        [12.9290, 77.6270],
        [12.9279, 77.6271], // Customer Home
    ];

    // Calculate position based on current time (looping every 30 seconds)
    let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs();
    let cycle_duration = 30; // 30 seconds to complete the route
    let progress = (now % cycle_duration) as f64 / cycle_duration as f64;
    
    let total_segments = (route.len() - 1) as f64;
    let current_segment_f = progress * total_segments;
    let current_segment = current_segment_f.floor() as usize;
    let segment_progress = current_segment_f - current_segment_f.floor();

    let p1 = route[current_segment];
    let p2 = route[current_segment + 1];
    
    let current_lat = p1[0] + (p2[0] - p1[0]) * segment_progress;
    let current_lng = p1[1] + (p2[1] - p1[1]) * segment_progress;

    let response = TrackingData {
        restaurant: route[2],
        customer: *route.last().unwrap(),
        driver: [current_lat, current_lng],
        route,
    };
    (StatusCode::OK, Json(response)).into_response()
}
INNER_EOF
