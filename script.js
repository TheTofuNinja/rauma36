let gameTime = 0;
let items = [
    {
        name: "Rewrite Tiếng Anh",
        count: 0,
        limit: 20,
        reward: 60
    },
    {
        name: "Vocabulary Tiếng Anh",
        count: 0,
        limit: 20,
        reward: 300
    }
];


const gameTimeElement = document.getElementById("game-time");
const addButton = document.getElementById("add-time");
const removeButton = document.getElementById("remove-time");
const itemsContainer = document.getElementById("items-container");

function renderItems() {
    itemsContainer.innerHTML = "";

    for(let i = 0; i < items.length; i++) {
        let item = items[i];

        let itemElement = document.createElement("div");
        itemElement.classList.add("item-card");
        itemElement.innerHTML = `
            <h3>${item.name}</h3>
            <p>Đã làm: <span>${item.count}/${item.limit}</span></p>
            <p>Thưởng: <span>${item.reward / 60} phút</span></p>

            <button onclick="completeItem(${i})">Hoàn thành</button>
        `;

    itemsContainer.appendChild(itemElement);
    }
}

function completeItem(index) {
    let item = items[index];

    if(item.count >= item.limit) {
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


addButton.addEventListener("click", function () {

    gameTime += 60;

    updateDisplay();
});


removeButton.addEventListener("click", function () {

    if (gameTime >= 60) {
        gameTime -= 60;
    }

    updateDisplay();
});
updateDisplay();
renderItems();
