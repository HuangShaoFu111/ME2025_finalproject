# 國立中央大學 電腦網路與程式 2025 期末專題報告

**專題名稱：Arcade Reborn - 高安全性復古街機平台**

**組員：** (請自行填入)  
**日期：** 2025年1月

---

## 摘要 (Abstract)

本專題「Arcade Reborn」旨在打造一個整合多款經典懷舊遊戲（如貪吃蛇、俄羅斯方塊、恐龍快跑等）的網頁平台。不同於一般的網頁小遊戲集合，本專案的核心亮點在於**高度整合的後端架構**與**多層次的防作弊安全機制**。我們採用 Python Flask 作為核心後端，SQLite 進行資料持久化，並結合 Rust 編譯的 WebAssembly (Wasm) 模組來強化前端邏輯的安全性。

系統具備完整的使用者帳號管理、角色權限分級（一般/管理員/嫌疑犯）、虛擬貨幣商店系統以及即時排行榜。針對網頁遊戲常見的作弊問題（如修改分數封包、加速齒輪），我們設計了一套包含「啟發式邏輯驗證」、「密碼學雜湊簽章」、「動態程式碼混淆」與「Wasm 二進位防護」的縱深防禦體系，確保競賽的公平性。

---

## 目錄 (Table of Contents)

