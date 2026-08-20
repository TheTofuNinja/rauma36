// 1. CẤU HÌNH FIREBASE DỰ ÁN TIME MANAGER
const firebaseConfig = {
  apiKey: "AIzaSyDGo7vga_lpcmYfrbz-D9I-qLt6Pm__6fE",
  authDomain: "time-manager-backend.firebaseapp.com",
  projectId: "time-manager-backend",
  storageBucket: "time-manager-backend.firebasestorage.app",
  messagingSenderId: "559854670704",
  appId: "1:559854670704:web:54ae2c5088e2670f2a35b5",
  measurementId: "G-PCDLP66F0M"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// 2. BIẾN TOÀN CỤC
let currentUser = null;
let gameTime = 0;
let timer = null;
let items = [];

let lastResetKey = null;
let playSessionSeconds = 0;

const DAILY_RESET_HOUR = 7;
const BREAK_AFTER_SECONDS = 60 * 60;
const MAX_GAME_TIME = 4 * 60 * 60;

const gameTimeElement = document.getElementById("game-time");
const itemsContainer = document.getElementById("items-container");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");

// 3. XỬ LÝ ĐĂNG NHẬP / ĐĂNG KÝ
function handleLogin() {
    const email = document.getElementById("auth-email").value;
    const pass = document.getElementById("auth-password").value;

    if (!email || !pass) {
        alert("Vui lòng nhập đầy đủ Email và Mật khẩu!");
        return;
    }

    auth.signInWithEmailAndPassword(email, pass)
        .catch(err => alert("Lỗi đăng nhập: " + err.message));
}

function handleRegister() {
    const email = document.getElementById("auth-email").value;
    const pass = document.getElementById("auth-password").value;

    if (!email || !pass) {
        alert("Vui lòng nhập đầy đủ Email và Mật khẩu!");
        return;
    }

    auth.createUserWithEmailAndPassword(email, pass)
        .then(() => alert("Đăng ký thành công!"))
        .catch(err => alert("Lỗi đăng ký: " + err.message));
}

function logout() {
    auth.signOut();
}

// 4. LẮNG NGHE TRẠNG THÁI ĐĂNG NHẬP
auth.onAuthStateChanged(user => {
    currentUser = user;
    const authScreen = document.getElementById("auth-screen");
    const mainApp = document.getElementById("main-app");

    if (user) {
        authScreen.style.display = "none";
        mainApp.style.display = "block";
        document.getElementById("user-email").textContent = user.email;
        loadUserData();
    } else {
        authScreen.style.display = "flex";
        mainApp.style.display = "none";
        items = [];
        gameTime = 0;
        updateDisplay();
        renderItems();
    }
});

// 5. TẢI VÀ LƯU DỮ LIỆU CỦA USER
function saveUserData() {
    if (!currentUser) return;
    db.collection("users").doc(currentUser.uid).set({
        gameTime: gameTime,
        items: items,
        lastResetKey: lastResetKey
    });
}

function loadUserData() {
    if (!currentUser) return;
    db.collection("users").doc(currentUser.uid).get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            gameTime = data.gameTime || 0;
            items = data.items || [];
            lastResetKey = data.lastResetKey || getResetKey();
        } else {
            gameTime = 0;
            items = [
                { name: "Rewrite Tiếng Anh", count: 0, limit: 20, reward: 20 },
                { name: "Vocabulary Tiếng Anh", count: 0, limit: 20, reward: 100 }
            ];
            saveUserData();
        }
        updateDisplay();
        renderItems();
        checkDailyReset();
    });
}

function getResetKey() {
    const now = new Date();

    // Trước 07:00 vẫn thuộc ngày học hôm trước
    if (now.getHours() < DAILY_RESET_HOUR) {
        now.setDate(now.getDate() - 1);
    }

    return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}


function getNextResetTime() {
    const now = new Date();

    const nextReset = new Date(now);

    nextReset.setHours(DAILY_RESET_HOUR, 0, 0, 0);

    if (now >= nextReset) {
        nextReset.setDate(nextReset.getDate() + 1);
    }

    return nextReset;
}


function updateResetTimer() {
    const element = document.getElementById("daily-reset-timer");

    if (!element) return;

    const now = new Date();
    const nextReset = getNextResetTime();

    const difference = nextReset - now;

    const totalSeconds = Math.max(
        0,
        Math.floor(difference / 1000)
    );

    const hours = Math.floor(totalSeconds / 3600);

    const minutes = Math.floor(
        (totalSeconds % 3600) / 60
    );

    const seconds = totalSeconds % 60;

    element.textContent =
        `${hours} giờ ${minutes} phút ${seconds} giây`;
}

function checkDailyReset() {
    const resetKey = getResetKey();

    if (lastResetKey === null) {
        lastResetKey = resetKey;
        return;
    }

    if (resetKey !== lastResetKey) {

        for (let item of items) {
            item.count = 0;
        }

        lastResetKey = resetKey;

        saveUserData();
        renderItems();

        alert("🌅 Ngày mới bắt đầu! Các hoạt động đã được reset.");
    }
}

function getResetKey() {
    const now = new Date();

    // Trước 07:00 thì vẫn thuộc ngày học hôm trước
    if (now.getHours() < DAILY_RESET_HOUR) {
        now.setDate(now.getDate() - 1);
    }

    return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}


function getNextResetTime() {
    const now = new Date();

    let nextReset = new Date(now);

    nextReset.setHours(DAILY_RESET_HOUR, 0, 0, 0);

    if (now >= nextReset) {
        nextReset.setDate(nextReset.getDate() + 1);
    }

    return nextReset;
}


