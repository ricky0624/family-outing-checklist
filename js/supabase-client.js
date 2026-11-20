
const SUPABASE_URL = "https://emfktidkfteqwuxqumkp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_4lbnjeXkBirDXuHg3HAFSw_Fxb3HFx8";

window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

console.log("Supabase Client 初始化完成");