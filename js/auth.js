
const authClient = window.supabaseClient;

const authSection = document.getElementById("auth-section");
const appContainer = document.getElementById("app-container");
const authMessage = document.getElementById("auth-message");
const currentUserEmail = document.getElementById("current-user-email");

const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const logoutBtn = document.getElementById("logout-btn");

// 顯示操作結果
function showAuthMessage(message) {
    authMessage.textContent = message;
}

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