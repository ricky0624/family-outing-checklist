//====== 變數宣告 ======
const myList = document.querySelector("#my-checklist-section");
const statusMessage = document.querySelector("#status-message");
const checklistUL = document.querySelector("#checklist-list");
const addListBtn = document.querySelector("#add-list-btn");

const selectListMode = document.querySelector("#select-create-mode-section");
const templateOptions = document.querySelector("#template-options");
const cancelBtn_mode = document.querySelector("#cancel-mode-btn");
const nextBtn = document.querySelector("#next-step-btn");

const createList = document.querySelector("#create-checklist-section");
const listForm = document.querySelector("#create-checklist-form");
const listNameInput = document.querySelector("#checklist-name");
const errorMsg_list = document.querySelector("#name-error");
const backBtn = document.querySelector("#back-step-btn");
const cancelBtn_create = document.querySelector("#cancel-create-btn");

const detailList = document.querySelector("#checklist-detail-section");
const detailTitle = document.querySelector("#detail-title");
const detailProgress = document.querySelector("#detail-progress");
const detailItems = document.querySelector("#detail-items");
const detailEmptyMsg = document.querySelector("#detail-empty-message");
const backMyListBtn = document.querySelector("#back-to-list-btn");
const addItemForm = document.querySelector("#add-item-form");
const itemNameInput = document.querySelector("#new-item-name");
const errorMsg_item = document.querySelector("#item-name-error");
const resetItemsBtn = document.querySelector("#reset-items-btn");

const shareSection = document.querySelector("#share-section");
const createInviteBtn = document.querySelector("#create-invite-btn");
const shareResult = document.querySelector("#share-result");
const shareLinkInput = document.querySelector("#share-link-input");
const copyShareLinkBtn = document.querySelector("#copy-share-link-btn");
const shareMessage = document.querySelector("#share-message");

const showInvitationsBtn = document.querySelector("#show-invitations-btn");
const invitationHistory = document.querySelector("#invitation-history");
const invitationHistoryMessage = document.querySelector("#invitation-history-message");
const invitationHistoryList = document.querySelector("#invitation-history-list");

const inviteStatus = document.querySelector("#invite-status");

const PENDING_INVITE_KEY = "pendingChecklistInvite";

// 取得網址中的 #invite=...
const hashParams = new URLSearchParams(
    window.location.hash.substring(1)
);

const checkLists = [];

const checklistTemplates = {
    park: ["尿布", "濕紙巾", "水壺", "小點心"],
    restaurant: ["濕紙巾", "圍兜", "水壺", "兒童餐具"],
    travel: ["替換衣物", "尿布", "盥洗用品", "睡衣"]
};

const templateNames = {
    park: "公園",
    restaurant: "餐廳",
    travel: "過夜旅行"
};

let activeChecklistId = null;
let loadedChecklistUserId = null;
let checklistLoadVersion = 0;
let shareRenderedChecklistId = null;
let inviteProcessing = false;
//=====================

if (hashParams.has("invite")) {
    const token = hashParams.get("invite");

    if (token && /^[0-9a-f]{64}$/.test(token)) {

        // 暫存邀請 Token
        sessionStorage.setItem(PENDING_INVITE_KEY, token);

        inviteStatus.textContent =
            "已收到分享邀請，請登入後加入清單。";

    } else {
        sessionStorage.removeItem(PENDING_INVITE_KEY);

        inviteStatus.textContent =
            "邀請連結格式不正確。";
    }

    inviteStatus.hidden = false;

    // 將 Token 從網址列移除
    history.replaceState(
        history.state,
        "",
        window.location.pathname + window.location.search
    );
}

window.supabaseClient.auth.onAuthStateChange((event, session) => {

    if (
        event !== "INITIAL_SESSION" &&
        event !== "SIGNED_IN" &&
        event !== "SIGNED_OUT"
    ) {
        return;
    }

    const userId = session?.user?.id ?? null;

    // 同一個使用者，不需要重複載入
    if (userId === loadedChecklistUserId) {
        return;
    }

    loadedChecklistUserId = userId;
    const version = ++checklistLoadVersion;

    // 登出後，清除目前記憶體中的清單
    if (!userId) {
        checkLists.length = 0;
        activeChecklistId = null;
        renderChecklists(checkLists);
        return;
    }

    setTimeout(async () => {

        // 1. 先載入目前使用者的清單
        await loadChecklistsFromDB(version);

        if (version !== checklistLoadVersion) {
            return;
        }

        // 2. 如果有尚未處理的邀請，自動接受
        await processPendingInvitation(version);

    }, 0);
});

