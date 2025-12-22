(function() {
    const {{ obf.var_salt }} = "{{ shared_salt }}";

    const {{ obf.fn_hash }} = async ({{ obf.var_score }}, {{ obf.var_nonce }}, {{ obf.var_ts }}) => {
        const msg = `${ {{ obf.var_score }} }:${ {{ obf.var_nonce }} }:${ {{ obf.var_ts }} }:${ {{ obf.var_salt }} }`;
        const encoder = new TextEncoder();
        const data = encoder.encode(msg);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    window.GameSecurity = {
        async getHash(score, nonce) {
            const timestamp = Date.now();
            let finalHash = "";

            try {
                const wasmModule = await import('/static/wasm/anticheat.js');
                await wasmModule.default(); 
                finalHash = wasmModule.generate_score_hash(score, nonce, timestamp);
            } catch (e) {
                finalHash = await {{ obf.fn_hash }}(score, nonce, timestamp);
            }

            return `${finalHash}|${timestamp}`;
        }
    };
})();
