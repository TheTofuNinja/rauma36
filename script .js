let gameTime = 0;

const gameTimeElement = document.getElementById("game-time");
const addButton = document.getElementById("add-time");
const removeButton = document.getElementById("remove-time");


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