//====== 我的清單頁 Start ======
//renderChecklists(checkLists);

//新增清單鈕
addListBtn.addEventListener("click", ()=>{
    resetCreateForm();

    myList.hidden = true;
    selectListMode.hidden = false;
});
//====== 我的清單頁 End ======

//====== 新增清單模式頁 Start ======
document.querySelectorAll('input[name="create-mode"]').forEach((radio) => {
    radio.addEventListener("change", () => {
        if(radio.value==="template"){
            templateOptions.hidden = false;
        }else{
            templateOptions.hidden = true;
        }
    });
});

//取消鈕
cancelBtn_mode.addEventListener("click", ()=>{
    resetCreateForm();

    myList.hidden = false;
    selectListMode.hidden = true;
});

//下一步鈕
nextBtn.addEventListener("click", ()=>{
    selectListMode.hidden = true;
    createList.hidden = false;
    listNameInput.focus();
    const selectedMode = document.querySelector('input[name="create-mode"]:checked').value;
    if(selectedMode==="template"){
        const templateType = document.querySelector("#template-type").value;
        listNameInput.value = transChinese(templateType);
    }else{
        listNameInput.value = "";
    }
});
//====== 新增清單模式頁 End ======

//====== 建立清單頁 Start ======
listNameInput.addEventListener("input", () => {
    errorMsg_list.hidden = true;
});

//上一步鈕
backBtn.addEventListener("click", ()=>{
    selectListMode.hidden = false;
    createList.hidden = true;
});

//取消鈕
cancelBtn_create.addEventListener("click", ()=>{
    resetCreateForm();

    myList.hidden = false;
    createList.hidden = true;
});

// 建立清單鈕
listForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const listName = listNameInput.value.trim();

    if (listName === "") {
        errorMsg_list.textContent = "請輸入清單名稱";
        errorMsg_list.hidden = false;
        return;
    }

    // 防止使用者連續點擊建立
    const submitBtn = listForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    try {
        let items = [];

        const selectedMode = document.querySelector(
            'input[name="create-mode"]:checked'
        ).value;

        if (selectedMode === "template") {
            const templateType =
                document.querySelector("#template-type").value;

            items = checklistTemplates[templateType].map(name => ({
                name: name,
                completed: false
            }));
        }

        // 寫入 Supabase，取得資料庫產生的 UUID
        const dbList = await createChecklistWithItemsInDB(
            listName,
            items
        );

        // 暫時保留原本前端的資料結構
        const newList = dbList;

        // 更新畫面使用的陣列
        checkLists.unshift(newList);

        renderChecklists(checkLists);

        // 記錄目前正在查看的清單
        activeChecklistId = newList.id;

        // 切換到詳細頁
        createList.hidden = true;
        myList.hidden = true;
        detailList.hidden = false;

        // 顯示剛建立的清單
        renderChecklistDetail(newList);

        listNameInput.value = "";
        errorMsg_list.hidden = true;

        console.log("建立成功：", newList);

    } catch (error) {
        console.error("建立清單失敗：", error);

        errorMsg_list.textContent = "建立清單失敗，請稍後再試";
        errorMsg_list.hidden = false;

    } finally {
        submitBtn.disabled = false;
    }
});
//====== 建立清單頁 End ======

//====== 詳細清單頁 Start ======
itemNameInput.addEventListener("input", () => {
    errorMsg_item.hidden = true;
});

backMyListBtn.addEventListener("click", ()=>{
    resetAddItemForm();

    activeChecklistId = null;

    myList.hidden = false;
    detailList.hidden = true;
});


addItemForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const itemName = itemNameInput.value.trim();

    if (itemName === "") {
        errorMsg_item.textContent = "請輸入物品名稱";
        errorMsg_item.hidden = false;
        return;
    }

    const currentChecklist = checkLists.find(
        checklist => checklist.id === activeChecklistId
    );

    if (!currentChecklist) {
        alert("找不到這份清單，請返回清單列表重新選擇");
        return;
    }

    const exists = currentChecklist.items.some(
        item => item.name === itemName
    );

    if (exists) {
        errorMsg_item.textContent = "這個物品已經在清單中了";
        errorMsg_item.hidden = false;
        return;
    }

    const submitBtn = addItemForm.querySelector(
        'button[type="submit"]'
    );

    submitBtn.disabled = true;
    itemNameInput.disabled = true;

    try {
        // 寫入 Supabase
        const newItem = await addChecklistItemInDB(
            currentChecklist.id,
            itemName
        );

        // 資料庫新增成功後，更新前端陣列
        currentChecklist.items.push(newItem);

        if (activeChecklistId === currentChecklist.id &&
            !detailList.hidden) {
            renderChecklistDetail(currentChecklist);
        }

        itemNameInput.value = "";
        errorMsg_item.hidden = true;

        console.log("新增物品成功：", newItem);

    } catch (error) {
        console.error("新增物品失敗：", error);

        if (error.code === "23505") {
            errorMsg_item.textContent =
                "這個物品已經在清單中了";
        } else {
            errorMsg_item.textContent =
                "新增物品失敗，請稍後再試";
        }

        errorMsg_item.hidden = false;

    } finally {
        submitBtn.disabled = false;
        itemNameInput.disabled = false;
    }
});



resetItemsBtn.addEventListener("click", async () => {

    const currentChecklist = checkLists.find(
        checklist => checklist.id === activeChecklistId
    );

    if (!currentChecklist) {
        alert("找不到這份清單");
        return;
    }

    const confirmed = confirm("確定開始新一次準備嗎？");

    if (!confirmed) {
        return;
    }

    // 防止使用者重複點擊
    resetItemsBtn.disabled = true;

    try {
        // 1. 先更新 Supabase 資料庫
        const updatedItems = await resetChecklistItemsInDB(
            currentChecklist.id
        );

        // 有物品卻沒有更新到資料，視為異常
        if (
            currentChecklist.items.length > 0 &&
            updatedItems.length === 0
        ) {
            throw new Error("沒有更新到任何物品，請確認操作權限");
        }

        // 2. 更新成功後，再修改前端記憶體
        currentChecklist.items.forEach(item => {
            item.completed = false;
        });

        // 3. 重新繪製詳細頁
        if (
            activeChecklistId === currentChecklist.id &&
            !detailList.hidden
        ) {
            renderChecklistDetail(currentChecklist);
        }

    } catch (error) {
        console.error("重設物品失敗：", error);

        alert("重設失敗：" + error.message);

    } finally {
        // 不管成功或失敗，都恢復按鈕
        resetItemsBtn.disabled = false;
    }
});


createInviteBtn.addEventListener("click", async () => {

    const currentChecklist = checkLists.find(
        checklist => checklist.id === activeChecklistId
    );

    if (!currentChecklist) {
        alert("找不到目前的清單");
        return;
    }

    // 前端權限檢查
    if (currentChecklist.owner_id !== loadedChecklistUserId) {
        alert("只有清單建立者可以產生邀請");
        return;
    }

    createInviteBtn.disabled = true;
    shareMessage.textContent = "正在產生分享連結...";

    try {
        // 1. 呼叫 Supabase 建立邀請
        const token = await createChecklistInvitationInDB(
            currentChecklist.id
        );

        // 2. 產生分享網址
        const inviteUrl = new URL(
            window.location.pathname,
            window.location.origin
        );

        inviteUrl.hash = "invite=" + encodeURIComponent(token);

        // 如果使用者已切換到其他清單，就不顯示舊連結
        if (activeChecklistId !== currentChecklist.id) {
            return;
        }

        // 3. 顯示分享連結
        shareLinkInput.value = inviteUrl.toString();
        shareResult.hidden = false;

        // 邀請紀錄已變動，清除舊的顯示結果
        invitationHistory.hidden = true;
        invitationHistoryList.replaceChildren();
        invitationHistoryMessage.textContent = "";

        shareMessage.textContent =
            "邀請連結已建立，請複製後傳給家人。";

    } catch (error) {
        console.error("建立邀請失敗：", error.message);

        shareResult.hidden = true;
        shareLinkInput.value = "";

        shareMessage.textContent =
            "建立邀請失敗：" + error.message;

    } finally {
        createInviteBtn.disabled = false;
    }
});

copyShareLinkBtn.addEventListener("click", async () => {

    const link = shareLinkInput.value;

    if (!link) {
        return;
    }

    try {
        await navigator.clipboard.writeText(link);

        shareMessage.textContent = "分享連結已複製！";

    } catch (error) {
        console.error("複製失敗：", error.message);

        // 若瀏覽器禁止自動複製，可手動 Ctrl+C
        shareLinkInput.focus();
        shareLinkInput.select();

        shareMessage.textContent =
            "無法自動複製，請按 Ctrl+C 複製連結";
    }
});

