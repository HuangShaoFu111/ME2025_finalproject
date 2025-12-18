(function() {
    const gameArea = document.getElementById("gameArea");
    const scoreEl = document.getElementById("score");
    const timeEl = document.getElementById("time");
    const startBtn = document.getElementById("startBtn");

    const modal = document.getElementById("gameOverModal");
    const finalScoreEl = document.getElementById("finalScore");
    const uploadStatusEl = document.getElementById("uploadStatus");
    const modalRestartBtn = document.getElementById("modalRestartBtn");

    let hitCount = 0;
    let score = 0;
    let timeLeft = 60;
    let timerInterval;
    let isPlaying = false;
    const MAX_BALLS = 3; 
    const SCORE_PER_HIT = 10; 

    // 🛡️ 防作弊參數
    let lastClickTime = 0;
    const HUMAN_LIMIT_MS = 80; // 人類極限手速
    let serverNonce = "";

    let gameHash = 0;
    function updateHash(x, y) { gameHash = (gameHash + x + y + 17) % 999999; }

    startBtn.addEventListener("click", startGame);
    modalRestartBtn.addEventListener("click", startGame);

    gameArea.addEventListener("mousedown", (e) => {
        if (!isPlaying) return;

        // 🛡️ 1. 檢查是否為真實硬體觸發
        if (!e.isTrusted) {
            console.warn("⚠️ Script detected: Untrusted Event");
            return;
        }

        const target = e.target.closest('.target-ball');
        if (target) {
            // 🛡️ 2. 隱形陷阱球檢測
            if (target.classList.contains('trap-ball')) {
                score -= 100; // 重罰
                scoreEl.textContent = score;
                target.remove();
                spawnBall(true);
                return;
            }

            handleHit(target, e);
        }
    });

    function startGame() {
        fetch('/api/start_game', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ game_name: 'whac' })
        })
        .then(res => res.json())
        .then(data => {
            if(data.status === 'success') serverNonce = data.nonce;
        });
        
        gameHash = 0;
        score = 0;
        timeLeft = 60;
        isPlaying = true;
        lastClickTime = 0;
        hitCount = 0;
        scoreEl.textContent = score;
        timeEl.textContent = timeLeft;
        modal.classList.add("hidden");
        startBtn.disabled = true;
        startBtn.textContent = "AIM TRAINER...";
        startBtn.style.opacity = "0.5";

        gameArea.innerHTML = '';
        
        for (let i = 0; i < MAX_BALLS; i++) { spawnBall(false); }
        spawnBall(true); // 初始陷阱

        clearInterval(timerInterval);
        timerInterval = setInterval(updateTimer, 1000);
    }

    function handleHit(ballElement, e) {
        const now = performance.now();
        if (now - lastClickTime < HUMAN_LIMIT_MS) return; 
        lastClickTime = now;

        score += SCORE_PER_HIT;
        hitCount++;
        scoreEl.textContent = score;

        const rect = ballElement.getBoundingClientRect();
        const areaRect = gameArea.getBoundingClientRect();
        const x = (rect.left - areaRect.left) + (rect.width / 2) - 30;
        const y = (rect.top - areaRect.top) + (rect.height / 2) - 30;
        createExplosion(x, y);

        ballElement.remove();
        spawnBall(false);
        updateHash(Math.floor(e.clientX), Math.floor(e.clientY)); // 記錄點擊座標特徵
    }

    function spawnBall(isTrap = false) {
        if (!isPlaying) return;

        const size = 70;
        const ball = document.createElement("div");
        ball.classList.add("target-ball");
        
        if (isTrap) {
            ball.classList.add("trap-ball");
            ball.style.opacity = "0"; 
            ball.style.zIndex = "10"; 
        }

        ball.style.width = size + "px";
        ball.style.height = size + "px";
        ball.style.display = "block";

        const maxX = gameArea.clientWidth - size;
        const maxY = gameArea.clientHeight - size;

        let x, y, overlap;
        let attempts = 0;
        do {
            x = Math.random() * maxX;
            y = Math.random() * maxY;
            overlap = false;

            const existingBalls = document.querySelectorAll('.target-ball');
            for (let other of existingBalls) {
                const dist = Math.sqrt(Math.pow(x - other.offsetLeft, 2) + Math.pow(y - other.offsetTop, 2));
                if (dist < size + 10) { overlap = true; break; }
            }
            attempts++;
        } while (overlap && attempts < 10);

        ball.style.left = x + "px";
        ball.style.top = y + "px";

        if (!isTrap) {
            ball.innerHTML = '<div class="inner-circle"></div><div class="crosshair"></div>';
            ball.animate([{ transform: 'scale(0)' }, { transform: 'scale(1)' }], { duration: 150, easing: 'ease-out' });
        }

        gameArea.appendChild(ball);
    }

    function updateTimer() {
        timeLeft--;
        timeEl.textContent = timeLeft;
        if (timeLeft <= 0) endGame();
    }

    function createExplosion(x, y) {
        const boom = document.createElement("div");
        boom.classList.add("explode-effect");
        boom.style.left = x + "px";
        boom.style.top = y + "px";
        gameArea.appendChild(boom);
        setTimeout(() => boom.remove(), 450);
    }

    async function endGame() {
        isPlaying = false;
        clearInterval(timerInterval);
        gameArea.innerHTML = '';

        startBtn.disabled = false;
        startBtn.textContent = "START TRAINING";
        startBtn.style.opacity = "1";

        finalScoreEl.textContent = score;
        uploadStatusEl.textContent = "Uploading score...";
        modal.classList.remove("hidden");

        const secureHash = await GameSecurity.getHash(score, serverNonce);

        fetch('/api/submit_score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                game_name: 'whac', 
                score: score, 
                hits: hitCount,
                hash: secureHash
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                uploadStatusEl.textContent = "✅ Data Archived";
                uploadStatusEl.style.color = "#4ade80";
            } else {
                uploadStatusEl.textContent = "❌ Archive Failed";
                uploadStatusEl.style.color = "#ef4444";
            }
        });
    }
})();