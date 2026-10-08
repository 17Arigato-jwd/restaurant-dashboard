use axum::{
    Router,
    http::{Request, header},
    extract::{State, Path},
    routing::get,
    Json,
    http::StatusCode,
    response::IntoResponse,
};
use axum::{
    Router,
    http::{Request, header},
    extract::{State, Path},
    routing::get,
    Json,
    http::StatusCode,
    response::IntoResponse,
};
use axum::{
    Router,
    http::{Request, header},
    extract::{State, Path},
    routing::get,
    Json,
    http::StatusCode,
    response::IntoResponse,
};
use axum {
    http::Request,
    extract::Path,
    routing::get,

    routing::get,
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
struct Restaurant {
    id: String,
    name: String,
    created_at: String,
}

#[derive(Serialize, FromRow)]
struct Team {
    id: String,
    restaurant_id: String,
    name: String,
    description: Option<String>,
    owner_id: String,
    created_at: String,
}

#[derive(Serialize, FromRow)]
struct Role {
    id: String,
    name: String,
    level: i32,
    can_edit_levels_above: i32,
}

#[derive(Serialize, FromRow)]
struct User {
    id: String,
    email: String,
    password_hash: String,
    name: String,
    role_id: String,
    team_id: Option<String>,
    restaurant_id: String,
    avatar_url: Option<String>,
    status: String,
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
    team_id: Option<String>,
    restaurant_id: String,
}

#[derive(Serialize, Deserialize)]
struct Claims {
    sub: String,
    role: String,
    team_id: Option<String>,
    restaurant_id: String,
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

    // ---- Multi-tenancy schema -------------------------------------------------
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
            owner_id TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY(restaurant_id) REFERENCES restaurants(id)
        );",
        "CREATE TABLE IF NOT EXISTS roles (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            level INTEGER NOT NULL,
            can_edit_levels_above INTEGER NOT NULL
        );",
        "DROP TABLE IF EXISTS users;",
        "CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            role_id TEXT NOT NULL,
            team_id TEXT,
            restaurant_id TEXT NOT NULL,
            avatar_url TEXT,
            status TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY(role_id) REFERENCES roles(id),
            FOREIGN KEY(team_id) REFERENCES teams(id),
            FOREIGN KEY(restaurant_id) REFERENCES restaurants(id)
        );",
        "INSERT OR IGNORE INTO roles (id, name, level, can_edit_levels_above)
         VALUES ('r1', 'Owner', 1, 1),
                ('r2', 'Store Manager', 2, 2),
                ('r3', 'Cashier', 3, 999),
                ('r4', 'Janitor', 4, 999);",
    ];
    for q in queries {
        sqlx::query(q).execute(&pool).await.unwrap();
    }

    let state = AppState { db: pool };

    let cors = CorsLayer::permissive();

    let app = Router::new()
        .route("/api/health", get(|| async { "OK" }))
        .route("/api/auth/register", post(register))
        .route("/api/auth/login", post(login))
        .route("/api/whatsapp/send-bill", post(send_whatsapp_bill))
        .route("/api/delivery/tracking", get(get_delivery_tracking))
        // ---- Team routes ----
        .route("/api/teams", get(list_teams).post(create_team))
        .route("/api/teams/:id", get(get_team).put(update_team).delete(delete_team))
        // ---- User routes ----
        .route("/api/users", get(list_users).post(create_user))
        .route("/api/users/:id", get(get_user).put(update_user).delete(delete_user))
        // ---- Role routes ----
        .route("/api/roles", get(list_roles).post(create_role))
        .route("/api/roles/:id", get(get_role).delete(delete_role))
        .with_state(state)
        .layer(cors);

    let addr = SocketAddr::from(([0, 0, 0, 0], 8000));
    println!("Rust backend listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

// ---- Route guards + helpers ------------------------------------------------------------
fn auth_header(req: &axum::http::Request<axum::body::Body>) -> Option<String> {
    req.headers()
        .get(axum::http::header::AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string())
}

async fn json_body<T: serde::de::DeserializeOwned>(
    req: axum::http::Request<axum::body::Body>,
) -> Result<T, (StatusCode, String)> {
    let body = req.into_body();
    let bytes = axum::body::to_bytes(body, 1 << 20)
        .await
        .map_err(|_| (StatusCode::BAD_REQUEST, "invalid body".into()))?;
    let t = serde_json::from_slice::<T>(&bytes)
        .map_err(|_| (StatusCode::BAD_REQUEST, "invalid json".into()))?;
    Ok(t)
}

fn sanitize_email(email: &str) -> String {
    email.trim().to_ascii_lowercase()
}

// ---- Team routes -----------------------------------------------------------------------
#[derive(Deserialize)]
struct TeamCreateRequest {
    name: String,
    description: Option<String>,
}

#[derive(Deserialize)]
struct TeamUpdateRequest {
    name: Option<String>,
    description: Option<String>,
}

#[derive(Serialize)]
struct TeamResponse {
    id: String,
    restaurant_id: String,
    name: String,
    description: Option<String>,
    owner_id: String,
    created_at: String,
}

async fn list_teams(State(state): State<AppState>) -> impl IntoResponse {
    let teams = sqlx::query_as::<_, (String, String, String, Option<String>, String, String)>(
        "SELECT id, restaurant_id, name, description, owner_id, created_at FROM teams"
    )
    .fetch_all(&state.db)
    .await
    .unwrap();

    let teams: Vec<TeamResponse> = teams
        .into_iter()
        .map(|(id, rid, name, desc, owner, ct)| TeamResponse {
            id,
            restaurant_id: rid,
            name,
            description: desc,
            owner_id: owner,
            created_at: ct,
        })
        .collect();

    (StatusCode::OK, Json(teams)).into_response()
}

async fn create_team(
    State(state): State<AppState>,
    req: axum::http::Request<axum::body::Body>,
) -> impl IntoResponse {
    let body = json_body(req).await.unwrap_or_else(|e| {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": e.1 })),
        )
            .into_response();
    });

    let name = body.name.trim().to_string();
    if name.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "Team name required" })),
        )
            .into_response();
    }

    let restaurant_id = format!("res_{}", Uuid::new_v4().simple());
    let id = format!("team_{}", Uuid::new_v4().simple());
    let now = Utc::now().to_rfc3339();

    let res = sqlx::query(
        "INSERT INTO restaurants (id, name, created_at) VALUES (?, ?, ?)"
    )
    .bind(&restaurant_id)
    .bind("My Restaurant")
    .bind(&now)
    .execute(&state.db)
    .await;

    if res.is_err() {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": "Failed to create restaurant" })),
        )
            .into_response();
    }

    let insert = sqlx::query(
        "INSERT INTO teams (id, restaurant_id, name, description, owner_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(&restaurant_id)
    .bind(&name)
    .bind(body.description)
    .bind("")
    .bind(&now)
    .execute(&state.db);

    if let Err(e) = insert.await {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": format!("Failed: {}", e) })),
        )
            .into_response();
    }

    (
        StatusCode::CREATED,
        Json(TeamResponse {
            id,
            restaurant_id,
            name,
            description: body.description,
            owner_id: String::new(),
            created_at: now,
        }),
    )
        .into_response()
}