showInvitationsBtn.addEventListener("click", async () => {

    const currentChecklist = checkLists.find(
        checklist => checklist.id === activeChecklistId
    );

    if (!currentChecklist) {
        alert("找不到目前的清單");
        return;
    }

    // 只有 Owner 可以查看邀請紀錄
    if (
        currentChecklist.owner_id !== loadedChecklistUserId
    ) {
        alert("只有清單建立者可以查看邀請紀錄");
        return;
    }

    await loadInvitationHistory(currentChecklist.id);
});


//====== 詳細清單頁 End ========

function renderChecklists(lists) {

    // 清空原本的清單畫面
    checklistUL.replaceChildren();

    // 判斷 checkLists 是否有資料
    if (lists.length > 0) {
        statusMessage.style.display = "none";

        lists.forEach((checklist) => {

            const list = document.createElement("li");

            // 清單名稱按鈕
            const nameBtn = document.createElement("button");
            nameBtn.type = "button";
            nameBtn.textContent = checklist.name;

            nameBtn.addEventListener("click", () => {
                activeChecklistId = checklist.id;

                myList.hidden = true;
                detailList.hidden = false;

                renderChecklistDetail(checklist);
            });

            list.appendChild(nameBtn);

            // 只有 Owner 才顯示刪除按鈕
            const isOwner = checklist.owner_id === loadedChecklistUserId;

            if (isOwner) {

                const deleteBtn = document.createElement("button");
                deleteBtn.type = "button";
                deleteBtn.textContent = "刪除";

                deleteBtn.addEventListener("click", async () => {

                    const confirmed = confirm(
                        `確定要刪除「${checklist.name}」這份清單嗎？`
                    );

                    if (!confirmed) {
                        return;
                    }

                    // 防止重複點擊
                    deleteBtn.disabled = true;

                    try {
                        // 先刪除 Supabase 資料庫中的清單
                        await deleteChecklistInDB(checklist.id);

                        // 資料庫刪除成功後，再刪除前端資料
                        const index = lists.findIndex(
                            item => item.id === checklist.id
                        );

                        if (index !== -1) {
                            lists.splice(index, 1);
                        }

                        // 重新繪製清單
                        renderChecklists(lists);

                    } catch (error) {
                        console.error("刪除清單失敗：", error);
                        alert("刪除失敗：" + error.message);
                    } finally {
                        deleteBtn.disabled = false;
                    }
                });
                list.appendChild(deleteBtn);
            }
            checklistUL.appendChild(list);
        });
    } else {
        statusMessage.textContent = "目前還沒有清單";
        statusMessage.style.display = "";
    }
}


function renderChecklistDetail(checklist) {

    detailTitle.textContent = checklist.name;
    
    // 切換到不同清單時，清除上一份清單的分享連結
    if (shareRenderedChecklistId !== checklist.id) {
        shareRenderedChecklistId = checklist.id;

        // 清除上一份清單的分享連結
        shareResult.hidden = true;
        shareLinkInput.value = "";
        shareMessage.textContent = "";

        // 清除上一份清單的邀請紀錄
        invitationHistory.hidden = true;
        invitationHistoryList.replaceChildren();
        invitationHistoryMessage.textContent = "";
    }


    // 只有 Owner 才能看到分享按鈕
    const isOwner =
        checklist.owner_id === loadedChecklistUserId;

    shareSection.hidden = !isOwner;

    detailItems.replaceChildren();

    const totalCount = checklist.items.length;
    const completedCount = checklist.items.filter(
        item => item.completed
    ).length;

    detailProgress.textContent =
        `已完成 ${completedCount} / ${totalCount} 項`;

    detailEmptyMsg.hidden = true;

    if (checklist.items.length === 0) {
        detailEmptyMsg.hidden = false;
        return;
    }

    checklist.items.forEach((item) => {
        const nameLi = document.createElement("li");
        const nameLabel = document.createElement("label");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = item.completed;

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.textContent = "刪除";

        // 刪除物品
        deleteBtn.addEventListener("click", async () => {
            const confirmed = confirm(
                `確定要刪除「${item.name}」這項物品嗎？`
            );

            if (!confirmed) {
                return;
            }

            deleteBtn.disabled = true;
            checkbox.disabled = true;

            try {
                // 先刪除資料庫物品
                await deleteChecklistItemInDB(item.id);

                // 成功後再移除記憶體中的物品
                const index = checklist.items.findIndex(
                    data => data.id === item.id
                );

                if (index !== -1) {
                    checklist.items.splice(index, 1);
                }

                // 仍在相同清單詳細頁時才重繪
                if (activeChecklistId === checklist.id &&
                    !detailList.hidden) {
                    renderChecklistDetail(checklist);
                }

            } catch (error) {
                console.error("刪除物品失敗：", error);
                alert("刪除物品失敗：" + error.message);

            } finally {
                deleteBtn.disabled = false;
                checkbox.disabled = false;
            }
        });

        // 勾選完成狀態
        checkbox.addEventListener("change", async () => {

            const newCompleted = checkbox.checked;

            checkbox.disabled = true;
            deleteBtn.disabled = true;

            try {
                // 先更新資料庫
                const updatedItem =
                    await updateChecklistItemCompletedInDB(
                        item.id,
                        newCompleted
                    );

                // 成功後才更新記憶體資料
                item.completed = updatedItem.completed;

                if (activeChecklistId === checklist.id &&
                    !detailList.hidden) {
                    renderChecklistDetail(checklist);
                }

            } catch (error) {
                console.error("更新物品失敗：", error);

                // 還原 Checkbox 狀態
                checkbox.checked = item.completed;

                alert("更新物品失敗：" + error.message);

            } finally {
                checkbox.disabled = false;
                deleteBtn.disabled = false;
            }
        });

        nameLabel.append(checkbox, item.name);
        nameLi.appendChild(nameLabel);
        nameLi.appendChild(deleteBtn);

        detailItems.appendChild(nameLi);
    });
}

