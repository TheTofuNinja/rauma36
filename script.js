// 1. CẤU HÌNH FIREBASE (Thay bằng config từ Firebase Console của bạn)
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
let authMode = 'login'; // 'login' hoặc 'register'

const gameTimeElement = document.getElementById("game-time");
const itemsContainer = document.getElementById("items-container");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");

// 3. XỬ LÝ CHUYỂN MÀN HÌNH ĐĂNG NHẬP / ĐĂNG KÝ
function setAuthMode(mode) {
    authMode = mode;
}

function handleAuthSubmit(event) {
    event.preventDefault();
    const email = document.getElementById("auth-email").value;
    const pass = document.getElementById("auth-password").value;

    if (authMode === 'register') {
        auth.createUserWithEmailAndPassword(email, pass)
            .then(() => alert("Đăng ký thành công!"))
            .catch(err => alert("Lỗi: " + err.message));
    } else {
        auth.signInWithEmailAndPassword(email, pass)
            .catch(err => alert("Lỗi đăng nhập: " + err.message));
    }
}

function logout() {
    auth.signOut();
}

// 4. LẮNG NGHE TRẠNG THÁI ĐĂNG NHẬP ĐỂ CHUYỂN TRANG
auth.onAuthStateChanged(user => {
    currentUser = user;
    const authScreen = document.getElementById("auth-screen");
    const mainApp = document.getElementById("main-app");

    if (user) {
        // Đã đăng nhập -> Hủy màn hình Auth, hiển thị Trang chính
        authScreen.style.display = "none";
        mainApp.style.display = "block";
        document.getElementById("user-email").textContent = user.email;
        loadUserData();
    } else {
        // Chưa đăng nhập / Đã Đăng xuất -> Hiện màn hình Auth full-page, ẩn Trang chính
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
        items: items
    });
}

function loadUserData() {
    if (!currentUser) return;
    db.collection("users").doc(currentUser.uid).get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            gameTime = data.gameTime || 0;
            items = data.items || [];
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
    });
}

// 6. RENDER CÁC HOẠT ĐỘNG VÀ QUẢN LÝ
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
            updateDisplay();
            if (gameTime % 10 === 0) saveUserData(); 
        } else {
            pauseGame();
            saveUserData();
            alert("⏰ Hết giờ chơi!");
        }
    }, 1000);
}

function pauseGame() {
    clearInterval(timer);
    timer = null;
    saveUserData();

    if (startBtn) startBtn.disabled = false;
    if (pauseBtn) pauseBtn.disabled = true;
}

    if (startBtn) startBtn.disabled = false;
    if (pauseBtn) pauseBtn.disabled = true;
}
