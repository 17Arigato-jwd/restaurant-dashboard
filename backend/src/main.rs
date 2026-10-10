use std::net::SocketAddr;

use axum::{
    extract::{Path, State},
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
    routing::{get, post, put},
    Json, Router,
};
use bcrypt::{hash, verify, DEFAULT_COST};
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sqlx::sqlite::{SqlitePool, SqlitePoolOptions};
use sqlx::FromRow;
use tower_http::cors::CorsLayer;
use uuid::Uuid;

/// Secret used to sign JWTs. Override with the `JWT_SECRET` env var in production.
const JWT_SECRET: &str = "easy-restaurant-dev-secret-change-me";
/// Hardcoded OTP used by the forgot-password flow.
const HARDCODED_OTP: &str = "123456";

#[derive(Clone)]
struct AppState {
    db: SqlitePool,
}

// ---------------------------------------------------------------- Database models

#[derive(FromRow)]
struct DbUser {
    id: String,
    email: String,
    password_hash: String,
    name: String,
    role_id: String,
    team_id: Option<String>,
    restaurant_id: String,
    avatar_url: Option<String>,
    status: String,
    must_change_password: i64,
    created_at: String,
    dish_specialty: Option<String>,
    weekly_schedule: Option<String>,
    leave_status: Option<String>,
}

