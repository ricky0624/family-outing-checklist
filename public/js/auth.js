console.log("新版 auth.js 已載入！");
const authClient = window.supabaseClient;

const authSection = document.getElementById("auth-section");
const appContainer = document.getElementById("app-container");
const authMessage = document.getElementById("auth-message");
const currentUserEmail = document.getElementById("current-user-email");

const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const logoutBtn = document.getElementById("logout-btn");

/* ===== 登入 / 註冊切換 ===== */
const loginTabBtn = document.getElementById("show-login-tab");
const signupTabBtn = document.getElementById("show-signup-tab");
const authWelcomeTitle = document.querySelector(".auth-welcome h2");
const authWelcomeText = document.querySelector(".auth-welcome p");

// 顯示操作結果
function showAuthMessage(message) {
    authMessage.textContent = message;
}


/* ===== 切換登入 / 註冊表單 ===== */

function switchAuthForm(mode) {

    const isLogin = mode === "login";

    // 1. 切換表單顯示
    loginForm.hidden = !isLogin;
    signupForm.hidden = isLogin;

    // 2. 切換按鈕樣式
    loginTabBtn.classList.toggle("is-active", isLogin);
    signupTabBtn.classList.toggle("is-active", !isLogin);

    // 3. 更新按鈕狀態（無障礙）
    loginTabBtn.setAttribute("aria-pressed", String(isLogin));
    signupTabBtn.setAttribute("aria-pressed", String(!isLogin));

    // 4. 更新歡迎文字
    if (isLogin) {
        authWelcomeTitle.textContent = "歡迎回來！";
        authWelcomeText.textContent =
            "登入帳號，繼續整理你的出門清單";
    } else {
        authWelcomeTitle.textContent = "一起開始準備吧！";
        authWelcomeText.textContent =
            "建立帳號，保存每次出門需要的物品";
    }

    // 5. 清除上一次操作的提示訊息
    showAuthMessage("");
}


// 點擊「登入」分頁
loginTabBtn.addEventListener("click", function() {
    switchAuthForm("login");
});


// 點擊「註冊」分頁
signupTabBtn.addEventListener("click", function() {
    console.log("註冊鈕");
    switchAuthForm("signup");
});

// 預設顯示登入表單
switchAuthForm("login");


// 根據登入狀態切換畫面
function renderAuthState(session) {
    const isLoggedIn = !!session?.user;

    authSection.hidden = isLoggedIn;
    appContainer.hidden = !isLoggedIn;

    currentUserEmail.textContent = isLoggedIn
        ? session.user.email
        : "";
}

// 監聽登入狀態，包括網頁重新整理後的初始 Session
authClient.auth.onAuthStateChange((event, session) => {
    console.log("Auth Event:", event);
    renderAuthState(session);
});

// 註冊
signupForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value;

    showAuthMessage("註冊中...");

    try {
        const { data, error } = await authClient.auth.signUp({
            email: email,
            password: password,
            options: {
                emailRedirectTo: window.location.origin + "/"
            }
        });

        if (error) {
            showAuthMessage("註冊失敗：" + error.message);
            return;
        }

        signupForm.reset();

        if (data.session) {
            showAuthMessage("註冊成功，已登入");
        } else {
            showAuthMessage("如果註冊成功，請至信箱完成驗證，再回來登入。");
        }
    } catch (error) {
        showAuthMessage("註冊失敗：" + error.message);
    }
});

// 登入
loginForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    showAuthMessage("登入中...");

    try {
        const { error } = await authClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            showAuthMessage("登入失敗：" + error.message);
            return;
        }

        loginForm.reset();
        showAuthMessage("");
    } catch (error) {
        showAuthMessage("登入失敗：" + error.message);
    }
});

// 登出
logoutBtn.addEventListener("click", async function() {
    const { error } = await authClient.auth.signOut({
        scope: "local"
    });

    if (error) {
        alert("登出失敗：" + error.message);
        return;
    }

    // 重新載入，順便清空舊 app.js 的記憶體測試資料
    window.location.reload();
});
