const canvas = document.getElementById("shaftCanvas");
const ctx = canvas.getContext("2d");
const depthEl = document.getElementById("depth");
const hpEl = document.getElementById("hp");

// Modal
const modal = document.getElementById("gameOverModal");
const finalScoreEl = document.getElementById("finalScore");
const uploadStatusEl = document.getElementById("uploadStatus");
const startScreen = document.getElementById("startScreen");
const startBtn = document.getElementById("startBtn");

// =========================================================
//  核心遊戲常數 
// =========================================================
const PLATFORM_SPACING = 55;          // ⭐ 關鍵修正：平台之間的理想垂直間距 (單位: 像素)
const INITIAL_PLATFORM_SPEED = 0.1;  // 平台基礎上升速度
const PLAYER_HORIZONTAL_SPEED = 0.35; // 玩家水平移動速度
const GRAVITY = 0.4;                  // 玩家重力加速度
const MAX_FALL_SPEED = 0.8;           // 最大自由落體速度限制

// 遊戲狀態 (READY -> PLAYING -> GAMEOVER)
let gameState = "READY"; 
let score = 0;
let hp = 100;
let frameCount = 0;
let gameSpeed = INITIAL_PLATFORM_SPEED;

// 玩家設定
const player = {
    x: 150, y: 100, w: 20, h: 20,
    vx: 0, vy: 0,
    onGround: false
};

// 平台設定
const platforms = [];
const platformWidth = 70;
const platformHeight = 15;

// 按鍵監聽
const keys = { ArrowLeft: false, ArrowRight: false };

// --- 事件綁定 ---
document.addEventListener("keydown", (e) => { 
    if(keys.hasOwnProperty(e.code) && gameState === "PLAYING") keys[e.code] = true; 
});
document.addEventListener("keyup", (e) => { if(keys.hasOwnProperty(e.code)) keys[e.code] = false; });
startBtn.addEventListener("click", startGame);

// --- 初始化/重置 ---
function spawnPlatform(y) {
    let type = 0;
    const rand = Math.random();
    if (rand < 0.25) type = 1; 
    else if (rand < 0.45) type = 2; 
    
    platforms.push({
        x: Math.random() * (canvas.width - platformWidth),
        y: y,
        w: platformWidth,
        h: platformHeight,
        type: type,
        active: true
    });
}

function resetState() {
    // ⭐ 關鍵修正 1: 根據固定間距生成足夠覆蓋畫面的平台
    platforms.length = 0;
    const platformCount = Math.ceil(canvas.height / PLATFORM_SPACING) + 2; // 確保有足夠的平台覆蓋整個畫布
    
    for(let i = 0; i < platformCount; i++) {
        // 從底部往上生成，間距使用 PLATFORM_SPACING
        spawnPlatform(canvas.height - 100 - i * PLATFORM_SPACING); 
    }
    
    player.x = 150; 
    player.y = 100;
    player.vy = 0;
    
    score = 0;
    hp = 100;
    frameCount = 0;
    gameSpeed = INITIAL_PLATFORM_SPEED; 
    
    depthEl.innerText = score;
    hpEl.innerText = hp;
    hpEl.style.color = '#4ade80';

    modal.classList.add("hidden");
}

function startGame() {
    if (gameState === "PLAYING") return;
    
    resetState();
    startScreen.classList.add("hidden"); 
    gameState = "PLAYING";
    requestAnimationFrame(gameLoop); 
}