#[derive(FromRow)]
struct RoleRow {
    id: String,
    name: String,
    level: i32,
    can_edit_levels_above: i32,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct RoleResponse {
    id: String,
    name: String,
    level: i32,
    can_edit_levels_above: i32,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct UserResponse {
    id: String,
    email: String,
    name: String,
    role_id: String,
    team_id: Option<String>,
    restaurant_id: String,
    avatar_url: Option<String>,
    status: String,
    must_change_password: bool,
    created_at: String,
    role: Option<RoleResponse>,
    dish_specialty: Option<String>,
    weekly_schedule: Option<String>,
    leave_status: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct TeamResponse {
    id: String,
    restaurant_id: String,
    name: String,
    description: Option<String>,
    owner_id: String,
    created_at: String,
    member_count: i64,
}

#[derive(Serialize, Deserialize, Clone)]
struct Claims {
    sub: String,
    role: String,
    team_id: Option<String>,
    restaurant_id: String,
    exp: usize,
}

// ---------------------------------------------------------------- Request bodies

#[derive(Deserialize)]
struct AuthRequest {
    email: String,
    password: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct OtpRequest {
    email: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ResetPasswordRequest {
    email: String,
    otp: String,
    new_password: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ChangePasswordRequest {
    current_password: Option<String>,
    new_password: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct UserCreateRequest {
    name: String,
    email: String,
    role_id: String,
    team_id: Option<String>,
    restaurant_id: Option<String>,
    password: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct UserUpdateRequest {
    name: Option<String>,
    email: Option<String>,
    role_id: Option<String>,
    team_id: Option<String>,
    avatar_url: Option<String>,
    status: Option<String>,
    dish_specialty: Option<String>,
    weekly_schedule: Option<String>,
    leave_status: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct TeamCreateRequest {
    name: String,
    description: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct TeamUpdateRequest {
    name: Option<String>,
    description: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct RoleCreateRequest {
    name: String,
    level: i32,
    can_edit_levels_above: Option<i32>,
}

// ---------------------------------------------------------------- Helpers

fn sanitize_email(email: &str) -> String {
    email.trim().to_ascii_lowercase()
}

fn bearer_token(headers: &HeaderMap) -> Option<String> {
    let raw = headers.get("authorization")?.to_str().ok()?;
    raw.strip_prefix("Bearer ")
        .map(|token| token.trim().to_string())
}

fn claims_from(headers: &HeaderMap) -> Option<Claims> {
    let token = bearer_token(headers)?;
    decode::<Claims>(
        &token,
        &DecodingKey::from_secret(JWT_SECRET.as_ref()),
        &Validation::default(),
    )
    .ok()
    .map(|data| data.claims)
}

async fn role_level(pool: &SqlitePool, role_id: &str) -> i32 {
    sqlx::query_scalar::<_, i32>("SELECT level FROM roles WHERE id = ?")
        .bind(role_id)
        .fetch_optional(pool)
        .await
        .ok()
        .flatten()
        .unwrap_or(999)
}

async fn role_by_id(pool: &SqlitePool, role_id: &str) -> Option<RoleResponse> {
    sqlx::query_as::<_, RoleRow>(
        "SELECT id, name, level, can_edit_levels_above FROM roles WHERE id = ?",
    )
    .bind(role_id)
    .fetch_optional(pool)
    .await
    .ok()
    .flatten()
    .map(|r| RoleResponse {
        id: r.id,
        name: r.name,
        level: r.level,
        can_edit_levels_above: r.can_edit_levels_above,
    })
}

async fn to_user_response(pool: &SqlitePool, user: &DbUser) -> UserResponse {
    UserResponse {
        id: user.id.clone(),
        email: user.email.clone(),
        name: user.name.clone(),
        role_id: user.role_id.clone(),
        team_id: user.team_id.clone(),
        restaurant_id: user.restaurant_id.clone(),
        avatar_url: user.avatar_url.clone(),
        status: user.status.clone(),
        must_change_password: user.must_change_password != 0,
        created_at: user.created_at.clone(),
        role: role_by_id(pool, &user.role_id).await,
        dish_specialty: user.dish_specialty.clone(),
        weekly_schedule: user.weekly_schedule.clone(),
        leave_status: user.leave_status.clone(),
    }
}

/// True when `caller` may modify the account `target_id`: always for themselves,
/// otherwise only for accounts whose role is strictly less privileged.
async fn can_modify(pool: &SqlitePool, caller: &Claims, target_id: &str) -> bool {
    if caller.sub == target_id {
        return true;
    }
    let target_role: Option<String> = sqlx::query_scalar("SELECT role_id FROM users WHERE id = ?")
        .bind(target_id)
        .fetch_optional(pool)
        .await
        .ok()
        .flatten();

    match target_role {
        Some(target_role) => {
            let caller_level = role_level(pool, &caller.role).await;
            let target_level = role_level(pool, &target_role).await;
            caller_level < target_level
        }
        None => false,
    }
}

fn generate_temp_password() -> String {
    let raw = Uuid::new_v4().simple().to_string();
    format!("Temp@{}", &raw[..6])
}

fn unauthorized() -> axum::response::Response {
    (
        StatusCode::UNAUTHORIZED,
        Json(json!({ "error": "Authentication required" })),
    )
        .into_response()
}

fn forbidden(message: &str) -> axum::response::Response {
    (StatusCode::FORBIDDEN, Json(json!({ "error": message }))).into_response()
}

// ---------------------------------------------------------------- Entry point

#[tokio::main]
async fn main() {
    let _ = dotenvy::dotenv();

    let db_url = "sqlite://restaurant.db?mode=rwc";
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(db_url)
        .await
        .expect("Failed to connect to SQLite");

    // ---- Multi-tenancy schema: Restaurants -> Teams -> Users ------------------
    let queries = vec![
        "PRAGMA foreign_keys = ON;",
        "CREATE TABLE IF NOT EXISTS restaurants (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            created_at TEXT NOT NULL
        );",
        "CREATE TABLE IF NOT EXISTS teams (
            id TEXT PRIMARY KEY,
            restaurant_id TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            owner_id TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL,
            FOREIGN KEY(restaurant_id) REFERENCES restaurants(id)
        );",
        "CREATE TABLE IF NOT EXISTS roles (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            level INTEGER NOT NULL,
            can_edit_levels_above INTEGER NOT NULL DEFAULT 999
        );",
        "CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            role_id TEXT NOT NULL,
            team_id TEXT,
            restaurant_id TEXT NOT NULL,
            avatar_url TEXT,
            status TEXT NOT NULL DEFAULT 'active',
            must_change_password INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            FOREIGN KEY(role_id) REFERENCES roles(id),
            FOREIGN KEY(team_id) REFERENCES teams(id),
            FOREIGN KEY(restaurant_id) REFERENCES restaurants(id)
        );",
        "CREATE TABLE IF NOT EXISTS restaurant_settings (
            restaurant_id TEXT PRIMARY KEY,
            data TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );",
        "CREATE TABLE IF NOT EXISTS tables (
            id TEXT PRIMARY KEY,
            restaurant_id TEXT NOT NULL,
            name TEXT NOT NULL,
            capacity INTEGER NOT NULL,
            state TEXT NOT NULL,
            waiter TEXT,
            seated_at INTEGER,
            FOREIGN KEY(restaurant_id) REFERENCES restaurants(id)
        );",
        "CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            table_id TEXT NOT NULL,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            qty INTEGER NOT NULL,
            created_at INTEGER,
            FOREIGN KEY(table_id) REFERENCES tables(id)
        );",
        "CREATE TABLE IF NOT EXISTS delivery_fleet (
            driver_id TEXT PRIMARY KEY,
            restaurant_id TEXT NOT NULL,
            driver_lat REAL NOT NULL,
            driver_lng REAL NOT NULL,
            status TEXT NOT NULL,
            customer_lat REAL NOT NULL,
            customer_lng REAL NOT NULL,
            last_updated TEXT NOT NULL,
            FOREIGN KEY(restaurant_id) REFERENCES restaurants(id)
        );",
        "CREATE TABLE IF NOT EXISTS customer_analytics (
            date TEXT NOT NULL,
            restaurant_id TEXT NOT NULL,
            dine_in_count INTEGER NOT NULL,
            delivery_count INTEGER NOT NULL,
            PRIMARY KEY(date, restaurant_id),
            FOREIGN KEY(restaurant_id) REFERENCES restaurants(id)
        );",
        "CREATE TABLE IF NOT EXISTS whatsapp_logs (
            id TEXT PRIMARY KEY,
            restaurant_id TEXT NOT NULL,
            table_id TEXT NOT NULL,
            phone TEXT NOT NULL,
            bill_total TEXT NOT NULL,
            invoice_no TEXT NOT NULL,
            sent_at TEXT NOT NULL
        );",
        "CREATE TABLE IF NOT EXISTS employee_shifts (
            id TEXT PRIMARY KEY,
            restaurant_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            user_name TEXT NOT NULL,
            day TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            role_label TEXT NOT NULL DEFAULT '',
            FOREIGN KEY(restaurant_id) REFERENCES restaurants(id)
        );",
        "CREATE TABLE IF NOT EXISTS inventory_items (
            id TEXT PRIMARY KEY,
            restaurant_id TEXT NOT NULL,
            name TEXT NOT NULL,
            category TEXT NOT NULL DEFAULT 'General',
            quantity REAL NOT NULL,
            unit TEXT NOT NULL DEFAULT 'kg',
            expiry_date TEXT NOT NULL,
            added_at TEXT NOT NULL,
            FOREIGN KEY(restaurant_id) REFERENCES restaurants(id)
        );",
        "INSERT OR IGNORE INTO roles (id, name, level, can_edit_levels_above)
         VALUES ('r1', 'Owner', 1, 1),
                ('r2', 'Store Manager', 2, 2),
                ('r3', 'Cashier', 3, 999),
                ('r4', 'Janitor', 4, 999),
                ('r5', 'Chef', 3, 999);",
    ];
    for query in queries {
        sqlx::query(query)
            .execute(&pool)
            .await
            .expect("Failed to run schema migration");
    }

    // Defensive column additions for databases created by older revisions.
    let alters = [
        "ALTER TABLE restaurants ADD COLUMN concept TEXT",
        "ALTER TABLE restaurants ADD COLUMN address TEXT",
        "ALTER TABLE restaurants ADD COLUMN phone TEXT",
        "ALTER TABLE restaurants ADD COLUMN fssai TEXT",
        "ALTER TABLE restaurants ADD COLUMN logo_url TEXT",
        "ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0",
        "ALTER TABLE users ADD COLUMN dish_specialty TEXT",
        "ALTER TABLE users ADD COLUMN weekly_schedule TEXT",
        "ALTER TABLE users ADD COLUMN leave_status TEXT",
        "ALTER TABLE orders ADD COLUMN created_at INTEGER",
    ];
    for alter in alters {
        let _ = sqlx::query(alter).execute(&pool).await;
    }

    // Data fix: seating timestamps used to be stored as epoch SECONDS, which the
    // UI read as milliseconds and rendered as absurd elapsed times. Normalise any
    // legacy value to milliseconds (idempotent: ms values are far above the cutoff).
    let _ = sqlx::query(
        "UPDATE tables SET seated_at = seated_at * 1000
         WHERE seated_at IS NOT NULL AND seated_at < 100000000000",
    )
    .execute(&pool)
    .await;
    let _ = sqlx::query(
        "UPDATE orders SET created_at = created_at * 1000
         WHERE created_at IS NOT NULL AND created_at < 100000000000",
    )
    .execute(&pool)
    .await;

    let state = AppState { db: pool };
    let cors = CorsLayer::permissive();

    let app = Router::new()
        .route("/api/health", get(health))
        // Auth
        .route("/api/auth/register", post(register))
        .route("/api/auth/login", post(login))
        .route("/api/auth/request-otp", post(request_otp))
        .route("/api/auth/reset-password", post(reset_password))
        // Teams
        .route("/api/teams", get(list_teams).post(create_team))
        .route(
            "/api/teams/{id}",
            get(get_team).put(update_team).delete(delete_team),
        )
        .route("/api/teams/{id}/members", get(list_team_members))
        // Users
        .route("/api/users", get(list_users).post(create_user))
        .route(
            "/api/users/{id}",
            get(get_user).put(update_user).delete(delete_user),
        )
        .route("/api/users/{id}/password", post(change_user_password))
        // Roles
        .route("/api/roles", get(list_roles).post(create_role))
        .route("/api/roles/{id}", get(get_role).delete(delete_role))
        // Restaurant settings
        .route(
            "/api/restaurants/{id}",
            get(get_restaurant).put(update_restaurant),
        )
        // Integrations (kept from the original backend)
        .route("/api/whatsapp/send-bill", post(send_whatsapp_bill))
        .route("/api/delivery/tracking", get(get_delivery_tracking))
        // Webhooks and Live API data
        .route("/api/tables", get(get_tables))
        .route("/api/tables/{id}", put(update_table))
        .route("/api/orders", post(create_order))
        .route("/api/orders/{id}", axum::routing::delete(delete_order))
        .route("/api/analytics", get(get_analytics))
        .route("/api/webhooks/tables", post(webhook_tables))
        .route("/api/webhooks/orders", post(webhook_orders))
        .route("/api/webhooks/fleet", post(webhook_fleet))
        .route("/api/webhooks/analytics", post(webhook_analytics))
        // Employee Shifts
        .route("/api/shifts", get(list_shifts).post(create_shift))
        .route("/api/shifts/{id}", axum::routing::delete(delete_shift))
        // Inventory Expiry
        .route("/api/inventory-items", get(list_inventory_items).post(create_inventory_item))
        .route("/api/inventory-items/{id}", axum::routing::delete(delete_inventory_item))
        .with_state(state)
        .layer(cors);

    let addr = SocketAddr::from(([0, 0, 0, 0], 8000));
    println!("Rust backend listening on {addr}");

    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .expect("Failed to bind address");
    axum::serve(listener, app).await.unwrap();
}

