# Retro Arcade Hub - 防作弊機制深度評估 (Strict Assessment)

**報告日期:** 2025/12/18  
**評估原則:** 嚴格、誠實、不留情面  
**核心結論:** 系統已從「初級玩具」升級為「有模有樣的防護」，但仍有顯著的架構級漏洞。

---

## 1. 殘酷的現實：為什麼你還是擋不住真正的高手？

雖然你在最新的更新中引入了 **動態混淆 (Dynamic Obfuscation)** 與 **Wasm 支援**，甚至加入了 **時間戳記驗證**，這些改進確實抬高了門檻，但請認清一個事實：

> **只要 Client 端擁有計算 Hash 所需的所有原料（Secret Salt, Nonce, Algorithm），他就一定能偽造出合法的 Hash。**

這不是你的程式寫得爛，而是 Web 架構的原罪。你把保險箱的鑰匙（Salt）雖然藏在了動態生成的變數裡、甚至藏在 Wasm 二進位檔裡，但鑰匙終究還是在使用者的電腦上。只要攻擊者有足夠的耐心（或使用動態調試器如 Chrome DevTools Protocol），他就能找出那個 Salt，或者直接 Hook 你的 `GameSecurity.getHash` 函數。

**你的現狀：** 你成功擋住了 95% 只會用「F12 改分數」的小白，但擋不住剩下 5% 懂逆向工程的資工系學生。

---

## 2. 新增機制的漏洞分析 (Vulnerability Analysis)

### 2.1 動態混淆 (Dynamic Obfuscation)
*   **你的做法:** 每次請求 `/dynamic/anticheat.js` 時，隨機生成變數名稱（如 `var_salt` 變成 `xKjLsM`）。
*   **實際效果:** **雞肋**。
    *   **原因:** 雖然變數名變了，但程式邏輯結構沒變。攻擊者只要看 `window.GameSecurity.getHash` 的回傳值，根本不需要去解讀那些亂碼變數。他只要在 Console 裡執行 `GameSecurity.getHash(99999, "nonce")`，你的防護函式反而變成了他的作弊工具。
    *   **評分:** ⭐⭐☆☆☆ (2/5)

### 2.2 Wasm (WebAssembly) 整合
*   **你的做法:** 嘗試引入 Rust 編譯的 Wasm 來隱藏雜湊邏輯。
*   **實際效果:** **概念正確，但實作有誤**。
    *   **漏洞:** 在 `templates/anticheat.js` 中，你留了一個巨大的後門 —— **JS Fallback (備案)**。
    *   ```javascript
        } catch (e) {
            // Wasm 未編譯或載入失敗，使用 JS 備案
            finalHash = await {{ obf.fn_hash }}(score, nonce, timestamp);
        }
        ```
    *   **攻擊手法:** 攻擊者只要攔截網路請求，故意讓 `.wasm` 檔案載入失敗（或直接在瀏覽器停用 Wasm），你的程式就會乖乖地吐出用 JS 寫的、包含 Salt 的備案邏輯。這叫「此地無銀三百兩」。
    *   **評分:** ⭐☆☆☆☆ (1/5) - *有了 Fallback，Wasm 的保護力直接歸零。*

### 2.3 時間戳記驗證 (Timestamp Validation)
*   **你的做法:** 限制 Hash 必須包含 `timestamp`，且誤差不能超過 30 秒。
*   **實際效果:** **有效，但有限**。
    *   這確實防止了攻擊者拿昨天的封包來今天重送 (Replay Attack)。但對於「即時篡改」的攻擊（中間人攻擊 MITM），攻擊者完全可以即時生成一個當下的 Timestamp。

---

## 3. 既有機制的隱憂 (Existing Concerns)

### 3.1 邏輯驗證的盲點
你在後端 `app.py` 寫了很多 `if` 判斷（如贪吃蛇步數檢查）。
*   **優點:** 這是目前最有效的防線。
*   **盲點:** 你只檢查了「最終結果」。
    *   **例子:** 貪吃蛇的 `moves < score * 2`。如果我寫一個腳本，每吃一個蘋果就故意原地轉圈圈浪費步數，就能完美繞過你的「效率檢測」。
    *   **結論:** 你的邏輯檢查太過依賴「統計特徵」，而非「過程重現」。

### 3.2 頻率限制 (Rate Limiting)
*   **問題:** `_score_submit_log` 是一個 Python Dictionary。
*   **後果:** 只要你的伺服器重啟（部署時很常見），所有人的限制就會被重置。如果你未來擴展成多台伺服器，這個機制會直接失效。這是不合格的生產環境設計。

---

## 4. 具體改進建議 (Actionable Advice)

我不需要你寫出完美的系統，但如果你想讓這份期末作業拿高分，請解決以下幾個「低級錯誤」：

1.  **移除 JS Fallback:** 
    *   狠下心來。如果 Wasm 載入失敗，就直接讓遊戲崩潰或禁止提交分數。不要給攻擊者留退路。
    
2.  **加強 Wasm 與 JS 的耦合:**
    *   不要只讓 Wasm 算 Hash。讓 Wasm 負責一部分的遊戲邏輯（例如：由 Wasm 計算貪食蛇的下一步位置）。這樣攻擊者如果停用 Wasm，遊戲根本玩不了。

3.  **Input Replay (重播機制):**
    *   這是唯一能徹底解決問題的方法。不要只傳 `score`，傳送 `[Up, Right, Up, Left...]` 的按鍵序列。
    *   後端拿這個序列重跑一次。如果最後分數跟前端送的不一樣，就是作弊。

4.  **環境變數:**
    *   `app.secret_key` 和 `SHARED_SALT` 還在程式碼裡裸奔。請把它們移到 `.env` 檔案或環境變數中。

---

## 5. 總結

你現在的系統像是一個**裝了三道鎖的紙門**。
鎖（Hash, Nonce, Timestamp）很精密，但門本身（前端 JS 架構）一捅就破。

*   **目前評分:** **B-** (有想法，但實作有明顯邏輯漏洞)
*   **改進後潛力:** **A+** (如果能移除 JS Fallback 並實作 Input Replay)

---
*Assessed by Honest AI Security Auditor.*


