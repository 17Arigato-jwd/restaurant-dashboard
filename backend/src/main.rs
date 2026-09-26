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