async fn health() -> &'static str {
    "OK"
}

// ---------------------------------------------------------------- Auth handlers

async fn register(
    State(state): State<AppState>,
    Json(payload): Json<AuthRequest>,
) -> impl IntoResponse {
    let email = sanitize_email(&payload.email);
    if email.is_empty() || payload.password.len() < 4 {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": "A valid email and a password of at least 4 characters are required" })),
        )
            .into_response();
    }

    let existing: Option<String> = sqlx::query_scalar("SELECT id FROM users WHERE email = ?")
        .bind(&email)
        .fetch_optional(&state.db)
        .await
        .ok()
        .flatten();
    if existing.is_some() {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": "An account with this email already exists" })),
        )
            .into_response();
    }

    let hashed = match hash(&payload.password, DEFAULT_COST) {
        Ok(value) => value,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "error": "Failed to hash password" })),
            )
                .into_response()
        }
    };

    let user_id = Uuid::new_v4().to_string();
    let restaurant_id = format!("res_{}", Uuid::new_v4().simple());
    let team_id = format!("team_{}", Uuid::new_v4().simple());
    let now = Utc::now().to_rfc3339();
    let name = email.split('@').next().unwrap_or("Owner").to_string();

    let _ = sqlx::query("INSERT INTO restaurants (id, name, created_at) VALUES (?, ?, ?)")
        .bind(&restaurant_id)
        .bind("My Restaurant")
        .bind(&now)
        .execute(&state.db)
        .await;

    let _ = sqlx::query(
        "INSERT INTO teams (id, restaurant_id, name, description, owner_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(&team_id)
    .bind(&restaurant_id)
    .bind("Main Branch")
    .bind("Primary location")
    .bind(&user_id)
    .bind(&now)
    .execute(&state.db)
    .await;

    // Give every new outlet a starter floor plan so the Tables & KDS screens are
    // immediately usable instead of starting completely empty.
    let floor_plan: [(&str, i64); 8] = [
        ("T-01", 2),
        ("T-02", 2),
        ("T-03", 4),
        ("T-04", 4),
        ("T-05", 6),
        ("T-06", 6),
        ("T-07", 8),
        ("T-08", 2),
    ];
    for (index, (table_name, capacity)) in floor_plan.iter().enumerate() {
        let table_id = format!("{}_t{}", restaurant_id, index + 1);
        let _ = sqlx::query(
            "INSERT OR IGNORE INTO tables (id, restaurant_id, name, capacity, state, waiter, seated_at)
             VALUES (?, ?, ?, ?, 'available', NULL, NULL)",
        )
        .bind(&table_id)
        .bind(&restaurant_id)
        .bind(table_name)
        .bind(capacity)
        .execute(&state.db)
        .await;
    }

    let result = sqlx::query(
        "INSERT INTO users (id, email, password_hash, name, role_id, team_id, restaurant_id, avatar_url, status, must_change_password, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&user_id)
    .bind(&email)
    .bind(&hashed)
    .bind(&name)
    .bind("r1")
    .bind(&team_id)
    .bind(&restaurant_id)
    .bind("")
    .bind("active")
    .bind(0_i64)
    .bind(&now)
    .execute(&state.db)
    .await;

    match result {
        Ok(_) => (
            StatusCode::CREATED,
            Json(json!({
                "success": true,
                "userId": user_id,
                "teamId": team_id,
                "restaurantId": restaurant_id
            })),
        )
            .into_response(),
        Err(error) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": format!("Failed to create account: {error}") })),
        )
            .into_response(),
    }
}

async fn login(State(state): State<AppState>, Json(payload): Json<AuthRequest>) -> impl IntoResponse {
    let email = sanitize_email(&payload.email);
    let user = sqlx::query_as::<_, DbUser>("SELECT * FROM users WHERE email = ?")
        .bind(&email)
        .fetch_optional(&state.db)
        .await
        .ok()
        .flatten();

    if let Some(user) = user {
        if verify(&payload.password, &user.password_hash).unwrap_or(false) {
            let expiration = Utc::now()
                .checked_add_signed(Duration::hours(24))
                .expect("valid timestamp")
                .timestamp() as usize;

            let claims = Claims {
                sub: user.id.clone(),
                role: user.role_id.clone(),
                team_id: user.team_id.clone(),
                restaurant_id: user.restaurant_id.clone(),
                exp: expiration,
            };

            let token = match encode(
                &Header::default(),
                &claims,
                &EncodingKey::from_secret(JWT_SECRET.as_ref()),
            ) {
                Ok(token) => token,
                Err(_) => {
                    return (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(json!({ "error": "Failed to issue token" })),
                    )
                        .into_response()
                }
            };

            let response = to_user_response(&state.db, &user).await;
            return (
                StatusCode::OK,
                Json(json!({
                    "token": token,
                    "role": user.role_id,
                    "userId": user.id,
                    "mustChangePassword": user.must_change_password != 0,
                    "user": response,
                })),
            )
                .into_response();
        }
    }

    (
        StatusCode::UNAUTHORIZED,
        Json(json!({ "error": "Invalid email or password" })),
    )
        .into_response()
}

async fn request_otp(
    State(state): State<AppState>,
    Json(payload): Json<OtpRequest>,
) -> impl IntoResponse {
    let email = sanitize_email(&payload.email);
    let exists: Option<String> = sqlx::query_scalar("SELECT id FROM users WHERE email = ?")
        .bind(&email)
        .fetch_optional(&state.db)
        .await
        .ok()
        .flatten();

    // Deliberately does not reveal whether the account exists.
    if exists.is_none() {
        println!("OTP requested for unknown email {email}");
    } else {
        println!("Hardcoded OTP {HARDCODED_OTP} generated for {email}");
    }

    (
        StatusCode::OK,
        Json(json!({ "ok": true, "message": "OTP sent successfully" })),
    )
        .into_response()
}

async fn reset_password(
    State(state): State<AppState>,
    Json(payload): Json<ResetPasswordRequest>,
) -> impl IntoResponse {
    if payload.otp.trim() != HARDCODED_OTP {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": "Invalid OTP" })),
        )
            .into_response();
    }
    if payload.new_password.len() < 4 {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": "Password must be at least 4 characters" })),
        )
            .into_response();
    }

    let email = sanitize_email(&payload.email);
    let hashed = match hash(&payload.new_password, DEFAULT_COST) {
        Ok(value) => value,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "error": "Failed to hash password" })),
            )
                .into_response()
        }
    };

    let result = sqlx::query(
        "UPDATE users SET password_hash = ?, must_change_password = 0 WHERE email = ?",
    )
    .bind(&hashed)
    .bind(&email)
    .execute(&state.db)
    .await;

    match result {
        Ok(done) if done.rows_affected() > 0 => {
            (StatusCode::OK, Json(json!({ "ok": true }))).into_response()
        }
        _ => (
            StatusCode::NOT_FOUND,
            Json(json!({ "error": "Account not found" })),
        )
            .into_response(),
    }
}

// ---------------------------------------------------------------- Team handlers