function updateResetTimer() {
    const element = document.getElementById("daily-reset-timer");

    if (!element) return;

    const now = new Date();
    const nextReset = getNextResetTime();

    const difference = nextReset - now;

    const totalSeconds = Math.floor(difference / 1000);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    element.textContent =
        `${hours} giờ ${minutes} phút ${seconds} giây`;
}

function checkGameTimeLimit() {

    if (gameTime > MAX_GAME_TIME) {

        gameTime = 0;

        saveUserData();
        updateDisplay();

        alert(
            "⚠️ Bạn đã tích quá 4 giờ Game Time.\n" +
            "Thời gian chơi đã được đặt lại về 0."
        );
    }
}


// 6. QUẢN LÝ TÁC VỤ VÀ ĐỒNG HỒ
function renderItems() {
    itemsContainer.innerHTML = "";

    for (let i = 0; i < items.length; i++) {
        let item = items[i];
        let isMaxed = item.count >= item.limit;

        let rewardMin = Math.floor(item.reward / 60);
        let rewardSec = item.reward % 60;
        let rewardText = rewardMin > 0 ? `${rewardMin} phút ${rewardSec > 0 ? rewardSec + 's' : ''}` : `${rewardSec} giây`;

        let itemElement = document.createElement("div");
        itemElement.classList.add("item-card");
        itemElement.innerHTML = `
            <h3>${item.name}</h3>
            <p>Đã làm: <span>${item.count}/${item.limit}</span></p>
            <p>Thưởng: <span>${rewardText}</span></p>

            <div class="card-actions">
                <button onclick="completeItem(${i})" ${isMaxed ? "disabled" : ""} class="btn-complete">
                    ${isMaxed ? "Đã đạt giới hạn" : "Hoàn thành"}
                </button>
                <button onclick="editItem(${i})" class="btn-edit">Sửa</button>
                <button onclick="deleteItem(${i})" class="btn-delete">Xóa</button>
            </div>
        `;

        itemsContainer.appendChild(itemElement);
    }
}

function handleFormSubmit(event) {
    event.preventDefault();
    if (!currentUser) return;

    const editIndex = parseInt(document.getElementById("edit-index").value);
    const nameInput = document.getElementById("item-name");
    const limitInput = document.getElementById("item-limit");
    const rewardInput = document.getElementById("item-reward");

    const rewardMinutes = parseFloat(rewardInput.value) / 3;
    const rewardSeconds = Math.round(rewardMinutes * 60);

    if (editIndex === -1) {
        items.push({
            name: nameInput.value,
            count: 0,
            limit: parseInt(limitInput.value),
            reward: rewardSeconds
        });
    } else {
        items[editIndex].name = nameInput.value;
        items[editIndex].limit = parseInt(limitInput.value);
        items[editIndex].reward = rewardSeconds;
        cancelEdit();
    }

    saveUserData();
    renderItems();

    nameInput.value = "";
    limitInput.value = "";
    rewardInput.value = "";
}

function editItem(index) {
    const item = items[index];
    document.getElementById("edit-index").value = index;
    document.getElementById("item-name").value = item.name;
    document.getElementById("item-limit").value = item.limit;
    document.getElementById("item-reward").value = (item.reward / 60) * 3;

    document.getElementById("form-title").textContent = "✏️ Sửa hoạt động";
    document.getElementById("form-submit-btn").textContent = "Cập nhật";
    document.getElementById("cancel-edit-btn").style.display = "inline-block";
}

function cancelEdit() {
    document.getElementById("edit-index").value = "-1";
    document.getElementById("item-name").value = "";
    document.getElementById("item-limit").value = "";
    document.getElementById("item-reward").value = "";

    document.getElementById("form-title").textContent = "➕ Thêm hoạt động mới";
    document.getElementById("form-submit-btn").textContent = "Thêm hoạt động";
    document.getElementById("cancel-edit-btn").style.display = "none";
}

function deleteItem(index) {
    items.splice(index, 1);
    saveUserData();
    renderItems();
}

function completeItem(index) {
    let item = items[index];
    if (item.count >= item.limit) return;

    item.count++;
    gameTime += item.reward;

    checkGameTimeLimit();
    
    saveUserData();
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
    if (gameTime <= 0) return alert("Bạn chưa có thời gian chơi!");
    if (timer !== null) return;

    if (startBtn) startBtn.disabled = true;
    if (pauseBtn) pauseBtn.disabled = false;

    timer = setInterval(() => {

      if (gameTime > 0) {
  
          gameTime--;
  
          playSessionSeconds++;
  
          updateDisplay();
  
          if (playSessionSeconds >= BREAK_AFTER_SECONDS) {
              showBreakReminder();
          }
  
          if (gameTime % 10 === 0) {
              saveUserData();
          }
  
      } else {
  
          pauseGame();
  
          saveUserData();
  
          alert("⏰ Hết giờ chơi!");
      }
  
  }, 1000);
}

function showBreakReminder() {

    const reminder = document.getElementById("break-reminder");

    if (!reminder) return;

    reminder.classList.remove("hidden");
}

function pauseGame() {

    clearInterval(timer);
    timer = null;

    playSessionSeconds = 0;

    const reminder = document.getElementById("break-reminder");

    if (reminder) {
        reminder.classList.add("hidden");
    }

    saveUserData();

    if (startBtn) startBtn.disabled = false;
    if (pauseBtn) pauseBtn.disabled = true;
}
setInterval(() => {

    updateResetTimer();
    checkDailyReset();

}, 1000);
