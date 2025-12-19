# WebAssembly 防作弊模組編譯指南

這個專案包含一個 Rust 編寫的 WebAssembly (Wasm) 模組，用於將分數雜湊邏輯隱藏在二進位檔中。

## 前置需求

1. 安裝 Rust: https://rustup.rs/
2. 安裝 wasm-pack: https://rustwasm.github.io/wasm-pack/installer/

## 編譯步驟

在終端機中進入 `wasm_project` 資料夾並執行：

```bash
cd wasm_project
wasm-pack build --target web --out-dir ../static/wasm
```

這將會產生以下檔案：
- `../static/wasm/anticheat.js`
- `../static/wasm/anticheat_bg.wasm`

## 系統整合

系統已經設定好會自動載入 `/static/wasm/anticheat.js`。
如果不進行編譯，系統將會使用 JavaScript 的備用邏輯 (但安全性較低)。



