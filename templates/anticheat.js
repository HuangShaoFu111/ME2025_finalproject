(function() {
    // 🛡️ Dynamic Obfuscation Variables (Server-Side Generated)
    const {{ obf.var_salt }} = "{{ shared_salt }}";

    // Fallback JS Implementation
    const {{ obf.fn_hash }} = async ({{ obf.var_score }}, {{ obf.var_nonce }}, {{ obf.var_ts }}) => {
        const msg = `${ {{ obf.var_score }} }:${ {{ obf.var_nonce }} }:${ {{ obf.var_ts }} }:${ {{ obf.var_salt }} }`;
        const encoder = new TextEncoder();
        const data = encoder.encode(msg);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    window.GameSecurity = {
        /**
         * Secure Hash Generation
         * Uses Wasm if available, falls back to Obfuscated JS.
         */
        async getHash(score, nonce) {
            const timestamp = Date.now();
            let finalHash = "";

            try {
                // 嘗試動態載入編譯後的 Wasm JS 膠水程式碼
                // 注意：這需要使用者先執行 wasm-pack build
                const wasmModule = await import('/static/wasm/anticheat.js');
                
                // 初始化 Wasm
                await wasmModule.default(); 
                
                // 呼叫 Rust 函數: generate_score_hash(score, nonce, timestamp)
                finalHash = wasmModule.generate_score_hash(score, nonce, timestamp);
                console.log("🔒 Secured by WebAssembly");
                
            } catch (e) {
                // Wasm 未編譯或載入失敗，使用 JS 備案
                // console.debug("Using JS Fallback", e);
                finalHash = await {{ obf.fn_hash }}(score, nonce, timestamp);
            }

            // Return format: "HASH|TIMESTAMP"
            return `${finalHash}|${timestamp}`;
        }
    };
    
    // 移除全域變數引用，增加 Console Debug 難度
    // console.log("Security Module Loaded");
})();



