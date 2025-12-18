// 🛡️ Security Utility for Anti-Cheat Hashing
// This file handles the cryptographic signature generation for score submission.

const GameSecurity = {
    // Shared secret salt - must match the server's SHARED_SALT
    salt: "ArcadeSuperSecretSalt_2025_NoCheating!",

    /**
     * Generates a SHA-256 hash of the score payload.
     * Format: score:nonce:salt
     * @param {number} score - The final score
     * @param {string} nonce - The server-provided nonce for this session
     * @returns {Promise<string>} - The hex string of the hash
     */
    async getHash(score, nonce) {
        if (!nonce) {
            console.error("Security Error: No nonce provided!");
            return null;
        }
        const msg = `${score}:${nonce}:${this.salt}`;
        const encoder = new TextEncoder();
        const data = encoder.encode(msg);
        
        // Use Web Crypto API
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        return hashHex;
    }
};

