async function getChecklistsFromDB() {

    const { data, error } = await window.supabaseClient
        .from("checklists")
        .select(`
            id,
            name,
            owner_id,
            created_at,
            checklist_items (
                id,
                name,
                completed,
                created_at
            )
        `)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("讀取清單失敗：", error.message);
        return null;
    }

    return data;
}

async function createChecklistInDB(name) {

    const checklistName = name.trim();

    if (!checklistName) {
        throw new Error("請輸入清單名稱");
    }

    const { data, error } = await window.supabaseClient
        .from("checklists")
        .insert({
            name: checklistName
        })
        .select("id, name, owner_id, created_at")
        .single();

    if (error) {
        throw error;
    }

    return data;
}


async function createChecklistWithItemsInDB(name, items = []) {

    // 1. 先建立清單
    const newList = await createChecklistInDB(name);

    let savedItems = [];

    // 2. 如果使用範本，將物品一起寫入資料庫
    if (items.length > 0) {

        const insertItems = items.map(item => ({
            checklist_id: newList.id,
            name: item.name,
            completed: item.completed
        }));

        const { data, error } = await window.supabaseClient
            .from("checklist_items")
            .insert(insertItems)
            .select("id, name, completed");

        if (error) {
            // 嘗試清除剛才建立的清單
            const { error: cleanupError } =
                await window.supabaseClient
                    .from("checklists")
                    .delete()
                    .eq("id", newList.id);

            if (cleanupError) {
                console.error("清除失敗的清單：", cleanupError);
            }

            throw error;
        }

        savedItems = data;
    }

    // 3. 回傳清單與物品資料
    return {
        ...newList,
        items: savedItems
    };
}


async function deleteChecklistInDB(checklistId) {

    const { data, error } = await window.supabaseClient
        .from("checklists")
        .delete()
        .eq("id", checklistId)
        .select("id")
        .maybeSingle();

    if (error) {
        throw error;
    }

    if (!data) {
        throw new Error("清單不存在，或目前帳號沒有刪除權限");
    }

    return data;
}


async function addChecklistItemInDB(checklistId, name) {
    const itemName = name.trim();

    if (!itemName) {
        throw new Error("請輸入物品名稱");
    }

    const { data, error } = await window.supabaseClient
        .from("checklist_items")
        .insert({
            checklist_id: checklistId,
            name: itemName,
            completed: false
        })
        .select("id, name, completed, created_at")
        .single();

    if (error) {
        throw error;
    }

    return data;
}


async function updateChecklistItemCompletedInDB(itemId, completed) {

    const { data, error } = await window.supabaseClient
        .from("checklist_items")
        .update({
            completed: completed
        })
        .eq("id", itemId)
        .select("id, name, completed")
        .maybeSingle();

    if (error) {
        throw error;
    }

    if (!data) {
        throw new Error("物品不存在，或沒有修改權限");
    }

    return data;
}


async function deleteChecklistItemInDB(itemId) {

    const { data, error } = await window.supabaseClient
        .from("checklist_items")
        .delete()
        .eq("id", itemId)
        .select("id")
        .maybeSingle();

    if (error) {
        throw error;
    }

    if (!data) {
        throw new Error("物品不存在，或沒有刪除權限");
    }

    return data;
}


async function resetChecklistItemsInDB(checklistId) {

    const { data, error } = await window.supabaseClient
        .from("checklist_items")
        .update({
            completed: false
        })
        .eq("checklist_id", checklistId)
        .select("id, completed");

    if (error) {
        throw error;
    }

    return data;
}


async function createChecklistInvitationInDB(checklistId) {

    const { data, error } = await window.supabaseClient
        .rpc("create_checklist_invitation", {
            p_checklist_id: checklistId
        });

    if (error) {
        throw error;
    }

    if (!data || typeof data !== "string") {
        throw new Error("沒有取得邀請 Token");
    }

    return data;
}


async function acceptChecklistInvitationInDB(token) {

    const { data, error } = await window.supabaseClient
        .rpc("accept_checklist_invitation", {
            p_token: token
        });

    if (error) {
        throw error;
    }

    if (!data) {
        throw new Error("接受邀請失敗，沒有取得清單 ID");
    }

    return data;
}


async function listChecklistInvitationsFromDB(checklistId) {

    const { data, error } = await window.supabaseClient
        .rpc("list_checklist_invitations", {
            p_checklist_id: checklistId
        });

    if (error) {
        throw error;
    }

    if (!Array.isArray(data)) {
        throw new Error("邀請紀錄格式不正確");
    }

    return data;
}


async function revokeChecklistInvitationInDB(invitationId) {

    const { data, error } = await window.supabaseClient
        .rpc("revoke_checklist_invitation", {
            p_invitation_id: invitationId
        });

    if (error) {
        throw error;
    }

    if (data !== true) {
        throw new Error(
            "邀請撤銷失敗，請確認邀請狀態或操作權限"
        );
    }

    return true;
}
