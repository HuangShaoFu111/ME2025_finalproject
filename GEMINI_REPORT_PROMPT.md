# Role Definition
你現在是一位頂尖的資工系大學生兼全端工程師，正在撰寫一份「計算機網路與程式」的期末專題報告。你的文筆需要專業、邏輯清晰，並使用繁體中文（Traditional Chinese）。

# Task
請根據下列提供的【專案技術規格】與【程式碼細節】，撰寫一份結構完整的期末書面報告。

# Context: Project Overview
本專案是一個基於 Flask (Backend) + SQLite (Database) + Vanilla JS (Frontend) + Rust/WASM (Security) 的整合式遊戲平台「Arcade Center」。
核心特色在於「防作弊機制」的深度實作，以及完整的全端互動功能（商店、積分、排行榜、管理員後台）。

# Report Structure Requirements (必備章節)
請務必依照以下架構撰寫，並在適當位置預留截圖空間：

## 1. 系統架構與路由設計 (System Architecture & Routing)
- **描述**: 解說 Flask 後端的路由規劃。
- **必備內容**:
    - 繪製或列出路由表 (Route Table)，包含 `/` (Login), `/lobby`, `/game/<name>`, `/shop`, `/profile`, `/admin`。
    - 解說 `@app.route` 的裝飾器邏輯與 Session 驗證機制 (`login_required` 概念)。
    - **截圖預留**: `![請在此處放入 flow.html 流程圖或路由架構圖]`

## 2. 遊戲大廳與功能介紹 (Game Lobby & Features)
- **描述**: 介紹前端頁面與使用者互動流程。
- **必備內容**:
    - 列出所有遊戲：Snake, Tetris, Dino, Whac-A-Mole, Shaft, Memory。
    - 簡述每個遊戲的渲染方式（Canvas 繪圖或 DOM 操作）與核心邏輯。
    - **截圖預留**: 
        - `![請在此處放入 大廳(Lobby) 頁面截圖]`
        - `![請在此處放入 各個遊戲畫面 的拼貼截圖]`

## 3. 資料庫設計與實作 (Database Implementation)
- **描述**: 解說 SQLite 資料庫結構 (`arcade.db`)。
- **必備內容**:
    - 詳細列出 Schema：
        - `users`: 儲存帳號、雜湊密碼、管理員權限 (`is_admin`)、嫌疑標記 (`is_suspect`)。
        - `scores`: 儲存遊戲分數與轉換後的代幣 (Tickets)。
        - `user_items`: 商店購買紀錄。
    - 解說 `database.py` 中的連線與 CRUD 封裝方式。
    - **截圖預留**: `![請在此處放入 ER Model 實體關聯圖或資料庫表格截圖]`

## 4. 資安與防作弊機制 (Security & Anti-Cheat) - **重點章節**
- **描述**: 本專案的核心亮點，需詳細撰寫。
- **必備內容**:
    - **密碼安全**: 說明使用 `werkzeug.security.generate_password_hash` (scrypt/pbkdf2) 進行密碼雜湊，並解釋其安全性優於明文。
    - **角色權限 (RBAC)**: 說明 Admin 與一般使用者的權限差異（Admin 可刪除用戶、解除嫌疑、無限金幣），以及程式碼如何檢查 `session['is_admin']`。
    - **防作弊 (Anti-Cheat)**:
        1. **WASM 加密簽章**: 解釋 Rust code (`lib.rs`) 如何將 `Score + Nonce + Timestamp + Salt` 進行 SHA256 加密，防止封包篡改。
        2. **後端邏輯驗證**: 解釋 `app.py` 中的 `validate_game_logic` 如何檢查「物理極限」（例如：貪吃蛇移動步數是否合理、打地鼠點擊率 CPS 是否超越人類極限）。
        3. **Replay Attack 防護**: 說明 Timestamp 與 Nonce 的檢核機制。
    - **截圖預留**: `![請在此處放入 防作弊被觸發時的後台 Log 或前端錯誤訊息截圖]`

## 5. 商店與經濟系統 (Economy System)
- **描述**: 解說分數轉換代幣與虛擬商品購買。
- **必備內容**:
    - 解說分數換算 Tickets 的匯率 (`GAME_TICKET_RATES`)。
    - 說明購買 (`/api/buy`) 與裝備 (`/api/equip`) 的邏輯。
    - **截圖預留**: `![請在此處放入 商店頁面截圖]`

## 6. 結論與心得
- 總結全端開發的挑戰，特別是在整合 Rust WASM 與 Python Flask 上的技術收穫。

---

# Technical Details for Reference (請參考以下程式碼細節進行撰寫)

### A. 資料庫 Schema (database.py)
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT, -- Hashed
    is_admin INTEGER DEFAULT 0,
    is_suspect INTEGER DEFAULT 0, -- Anti-cheat flag
    spent_points INTEGER,
    ...
);
CREATE TABLE scores (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    game_name TEXT,
    score INTEGER,
    tickets_earned INTEGER, -- Economy
    ...
);
```

### B. 防作弊核心 (app.py)
```python
# 物理極限檢查範例
if game_name == 'snake':
    # 檢查移動步數是否超過時間內的理論最大值
    max_possible_moves = (duration * 10) * TOLERANCE + 5
    if moves > max_possible_moves:
        return False, "Speed hack detected"
```

### C. WASM 簽章 (lib.rs)
```rust
// 使用 SHA256 進行不可逆加密，Salt 被編譯進 Binary 中難以逆向
pub fn generate_score_hash(score: i32, nonce: &str, timestamp: f64) -> String {
    let payload = format!("{}:{}:{}:{}", score, nonce, timestamp, SHARED_SALT);
    sha256(payload)
}
```

### D. 路由權限控制
- 使用 `session.get('user_id')` 判斷登入。
- 使用 `dict(user).get('is_admin')` 判斷管理員，保護 `/admin` 路由。

---

# Output Format
請直接輸出 Markdown 格式的報告內容，標題層級清楚 (H1, H2, H3)，並確保語氣專業流暢。
請在每個段落適當引用上述的技術細節，以證明報告的技術深度。