async fn get_team(State(state): State<AppState>, path: Path<String>) -> impl IntoResponse {
    let id = path.0;
    let team = sqlx::query_as::<_, (String, String, String, Option<String>, String, String)>(
        "SELECT id, restaurant_id, name, description, owner_id, created_at FROM teams WHERE id = ?"
    )
    .bind(&id)
    .fetch_optional(&state.db)
    .await
    .unwrap();

    match team {
        Some((id, rid, name, desc, owner, ct)) => (
            StatusCode::OK,
            Json(TeamResponse {
                id,
                restaurant_id: rid,
                name,
                description: desc,
                owner_id: owner,
                created_at: ct,
            }),
        ),
        None => (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({ "error": "Team not found" })),
        ),
    }
    .into_response()
}

async fn update_team(
    State(state): State<AppState>,
    path: Path<String>,
    req: axum::http::Request<axum::body::Body>,
) -> impl IntoResponse {
    let id = path.0;
    let body = json_body(req).await.unwrap_or_else(|e| {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": e.1 })),
        )
            .into_response();
    });

    let name = body.name.clone().unwrap_or_default();
    let description = body.description.clone();

    let res = sqlx::query(
        "UPDATE teams SET name = COALESCE(?, name), description = COALESCE(?, description) WHERE id = ?"
    )
    .bind(&name)
    .bind(&description)
    .bind(&id)
    .execute(&state.db)
    .await;

    if res.is_err() {
        return (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({ "error": "Team not found" })),
        )
            .into_response();
    }

    get_team(State(state), Path(id)).await
}

