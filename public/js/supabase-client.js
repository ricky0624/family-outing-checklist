
const SUPABASE_URL = "https://hpdpcjqclejqfodedmyg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_xA637SHUtjR8y-14UbzAWw_6t-2NJNo";

window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

console.log("Supabase Client 初始化完成");