1. [專題動機 (Motivation)](#1-專題動機-motivation)
2. [系統架構 (System Architecture)](#2-系統架構-system-architecture)
3. [功能介紹 (Features)](#3-功能介紹-features)
    - [使用者系統與權限](#31-使用者系統與權限-user--permissions)
    - [遊戲陣容與實作](#32-遊戲陣容與實作-games)
    - [商店與經濟系統](#33-商店與經濟系統-shop--economy)
4. [資料庫設計 (Database Design)](#4-資料庫設計-database-design)
5. [安全性與防作弊機制 (Security & Anti-Cheat)](#5-安全性與防作弊機制-security--anti-cheat)
    - [L1: 啟發式邏輯驗證](#l1-啟發式邏輯驗證-heuristic-validation)
    - [L2: 密碼學雜湊與 Nonce 機制](#l2-密碼學雜湊與-nonce-機制)
    - [L3: WebAssembly 二進位防護](#l3-webassembly-二進位防護)
    - [L4: 動態程式碼混淆](#l4-動態程式碼混淆-dynamic-obfuscation)
6. [關鍵程式碼解析 (Code Highlights)](#6-關鍵程式碼解析-code-highlights)
7. [結論 (Conclusion)](#7-結論-conclusion)
8. [參考文獻 (References)](#8-參考文獻-references)
9. [附錄 (Appendix)](#9-附錄-appendix)

---

## 1. 專題動機 (Motivation)

在 Web 技術高度發展的今天，網頁遊戲因其跨平台、免安裝的特性重新受到歡迎。然而，傳統的前端遊戲往往缺乏安全性，玩家可以輕易透過瀏覽器開發者工具（F12）修改變數或偽造 API 請求來竄改分數，這對於追求競技排名的平台來說是致命傷。

本專題的動機在於：
1.  **重現經典**：以現代 Web 技術（Canvas, ES6+）重製經典街機遊戲，提供流暢的遊玩體驗。
2.  **全端實踐**：從資料庫設計、後端 API 撰寫到前端渲染，完整實踐全端開發流程。
3.  **資安挑戰**：探討並實作如何在不依賴封閉客戶端的情況下，在開放的 Web 環境中建立可信的計分系統。

---

## 2. 系統架構 (System Architecture)

本專案採用經典的 MVC (Model-View-Controller) 架構變體，並引入了現代化的 Wasm 技術。

### 2.1 技術堆疊 (Tech Stack)
*   **Backend**: Python Flask (輕量級、高彈性路由)
*   **Database**: SQLite (輕便、單一檔案部署，適合嵌入式場景)
*   **Frontend**: HTML5, CSS3, Vanilla JavaScript (無框架依賴，極致效能)
*   **Security Core**: Rust (編譯為 WebAssembly) + Werkzeug Security
*   **Protocol**: HTTP/1.1, JSON API

### 2.2 路由機制 (Routing Mechanism)

系統路由由 `app.py` 統一管理，採用裝飾器模式定義。所有的靜態資源由 Flask 自動服務，動態邏輯則通過 API 端點處理。

![Routing Flowchart](placeholder_for_routing_flowchart_screenshot)
*(此處預留空間放路由流程圖截圖，可參考 finalreport/flow.html)*

**主要路由表：**
*   `/`: 首頁/登入頁面
*   `/lobby`: 遊戲大廳（需登入）
*   `/game/<name>`: 動態載入指定遊戲頁面
*   `/api/start_game`: 初始化遊戲 Session，獲取 Nonce
*   `/api/submit_score`: 提交分數（含資安驗證）
*   `/dynamic/anticheat.js`: 動態生成的混淆防作弊腳本

---

## 3. 功能介紹 (Features)

### 3.1 使用者系統與權限 (User & Permissions)

我們設計了完善的角色權限系統 (Role-Based Access Control)，將使用者分為三類：

1.  **一般玩家 (User)**: 可遊玩、存分、購買道具。
2.  **管理員 (Admin)**: 擁有上帝視角，可進入 `/admin` 面板，查看所有使用者狀態、刪除違規帳號、手動解除或標記嫌疑犯。
3.  **嫌疑犯 (Suspect)**: 當系統偵測到作弊行為時，自動標記為嫌疑犯。嫌疑犯的分數可能被凍結或標記，且後台會保留詳細違規紀錄。

**使用者認證流程**：
*   使用 `werkzeug.security` 進行密碼雜湊 (PBKDF2/SHA256)，確保資料庫外洩時密碼不被還原。
*   登入狀態維持依賴 Flask Session (Signed Cookies)，防止客戶端偽造 Session ID。

![Profile Page Screenshot](placeholder_for_profile_page_screenshot)
*(個人資料頁面截圖，展示頭像上傳與資料修改)*

### 3.2 遊戲陣容與實作 (Games)

平台收錄了六款經典遊戲，皆使用 HTML5 Canvas 進行 60 FPS 渲染。

1.  **Snake (貪吃蛇)**:
    *   **邏輯**: 使用 Queue 處理輸入緩衝，防止快速按鍵導致自殺。實作了 `integrityCheck` 變數隨每一步驟累加，防止直接修改分數變數。
    *   **渲染**: 格狀繪製，動態計算蛇身插值動畫。
2.  **Tetris (俄羅斯方塊)**:
    *   **邏輯**: 實作 SRS (Super Rotation System) 旋轉演算法，包含踢牆 (Wall Kick) 機制。
3.  **Dino (恐龍快跑)**:
    *   **邏輯**: 物理引擎模擬重力與跳躍拋物線，速度隨時間線性增加。
4.  **Memory (記憶翻牌)**:
    *   **邏輯**: 狀態機管理 (Idle, OneFlipped, TwoFlipped, Matched)。
5.  **Whac-A-Mole (打地鼠)**:
    *   **邏輯**: 時間驅動的隨機生成機制，嚴格檢測 CPS (Clicks Per Second)。
6.  **Shaft (小朋友下樓梯)**:
    *   **邏輯**: 碰撞檢測 (AABB)，平台隨機生成與滾動機制。

![Game Screenshot Mosaic](placeholder_for_game_screenshots)
*(此處預留空間放六款遊戲的縮圖拼貼)*

### 3.3 商店與經濟系統 (Shop & Economy)

我們實作了虛擬經濟系統，增加平台黏著度。

*   **代幣轉換**: 遊戲分數依據難度係數 (Ticket Rate) 自動轉換為代幣。
    *   例如：Tetris 100分 = 1 代幣；Snake 1 蘋果 = 2 代幣。
*   **商品類型**:
    *   **Title**: 顯示在排行榜的稱號。
    *   **Avatar Frame**: 頭像外框。
    *   **Lobby Effect**: 大廳背景特效 (如 Matrix 數字雨)。

---

## 4. 資料庫設計 (Database Design)

使用 **SQLite** 作為關聯式資料庫，Schema 設計符合第三正規化 (3NF)。

### Schema 概覽

1.  **`users` 表**:
    *   `id` (PK), `username`, `password` (Hashed), `avatar`
    *   `is_admin`, `is_suspect` (狀態旗標)
    *   `spent_points` (已消費點數), `equipped_*` (當前裝備)
    
2.  **`scores` 表**:
    *   `id` (PK), `user_id` (FK), `game_name`, `score`
    *   `tickets_earned`: 記錄該次遊玩獲得的代幣
    *   `timestamp`: 用於繪製成長曲線

3.  **`user_items` 表**:
    *   `user_id` (FK), `item_id`: 記錄購買歷史，防止重複購買。

**初始化邏輯 (`database.py`)**:
系統具備「自我修復」能力。在 `init_db()` 中使用 `add_column_if_missing` 函數，當程式碼更新導致 Schema 變更時，自動 ALTER Table 補齊欄位，無需手動刪庫重建。

```python
# database.py 片段
def add_column_if_missing(cur, table, column_def):
    # 檢查欄位是否存在，不存在則動態新增
    ...
```

---

## 5. 安全性與防作弊機制 (Security & Anti-Cheat)

這是本專題技術含量最高的部分，我們採用「縱深防禦 (Defense in Depth)」策略。

### L1: 啟發式邏輯驗證 (Heuristic Validation)

後端 `validate_game_logic` 函數會根據物理極限檢查成績合理性。

*   **不可能的反應時間**: 0.5秒內獲得高分。
*   **Snake**: 移動步數 < 分數 * 2 (瞬移外掛)。
*   **Tetris**: 方塊數 vs 消行數比例異常 (Auto-dropper 檢測)。
*   **Whac**: 點擊數 vs 時間 (CPS > 12 判定為連點程式)。

### L2: 密碼學雜湊與 Nonce 機制

為了防止封包重放 (Replay Attack) 與竄改 (Tampering)：

1.  **Start Game**: 伺服器生成唯一 `Nonce` (UUID) 並存入 Session。
2.  **End Game**: 前端計算 Hash = `SHA256(Score + Nonce + Timestamp + Salt)`。
3.  **Verify**: 後端收到分數後，取出 Session 中的 Nonce 與伺服器 Salt 進行相同計算比對。

**Salt 管理**: `SHARED_SALT` 被編譯進 Wasm binary 或由後端動態注入，絕不以明文形式直接暴露在 HTML 中。

### L3: WebAssembly 二進位防護

為了避免駭客直接閱讀 JS 原始碼找出雜湊邏輯，我們使用 Rust 撰寫雜湊算法並編譯為 Wasm。

*   **優勢**: Wasm 為二進位格式，反編譯難度遠高於 JS。
*   **實作**: `wasm_project/src/lib.rs` 定義了 `generate_score_hash` 函數。

### L4: 動態程式碼混淆 (Dynamic Obfuscation)

針對不支援 Wasm 的環境，我們提供 JS 備案，但該 JS 檔案 (`/dynamic/anticheat.js`) 是由 Flask 動態生成的。
*   **變數隨機化**: 每次請求，變數名稱（如 `score`, `hash`）都會被替換為隨機字串（如 `aXy1z`, `b99qq`），讓自動化腳本無法鎖定特定變數名攻擊。

---

## 6. 關鍵程式碼解析 (Code Highlights)

### 6.1 後端防作弊核心 (Python)

```python
# app.py: 綜合驗證流程
@app.route('/api/submit_score', methods=['POST'])
def submit_score():
    # 1. 頻率限制 (Rate Limiting)
    if len(history) >= RATE_LIMIT_MAX_SUBMITS: return error("Too fast")
    
    # 2. 驗證 Hash (Signature Verification)
    expected_str = f"{score}:{server_nonce}:{client_ts}:{SHARED_SALT}"
    if client_hash != hashlib.sha256(expected_str.encode()).hexdigest():
        return error("Hash mismatch")

    # 3. 邏輯驗證 (Logic Check)
    is_valid, reason = validate_game_logic(game_name, score, data, duration)
    if not is_valid:
        database.mark_user_suspect(user_id) # 自動標記嫌疑犯
        return error(f"Cheat detected: {reason}")
```

### 6.2 前端安全模組 (JavaScript/Wasm)

```javascript
// templates/anticheat.js: 優先使用 Wasm，失敗則降級
window.GameSecurity = {
    async getHash(score, nonce) {
        try {
            // 嘗試載入 WebAssembly
            const wasmModule = await import('/static/wasm/anticheat.js');
            await wasmModule.default();
            return wasmModule.generate_score_hash(score, nonce, Date.now());
        } catch (e) {
            // 降級使用混淆過的 JS
            return await {{ obf.fn_hash }}(score, nonce, Date.now());
        }
    }
};
```

---

## 7. 結論 (Conclusion)

Arcade Reborn 專題成功展示了如何將現代 Web 技術應用於復古遊戲平台。我們不僅實現了流暢的遊戲體驗與豐富的商城系統，更深入探討了 Web 安全議題。透過 Python 後端的嚴格把關、Rust/Wasm 的前端防護以及資料庫的完善設計，我們構建了一個既有趣又公平的競技環境。

未來展望包括：
1.  **多人連線對戰**: 使用 WebSocket 實作即時對戰 (如俄羅斯方塊對戰)。
2.  **更強的 AI 偵測**: 訓練機器學習模型來識別人類與腳本的操作軌跡差異。

---

## 8. 參考文獻 (References)

1.  Flask Documentation (2024). *Pallets Projects*.
2.  MDN Web Docs - WebAssembly API.
3.  "Secure Game Architecture: Anti-Cheat Logic in Web Games", *GDC 2023*.
4.  SQLite Optimization Guide for Web Apps.

---

## 9. 附錄 (Appendix)

### 安裝與執行指南

1.  **環境需求**: Python 3.9+, Rust (選用, 用於編譯 Wasm)
2.  **安裝依賴**:
    ```bash
    pip install flask
    ```
3.  **初始化資料庫**:
    系統第一次啟動時會自動建立 `arcade.db`。
4.  **啟動伺服器**:
    ```bash
    python app.py
    ```
5.  **瀏覽器訪問**: 打開 `http://localhost:5000`

**(報告結束)**