async fn delete_team(State(state): State<AppState>, path: Path<String>) -> impl IntoResponse {
    let id = path.0;
    let res = sqlx::query("DELETE FROM teams WHERE id = ?")
        .bind(&id)
        .execute(&state.db)
        .await;

    if res.is_err() {
        return (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({ "error": "Team not found" })),
        )
            .into_response();
    }

    (StatusCode::NO_CONTENT).into_response()
}

// ---- User routes -----------------------------------------------------------------------
#[derive(Deserialize)]
struct UserCreateRequest {
    name: String,
    email: String,
    role_id: String,
    team_id: Option<String>,
    restaurant_id: String,
}

#[derive(Deserialize)]
struct UserUpdateRequest {
    name: Option<String>,
    email: Option<String>,
    role_id: Option<String>,
    team_id: Option<String>,
    restaurant_id: Option<String>,
    avatar_url: Option<String>,
    status: Option<String>,
}

#[derive(Serialize)]
struct UserResponse {
    id: String,
    email: String,
    name: String,
    role_id: String,
    team_id: Option<String>,
    restaurant_id: String,
    avatar_url: Option<String>,
    status: String,
    created_at: String,
}

async fn list_users(State(state): State<AppState>) -> impl IntoResponse {
    let users = sqlx::query_as::<_, (String, String, String, String, String, Option<String>, String, Option<String>, String, String)>(
        "SELECT id, email, password_hash, name, role_id, team_id, restaurant_id, avatar_url, status, created_at FROM users"
    )
    .fetch_all(&state.db)
    .await
    .unwrap();

    let users: Vec<UserResponse> = users
        .into_iter()
        .map(|(id, email, _, name, role_id, team_id, rid, avatar, status, ct)| UserResponse {
            id,
            email,
            name,
            role_id,
            team_id,
            restaurant_id: rid,
            avatar_url: avatar,
            status,
            created_at: ct,
        })
        .collect();

    (StatusCode::OK, Json(users)).into_response()
}

async fn create_user(
    State(state): State<AppState>,
    req: axum::http::Request<axum::body::Body>,
) -> impl IntoResponse {
    let body = json_body(req).await.unwrap_or_else(|e| {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": e.1 })),
        )
            .into_response();
    });

    let email = sanitize_email(&body.email);
    if email.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "Email required" })),
        )
            .into_response();
    }

    let now = Utc::now().to_rfc3339();
    let id = Uuid::new_v4().to_string();

    let res = sqlx::query(
        "INSERT INTO users (id, email, password_hash, name, role_id, team_id, restaurant_id, avatar_url, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(&email)
    .bind("")
    .bind(&body.name)
    .bind(&body.role_id)
    .bind(body.team_id)
    .bind(&body.restaurant_id)
    .bind("")
    .bind("active")
    .bind(&now)
    .execute(&state.db)
    .await;

    if let Err(e) = res.await {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": format!("Failed: {}", e) })),
        )
            .into_response();
    }

    let user = sqlx::query_as::<_, (String, String, String, String, String, Option<String>, String, Option<String>, String, String)>(
        "SELECT id, email, password_hash, name, role_id, team_id, restaurant_id, avatar_url, status, created_at FROM users WHERE id = ?"
    )
    .bind(&id)
    .fetch_optional(&state.db)
    .await
    .unwrap();

    match user {
        Some((id, email, _, name, role_id, team_id, rid, avatar, status, ct)) => (
            StatusCode::CREATED,
            Json(UserResponse {
                id,
                email,
                name,
                role_id,
                team_id,
                restaurant_id: rid,
                avatar_url: avatar,
                status,
                created_at: ct,
            }),
        ),
        None => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": "Failed to fetch created user" })),
        ),
    }
    .into_response()
}

async fn get_user(State(state): State<AppState>, path: Path<String>) -> impl IntoResponse {
    let id = path.0;
    let user = sqlx::query_as::<_, (String, String, String, String, String, Option<String>, String, Option<String>, String, String)>(
        "SELECT id, email, password_hash, name, role_id, team_id, restaurant_id, avatar_url, status, created_at FROM users WHERE id = ?"
    )
    .bind(&id)
    .fetch_optional(&state.db)
    .await
    .unwrap();

    match user {
        Some((id, email, _, name, role_id, team_id, rid, avatar, status, ct)) => (
            StatusCode::OK,
            Json(UserResponse {
                id,
                email,
                name,
                role_id,
                team_id,
                restaurant_id: rid,
                avatar_url: avatar,
                status,
                created_at: ct,
            }),
        ),
        None => (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({ "error": "User not found" })),
        ),
    }
    .into_response()
}

