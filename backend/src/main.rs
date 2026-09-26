use axum::{
    routing::get,
    Router,
    Json,
};
use serde::Serialize;
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};

#[derive(Serialize)]
struct SystemStatus {
    status: String,
    version: String,
    tally_connected: bool,
}

#[tokio::main]
async fn main() {
    // Basic CORS setup to allow the Next.js frontend to communicate
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/api/health", get(health_check))
        .layer(cors);

    let addr = SocketAddr::from(([127, 0, 0, 1], 8000));
    println!("Rust backend listening on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn health_check() -> Json<SystemStatus> {
    Json(SystemStatus {
        status: "operational".to_string(),
        version: "1.0.0".to_string(),
        tally_connected: true,
    })
}
