let gameTime = 0;
let timer = null;
let items = [
    {name: "Rewrite Tiếng Anh", count: 0, limit: 20, reward: 60},
    {name: "Vocabulary Tiếng Anh", count: 0, limit: 20, reward: 300}
];

const gameTimeElement = document.getElementById("game-time");
const itemsContainer = document.getElementById("items-container");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");

function renderItems() {
    itemsContainer.innerHTML = "";

    for (let i = 0; i < items.length; i++) {
        let item = items[i];
        let isMaxed = item.count >= item.limit;

        let itemElement = document.createElement("div");
        itemElement.classList.add("item-card");
        itemElement.innerHTML = `
            <h3>${item.name}</h3>
            <p>Đã làm: <span>${item.count}/${item.limit}</span></p>
            <p>Thưởng: <span>${item.reward / 60} phút</span></p>

            <button 
                onclick="completeItem(${i})" 
                ${isMaxed ? "disabled" : ""}
                style="${isMaxed ? "background-color: #ccc; cursor: not-allowed;" : "background-color: #4CAF50; color: white;"}">
                ${isMaxed ? "Đã đạt giới hạn" : "Hoàn thành"}
            </button>
        `;

        itemsContainer.appendChild(itemElement);
    }
}

function completeItem(index) {
    let item = items[index];

    if (item.count >= item.limit) {
        return;
    }
    
    item.count++;
    gameTime += item.reward;
    updateDisplay();
    renderItems();
}

function updateDisplay() {
    let minutes = Math.floor(gameTime / 60);
    let seconds = gameTime % 60;

    minutes = String(minutes).padStart(2, "0");
    seconds = String(seconds).padStart(2, "0");

    gameTimeElement.textContent = `${minutes}:${seconds}`;
}

function startGame() {
    if(gameTime <= 0 || timer !== null) return;
    startBtn.disabled = true;
    pauseBtn.disabled = false;

    timer = setInterval(() => {
        if(gameTime > 0) {
            gameTime--;
            updateDisplay();
        } else {
            pauseGame();
            
        }
    }, 1000);
}

function pauseGame() {
    clearInterval(timer);
    timer = null;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
}

updateDisplay();
renderItems();