async fn list_teams(State(state): State<AppState>, headers: HeaderMap) -> impl IntoResponse {
    let claims = claims_from(&headers);
    let teams = match claims {
        Some(claims) => {
            sqlx::query_as::<_, (String, String, String, Option<String>, String, String)>(
                "SELECT id, restaurant_id, name, description, owner_id, created_at FROM teams WHERE restaurant_id = ? ORDER BY created_at",
            )
            .bind(&claims.restaurant_id)
            .fetch_all(&state.db)
            .await
        }
        None => {
            sqlx::query_as::<_, (String, String, String, Option<String>, String, String)>(
                "SELECT id, restaurant_id, name, description, owner_id, created_at FROM teams ORDER BY created_at",
            )
            .fetch_all(&state.db)
            .await
        }
    }
    .unwrap_or_default();

    let mut responses = Vec::new();
    for (id, restaurant_id, name, description, owner_id, created_at) in teams {
        let member_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM users WHERE team_id = ?")
            .bind(&id)
            .fetch_one(&state.db)
            .await
            .unwrap_or(0);
        responses.push(TeamResponse {
            id,
            restaurant_id,
            name,
            description,
            owner_id,
            created_at,
            member_count,
        });
    }

    (StatusCode::OK, Json(responses)).into_response()
}

async fn create_team(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<TeamCreateRequest>,
) -> impl IntoResponse {
    let claims = match claims_from(&headers) {
        Some(claims) => claims,
        None => return unauthorized(),
    };

    let name = payload.name.trim().to_string();
    if name.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": "Team name is required" })),
        )
            .into_response();
    }

    let id = format!("team_{}", Uuid::new_v4().simple());
    let now = Utc::now().to_rfc3339();

    let insert = sqlx::query(
        "INSERT INTO teams (id, restaurant_id, name, description, owner_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&claims.restaurant_id)
    .bind(&name)
    .bind(&payload.description)
    .bind(&claims.sub)
    .bind(&now)
    .execute(&state.db)
    .await;

    match insert {
        Ok(_) => (
            StatusCode::CREATED,
            Json(TeamResponse {
                id,
                restaurant_id: claims.restaurant_id,
                name,
                description: payload.description,
                owner_id: claims.sub,
                created_at: now,
                member_count: 0,
            }),
        )
            .into_response(),
        Err(error) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": format!("Failed to create team: {error}") })),
        )
            .into_response(),
    }
}

async fn get_team(State(state): State<AppState>, Path(id): Path<String>) -> impl IntoResponse {
    let team = sqlx::query_as::<_, (String, String, String, Option<String>, String, String)>(
        "SELECT id, restaurant_id, name, description, owner_id, created_at FROM teams WHERE id = ?",
    )
    .bind(&id)
    .fetch_optional(&state.db)
    .await
    .ok()
    .flatten();

    match team {
        Some((id, restaurant_id, name, description, owner_id, created_at)) => {
            let member_count: i64 =
                sqlx::query_scalar("SELECT COUNT(*) FROM users WHERE team_id = ?")
                    .bind(&id)
                    .fetch_one(&state.db)
                    .await
                    .unwrap_or(0);
            (
                StatusCode::OK,
                Json(TeamResponse {
                    id,
                    restaurant_id,
                    name,
                    description,
                    owner_id,
                    created_at,
                    member_count,
                }),
            )
                .into_response()
        }
        None => (
            StatusCode::NOT_FOUND,
            Json(json!({ "error": "Team not found" })),
        )
            .into_response(),
    }
}

async fn update_team(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(payload): Json<TeamUpdateRequest>,
) -> impl IntoResponse {
    let result = sqlx::query(
        "UPDATE teams SET name = COALESCE(?, name), description = COALESCE(?, description) WHERE id = ?",
    )
    .bind(&payload.name)
    .bind(&payload.description)
    .bind(&id)
    .execute(&state.db)
    .await;

    match result {
        Ok(done) if done.rows_affected() > 0 => get_team(State(state), Path(id)).await.into_response(),
        _ => (
            StatusCode::NOT_FOUND,
            Json(json!({ "error": "Team not found" })),
        )
            .into_response(),
    }
}

async fn delete_team(State(state): State<AppState>, Path(id): Path<String>) -> impl IntoResponse {
    let members: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM users WHERE team_id = ?")
        .bind(&id)
        .fetch_one(&state.db)
        .await
        .unwrap_or(0);
    if members > 0 {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": "Cannot delete a team that still has members" })),
        )
            .into_response();
    }

    let result = sqlx::query("DELETE FROM teams WHERE id = ?")
        .bind(&id)
        .execute(&state.db)
        .await;
    match result {
        Ok(_) => StatusCode::NO_CONTENT.into_response(),
        Err(_) => (
            StatusCode::NOT_FOUND,
            Json(json!({ "error": "Team not found" })),
        )
            .into_response(),
    }
}

async fn list_team_members(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let users = sqlx::query_as::<_, DbUser>("SELECT * FROM users WHERE team_id = ?")
        .bind(&id)
        .fetch_all(&state.db)
        .await
        .unwrap_or_default();

    let mut responses = Vec::new();
    for user in &users {
        responses.push(to_user_response(&state.db, user).await);
    }
    (StatusCode::OK, Json(responses)).into_response()
}

// ---------------------------------------------------------------- User handlers

async fn list_users(State(state): State<AppState>, headers: HeaderMap) -> impl IntoResponse {
    let claims = claims_from(&headers);
    let users = match claims {
        Some(claims) => {
            sqlx::query_as::<_, DbUser>(
                "SELECT * FROM users WHERE restaurant_id = ? ORDER BY created_at",
            )
            .bind(&claims.restaurant_id)
            .fetch_all(&state.db)
            .await
        }
        None => sqlx::query_as::<_, DbUser>("SELECT * FROM users ORDER BY created_at")
            .fetch_all(&state.db)
            .await,
    }
    .unwrap_or_default();

    let mut responses = Vec::new();
    for user in &users {
        responses.push(to_user_response(&state.db, user).await);
    }
    (StatusCode::OK, Json(responses)).into_response()
}

async fn create_user(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<UserCreateRequest>,
) -> impl IntoResponse {
    let claims = match claims_from(&headers) {
        Some(claims) => claims,
        None => return unauthorized(),
    };

    let email = sanitize_email(&payload.email);
    if email.is_empty() || payload.name.trim().is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": "Name and email are required" })),
        )
            .into_response();
    }

    let caller_level = role_level(&state.db, &claims.role).await;
    let new_level = role_level(&state.db, &payload.role_id).await;
    if caller_level >= new_level {
        return forbidden("You cannot create an account with an equal or higher role");
    }

    let existing: Option<String> = sqlx::query_scalar("SELECT id FROM users WHERE email = ?")
        .bind(&email)
        .fetch_optional(&state.db)
        .await
        .ok()
        .flatten();
    if existing.is_some() {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": "An account with this email already exists" })),
        )
            .into_response();
    }

    let temp_password = payload
        .password
        .clone()
        .unwrap_or_else(generate_temp_password);
    let hashed = match hash(&temp_password, DEFAULT_COST) {
        Ok(value) => value,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "error": "Failed to hash password" })),
            )
                .into_response()
        }
    };

    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let team_id = payload.team_id.clone().or(claims.team_id.clone());
    let restaurant_id = payload
        .restaurant_id
        .clone()
        .unwrap_or(claims.restaurant_id.clone());

    let insert = sqlx::query(
        "INSERT INTO users (id, email, password_hash, name, role_id, team_id, restaurant_id, avatar_url, status, must_change_password, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&email)
    .bind(&hashed)
    .bind(payload.name.trim())
    .bind(&payload.role_id)
    .bind(&team_id)
    .bind(&restaurant_id)
    .bind("")
    .bind("active")
    .bind(1_i64)
    .bind(&now)
    .execute(&state.db)
    .await;

    if let Err(error) = insert {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": format!("Failed to create member: {error}") })),
        )
            .into_response();
    }

    let user = sqlx::query_as::<_, DbUser>("SELECT * FROM users WHERE id = ?")
        .bind(&id)
        .fetch_one(&state.db)
        .await;
    match user {
        Ok(user) => (
            StatusCode::CREATED,
            Json(json!({
                "user": to_user_response(&state.db, &user).await,
                "tempPassword": temp_password,
            })),
        )
            .into_response(),
        Err(_) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": "Failed to fetch created member" })),
        )
            .into_response(),
    }
}

