# ME2025_finalproject
# [cite_start]期末專題提案: Retro Arcade Hub 懷舊小遊戲平台 [cite: 1]

[cite_start]**組員**: 黃紹輔 111303307、詹智翔 111303555 [cite: 2]  
[cite_start]**日期**: 2024/12/02 [cite: 3]

---

## [cite_start]1. 選擇網站主題與專題題目 [cite: 4]

* [cite_start]**網站主題**: 遊戲網站 [cite: 5]
* [cite_start]**專題題目**: 「Retro Arcade Hub 懷舊小遊戲平台」(GameBox 休閒遊戲站) [cite: 6]
* [cite_start]**專題目標**: 打造一個集結反應力、記憶力與經典街機風格的整合型遊戲平台，提供使用者放鬆娛樂並具備競技排名的功能。 [cite: 7, 8]

---

## [cite_start]2. 預計實作的功能與架構 [cite: 9]

### [cite_start]一、核心系統架構 (System Architecture) [cite: 10]

[cite_start]本系統採 Client-Server 架構，將前端展示與後端邏輯分離，確保資料安全性與操作流暢度。 [cite: 11]

* [cite_start]**前端 (Frontend)**: [cite: 12]
    * [cite_start]使用 HTML5, CSS3 進行頁面切版與 RWD (Responsive Web Design) 響應式設計。 [cite: 13]
    * [cite_start]使用 JavaScript (Canvas API) 處理四款遊戲的核心運作邏輯與 DOM 操作。 [cite: 14]
* [cite_start]**後端 (Backend)**: [cite: 15]
    * [cite_start]使用 Python Flask 框架。 [cite: 16]
    * [cite_start]負責處理前端發送的請求 (Request)、會員驗證邏輯 (Session 管理) 以及 API 路由控制。 [cite: 17, 18]
* [cite_start]**資料庫 (Database)**: [cite: 19]
    * [cite_start]使用 SQLite 關聯式資料庫。 [cite: 20]
    * [cite_start]設計資料表以儲存使用者帳號資訊 (users) 與各項遊戲分數紀錄 (scores)。 [cite: 21, 22]

### [cite_start]二、前後端與資料庫互動模式 (Interaction Flow) [cite: 23]

[cite_start]資料互動主要透過 HTTP Request (GET/POST) 進行，流程如下： [cite: 24]

1.  [cite_start]**會員驗證流 (Auth Flow)**: [cite: 25]
    * [cite_start]使用者在前端表單輸入帳密 -> 後端接收 POST 請求 -> 查詢資料庫 (SELECT) 比對帳密。 [cite: 26]
    * [cite_start]若比對成功：後端建立 Session 並回傳登入成功訊息，前端跳轉至大廳。 [cite: 27]
    * [cite_start]若失敗/格式錯誤：後端回傳錯誤代碼，前端顯示警告視窗 (Alert)。 [cite: 28]
2.  [cite_start]**遊戲分數上傳 (Score Submission)**: [cite: 29]
    * [cite_start]當玩家遊戲結束 (Game Over) 時，前端 JavaScript 自動抓取最終分數。 [cite: 30]
    * [cite_start]透過 AJAX/Fetch 發送異步請求將「分數」與「使用者 ID」傳送至後端。 [cite: 31]
    * [cite_start]後端接收後執行寫入資料庫 (INSERT) 動作，更新該玩家的歷史紀錄。 [cite: 32]
3.  [cite_start]**排行榜資料獲取 (Data Retrieval)**: [cite: 33]
    * [cite_start]當使用者進入排行榜頁面，前端發送請求。 [cite: 34]
    * [cite_start]後端對資料庫執行排序查詢 (ORDER BY score DESC)，撈取前 10 筆資料。 [cite: 35]
    * [cite_start]後端將資料包裝成 JSON 或 HTML 格式回傳，前端渲染成表格顯示。 [cite: 36]

### [cite_start]三、頁面跳轉關係 (Page Routing) [cite: 37]

[cite_start]本系統規劃以下頁面路由，並設有權限檢查機制 (未登入者強制導回首頁並跳出警告)： [cite: 38]

