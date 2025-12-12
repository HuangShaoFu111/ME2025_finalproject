const canvas = document.getElementById("shaftCanvas");
const ctx = canvas.getContext("2d");
const depthEl = document.getElementById("depth");
const hpEl = document.getElementById("hp");
const startBtn = document.getElementById("startBtn");

// Modal
const modal = document.getElementById("gameOverModal");
const finalScoreEl = document.getElementById("finalScore");
const uploadStatusEl = document.getElementById("uploadStatus");

let gameState = "IDLE"; 
let score = 0;
let hp = 100;
let frameCount = 0;
let animationId = null; 
let lastTime = 0; 

// ==========================================
// 🏆 黃金參數配方 (Golden Physics Recipe)
// ==========================================
const PHYSICS = {
    gravity: 0.6,          
    moveSpeed: 3,        
    friction: 0.7,         
    jumpForce: -16,        
    maxFallSpeed: 2,      
    platformStartSpeed: 1, 
    platformAccel: 1500    
};

// 玩家設定
const initialPlayerState = {
    x: 150, y: 100, w: 20, h: 20,
    vx: 0, vy: 0,
    onGround: false,
    invincibleUntil: 0, 
    isHurt: false       
};

let player = { ...initialPlayerState };

// 平台設定
const platforms = [];
const platformWidth = 70;
const platformHeight = 15;
let platformSpeed = PHYSICS.platformStartSpeed;

// 按鍵監聽
const keys = { ArrowLeft: false, ArrowRight: false };

// 🚀 [關鍵修改] 鍵盤事件監聽：加入「按任意鍵開始」邏輯
document.addEventListener("keydown", (e) => { 
    // 1. 如果遊戲不在進行中 (IDLE 或 GAMEOVER)
    if (gameState !== "PLAYING") {
        // 排除 F1-F12、Ctrl、Alt 組合鍵，避免誤觸瀏覽器功能
        if (e.key.startsWith("F") || e.ctrlKey || e.altKey || e.metaKey) return;
        
        // 啟動遊戲
        startGame();
        e.preventDefault(); // 防止空白鍵捲動網頁
        return;
    }

    // 2. 遊戲進行中的正常操作
    // 防止按方向鍵捲動網頁
    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
    }
    if(keys.hasOwnProperty(e.code)) keys[e.code] = true; 
});

document.addEventListener("keyup", (e) => { if(keys.hasOwnProperty(e.code)) keys[e.code] = false; });

startBtn.addEventListener("click", startGame);

function startGame() {
    if (gameState === "PLAYING") return;

    if (gameState === "GAMEOVER") {
        resetGame();
    }
    
    gameState = "PLAYING";
    
    startBtn.disabled = true;
    startBtn.style.opacity = "0.5";
    startBtn.textContent = "RUNNING...";
    modal.classList.add("hidden");

    lastTime = performance.now();
    gameLoop(lastTime);
}

function resetGame() {
    score = 0;
    hp = 100;
    frameCount = 0;
    depthEl.innerText = 0;
    hpEl.innerText = 100;
    hpEl.style.color = '#4ade80';
    platformSpeed = PHYSICS.platformStartSpeed; 

    player = { ...initialPlayerState };

    platforms.length = 0;
    for(let i=0; i<7; i++) {
        spawnPlatform(100 + i * 85, true); 
    }

    const startPlatform = platforms[3]; 
    player.x = startPlatform.x + (startPlatform.w / 2) - (player.w / 2);
    player.y = startPlatform.y - player.h - 2; 
    player.vx = 0;
    player.vy = 0;
}

function spawnPlatform(y, safe = false) {
    let type = 0; 
    let hasHealth = false;

    if (!safe) {
        const rand = Math.random();
        if (rand < 0.2) type = 1;      // Spikes
        else if (rand < 0.35) type = 2; // Fake
        else if (rand < 0.45) type = 3; // Spring
        
        if (type === 0 && Math.random() < 0.05) {
            hasHealth = true;
        }
    }
    
    platforms.push({
        x: Math.random() * (canvas.width - platformWidth),
        y: y,
        w: platformWidth,
        h: platformHeight,
        type: type,
        hasHealth: hasHealth,
        isSpringActive: false 
    });
}

