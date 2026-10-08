import re

with open('backend/src/main.rs', 'r') as f:
    content = f.read()

# 1. Update schema
old_schema = """    sqlx::query(
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
    .unwrap();"""

new_schema = """    let queries = vec![
        "PRAGMA foreign_keys = ON;",
        "CREATE TABLE IF NOT EXISTS restaurants (id TEXT PRIMARY KEY, name TEXT NOT NULL, created_at TEXT NOT NULL);",
        "CREATE TABLE IF NOT EXISTS teams (id TEXT PRIMARY KEY, restaurant_id TEXT NOT NULL, name TEXT NOT NULL, description TEXT, owner_id TEXT, created_at TEXT NOT NULL, FOREIGN KEY(restaurant_id) REFERENCES restaurants(id));",
        "CREATE TABLE IF NOT EXISTS roles (id TEXT PRIMARY KEY, name TEXT NOT NULL, level INTEGER NOT NULL, can_edit_levels_above INTEGER NOT NULL);",
        "DROP TABLE IF EXISTS users;",
        "CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, name TEXT NOT NULL, role_id TEXT NOT NULL, team_id TEXT, restaurant_id TEXT NOT NULL, avatar_url TEXT, status TEXT NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY(role_id) REFERENCES roles(id), FOREIGN KEY(team_id) REFERENCES teams(id), FOREIGN KEY(restaurant_id) REFERENCES restaurants(id));",
        "INSERT OR IGNORE INTO roles (id, name, level, can_edit_levels_above) VALUES ('r1', 'Owner', 1, 1), ('r2', 'Store Manager', 2, 2), ('r3', 'Cashier', 3, 999), ('r4', 'Janitor', 4, 999);"
    ];
    for q in queries {
        sqlx::query(q).execute(&pool).await.unwrap();
    }"""
content = content.replace(old_schema, new_schema)

# 2. Update User struct
old_user = """struct User {
    id: String,
    email: String,
    password_hash: String,
    role: String,
    created_at: String,
}"""
new_user = """struct User {
    id: String,
    email: String,
    #[serde(skip_serializing)]
    password_hash: String,
    name: String,
    role_id: String,
    team_id: Option<String>,
    restaurant_id: String,
    avatar_url: Option<String>,
    status: String,
    created_at: String,
}"""
content = content.replace(old_user, new_user)

# 3. Update register handler
old_reg = """    let role = "owner";

    let result = sqlx::query(
        "INSERT INTO users (id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(&payload.email)
    .bind(&hashed)
    .bind(role)
    .bind(&now)
    .execute(&state.db)
    .await;"""
new_reg = """    let restaurant_id = format!("res_{}", Uuid::new_v4().simple());
    let team_id = format!("team_{}", Uuid::new_v4().simple());
    
    let _ = sqlx::query("INSERT INTO restaurants (id, name, created_at) VALUES (?, ?, ?)")
        .bind(&restaurant_id).bind("My Restaurant").bind(&now).execute(&state.db).await;

    let _ = sqlx::query("INSERT INTO teams (id, restaurant_id, name, description, owner_id, created_at) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(&team_id).bind(&restaurant_id).bind("Main Branch").bind("Primary location").bind(&id).bind(&now).execute(&state.db).await;

    let result = sqlx::query(
        "INSERT INTO users (id, email, password_hash, name, role_id, team_id, restaurant_id, avatar_url, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&id).bind(&payload.email).bind(&hashed).bind(payload.email.split('@').next().unwrap_or("Owner"))
    .bind("r1").bind(&team_id).bind(&restaurant_id).bind("").bind("active").bind(&now)
    .execute(&state.db).await;"""
content = content.replace(old_reg, new_reg)

# 4. Update login claims
content = content.replace("struct AuthResponse {\n    token: String,\n    role: String,\n}", "struct AuthResponse {\n    token: String,\n    role: String,\n    team_id: Option<String>,\n    restaurant_id: String,\n}")
content = content.replace("struct Claims {\n    sub: String,\n    role: String,\n    exp: usize,\n}", "struct Claims {\n    sub: String,\n    role: String,\n    team_id: Option<String>,\n    restaurant_id: String,\n    exp: usize,\n}")
content = content.replace("role: user.role.clone(),", "role: user.role_id.clone(),\n                team_id: user.team_id.clone(),\n                restaurant_id: user.restaurant_id.clone(),")
content = content.replace("AuthResponse { token, role: user.role }", "AuthResponse { token, role: user.role_id, team_id: user.team_id, restaurant_id: user.restaurant_id }")

with open('backend/src/main.rs', 'w') as f:
    f.write(content)
