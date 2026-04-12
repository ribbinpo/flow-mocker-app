use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::Instant;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ProxyRequest {
    method: String,
    url: String,
    headers: HashMap<String, String>,
    query_params: HashMap<String, String>,
    body: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ProxyResponse {
    status: u16,
    headers: HashMap<String, String>,
    body: serde_json::Value,
    latency_ms: u64,
}

#[tauri::command]
async fn proxy_request(request: ProxyRequest) -> Result<ProxyResponse, String> {
    let start = Instant::now();

    let client = reqwest::Client::new();

    let method = request
        .method
        .parse::<reqwest::Method>()
        .map_err(|e| format!("Invalid method: {}", e))?;

    let mut builder = client.request(method, &request.url);

    for (key, value) in &request.headers {
        builder = builder.header(key, value);
    }

    if !request.query_params.is_empty() {
        builder = builder.query(&request.query_params);
    }

    if let Some(body) = &request.body {
        let parsed: serde_json::Value =
            serde_json::from_str(body).map_err(|e| format!("Invalid JSON body: {}", e))?;
        builder = builder.json(&parsed);
    }

    let response = builder.send().await.map_err(|e| e.to_string())?;

    let status = response.status().as_u16();

    let headers: HashMap<String, String> = response
        .headers()
        .iter()
        .map(|(k, v)| (k.to_string(), v.to_str().unwrap_or("").to_string()))
        .collect();

    let body: serde_json::Value = response
        .json()
        .await
        .unwrap_or(serde_json::Value::Null);

    let latency_ms = start.elapsed().as_millis() as u64;

    Ok(ProxyResponse {
        status,
        headers,
        body,
        latency_ms,
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![proxy_request])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