function transChinese(val){
    return templateNames[val] ?? val;
}

function resetCreateForm() {
    listForm.reset();
    errorMsg_list.hidden = true;

    document.querySelector('input[name="create-mode"][value="blank"]').checked = true;

    document.querySelector("#template-type").value = "park";
    templateOptions.hidden = true;
}

function resetAddItemForm() {
    addItemForm.reset();
    errorMsg_item.hidden = true;
    errorMsg_item.textContent = "請輸入物品名稱";
}

async function loadChecklistsFromDB(version) {

    const statusMessage =
        document.getElementById("status-message");

    statusMessage.textContent = "清單載入中...";
    statusMessage.hidden = false;

    const dbLists = await getChecklistsFromDB();

    // 如果登入狀態已改變，就忽略舊的查詢結果
    if (version !== checklistLoadVersion) {
        return;
    }

    if (dbLists === null) {
        statusMessage.textContent = "讀取清單失敗，請稍後重新整理";
        statusMessage.hidden = false;
        return;
    }

    // 將 Supabase 資料轉換成原本 app.js 使用的格式
    const newLists = dbLists.map(list => ({
        id: list.id,
        name: list.name,
        owner_id: list.owner_id,
        created_at: list.created_at,
        items: list.checklist_items ?? []
    }));

    // 清除舊資料，放入資料庫最新資料
    checkLists.splice(0, checkLists.length, ...newLists);

    activeChecklistId = null;

    // 更新清單列表
    renderChecklists(checkLists);

    console.log("從 Supabase 載入完成：", checkLists);
}


async function processPendingInvitation(version) {

    const token = sessionStorage.getItem(PENDING_INVITE_KEY);

    if (!token || inviteProcessing) {
        return;
    }

    inviteProcessing = true;
    inviteStatus.hidden = false;
    inviteStatus.textContent = "正在驗證分享邀請...";

    try {
        // 1. 呼叫後端接受邀請
        const checklistId =
            await acceptChecklistInvitationInDB(token);

        // 登入身分已變動時，不再更新舊畫面
        if (version !== checklistLoadVersion) {
            return;
        }

        // 2. 清除已使用的暫存 Token
        sessionStorage.removeItem(PENDING_INVITE_KEY);

        // 3. 重新載入清單，取得剛加入的共享清單
        await loadChecklistsFromDB(version);

        if (version !== checklistLoadVersion) {
            return;
        }

        // 4. 確認清單已經出現在前端陣列中
        const joinedChecklist = checkLists.find(
            checklist => checklist.id === checklistId
        );

        if (joinedChecklist) {

            // 1. 記錄目前正在查看的清單
            activeChecklistId = joinedChecklist.id;

            // 2. 隱藏其他清單操作畫面
            myList.hidden = true;

            document.querySelector(
                "#select-create-mode-section"
            ).hidden = true;

            document.querySelector(
                "#create-checklist-section"
            ).hidden = true;

            // 3. 顯示詳細頁
            detailList.hidden = false;

            // 4. 繪製剛加入的共享清單
            renderChecklistDetail(joinedChecklist);

            // 5. 顯示成功訊息
            inviteStatus.hidden = false;
            inviteStatus.textContent =
                "成功加入共享清單！";

        } else {

            inviteStatus.hidden = false;
            inviteStatus.textContent =
                "邀請已接受，但清單載入失敗，請重新整理網頁。";
        }


    } catch (error) {
        if (version !== checklistLoadVersion) {
            return;
        }

        console.error("接受邀請失敗：", error.message);

        sessionStorage.removeItem(PENDING_INVITE_KEY);

        inviteStatus.textContent =
            "接受邀請失敗：" + error.message;

    } finally {
        inviteProcessing = false;
    }
}


