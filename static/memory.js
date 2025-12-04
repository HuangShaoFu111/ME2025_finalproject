const board = document.getElementById("gameBoard");
const movesEl = document.getElementById("moves");
const timerEl = document.getElementById("timer");
const restartBtn = document.getElementById("restartBtn");

let timer = 0;
let moves = 0;
let firstCard = null;
let secondCard = null;
let lockBoard = false;
let interval;

// 使用簡單 emoji 做卡片
let icons = ["🍎","🍌","🍒","🍇","🍉","🥝","🍑","🍍"];
let cards = [];

function startGame() {
    timer = 0;
    moves = 0;
    firstCard = null;
    secondCard = null;
    lockBoard = false;

    timerEl.textContent = 0;
    movesEl.textContent = 0;

    clearInterval(interval);
    interval = setInterval(() => {
        timer++;
        timerEl.textContent = timer;
    }, 1000);

    // 產生 16 張卡（8 組）
    cards = [...icons, ...icons]
        .sort(() => Math.random() - 0.5);

    board.innerHTML = "";

    cards.forEach((icon) => {
        const card = document.createElement("div");
        card.classList.add("card");
        card.dataset.icon = icon;
        card.textContent = "❓";

        card.addEventListener("click", () => flipCard(card));

        board.appendChild(card);
    });
}

function flipCard(card) {
    if (lockBoard || card === firstCard) return;

    card.classList.add("flipped");
    card.textContent = card.dataset.icon;

    if (!firstCard) {
        firstCard = card;
        return;
    }

    secondCard = card;
    moves++;
    movesEl.textContent = moves;

    checkMatch();
}

function checkMatch() {
    if (firstCard.dataset.icon === secondCard.dataset.icon) {
        matchFound();
    } else {
        lockBoard = true;
        setTimeout(() => {
            firstCard.classList.remove("flipped");
            secondCard.classList.remove("flipped");

            firstCard.textContent = "❓";
            secondCard.textContent = "❓";

            resetTurn();
        }, 800);
    }
}

function matchFound() {
    firstCard.classList.add("matched");
    secondCard.classList.add("matched");
    firstCard.removeEventListener("click", flipCard);
    secondCard.removeEventListener("click", flipCard);

    resetTurn();

    if (document.querySelectorAll(".matched").length === cards.length) {
        setTimeout(() => {
            alert(`你完成了！共 ${moves} 次配對，用時 ${timer} 秒`);
        }, 200);
    }
}

function resetTurn() {
    [firstCard, secondCard, lockBoard] = [null, null, false];
}

restartBtn.addEventListener("click", startGame);

startGame();
