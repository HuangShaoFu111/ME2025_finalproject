const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");

// Modal 元素
const modal = document.getElementById("gameOverModal");
const finalScoreEl = document.getElementById("finalScore");
const uploadStatusEl = document.getElementById("uploadStatus");

let gridSize = 20;
let snake = [{ x: 200, y: 200 }];
let direction = { x: 0, y: 0 };
let food = spawnFood();
let score = 0;
let loop = null;

// ⭐ BUG 修復關鍵：增加一個變數鎖定目前的輸入
let isProcessingInput = false;

document.addEventListener("keydown", changeDirection);

// 啟動遊戲
startGame();

function startGame() {
    loop = setInterval(gameLoop, 100);
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r); // 使用新的 Canvas API
    ctx.fill();
    ctx.closePath();
}

function gameLoop() {
    // 每個 Loop 開始時，解鎖輸入，允許下一次轉向
    isProcessingInput = false;

    let head = {
        x: snake[0].x + direction.x * gridSize,
        y: snake[0].y + direction.y * gridSize
    };

    /* === 無限地圖 === */
    if (head.x < 0) head.x = canvas.width - gridSize;
    if (head.x >= canvas.width) head.x = 0;
    if (head.y < 0) head.y = canvas.height - gridSize;
    if (head.y >= canvas.height) head.y = 0;

    // 撞自己 (從第4節開始判斷即可，優化效能)
    if (snake.length > 3) {
        for (let i = 3; i < snake.length; i++) {
            if (snake[i].x === head.x && snake[i].y === head.y) {
                return gameOver();
            }
        }
    }

    snake.unshift(head);

    // 吃食物
    if (head.x === food.x && head.y === food.y) {
        score++;
        scoreEl.textContent = score;
        food = spawnFood();
    } else {
        snake.pop(); // 沒吃到就移除尾巴
    }

    draw();
}

function draw() {
    // 1. 清空畫布
    ctx.fillStyle = "#0d1117";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. 畫網格 (美化)
    drawGrid();

    // 3. 畫食物 (帶有呼吸燈特效)
    let glow = Math.abs(Math.sin(Date.now() / 200)) * 10 + 5; // 呼吸計算
    ctx.shadowBlur = glow;
    ctx.shadowColor = "#ff3b3b";
    ctx.fillStyle = "#ff3b3b";
    
    // 讓食物稍微小一點點，看起來更精緻
    let padding = 2;
    roundRect(ctx, food.x + padding, food.y + padding, gridSize - padding*2, gridSize - padding*2, 5);

    // 4. 畫蛇
    snake.forEach((part, index) => {
        if (index === 0) {
            // 頭部
            ctx.fillStyle = "#7CFF7C";  
            ctx.shadowColor = "#7CFF7C";
            ctx.shadowBlur = 15;
            roundRect(ctx, part.x, part.y, gridSize, gridSize, 4);
            
            // 畫眼睛 (增加細節)
            drawEyes(part);
        } else {
            // 身體 (漸層綠色)
            ctx.fillStyle = `hsl(120, 100%, ${50 - (index * 2)}%)`; // 尾巴越來越暗
            ctx.shadowBlur = 0;
            ctx.shadowColor = "transparent";
            roundRect(ctx, part.x + 1, part.y + 1, gridSize - 2, gridSize - 2, 2);
        }
    });

    // 重置陰影，避免影響其他繪圖
    ctx.shadowBlur = 0; 
}

function drawGrid() {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
    }
    for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();
}

function drawEyes(head) {
    ctx.fillStyle = "black";
    ctx.shadowBlur = 0;
    
    let eyeSize = 3;
    let offsetX = 5;
    let offsetY = 5;

    // 根據方向調整眼睛位置
    if (direction.x === 1) { // 右
        ctx.fillRect(head.x + 12, head.y + 4, eyeSize, eyeSize);
        ctx.fillRect(head.x + 12, head.y + 12, eyeSize, eyeSize);
    } else if (direction.x === -1) { // 左
        ctx.fillRect(head.x + 4, head.y + 4, eyeSize, eyeSize);
        ctx.fillRect(head.x + 4, head.y + 12, eyeSize, eyeSize);
    } else if (direction.y === -1) { // 上
        ctx.fillRect(head.x + 4, head.y + 4, eyeSize, eyeSize);
        ctx.fillRect(head.x + 12, head.y + 4, eyeSize, eyeSize);
    } else { // 下或靜止
        ctx.fillRect(head.x + 4, head.y + 12, eyeSize, eyeSize);
        ctx.fillRect(head.x + 12, head.y + 12, eyeSize, eyeSize);
    }
}

function spawnFood() {
    // 確保食物不會生在蛇身上
    let newFood;
    let isOnSnake;
    do {
        newFood = {
            x: Math.floor(Math.random() * (canvas.width / gridSize)) * gridSize,
            y: Math.floor(Math.random() * (canvas.height / gridSize)) * gridSize
        };
        isOnSnake = snake.some(part => part.x === newFood.x && part.y === newFood.y);
    } while (isOnSnake);
    return newFood;
}

function changeDirection(e) {
    // ⭐ 如果這個 Frame 已經處理過輸入，則忽略後續按鍵，防止自殺
    if (isProcessingInput) return;

    const key = e.key;
    let moved = false;

    if (key === "ArrowUp" && direction.y === 0) {
        direction = { x: 0, y: -1 };
        moved = true;
    }
    else if (key === "ArrowDown" && direction.y === 0) {
        direction = { x: 0, y: 1 };
        moved = true;
    }
    else if (key === "ArrowLeft" && direction.x === 0) {
        direction = { x: -1, y: 0 };
        moved = true;
    }
    else if (key === "ArrowRight" && direction.x === 0) {
        direction = { x: 1, y: 0 };
        moved = true;
    }

    // 只有當方向真正改變時，才鎖定輸入
    if (moved) {
        isProcessingInput = true;
    }
}

function gameOver() {
    clearInterval(loop);
    
    // 顯示結算視窗
    modal.classList.remove("hidden");
    finalScoreEl.textContent = score;
    uploadStatusEl.textContent = "Uploading score...";
    uploadStatusEl.style.color = "#888";

    // 上傳分數
    fetch('/api/submit_score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            game_name: 'snake',
            score: score
        })
    })
    .then(response => response.json())
    .then(data => {
        if(data.status === 'success') {
            uploadStatusEl.textContent = "✅ Score saved successfully!";
            uploadStatusEl.style.color = "#4ade80"; // Green
        } else {
            uploadStatusEl.textContent = "❌ Save failed (Not logged in?)";
            uploadStatusEl.style.color = "#ef4444"; // Red
        }
    })
    .catch(error => {
        console.error('Error:', error);
        uploadStatusEl.textContent = "⚠️ Network Error";
    });
}