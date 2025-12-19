use wasm_bindgen.prelude::*;
use sha2::{Sha256, Digest};

// 硬編碼的 Salt，編譯後會隱藏在二進位檔中，比純文字 JS 難找
const SHARED_SALT: &str = "ArcadeSuperSecretSalt_2025_NoCheating!";

#[wasm_bindgen]
pub fn generate_score_hash(score: i32, nonce: &str, timestamp: f64) -> String {
    // 轉換 timestamp 為整數 (毫秒)
    let ts_int = timestamp as i64;
    
    // 格式: score:nonce:timestamp:salt
    let payload = format!("{}:{}:{}:{}", score, nonce, ts_int, SHARED_SALT);
    
    let mut hasher = Sha256::new();
    hasher.update(payload);
    let result = hasher.finalize();
    
    hex::encode(result)
}


