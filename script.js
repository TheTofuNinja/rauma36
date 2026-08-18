let gameTime = 0;
let timer = null;

let items = [
    { name: "Rewrite Tiếng Anh", count: 0, limit: 20, reward: Math.round(60 / 3) },
    { name: "Vocabulary Tiếng Anh", count: 0, limit: 20, reward: Math.round(300 / 3) }
];

const gameTimeElement = document.getElementById("game-time");
const itemsContainer = document.getElementById("items-container");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn") || document.getElementById("stop-btn");

function renderItems() {
    itemsContainer.innerHTML = "";

    for (let i = 0; i < items.length; i++) {
        let item = items[i];
        let isMaxed = item.count >= item.limit;

        // Tính phút và giây thưởng
        let rewardMin = Math.floor(item.reward / 60);
        let rewardSec = item.reward % 60;
        let rewardText = rewardMin > 0 ? `${rewardMin} phút ${rewardSec > 0 ? rewardSec + 's' : ''}` : `${rewardSec} giây`;

        let itemElement = document.createElement("div");
        itemElement.classList.add("item-card");
        itemElement.innerHTML = `
            <h3>${item.name}</h3>
            <p>Đã làm: <span>${item.count}/${item.limit}</span></p>
            <p>Thưởng: <span>${rewardText} (1/3 thời gian)</span></p>

            <div class="card-actions">
                <button 
                    onclick="completeItem(${i})" 
                    ${isMaxed ? "disabled" : ""}
                    class="btn-complete">
                    ${isMaxed ? "Đã đạt giới hạn" : "Hoàn thành"}
                </button>
                <button onclick="deleteItem(${i})" class="btn-delete">Xóa</button>
            </div>
        `;

        itemsContainer.appendChild(itemElement);
    }
}
// --- HÀM XÓA HOẠT ĐỘNG ---
function deleteItem(index) {
    // Xóa 1 phần tử tại vị trí index khỏi mảng items
    items.splice(index, 1);
    
    // Cập nhật lại giao diện sau khi xóa
    renderItems();
}

function addNewItem(event) {
    event.preventDefault();

    const nameInput = document.getElementById("item-name");
    const limitInput = document.getElementById("item-limit");
    const rewardInput = document.getElementById("item-reward");

    // Lấy số phút nhập vào, chia 3 rồi đổi ra giây
    const rewardMinutes = parseFloat(rewardInput.value) / 3;
    const rewardSeconds = Math.round(rewardMinutes * 60);

    const newItem = {
        name: nameInput.value,
        count: 0,
        limit: parseInt(limitInput.value),
        reward: rewardSeconds
    };

    items.push(newItem);
    renderItems();

    nameInput.value = "";
    limitInput.value = "";
    rewardInput.value = "";
}

function completeItem(index) {
    let item = items[index];

    if (item.count >= item.limit) return;

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
    if (gameTime <= 0) {
        alert("Bạn chưa có thời gian chơi! Hãy làm bài tập bên dưới trước.");
        return;
    }

    if (timer !== null) return;

    if (startBtn) startBtn.disabled = true;
    if (pauseBtn) pauseBtn.disabled = false;

    timer = setInterval(() => {
        if (gameTime > 0) {
            gameTime--;
            updateDisplay();
        } else {
            pauseGame();
            alert("⏰ Hết giờ chơi!");
        }
    }, 1000);
}

function pauseGame() {
    clearInterval(timer);
    timer = null;

    if (startBtn) startBtn.disabled = false;
    if (pauseBtn) pauseBtn.disabled = true;
}

updateDisplay();
renderItems();
