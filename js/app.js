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


const checkLists = [
    {id:1, name:"週末去公園", nextItemId:1, items:[]},
    {id:2, name:"親子餐廳", nextItemId:1, items:[]}
];

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

let nextChecklistId = Math.max(0, ...checkLists.map(checklist => checklist.id)) + 1;
let activeChecklistId = null;

//=====================

//====== 我的清單頁 Start ======
renderChecklists(checkLists);

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

//建立清單鈕
listForm.addEventListener("submit", (event)=>{
    event.preventDefault();

    const listName = listNameInput.value.trim();

    if(listName===""){
        errorMsg_list.hidden = false;
        return;
    }

    let items = [];
    const selectedMode = document.querySelector('input[name="create-mode"]:checked').value;
    if(selectedMode==="template"){
        const templateType = document.querySelector("#template-type").value;
        items = checklistTemplates[templateType].map((name, index) => {
            return {
                id: index + 1,
                name: name,
                completed: false
            };
        });
    }

    const nextItemId = Math.max(0, ...items.map(item => item.id))+1;
    const newList = {id:nextChecklistId, name:listName, nextItemId:nextItemId, items:items};

    checkLists.push(newList);

    nextChecklistId++;

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

    console.log(checkLists);
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

addItemForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const itemName = itemNameInput.value.trim();

    if(itemName===""){
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

    if(exists){
        errorMsg_item.textContent = "這個物品已經在清單中了";
        errorMsg_item.hidden = false;
        return;
    }

    const newItemID = currentChecklist.nextItemId;

    currentChecklist.nextItemId++;

    const newItem = {id:newItemID, name:itemName, completed:false};
    currentChecklist.items.push(newItem);

    renderChecklistDetail(currentChecklist);

    itemNameInput.value = "";
    errorMsg_item.hidden = true;
});

resetItemsBtn.addEventListener("click", ()=>{
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

    currentChecklist.items.forEach((item)=>{
        item.completed = false;
    });

    renderChecklistDetail(currentChecklist);
});

//====== 詳細清單頁 End ========

function renderChecklists(lists){
    //清空原本的清單畫面
    checklistUL.replaceChildren();

    //判斷 checkLists 是否有資料
    if(lists.length>0){
        statusMessage.style.display = "none";

        lists.forEach((checklist) => {
            const list = document.createElement("li");

            const nameBtn = document.createElement("button");
            nameBtn.type = "button";
            nameBtn.textContent = checklist.name;

            nameBtn.addEventListener("click", ()=>{
                activeChecklistId = checklist.id;

                myList.hidden = true;
                detailList.hidden = false;

                renderChecklistDetail(checklist);
            });

            const deleteBtn = document.createElement("button");
            deleteBtn.type = "button";
            deleteBtn.textContent = "刪除";

            deleteBtn.addEventListener("click", ()=>{
                const confirmed = confirm(`確定要刪除「${checklist.name}」這份清單嗎？`);

                if (!confirmed) {
                    return;
                }

                const index = lists.findIndex(list => list.id === checklist.id);
                if (index !== -1) {
                    lists.splice(index, 1);
                }

                renderChecklists(lists);
            });

            list.appendChild(nameBtn);
            list.appendChild(deleteBtn);

            checklistUL.appendChild(list);

        });
    }else{
        statusMessage.style.display = "";
    }
}

function renderChecklistDetail(checklist) {

    detailTitle.textContent = checklist.name;
    detailItems.replaceChildren();

    const totalCount = checklist.items.length;
    const completedCount = checklist.items.filter(item => item.completed).length;
    detailProgress.textContent = `已完成 ${completedCount} / ${totalCount} 項`;

    detailEmptyMsg.hidden = true;

    if(checklist.items.length===0){
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

        deleteBtn.addEventListener("click", ()=>{
            const confirmed = confirm(`確定要刪除「${item.name}」這項物品嗎？`);

            if (!confirmed) {
                return;
            }

            const index = checklist.items.findIndex(data => data.id === item.id);
            if (index !== -1) {
                checklist.items.splice(index, 1);
            }

            renderChecklistDetail(checklist);
        });

        checkbox.addEventListener("change", () => {
            item.completed = checkbox.checked;

            renderChecklistDetail(checklist);
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