1.  [cite_start]**公開層 (Public Zone)**: [cite: 39]
    * [cite_start]**首頁/登入頁 (Login)**: 系統入口，提供登入與註冊按鈕。 [cite: 40]
    * [cite_start]**註冊頁 (Register)**: 填寫資料，成功後跳轉回登入頁。 [cite: 41]
2.  [cite_start]**會員層 (Member Zone - 需登入狀態)**: [cite: 42]
    * [cite_start]**遊戲大廳 (Lobby)**: 登入後的中心頁面，顯示歡迎訊息，可點擊不同卡片跳轉至四款不同的遊戲頁面。 [cite: 43, 44]
    * [cite_start]**遊戲頁面 (Game Room)**: [cite: 45]
        * [cite_start]包含四個獨立 URL (如 `/game/snake`, `/game/dino` 等)。 [cite: 46]
        * [cite_start]遊戲結束後提供「再來一局 (Reload)」或「返回大廳 (Back to Lobby)」按鈕。 [cite: 47]
    * [cite_start]**排行榜 (Leaderboard)**: 可從大廳進入，上方有標籤 (Tab) 可切換查看四種不同遊戲的排名，並可跳轉回大廳。 [cite: 48, 50]

---

## [cite_start]3. 預計分工 [cite: 49]

* [cite_start]**組員 A: 黃紹輔** [cite: 51]
    * [cite_start]**系統建置**: 負責資料庫設計 (Schema Design: Users/Scores)、會員註冊與登入系統 (Flask Auth)、Python 環境建置。 [cite: 52]
    * [cite_start]**遊戲開發**: 負責「反應力挑戰」與「恐龍跑酷」之遊戲邏輯撰寫。 [cite: 53]
    * [cite_start]**整合**: 負責後端 API 串接與處理分數上傳 (INSERT) 功能。 [cite: 54]
* [cite_start]**組員 B: 詹智翔** [cite: 55]
    * [cite_start]**前端設計**: 負責網站整體 UI/UX 切版 (HTML/CSS/RWD)、遊戲大廳頁面、排行榜頁面設計。 [cite: 56]
    * [cite_start]**遊戲開發**: 負責「翻牌記憶遊戲」與「經典貪食蛇」之遊戲邏輯撰寫。 [cite: 57]
    * [cite_start]**整合**: 負責將遊戲 Canvas 嵌入網頁並處理分數顯示 (DOM) 邏輯。 [cite: 58]

---

## [cite_start]4. 開發時程規劃 [cite: 59]

* [cite_start]**第一週 (12/01-12/07): 核心架構與基礎建設** [cite: 60]
    * [cite_start]12/02 - 12/03: 完成 GitHub Repo 設定、SQLite 資料庫規劃、Flask 前後端環境建置。 [cite: 61, 62]
    * [cite_start]12/04 - 12/05: 完成會員系統 (註冊/登入/登出) 及頁面基礎切版。 [cite: 63]
    * [cite_start]12/06 - 12/08: 開始製作第一波遊戲 (每人各負責一款)，目標是達到「可遊玩」狀態。 [cite: 64]
* [cite_start]**第二週 (12/08 - 12/14): 遊戲完工與排行榜串接** [cite: 65]
    * [cite_start]12/09 - 12/12: 完成剩下兩款遊戲開發，並優化遊戲體驗 (Game Over 判定、計分邏輯)。 [cite: 66]
    * [cite_start]12/13 - 12/14: 實作排行榜功能，將遊戲分數寫入資料庫 (INSERT) 並讀取顯示 (SELECT)。 [cite: 67]
    * [cite_start]12/15: 本地端全系統整合測試，確保 Database 與 Frontend 互動無誤。 [cite: 68]
* [cite_start]**收尾階段 (12/16 - 12/18): 除錯與簡報準備** [cite: 69]
    * [cite_start]12/16: 全站測試 (Bug Fixing)，檢查 Session 登入狀態是否在跳轉頁面時保持，並修正 UI 細節。 [cite: 70]
    * [cite_start]12/17: 製作期末報告投影片 (含架構圖、Demo 流程)，上傳程式碼至 GitHub 並 Highlight 特色。 [cite: 71, 72]
    * [cite_start]12/18: 期末專題發表。 [cite: 73]