async fn update_user(
    State(state): State<AppState>,
    path: Path<String>,
    req: axum::http::Request<axum::body::Body>,
) -> impl IntoResponse {
    let id = path.0;
    let body = json_body(req).await.unwrap_or_else(|e| {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": e.1 })),
        )
            .into_response();
    });

    let email = body.email.as_deref().map(|s| sanitize_email(s));
    let mut sql = String::from("UPDATE users SET ");
    let mut params: Vec<String> = Vec::new();

    if let Some(e) = &email {
        sql.push_str("email = ?, ");
        params.push(e.clone());
    }
    if let Some(name) = body.name {
        sql.push_str("name = ?, ");
        params.push(name);
    }
    if let Some(role_id) = body.role_id {
        sql.push_str("role_id = ?, ");
        params.push(role_id);
    }
    if let Some(team_id) = &body.team_id {
        sql.push_str("team_id = ?, ");
        params.push(team_id.clone());
    }
    if let Some(restaurant_id) = &body.restaurant_id {
        sql.push_str("restaurant_id = ?, ");
        params.push(restaurant_id.clone());
    }
    if let Some(avatar_url) = &body.avatar_url {
        sql.push_str("avatar_url = ?, ");
        params.push(avatar_url.clone());
    }
    if let Some(status) = &body.status {
        sql.push_str("status = ?, ");
        params.push(status.clone());
    }
    sql.push_str("updated_at = ?, ");
    params.push(Utc::now().to_rfc3339());
    sql.push_str("WHERE id = ?");
    params.push(id.clone());

    let res = sqlx::query(&sql)
        .bind(&params)
        .execute(&state.db)
        .await;

    if res.is_err() {
        return (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({ "error": "User not found" })),
        )
            .into_response();
    }

    get_user(State(state), Path(id)).await
}

async fn delete_user(State(state): State<AppState>, path: Path<String>) -> impl IntoResponse {
    let id = path.0;
    let res = sqlx::query("DELETE FROM users WHERE id = ?")
        .bind(&id)
        .execute(&state.db)
        .await;

    if res.is_err() {
        return (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({ "error": "User not found" })),
        )
            .into_response();
    }

    (StatusCode::NO_CONTENT).into_response()
}

// ---- Role routes -----------------------------------------------------------------------
#[derive(Deserialize)]
struct RoleCreateRequest {
    name: String,
    level: i32,
    can_edit_levels_above: i32,
}

#[derive(Serialize)]
struct RoleResponse {
    id: String,
    name: String,
    level: i32,
    can_edit_levels_above: i32,
}

async fn list_roles(State(state): State<AppState>) -> impl IntoResponse {
    let roles = sqlx::query_as::<_, (String, String, i32, i32)>(
        "SELECT id, name, level, can_edit_levels_above FROM roles"
    )
    .fetch_all(&state.db)
    .await
    .unwrap();

    let roles: Vec<RoleResponse> = roles
        .into_iter()
        .map(|(id, name, level, can_edit)| RoleResponse {
            id,
            name,
            level,
            can_edit_levels_above: can_edit,
        })
        .collect();

    (StatusCode::OK, Json(roles)).into_response()
}

async fn create_role(
    State(state): State<AppState>,
    req: axum::http::Request<axum::body::Body>,
) -> impl IntoResponse {
    let body = json_body(req).await.unwrap_or_else(|e| {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": e.1 })),
        )
            .into_response();
    });

    if body.level < 1 || body.level > 4 {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "Level must be between 1 and 4" })),
        )
            .into_response();
    }

    let id = format!("r{}", Uuid::new_v4().simple());
    let now = Utc::now().to_rfc3339();

    let res = sqlx::query(
        "INSERT INTO roles (id, name, level, can_edit_levels_above) VALUES (?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(&body.name)
    .bind(body.level)
    .bind(body.can_edit_levels_above)
    .execute(&state.db)
    .await;

    if let Err(e) = res.await {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": format!("Failed: {}", e) })),
        )
            .into_response();
    }

    (
        StatusCode::CREATED,
        Json(RoleResponse {
            id,
            name: body.name,
            level: body.level,
            can_edit_levels_above: body.can_edit_levels_above,
        }),
    )
        .into_response()
}