async fn get_user(State(state): State<AppState>, Path(id): Path<String>) -> impl IntoResponse {
    let user = sqlx::query_as::<_, DbUser>("SELECT * FROM users WHERE id = ?")
        .bind(&id)
        .fetch_optional(&state.db)
        .await
        .ok()
        .flatten();

    match user {
        Some(user) => {
            (StatusCode::OK, Json(to_user_response(&state.db, &user).await)).into_response()
        }
        None => (
            StatusCode::NOT_FOUND,
            Json(json!({ "error": "User not found" })),
        )
            .into_response(),
    }
}

async fn update_user(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<String>,
    Json(payload): Json<UserUpdateRequest>,
) -> impl IntoResponse {
    let claims = match claims_from(&headers) {
        Some(claims) => claims,
        None => return unauthorized(),
    };
    if !can_modify(&state.db, &claims, &id).await {
        return forbidden("You do not have permission to edit this account");
    }

    let email = payload.email.as_deref().map(sanitize_email);

    let result = sqlx::query(
        "UPDATE users SET
            name = COALESCE(?, name),
            email = COALESCE(?, email),
            role_id = COALESCE(?, role_id),
            team_id = COALESCE(?, team_id),
            avatar_url = COALESCE(?, avatar_url),
            status = COALESCE(?, status),
            dish_specialty = COALESCE(?, dish_specialty),
            weekly_schedule = COALESCE(?, weekly_schedule),
            leave_status = COALESCE(?, leave_status)
         WHERE id = ?",
    )
    .bind(&payload.name)
    .bind(&email)
    .bind(&payload.role_id)
    .bind(&payload.team_id)
    .bind(&payload.avatar_url)
    .bind(&payload.status)
    .bind(&payload.dish_specialty)
    .bind(&payload.weekly_schedule)
    .bind(&payload.leave_status)
    .bind(&id)
    .execute(&state.db)
    .await;

    match result {
        Ok(done) if done.rows_affected() > 0 => {
            get_user(State(state), Path(id)).await.into_response()
        }
        Ok(_) => (
            StatusCode::NOT_FOUND,
            Json(json!({ "error": "User not found" })),
        )
            .into_response(),
        Err(error) => (
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": format!("Failed to update user: {error}") })),
        )
            .into_response(),
    }
}

async fn delete_user(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let claims = match claims_from(&headers) {
        Some(claims) => claims,
        None => return unauthorized(),
    };
    if !can_modify(&state.db, &claims, &id).await {
        return forbidden("You do not have permission to remove this account");
    }

    let result = sqlx::query("DELETE FROM users WHERE id = ?")
        .bind(&id)
        .execute(&state.db)
        .await;
    match result {
        Ok(_) => StatusCode::NO_CONTENT.into_response(),
        Err(_) => (
            StatusCode::NOT_FOUND,
            Json(json!({ "error": "User not found" })),
        )
            .into_response(),
    }
}

async fn change_user_password(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<String>,
    Json(payload): Json<ChangePasswordRequest>,
) -> impl IntoResponse {
    let claims = match claims_from(&headers) {
        Some(claims) => claims,
        None => return unauthorized(),
    };
    if !can_modify(&state.db, &claims, &id).await {
        return forbidden("You do not have permission to change this password");
    }
    if payload.new_password.len() < 4 {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": "Password must be at least 4 characters" })),
        )
            .into_response();
    }

    let user = sqlx::query_as::<_, DbUser>("SELECT * FROM users WHERE id = ?")
        .bind(&id)
        .fetch_optional(&state.db)
        .await
        .ok()
        .flatten();
    let user = match user {
        Some(user) => user,
        None => {
            return (
                StatusCode::NOT_FOUND,
                Json(json!({ "error": "User not found" })),
            )
                .into_response()
        }
    };

    // Changing your own password normally requires the current one, except when
    // the account is still using an auto-generated temporary password.
    if claims.sub == id && user.must_change_password == 0 {
        let current = payload.current_password.clone().unwrap_or_default();
        if !verify(&current, &user.password_hash).unwrap_or(false) {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({ "error": "Current password is incorrect" })),
            )
                .into_response();
        }
    }

    let hashed = match hash(&payload.new_password, DEFAULT_COST) {
        Ok(value) => value,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "error": "Failed to hash password" })),
            )
                .into_response()
        }
    };

    let result = sqlx::query("UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?")
        .bind(&hashed)
        .bind(&id)
        .execute(&state.db)
        .await;

    match result {
        Ok(_) => (StatusCode::OK, Json(json!({ "ok": true }))).into_response(),
        Err(error) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": format!("Failed to update password: {error}") })),
        )
            .into_response(),
    }
}

// ---------------------------------------------------------------- Role handlers

async fn list_roles(State(state): State<AppState>) -> impl IntoResponse {
    let roles = sqlx::query_as::<_, RoleRow>(
        "SELECT id, name, level, can_edit_levels_above FROM roles ORDER BY level",
    )
    .fetch_all(&state.db)
    .await
    .unwrap_or_default();

    let roles: Vec<RoleResponse> = roles
        .into_iter()
        .map(|role| RoleResponse {
            id: role.id,
            name: role.name,
            level: role.level,
            can_edit_levels_above: role.can_edit_levels_above,
        })
        .collect();

    (StatusCode::OK, Json(roles)).into_response()
}

async fn create_role(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<RoleCreateRequest>,
) -> impl IntoResponse {
    let claims = match claims_from(&headers) {
        Some(claims) => claims,
        None => return unauthorized(),
    };
    if role_level(&state.db, &claims.role).await > 2 {
        return forbidden("Only owners and managers can create roles");
    }
    if payload.name.trim().is_empty() || payload.level < 1 {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": "A role name and a level of at least 1 are required" })),
        )
            .into_response();
    }

    let id = format!("r{}", Uuid::new_v4().simple());
    let can_edit_levels_above = payload.can_edit_levels_above.unwrap_or(payload.level);

    let result = sqlx::query(
        "INSERT INTO roles (id, name, level, can_edit_levels_above) VALUES (?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&payload.name)
    .bind(payload.level)
    .bind(can_edit_levels_above)
    .execute(&state.db)
    .await;

    match result {
        Ok(_) => (
            StatusCode::CREATED,
            Json(RoleResponse {
                id,
                name: payload.name,
                level: payload.level,
                can_edit_levels_above,
            }),
        )
            .into_response(),
        Err(error) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": format!("Failed to create role: {error}") })),
        )
            .into_response(),
    }
}

async fn get_role(State(state): State<AppState>, Path(id): Path<String>) -> impl IntoResponse {
    match role_by_id(&state.db, &id).await {
        Some(role) => (StatusCode::OK, Json(role)).into_response(),
        None => (
            StatusCode::NOT_FOUND,
            Json(json!({ "error": "Role not found" })),
        )
            .into_response(),
    }
}

async fn delete_role(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let claims = match claims_from(&headers) {
        Some(claims) => claims,
        None => return unauthorized(),
    };
    if role_level(&state.db, &claims.role).await > 2 {
        return forbidden("Only owners and managers can delete roles");
    }

    let target_level = role_level(&state.db, &id).await;
    if target_level <= 2 {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": "Cannot delete core admin/manager roles" })),
        )
            .into_response();
    }

    let result = sqlx::query("DELETE FROM roles WHERE id = ?")
        .bind(&id)
        .execute(&state.db)
        .await;
    match result {
        Ok(_) => StatusCode::NO_CONTENT.into_response(),
        Err(_) => (
            StatusCode::NOT_FOUND,
            Json(json!({ "error": "Role not found" })),
        )
            .into_response(),
    }
}