async function loadInvitationHistory(checklistId) {

    showInvitationsBtn.disabled = true;
    invitationHistory.hidden = false;

    invitationHistoryMessage.textContent =
        "正在讀取邀請紀錄...";

    invitationHistoryList.replaceChildren();

    try {
        // 1. 向 Supabase 取得邀請紀錄
        const invitations =
            await listChecklistInvitationsFromDB(checklistId);

        // 讀取期間如果切換清單，就不要顯示舊資料
        if (
            activeChecklistId !== checklistId ||
            shareSection.hidden
        ) {
            return;
        }

        // 2. 沒有任何邀請
        if (invitations.length === 0) {
            invitationHistoryMessage.textContent =
                "目前沒有邀請紀錄";
            return;
        }

        invitationHistoryMessage.textContent = "";

        // 3. 顯示每一筆邀請
        invitations.forEach(invitation => {

            const li = document.createElement("li");
            const info = document.createElement("div");

            const createdAt = new Date(
                invitation.created_at
            ).toLocaleString("zh-TW", {
                timeZone: "Asia/Taipei"
            });

            const expiresAt = new Date(
                invitation.expires_at
            ).toLocaleString("zh-TW", {
                timeZone: "Asia/Taipei"
            });

            const expiresTime = Date.parse(
                invitation.expires_at
            );

            const isExpired =
                Number.isFinite(expiresTime) &&
                expiresTime <= Date.now();

            // 依照資料庫欄位判斷顯示狀態
            let status = "有效";

            if (invitation.revoked_at) {
                status = "已撤銷";
            } else if (invitation.used_at) {
                status = "已使用";
            } else if (!Number.isFinite(expiresTime)) {
                status = "狀態未知";
            } else if (isExpired) {
                status = "已過期";
            }

            info.textContent =
                `建立：${createdAt}｜` +
                `到期：${expiresAt}｜` +
                `狀態：${status}`;

            li.appendChild(info);

            // 4. 只有尚未使用、未撤銷且未過期的邀請
            //    才顯示撤銷按鈕
            const canRevoke =
                !invitation.used_at &&
                !invitation.revoked_at &&
                Number.isFinite(expiresTime) &&
                !isExpired;

            if (canRevoke) {

                const revokeBtn =
                    document.createElement("button");

                revokeBtn.type = "button";
                revokeBtn.textContent = "撤銷";

                revokeBtn.addEventListener("click", async () => {

                    const confirmed = confirm(
                        "確定要撤銷這筆邀請嗎？"
                    );

                    if (!confirmed) {
                        return;
                    }

                    revokeBtn.disabled = true;

                    try {
                        // 撤銷指定邀請
                        await revokeChecklistInvitationInDB(
                            invitation.invitation_id
                        );

                        // 如果已切換清單，不更新原本畫面
                        if (
                            activeChecklistId !== checklistId ||
                            shareSection.hidden
                        ) {
                            return;
                        }

                        // 撤銷成功後重新查詢邀請紀錄
                        await loadInvitationHistory(checklistId);

                    } catch (error) {
                        console.error("撤銷邀請失敗：", error);

                        if (
                            activeChecklistId === checklistId &&
                            !shareSection.hidden
                        ) {
                            invitationHistoryMessage.textContent =
                                "撤銷失敗：" + error.message;
                        }

                    } finally {
                        revokeBtn.disabled = false;
                    }
                });

                li.appendChild(revokeBtn);
            }

            invitationHistoryList.appendChild(li);
        });

    } catch (error) {
        console.error("讀取邀請紀錄失敗：", error);

        if (
            activeChecklistId === checklistId &&
            !shareSection.hidden
        ) {
            invitationHistoryMessage.textContent =
                "讀取失敗：" + error.message;
        }

    } finally {
        showInvitationsBtn.disabled = false;
    }
}