async fn get_role(State(state): State<AppState>, path: Path<String>) -> impl IntoResponse {
    let id = path.0;
    let role = sqlx::query_as::<_, (String, String, i32, i32)>(
        "SELECT id, name, level, can_edit_levels_above FROM roles WHERE id = ?"
    )
    .bind(&id)
    .fetch_optional(&state.db)
    .await
    .unwrap();

    match role {
        Some((id, name, level, can_edit)) => (
            StatusCode::OK,
            Json(RoleResponse {
                id,
                name,
                level,
                can_edit_levels_above: can_edit,
            }),
        ),
        None => (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({ "error": "Role not found" })),
        ),
    }
    .into_response()
}

async fn delete_role(State(state): State<AppState>, path: Path<String>) -> impl IntoResponse {
    let id = path.0;
    let res = sqlx::query("DELETE FROM roles WHERE id = ?")
        .bind(&id)
        .execute(&state.db)
        .await;

    if res.is_err() {
        return (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({ "error": "Role not found" })),
        )
            .into_response();
    }

    (StatusCode::NO_CONTENT).into_response()
}

// ---- Auth routes -----------------------------------------------------------------------
#[derive(Deserialize)]
struct RegisterAuthRequest {
    email: String,
    password: String,
}

#[derive(Deserialize)]
struct LoginAuthRequest {
    email: String,
    password: String,
}

async fn register(
    State(state): State<AppState>,
    Json(payload): Json<RegisterAuthRequest>,
) -> impl IntoResponse {
    let hashed = hash(&payload.password, DEFAULT_COST).unwrap();
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    let restaurant_id = format!("res_{}", Uuid::new_v4().simple());
    let team_id = format!("team_{}", Uuid::new_v4().simple());

    sqlx::query(
        "INSERT INTO restaurants (id, name, created_at) VALUES (?, ?, ?)"
    )
    .bind(&restaurant_id)
    .bind("My Restaurant")
    .bind(&now)
    .execute(&state.db)
    .await
    .unwrap();

    sqlx::query(
        "INSERT INTO teams (id, restaurant_id, name, description, owner_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(&team_id)
    .bind(&restaurant_id)
    .bind("Main Branch")
    .bind("Primary location")
    .bind(&id)
    .bind(&now)
    .execute(&state.db)
    .await
    .unwrap();

    let result = sqlx::query(
        "INSERT INTO users (id, email, password_hash, name, role_id, team_id, restaurant_id, avatar_url, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(&payload.email)
    .bind(&hashed)
    .bind(payload.email.split('@').next().unwrap_or("Owner"))
    .bind("r1")
    .bind(&team_id)
    .bind(&restaurant_id)
    .bind("")
    .bind("active")
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
    Json(payload): Json<LoginAuthRequest>,
) -> impl IntoResponse {
    let user = sqlx::query_as::<_, User>(
        "SELECT * FROM users WHERE email = ?"
    )
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
                role: user.role_id.clone(),
                team_id: user.team_id.clone(),
                restaurant_id: user.restaurant_id.clone(),
                exp: expiration,
            };

            let token = encode(
                &Header::default(),
                &claims,
                &EncodingKey::from_secret(JWT_SECRET.as_ref()),
            )
            .unwrap();

            return (
                StatusCode::OK,
                Json(AuthResponse {
                    token,
                    role: user.role_id,
                    team_id: user.team_id,
                    restaurant_id: user.restaurant_id,
                }),
            )
                .into_response();
        }
    }

    (StatusCode::UNAUTHORIZED, "Invalid credentials").into_response()
}

// ---- Radar route (existing, kept untouched) ---------------------------------------------
#[derive(Deserialize)]
struct WhatsAppBillRequest {
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
    Json(payload): Json<WhatsAppBillRequest>,
) -> impl IntoResponse {
    println!(
        "Simulating WhatsApp bill send to {} for table {}",
        payload.phone, payload.table_id
    );

    let response = WhatsAppResponse {
        ok: true,
        message_id: format!(
            "wamid.mock.{}",
            Uuid::new_v4()
                .to_string()
                .replace("-", "")
                .chars()
                .take(10)
                .collect::<String>()
        ),
    };

    (StatusCode::OK, Json(response)).into_response()
}

// ---- Delivery tracking (existing, kept untouched) ---------------------------------------
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

    let routes = vec![
        // 1. Original (Near, South East)
        vec![
            [12.9360, 77.6230],
            restaurant_loc,
            [12.9330, 77.6266],
            [12.9312, 77.6268],
            [12.9290, 77.6270],
            [12.9279, 77.6271],
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
        ],
    ];

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    let mut deliveries = Vec::new();

    for (i, route) in routes.iter().enumerate() {
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