// ---------------------------------------------------------------- Restaurant handlers

async fn get_restaurant(State(state): State<AppState>, Path(id): Path<String>) -> impl IntoResponse {
    let restaurant = sqlx::query_as::<_, (String, String)>(
        "SELECT id, name FROM restaurants WHERE id = ?",
    )
    .bind(&id)
    .fetch_optional(&state.db)
    .await
    .ok()
    .flatten();

    let (id, name) = match restaurant {
        Some(row) => row,
        None => {
            return (
                StatusCode::NOT_FOUND,
                Json(json!({ "error": "Restaurant not found" })),
            )
                .into_response()
        }
    };

    let settings: Option<String> =
        sqlx::query_scalar("SELECT data FROM restaurant_settings WHERE restaurant_id = ?")
            .bind(&id)
            .fetch_optional(&state.db)
            .await
            .ok()
            .flatten();

    let settings: Value = settings
        .as_deref()
        .and_then(|raw| serde_json::from_str(raw).ok())
        .unwrap_or_else(|| json!({}));

    (
        StatusCode::OK,
        Json(json!({ "id": id, "name": name, "settings": settings })),
    )
        .into_response()
}

async fn update_restaurant(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<String>,
    Json(payload): Json<Value>,
) -> impl IntoResponse {
    let claims = match claims_from(&headers) {
        Some(claims) => claims,
        None => return unauthorized(),
    };
    if claims.restaurant_id != id {
        return forbidden("You can only edit your own restaurant settings");
    }

    let now = Utc::now().to_rfc3339();
    let serialized = payload.to_string();

    let result = sqlx::query(
        "INSERT INTO restaurant_settings (restaurant_id, data, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(restaurant_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at",
    )
    .bind(&id)
    .bind(&serialized)
    .bind(&now)
    .execute(&state.db)
    .await;

    if let Some(name) = payload.get("name").and_then(|value| value.as_str()) {
        let _ = sqlx::query("UPDATE restaurants SET name = ? WHERE id = ?")
            .bind(name)
            .bind(&id)
            .execute(&state.db)
            .await;
    }

    match result {
        Ok(_) => (StatusCode::OK, Json(json!({ "ok": true }))).into_response(),
        Err(error) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": format!("Failed to save settings: {error}") })),
        )
            .into_response(),
    }
}

// ---------------------------------------------------------------- Integrations & Live APIs

#[derive(Deserialize)]
struct WhatsAppBillRequest {
    restaurant_id: String,
    table_id: String,
    phone: String,
    bill_total: String,
    invoice_no: String,
}

#[derive(Serialize)]
struct WhatsAppResponse {
    ok: bool,
    message_id: String,
}