// --- 核心更新 ---
function update() {
    if(gameState !== "PLAYING") return;

    frameCount++;
    score = Math.floor(frameCount / 10);
    depthEl.innerText = score;

    gameSpeed = INITIAL_PLATFORM_SPEED + (score / 5000); 

    // 1. 玩家水平移動
    if (keys.ArrowLeft) player.vx = -PLAYER_HORIZONTAL_SPEED;
    else if (keys.ArrowRight) player.vx = PLAYER_HORIZONTAL_SPEED;
    else player.vx = 0; 

    player.x += player.vx;
    
    // 邊界檢查
    if (player.x < 0) player.x = 0;
    if (player.x + player.w > canvas.width) player.x = canvas.width - player.w;

    // 2. 玩家垂直移動
    player.vy = Math.min(player.vy + GRAVITY, MAX_FALL_SPEED);
    player.y += player.vy;

    // 3. 平台移動與生成
    platforms.forEach(p => p.y -= gameSpeed);

    // ⭐ 關鍵修正 2: 檢查最底下的平台是否已經足夠高，然後在底部生成新平台
    // 檢查最後一個平台是否已經進入畫面，如果底部還有空間，就生成新的
    const lastPlatform = platforms[platforms.length - 1];
    if (lastPlatform && lastPlatform.y <= canvas.height - PLATFORM_SPACING) {
        spawnPlatform(canvas.height); 
    }

    // 移除過頂部的平台
    if (platforms.length > 0 && platforms[0].y + platformHeight < 0) {
        platforms.shift();
    }
    
    // 4. 碰撞檢測與修正
    let wasOnGround = player.onGround;
    player.onGround = false;

    platforms.forEach(p => {
        if (
            player.vy >= 0 && 
            player.x + player.w > p.x &&
            player.x < p.x + p.w &&
            player.y + player.h >= p.y &&
            player.y + player.h <= p.y + platformHeight
        ) {
            if (p.type === 2) return; 

            player.y = p.y - player.h;
            player.vy = 0;
            player.onGround = true;
            
            if (p.type === 1) { 
                if (!wasOnGround) { 
                    hp = Math.max(0, hp - 5);
                }
                hpEl.style.color = 'red';
            } else {
                hpEl.style.color = '#4ade80';
            }
        }
    });

    // 平台帶玩家上升
    if (player.onGround) {
         player.y -= gameSpeed; 
    }
    
    // 5. 頂部尖刺傷害
    if (player.y < 10) {
        if (player.y < 5) { 
            hp = Math.max(0, hp - 10);
        } else {
            hp = Math.max(0, hp - 3);
        }
        player.y = 10;
        player.vy = 0; 
    }

    hpEl.innerText = Math.floor(hp);

    // 6. 死亡判定
    if (player.y > canvas.height || hp <= 0) {
        gameOver();
    }
}

// --- 繪圖 ---
function draw() {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 畫平台
    platforms.forEach(p => {
        if(p.type === 0) ctx.fillStyle = "#4ade80"; // Normal
        if(p.type === 1) ctx.fillStyle = "#ef4444"; // Spikes (Red)
        if(p.type === 2) ctx.fillStyle = "rgba(255, 255, 255, 0.2)"; // Fake
        
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.fillStyle;
        ctx.fillRect(p.x, p.y, p.w, p.h);
        
        // 尖刺特效
        if(p.type === 1) {
             ctx.beginPath();
             for(let i=0; i<p.w; i+=10) {
                 ctx.moveTo(p.x + i, p.y);
                 ctx.lineTo(p.x + i + 5, p.y - 10);
                 ctx.lineTo(p.x + i + 10, p.y);
             }
             ctx.fill();
        }
    });

    // 畫玩家
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#facc15";
    ctx.fillStyle = "#facc15";
    ctx.fillRect(player.x, player.y, player.w, player.h);
    // 眼睛
    ctx.fillStyle = "black";
    ctx.shadowBlur = 0;
    
    let eyeOffset = player.vx < 0 ? 2 : (player.vx > 0 ? 12 : 7);
    ctx.fillRect(player.x + eyeOffset, player.y + 5, 4, 4);
    ctx.fillRect(player.x + eyeOffset + 7, player.y + 5, 4, 4);

}

// --- 遊戲迴圈/結束 ---
function gameLoop() {
    if(gameState === "PLAYING") {
        update();
    }
    draw(); 
    requestAnimationFrame(gameLoop);
}

function gameOver() {
    gameState = "GAMEOVER";
    modal.classList.remove("hidden");
    finalScoreEl.innerText = score;
    startScreen.classList.remove("hidden"); 
    
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

// 初始啟動
resetState(); 
gameState = "READY"; 
gameLoop();