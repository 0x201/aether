use axum::{Router, routing::get};
use scalar_api_reference::axum::router;
use serde_json::json;
use std::env;

#[tokio::main]
async fn main() {
    let port = env::var("PORT").unwrap_or_else(|_| "3001".to_string());
    let addr = format!("0.0.0.0:{}", port);

    println!("Server listening on {}", addr);

    let docs_config = json!({
        "url": "/scalar",
        "theme": "kepler"
    });

    let app = Router::new()
        .merge(router("/scalar", &docs_config))
        .route("/", get(root))
        .route("/greet", get(greet));

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn root() -> &'static str {
    "Hello, World!"
}

async fn greet() -> String {
    format!("Hello, world!")
}