async fn send_whatsapp_bill(
    State(state): State<AppState>,
    Json(payload): Json<WhatsAppBillRequest>,
) -> impl IntoResponse {
    let message_id = format!("wamid.{}", Uuid::new_v4().simple());
    let now = Utc::now().to_rfc3339();

    let _ = sqlx::query(
        "INSERT INTO whatsapp_logs (id, restaurant_id, table_id, phone, bill_total, invoice_no, sent_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&message_id)
    .bind(&payload.restaurant_id)
    .bind(&payload.table_id)
    .bind(&payload.phone)
    .bind(&payload.bill_total)
    .bind(&payload.invoice_no)
    .bind(&now)
    .execute(&state.db)
    .await;

    let response = WhatsAppResponse {
        ok: true,
        message_id,
    };

    (StatusCode::OK, Json(response)).into_response()
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

async fn get_delivery_tracking(
    State(state): State<AppState>,
) -> impl IntoResponse {
    let restaurant_loc = [12.9345, 77.6265];
    let rows: Vec<(String, f64, f64, f64, f64)> = sqlx::query_as(
        "SELECT driver_id, driver_lat, driver_lng, customer_lat, customer_lng FROM delivery_fleet"
    )
    .fetch_all(&state.db)
    .await
    .unwrap_or_default();

    let mut deliveries = Vec::new();
    for (id, d_lat, d_lng, c_lat, c_lng) in rows {
        deliveries.push(DeliveryData {
            id,
            customer: [c_lat, c_lng],
            driver: [d_lat, d_lng],
            route: vec![restaurant_loc, [c_lat, c_lng]],
        });
    }

    let response = FleetTrackingData {
        restaurant: restaurant_loc,
        deliveries,
    };

    (StatusCode::OK, Json(response)).into_response()
}

// ---------------------------------------------------------------- Webhooks (Live API Ingestion)

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct TableItem {
    id: String,
    name: String,
    capacity: i64,
    state: String,
    waiter: Option<String>,
    seated_at: Option<i64>,
    orders: Vec<OrderItem>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct OrderItem {
    id: String,
    name: String,
    price: f64,
    qty: i64,
    created_at: Option<i64>,
}

async fn get_tables(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let claims = match claims_from(&headers) {
        Some(claims) => claims,
        None => return unauthorized(),
    };
    
    let table_rows: Vec<(String, String, i64, String, Option<String>, Option<i64>)> = sqlx::query_as(
        "SELECT id, name, capacity, state, waiter, seated_at FROM tables WHERE restaurant_id = ?"
    )
    .bind(&claims.restaurant_id)
    .fetch_all(&state.db)
    .await
    .unwrap_or_default();

    let mut tables = Vec::new();
    for (id, name, capacity, state_val, waiter, seated_at) in table_rows {
        let order_rows: Vec<(String, String, f64, i64, Option<i64>)> = sqlx::query_as(
            "SELECT id, name, price, qty, created_at FROM orders WHERE table_id = ?"
        )
        .bind(&id)
        .fetch_all(&state.db)
        .await
        .unwrap_or_default();

        let mut orders = Vec::new();
        for (oid, oname, price, qty, created_at) in order_rows {
            orders.push(OrderItem { id: oid, name: oname, price, qty, created_at });
        }

        tables.push(TableItem {
            id: id.clone(),
            name,
            capacity,
            state: state_val,
            waiter,
            seated_at,
            orders,
        });
    }

    (StatusCode::OK, Json(tables)).into_response()
}

#[derive(Deserialize)]
struct WebhookTableRequest {
    restaurant_id: String,
    id: String,
    name: String,
    capacity: i64,
    state: String,
    waiter: Option<String>,
}

async fn webhook_tables(
    State(state): State<AppState>,
    Json(payload): Json<WebhookTableRequest>,
) -> impl IntoResponse {
    // Stored in milliseconds so the UI can compute elapsed seating time directly.
    let now = Utc::now().timestamp_millis();
    let seated_at = if payload.state == "available" { None } else { Some(now) };

    let _ = sqlx::query(
        "INSERT INTO tables (id, restaurant_id, name, capacity, state, waiter, seated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
            state=excluded.state,
            waiter=excluded.waiter,
            capacity=excluded.capacity,
            name=excluded.name,
            seated_at = CASE
                WHEN excluded.state = 'available' THEN NULL
                ELSE COALESCE(tables.seated_at, excluded.seated_at)
            END"
    )
    .bind(&payload.id)
    .bind(&payload.restaurant_id)
    .bind(&payload.name)
    .bind(&payload.capacity)
    .bind(&payload.state)
    .bind(&payload.waiter)
    .bind(&seated_at)
    .execute(&state.db)
    .await;

    (StatusCode::OK, Json(json!({ "ok": true }))).into_response()
}

#[derive(Deserialize)]
struct WebhookOrderRequest {
    id: String,
    table_id: String,
    name: String,
    price: f64,
    qty: i64,
    created_at: Option<i64>,
}

async fn webhook_orders(
    State(state): State<AppState>,
    Json(payload): Json<WebhookOrderRequest>,
) -> impl IntoResponse {
    let created_at = payload.created_at.unwrap_or_else(|| Utc::now().timestamp_millis());
    let _ = sqlx::query(
        "INSERT INTO orders (id, table_id, name, price, qty, created_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET qty=excluded.qty"
    )
    .bind(&payload.id)
    .bind(&payload.table_id)
    .bind(&payload.name)
    .bind(&payload.price)
    .bind(&payload.qty)
    .bind(created_at)
    .execute(&state.db)
    .await;

    // Also mark table as ordered
    let _ = sqlx::query("UPDATE tables SET state = 'ordered' WHERE id = ?")
        .bind(&payload.table_id)
        .execute(&state.db)
        .await;

    (StatusCode::OK, Json(json!({ "ok": true }))).into_response()
}

/// Persists floor-plan changes (seating, billing, clearing) made in the Tables
/// screen so the 3-second live poll cannot revert them.
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct UpdateTableRequest {
    state: Option<String>,
    waiter: Option<String>,
    clear_orders: Option<bool>,
}

async fn update_table(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<String>,
    Json(payload): Json<UpdateTableRequest>,
) -> impl IntoResponse {
    let claims = match claims_from(&headers) {
        Some(claims) => claims,
        None => return unauthorized(),
    };

    let owns_table: Option<String> =
        sqlx::query_scalar("SELECT id FROM tables WHERE id = ? AND restaurant_id = ?")
            .bind(&id)
            .bind(&claims.restaurant_id)
            .fetch_optional(&state.db)
            .await
            .ok()
            .flatten();
    if owns_table.is_none() {
        return (
            StatusCode::NOT_FOUND,
            Json(json!({ "error": "Table not found" })),
        )
            .into_response();
    }

    if payload.clear_orders == Some(true) {
        let _ = sqlx::query("DELETE FROM orders WHERE table_id = ?")
            .bind(&id)
            .execute(&state.db)
            .await;
    }

    if let Some(new_state) = payload.state.as_deref() {
        match new_state {
            "available" => {
                let _ = sqlx::query(
                    "UPDATE tables SET state = 'available', seated_at = NULL, waiter = NULL WHERE id = ?",
                )
                .bind(&id)
                .execute(&state.db)
                .await;
            }
            "seated" => {
                let now = Utc::now().timestamp_millis();
                let _ = sqlx::query(
                    "UPDATE tables SET state = 'seated', seated_at = COALESCE(seated_at, ?), waiter = COALESCE(?, waiter) WHERE id = ?",
                )
                .bind(now)
                .bind(&payload.waiter)
                .bind(&id)
                .execute(&state.db)
                .await;
            }
            other => {
                let _ = sqlx::query("UPDATE tables SET state = ? WHERE id = ?")
                    .bind(other)
                    .bind(&id)
                    .execute(&state.db)
                    .await;
            }
        }
    } else if let Some(waiter) = payload.waiter.as_deref() {
        let _ = sqlx::query("UPDATE tables SET waiter = ? WHERE id = ?")
            .bind(waiter)
            .bind(&id)
            .execute(&state.db)
            .await;
    }

    (StatusCode::OK, Json(json!({ "ok": true }))).into_response()
}

/// Authenticated order creation used by the Tables & KDS screens. Scopes the
/// write to a table that belongs to the caller's restaurant.
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateOrderRequest {
    table_id: String,
    name: String,
    price: f64,
    qty: i64,
}

async fn create_order(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateOrderRequest>,
) -> impl IntoResponse {
    let claims = match claims_from(&headers) {
        Some(claims) => claims,
        None => return unauthorized(),
    };

    let owns_table: Option<String> =
        sqlx::query_scalar("SELECT id FROM tables WHERE id = ? AND restaurant_id = ?")
            .bind(&payload.table_id)
            .bind(&claims.restaurant_id)
            .fetch_optional(&state.db)
            .await
            .ok()
            .flatten();
    if owns_table.is_none() {
        return (
            StatusCode::NOT_FOUND,
            Json(json!({ "error": "Table not found" })),
        )
            .into_response();
    }

    if payload.name.trim().is_empty() || payload.qty <= 0 {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": "An item name and a positive quantity are required" })),
        )
            .into_response();
    }

    let id = format!("order_{}", Uuid::new_v4().simple());
    let now = Utc::now().timestamp_millis();
    let _ = sqlx::query(
        "INSERT INTO orders (id, table_id, name, price, qty, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&payload.table_id)
    .bind(payload.name.trim())
    .bind(payload.price)
    .bind(payload.qty)
    .bind(now)
    .execute(&state.db)
    .await;

    let _ = sqlx::query("UPDATE tables SET state = 'ordered' WHERE id = ?")
        .bind(&payload.table_id)
        .execute(&state.db)
        .await;

    (
        StatusCode::CREATED,
        Json(json!({ "ok": true, "id": id, "createdAt": now })),
    )
        .into_response()
}

/// Removes a KOT line item (used by the KDS "bump" action). When the table has
/// no remaining items it drops back to the `seated` state.
async fn delete_order(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let claims = match claims_from(&headers) {
        Some(claims) => claims,
        None => return unauthorized(),
    };

    let table_id: Option<String> = sqlx::query_scalar(
        "SELECT o.table_id FROM orders o
         JOIN tables t ON t.id = o.table_id
         WHERE o.id = ? AND t.restaurant_id = ?",
    )
    .bind(&id)
    .bind(&claims.restaurant_id)
    .fetch_optional(&state.db)
    .await
    .ok()
    .flatten();

    let table_id = match table_id {
        Some(table_id) => table_id,
        None => {
            return (
                StatusCode::NOT_FOUND,
                Json(json!({ "error": "Order not found" })),
            )
                .into_response()
        }
    };

    let _ = sqlx::query("DELETE FROM orders WHERE id = ?")
        .bind(&id)
        .execute(&state.db)
        .await;

    let remaining: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM orders WHERE table_id = ?")
        .bind(&table_id)
        .fetch_one(&state.db)
        .await
        .unwrap_or(0);
    if remaining == 0 {
        let _ = sqlx::query("UPDATE tables SET state = 'seated' WHERE id = ?")
            .bind(&table_id)
            .execute(&state.db)
            .await;
    }

    StatusCode::NO_CONTENT.into_response()
}

#[derive(Deserialize)]
struct WebhookFleetRequest {
    driver_id: String,
    restaurant_id: String,
    driver_lat: f64,
    driver_lng: f64,
    status: String,
    customer_lat: f64,
    customer_lng: f64,
}

async fn webhook_fleet(
    State(state): State<AppState>,
    Json(payload): Json<WebhookFleetRequest>,
) -> impl IntoResponse {
    let now = Utc::now().to_rfc3339();
    let _ = sqlx::query(
        "INSERT INTO delivery_fleet (driver_id, restaurant_id, driver_lat, driver_lng, status, customer_lat, customer_lng, last_updated)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(driver_id) DO UPDATE SET driver_lat=excluded.driver_lat, driver_lng=excluded.driver_lng, status=excluded.status, last_updated=excluded.last_updated"
    )
    .bind(&payload.driver_id)
    .bind(&payload.restaurant_id)
    .bind(&payload.driver_lat)
    .bind(&payload.driver_lng)
    .bind(&payload.status)
    .bind(&payload.customer_lat)
    .bind(&payload.customer_lng)
    .bind(&now)
    .execute(&state.db)
    .await;

    (StatusCode::OK, Json(json!({ "ok": true }))).into_response()
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct AnalyticsData {
    date: String,
    dine_in: i64,
    delivery: i64,
}

async fn get_analytics(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let claims = match claims_from(&headers) {
        Some(claims) => claims,
        None => return unauthorized(),
    };

    let rows: Vec<(String, i64, i64)> = sqlx::query_as(
        "SELECT date, dine_in_count, delivery_count FROM customer_analytics WHERE restaurant_id = ? ORDER BY date ASC"
    )
    .bind(&claims.restaurant_id)
    .fetch_all(&state.db)
    .await
    .unwrap_or_default();

    let mut results = Vec::new();
    for (date, dine_in, delivery) in rows {
        results.push(AnalyticsData { date, dine_in, delivery });
    }

    (StatusCode::OK, Json(results)).into_response()
}

#[derive(Deserialize)]
struct WebhookAnalyticsRequest {
    date: String,
    restaurant_id: String,
    dine_in_count: i64,
    delivery_count: i64,
}

async fn webhook_analytics(
    State(state): State<AppState>,
    Json(payload): Json<WebhookAnalyticsRequest>,
) -> impl IntoResponse {
    let _ = sqlx::query(
        "INSERT INTO customer_analytics (date, restaurant_id, dine_in_count, delivery_count)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(date, restaurant_id) DO UPDATE SET dine_in_count=excluded.dine_in_count, delivery_count=excluded.delivery_count"
    )
    .bind(&payload.date)
    .bind(&payload.restaurant_id)
    .bind(&payload.dine_in_count)
    .bind(&payload.delivery_count)
    .execute(&state.db)
    .await;

    (StatusCode::OK, Json(json!({ "ok": true }))).into_response()
}

// ---------------------------------------------------------------- Employee Shifts

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ShiftResponse {
    id: String,
    restaurant_id: String,
    user_id: String,
    user_name: String,
    day: String,
    start_time: String,
    end_time: String,
    role_label: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateShiftRequest {
    user_id: String,
    user_name: String,
    day: String,
    start_time: String,
    end_time: String,
    role_label: String,
}

async fn list_shifts(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let claims = match claims_from(&headers) {
        Some(claims) => claims,
        None => return unauthorized(),
    };

    let rows: Vec<(String, String, String, String, String, String, String, String)> = sqlx::query_as(
        "SELECT id, restaurant_id, user_id, user_name, day, start_time, end_time, role_label FROM employee_shifts WHERE restaurant_id = ?"
    )
    .bind(&claims.restaurant_id)
    .fetch_all(&state.db)
    .await
    .unwrap_or_default();

    let mut shifts = Vec::new();
    for (id, restaurant_id, user_id, user_name, day, start_time, end_time, role_label) in rows {
        shifts.push(ShiftResponse { id, restaurant_id, user_id, user_name, day, start_time, end_time, role_label });
    }

    (StatusCode::OK, Json(shifts)).into_response()
}

async fn create_shift(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateShiftRequest>,
) -> impl IntoResponse {
    let claims = match claims_from(&headers) {
        Some(claims) => claims,
        None => return unauthorized(),
    };

    let id = format!("shift_{}", Uuid::new_v4().simple());
    
    let result = sqlx::query(
        "INSERT INTO employee_shifts (id, restaurant_id, user_id, user_name, day, start_time, end_time, role_label)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(&claims.restaurant_id)
    .bind(&payload.user_id)
    .bind(&payload.user_name)
    .bind(&payload.day)
    .bind(&payload.start_time)
    .bind(&payload.end_time)
    .bind(&payload.role_label)
    .execute(&state.db)
    .await;

    match result {
        Ok(_) => (StatusCode::CREATED, Json(ShiftResponse {
            id,
            restaurant_id: claims.restaurant_id,
            user_id: payload.user_id,
            user_name: payload.user_name,
            day: payload.day,
            start_time: payload.start_time,
            end_time: payload.end_time,
            role_label: payload.role_label,
        })).into_response(),
        Err(error) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": format!("Failed to create shift: {}", error) }))
        ).into_response()
    }
}

async fn delete_shift(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let claims = match claims_from(&headers) {
        Some(claims) => claims,
        None => return unauthorized(),
    };

    let result = sqlx::query("DELETE FROM employee_shifts WHERE id = ? AND restaurant_id = ?")
        .bind(&id)
        .bind(&claims.restaurant_id)
        .execute(&state.db)
        .await;
        
    match result {
        Ok(done) if done.rows_affected() > 0 => StatusCode::NO_CONTENT.into_response(),
        _ => (StatusCode::NOT_FOUND, Json(json!({ "error": "Shift not found" }))).into_response()
    }
}

// ---------------------------------------------------------------- Inventory Items

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct InventoryItemResponse {
    id: String,
    restaurant_id: String,
    name: String,
    category: String,
    quantity: f64,
    unit: String,
    expiry_date: String,
    added_at: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateInventoryItemRequest {
    name: String,
    category: Option<String>,
    quantity: f64,
    unit: Option<String>,
    expiry_date: String,
}

async fn list_inventory_items(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let claims = match claims_from(&headers) {
        Some(claims) => claims,
        None => return unauthorized(),
    };

    let rows: Vec<(String, String, String, String, f64, String, String, String)> = sqlx::query_as(
        "SELECT id, restaurant_id, name, category, quantity, unit, expiry_date, added_at FROM inventory_items WHERE restaurant_id = ? ORDER BY expiry_date ASC"
    )
    .bind(&claims.restaurant_id)
    .fetch_all(&state.db)
    .await
    .unwrap_or_default();

    let mut items = Vec::new();
    for (id, restaurant_id, name, category, quantity, unit, expiry_date, added_at) in rows {
        items.push(InventoryItemResponse { id, restaurant_id, name, category, quantity, unit, expiry_date, added_at });
    }

    (StatusCode::OK, Json(items)).into_response()
}

async fn create_inventory_item(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateInventoryItemRequest>,
) -> impl IntoResponse {
    let claims = match claims_from(&headers) {
        Some(claims) => claims,
        None => return unauthorized(),
    };

    let id = format!("inv_{}", Uuid::new_v4().simple());
    let now = Utc::now().to_rfc3339();
    let category = payload.category.unwrap_or_else(|| "General".to_string());
    let unit = payload.unit.unwrap_or_else(|| "kg".to_string());

    let result = sqlx::query(
        "INSERT INTO inventory_items (id, restaurant_id, name, category, quantity, unit, expiry_date, added_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(&claims.restaurant_id)
    .bind(&payload.name)
    .bind(&category)
    .bind(&payload.quantity)
    .bind(&unit)
    .bind(&payload.expiry_date)
    .bind(&now)
    .execute(&state.db)
    .await;

    match result {
        Ok(_) => (StatusCode::CREATED, Json(InventoryItemResponse {
            id,
            restaurant_id: claims.restaurant_id,
            name: payload.name,
            category,
            quantity: payload.quantity,
            unit,
            expiry_date: payload.expiry_date,
            added_at: now,
        })).into_response(),
        Err(error) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": format!("Failed to create inventory item: {}", error) }))
        ).into_response()
    }
}

async fn delete_inventory_item(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let claims = match claims_from(&headers) {
        Some(claims) => claims,
        None => return unauthorized(),
    };

    let result = sqlx::query("DELETE FROM inventory_items WHERE id = ? AND restaurant_id = ?")
        .bind(&id)
        .bind(&claims.restaurant_id)
        .execute(&state.db)
        .await;
        
    match result {
        Ok(done) if done.rows_affected() > 0 => StatusCode::NO_CONTENT.into_response(),
        _ => (StatusCode::NOT_FOUND, Json(json!({ "error": "Inventory item not found" }))).into_response()
    }
}
