use axum::{
    routing::{get, post},
    Router, Json, extract::State, http::StatusCode, response::IntoResponse,
};
use serde::{Deserialize, Serialize};
use sqlx::{sqlite::SqlitePoolOptions, SqlitePool, FromRow};
use jsonwebtoken::{encode, Header, EncodingKey};
use bcrypt::{hash, verify, DEFAULT_COST};
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;
use chrono::{Utc, Duration};
use uuid::Uuid;

const JWT_SECRET: &str = "super_secret_key_change_in_production";

#[derive(Clone)]
struct AppState {
    db: SqlitePool,
}

#[derive(Serialize, FromRow)]
struct User {
    id: String,
    email: String,
    password_hash: String,
    role: String,
    created_at: String,
}

#[derive(Deserialize)]
struct RegisterRequest {
    email: String,
    password: String,
}

#[derive(Deserialize)]
struct LoginRequest {
    email: String,
    password: String,
}

#[derive(Serialize)]
struct AuthResponse {
    token: String,
    role: String,
}

#[derive(Serialize, Deserialize)]
struct Claims {
    sub: String,
    role: String,
    exp: usize,
}

#[tokio::main]
async fn main() {
    let db_url = "sqlite://restaurant.db?mode=rwc";
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(db_url)
        .await
        .expect("Failed to connect to SQLite");

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL,
            created_at TEXT NOT NULL
        )"
    )
    .execute(&pool)
    .await
    .unwrap();

    let state = AppState { db: pool };

    let cors = CorsLayer::permissive();

    let app = Router::new()
        .route("/api/health", get(|| async { "OK" }))
        .route("/api/auth/register", post(register))
        .route("/api/auth/login", post(login))
        .route("/api/whatsapp/send-bill", post(send_whatsapp_bill))
        .route("/api/delivery/tracking", get(get_delivery_tracking))
        .with_state(state)
        .layer(cors);

    let addr = SocketAddr::from(([0, 0, 0, 0], 8000));
    println!("Rust backend listening on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

#[derive(Deserialize)]
struct WhatsAppBillRequest {
    tableId: String,
    phone: String,
    billTotal: String,
    invoiceNo: String,
}

#[derive(Serialize)]
struct WhatsAppResponse {
    ok: bool,
    messageId: String,
}

async fn send_whatsapp_bill(
    Json(payload): Json<WhatsAppBillRequest>,
) -> impl IntoResponse {
    println!("Simulating WhatsApp bill send to {} for table {}", payload.phone, payload.tableId);
    
    // In a real scenario, we would make a reqwest HTTP POST to Meta's Graph API here:
    // https://graph.facebook.com/v19.0/.../messages
    // with the template name 'digital_bill_receipt' as specified in the PDF blueprint.
    
    // For now, return a mocked success response
    let response = WhatsAppResponse {
        ok: true,
        messageId: format!("wamid.mock.{}", Uuid::new_v4().to_string().replace("-", "").chars().take(10).collect::<String>()),
    };

    (StatusCode::OK, Json(response)).into_response()
}

async fn register(
    State(state): State<AppState>,
    Json(payload): Json<RegisterRequest>,
) -> impl IntoResponse {
    let hashed = hash(&payload.password, DEFAULT_COST).unwrap();
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    let role = "owner";

    let result = sqlx::query(
        "INSERT INTO users (id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(&payload.email)
    .bind(&hashed)
    .bind(role)
    .bind(&now)
    .execute(&state.db)
    .await;

    match result {
        Ok(_) => (StatusCode::CREATED, "User created successfully").into_response(),
        Err(_) => (StatusCode::BAD_REQUEST, "User already exists").into_response(),
    }
}

async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> impl IntoResponse {
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE email = ?")
        .bind(&payload.email)
        .fetch_optional(&state.db)
        .await
        .unwrap();

    if let Some(user) = user {
        if verify(&payload.password, &user.password_hash).unwrap_or(false) {
            let expiration = Utc::now()
                .checked_add_signed(Duration::hours(24))
                .expect("valid timestamp")
                .timestamp() as usize;

            let claims = Claims {
                sub: user.id,
                role: user.role.clone(),
                exp: expiration,
            };

            let token = encode(
                &Header::default(),
                &claims,
                &EncodingKey::from_secret(JWT_SECRET.as_ref()),
            ).unwrap();

            return (StatusCode::OK, Json(AuthResponse { token, role: user.role })).into_response();
        }
    }

    (StatusCode::UNAUTHORIZED, "Invalid credentials").into_response()
}

#[derive(Serialize)]
struct FleetTrackingData {
    restaurant: [f64; 2],
    deliveries: Vec<DeliveryData>,
}

#[derive(Serialize)]
struct DeliveryData {
    id: String,
    customer: [f64; 2],
    driver: [f64; 2],
    route: Vec<[f64; 2]>,
}

async fn get_delivery_tracking() -> impl IntoResponse {
    let restaurant_loc = [12.9345, 77.6265];
    
    // We will define 5 routes. 1 old, 4 new (far and near).
    let routes = vec![
        // 1. Original (Near, South East)
        vec![
            [12.9360, 77.6230], // Start
            restaurant_loc,
            [12.9330, 77.6266],
            [12.9312, 77.6268],
            [12.9290, 77.6270],
            [12.9279, 77.6271], // Customer
        ],
        // 2. Near, North West (Indiranagar direction)
        vec![
            [12.9320, 77.6290],
            restaurant_loc,
            [12.9360, 77.6250],
            [12.9390, 77.6220],
            [12.9420, 77.6190],
        ],
        // 3. Far, HSR Layout direction (South)
        vec![
            [12.9380, 77.6280],
            restaurant_loc,
            [12.9250, 77.6300],
            [12.9150, 77.6350],
            [12.9080, 77.6390],
        ],
        // 4. Far, BTM Layout direction (West)
        vec![
            [12.9310, 77.6240],
            restaurant_loc,
            [12.9320, 77.6200],
            [12.9250, 77.6150],
            [12.9200, 77.6100],
            [12.9160, 77.6050],
        ],
        // 5. Very Near (Just a couple streets away)
        vec![
            [12.9355, 77.6270],
            restaurant_loc,
            [12.9350, 77.6285],
            [12.9365, 77.6295],
        ]
    ];

    let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs();
    
    let mut deliveries = Vec::new();
    
    for (i, route) in routes.iter().enumerate() {
        // Offset the cycle duration and progress slightly for each driver so they aren't synchronized
        let cycle_duration = 20 + (i as u64 * 5); 
        let progress = ((now + (i as u64 * 13)) % cycle_duration) as f64 / cycle_duration as f64;
        
        let total_segments = (route.len() - 1) as f64;
        let current_segment_f = progress * total_segments;
        let current_segment = current_segment_f.floor() as usize;
        let segment_progress = current_segment_f - current_segment_f.floor();

        let p1 = route[current_segment];
        let p2 = route[current_segment + 1];
        
        let current_lat = p1[0] + (p2[0] - p1[0]) * segment_progress;
        let current_lng = p1[1] + (p2[1] - p1[1]) * segment_progress;
        
        deliveries.push(DeliveryData {
            id: format!("driver-{}", i),
            customer: *route.last().unwrap(),
            driver: [current_lat, current_lng],
            route: route.clone(),
        });
    }

    let response = FleetTrackingData {
        restaurant: restaurant_loc,
        deliveries,
    };
    
    (StatusCode::OK, Json(response)).into_response()
}