function update(deltaTime) {
    if(gameState !== "PLAYING") return;

    frameCount++;
    score = Math.floor(frameCount / 10);
    depthEl.innerText = score;

    // === 1. 玩家水平移動 ===
    if (keys.ArrowLeft) {
        player.vx = -PHYSICS.moveSpeed;
    } else if (keys.ArrowRight) {
        player.vx = PHYSICS.moveSpeed;
    } else {
        player.vx *= PHYSICS.friction;
        if (Math.abs(player.vx) < 0.1) player.vx = 0;
    }

    player.x += player.vx;

    if (player.x < 0) player.x = 0;
    if (player.x + player.w > canvas.width) player.x = canvas.width - player.w;

    // === 2. 垂直物理 ===
    player.vy += PHYSICS.gravity; 
    
    if (player.vy > PHYSICS.maxFallSpeed) {
        player.vy = PHYSICS.maxFallSpeed;
    }
    
    player.y += player.vy;

    // === 3. 平台移動 ===
    const speedBoost = Math.min(3, score / PHYSICS.platformAccel); 
    const currentSpeed = platformSpeed + speedBoost;
    
    platforms.forEach(p => p.y -= currentSpeed);

    if (platforms[0].y + platformHeight < 0) {
        platforms.shift();
        spawnPlatform(canvas.height);
    }

    // === 4. 碰撞檢測 ===
    player.onGround = false;
    
    const now = performance.now();
    const isInvincible = now < player.invincibleUntil;
    player.isHurt = isInvincible; 

    platforms.forEach(p => {
        if (player.vy > 0 && 
            player.x + player.w > p.x + 5 && 
            player.x < p.x + p.w - 5 &&
            player.y + player.h >= p.y &&     
            player.y + player.h <= p.y + p.h + 10 
        ) {
            if (p.type === 2) return; 

            player.y = p.y - player.h;
            player.vy = -currentSpeed; 
            player.onGround = true;

            if (p.type === 1) { // Spikes
                if (!isInvincible) {
                    takeDamage(15); 
                    player.vy = -4; 
                }
            } 
            else if (p.type === 3) { // Spring
                player.vy = PHYSICS.jumpForce; 
                p.isSpringActive = true;
                setTimeout(() => p.isSpringActive = false, 200); 
            }
            else { // Normal
                if (p.hasHealth) {
                    hp = Math.min(100, hp + 10); 
                    p.hasHealth = false; 
                    hpEl.style.color = '#4ade80';
                }
            }
        }
    });

    if (player.y < 10) {
        if (!isInvincible) {
            takeDamage(20);
            player.vy = 5; 
        }
        player.y = 10;
    }

    hpEl.innerText = Math.floor(hp);
    
    if(hp <= 30) hpEl.style.color = '#ef4444';
    else if(hp > 30 && hp < 100) hpEl.style.color = '#facc15';

    if (player.y > canvas.height || hp <= 0) {
        gameOver();
    }
}

function takeDamage(amount) {
    hp -= amount;
    player.invincibleUntil = performance.now() + 1000; 
}

function draw() {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 畫平台
    platforms.forEach(p => {
        let color = "#4ade80"; // Normal
        if(p.type === 1) color = "#ef4444"; // Spikes
        if(p.type === 2) color = "rgba(255, 255, 255, 0.2)"; // Fake
        if(p.type === 3) color = "#f472b6"; // Spring

        ctx.fillStyle = color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;

        let drawY = p.y;
        let drawH = p.h;
        if (p.type === 3 && p.isSpringActive) {
            drawY += 5;
            drawH -= 5;
        }

        ctx.fillRect(p.x, drawY, p.w, drawH);
        
        if(p.type === 1) {
             ctx.fillStyle = "#ef4444";
             ctx.beginPath();
             for(let i=0; i<p.w; i+=10) {
                 ctx.moveTo(p.x + i, p.y);
                 ctx.lineTo(p.x + i + 5, p.y - 10);
                 ctx.lineTo(p.x + i + 10, p.y);
             }
             ctx.fill();
        }

        if(p.type === 3) {
            ctx.fillStyle = "#fff";
            ctx.fillRect(p.x + 10, drawY - 3, p.w - 20, 3);
        }

        if (p.hasHealth) {
            ctx.fillStyle = "#ff0000";
            ctx.shadowColor = "#ff0000";
            ctx.font = "16px Arial";
            ctx.fillText("❤️", p.x + p.w/2 - 8, p.y - 5);
        }
    });

    // 畫玩家
    if (player.isHurt && Math.floor(performance.now() / 100) % 2 === 0) {
        // 閃爍
    } else {
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#facc15";
        ctx.fillStyle = "#facc15";
        ctx.fillRect(player.x, player.y, player.w, player.h);
        
        ctx.fillStyle = "black";
        ctx.shadowBlur = 0;
        if (keys.ArrowLeft) {
            ctx.fillRect(player.x+2, player.y+5, 4, 4);
        } else {
            ctx.fillRect(player.x+12, player.y+5, 4, 4);
        }
    }
}

function gameLoop(timestamp) {
    if(gameState === "PLAYING") {
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;
        update(deltaTime);
        draw();
        animationId = requestAnimationFrame(gameLoop);
    } else {
        draw(); 
        requestAnimationFrame(() => gameLoop(performance.now())); 
    }
}

function gameOver() {
    gameState = "GAMEOVER";
    
    startBtn.disabled = false;
    startBtn.style.opacity = "1";
    startBtn.textContent = "RETRY MISSION";

    modal.classList.remove("hidden");
    finalScoreEl.innerText = score;

    fetch('/api/submit_score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            game_name: 'shaft',
            score: score
        })
    })
    .then(res => res.json())
    .then(data => {
        if(data.status === 'success') {
            uploadStatusEl.innerText = "✅ Score Uploaded";
            uploadStatusEl.style.color = "#4ade80";
        } else {
            uploadStatusEl.innerText = "❌ Upload Failed";
        }
    });
}

// 啟動初始化
resetGame();
gameLoop(performance.now());