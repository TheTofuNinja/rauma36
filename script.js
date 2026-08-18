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

const gameTimeElement = document.getElementById("game-time");
const itemsContainer = document.getElementById("items-container");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");

// 3. XỬ LÝ ĐĂNG NHẬP / ĐĂNG KÝ / ĐĂNG XUẤT
function register() {
    const email = document.getElementById("auth-email").value;
    const pass = document.getElementById("auth-password").value;
    auth.createUserWithEmailAndPassword(email, pass)
        .then(() => alert("Đăng ký thành công!"))
        .catch(err => alert("Lỗi: " + err.message));
}

function login() {
    const email = document.getElementById("auth-email").value;
    const pass = document.getElementById("auth-password").value;
    auth.signInWithEmailAndPassword(email, pass)
        .catch(err => alert("Lỗi: " + err.message));
}

function logout() {
    auth.signOut();
}

// Lắng nghe trạng thái Đăng nhập
auth.onAuthStateChanged(user => {
    currentUser = user;
    if (user) {
        document.getElementById("auth-logged-out").style.display = "none";
        document.getElementById("auth-logged-in").style.display = "block";
        document.getElementById("user-email").textContent = user.email;
        loadUserData(); // Tải dữ liệu từ database khi đăng nhập thành công
    } else {
        document.getElementById("auth-logged-out").style.display = "block";
        document.getElementById("auth-logged-in").style.display = "none";
        items = [];
        gameTime = 0;
        updateDisplay();
        renderItems();
    }
});

// 4. LƯU & TẢI DỮ LIỆU TỪ BACKEND (FIRESTORE)
function saveUserData() {
    if (!currentUser) return;
    db.collection("users").doc(currentUser.uid).set({
        gameTime: gameTime,
        items: items
    }).then(() => {
        console.log("Đã lưu dữ liệu thành công!");
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
            // Mặc định cho người dùng mới
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

// 5. HIỂN THỊ VÀ XỬ LÝ SỬA / XÓA HOẠT ĐỘNG
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
    if (!currentUser) return alert("Vui lòng đăng nhập để thực hiện!");

    const editIndex = parseInt(document.getElementById("edit-index").value);
    const nameInput = document.getElementById("item-name");
    const limitInput = document.getElementById("item-limit");
    const rewardInput = document.getElementById("item-reward");

    const rewardMinutes = parseFloat(rewardInput.value) / 3; // Chia 3 như yêu cầu
    const rewardSeconds = Math.round(rewardMinutes * 60);

    if (editIndex === -1) {
        // THÊM MỚI
        items.push({
            name: nameInput.value,
            count: 0,
            limit: parseInt(limitInput.value),
            reward: rewardSeconds
        });
    } else {
        // CẬP NHẬT / SỬA
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
    // Đổi giây ra phút thưởng thực tế (nhân 3 lại để hiển thị cho người dùng chỉnh sửa)
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
    if (!currentUser) return alert("Vui lòng đăng nhập!");
    items.splice(index, 1);
    saveUserData();
    renderItems();
}

function completeItem(index) {
    if (!currentUser) return alert("Vui lòng đăng nhập!");
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
            // Lưu thời gian game đếm ngược định kỳ
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
