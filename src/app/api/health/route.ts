import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { diag } from "@/lib/diag";

// GET /api/health — diagnóstico: presencia de env vars (sin valores) + conexión a Supabase.
// No expone secretos, solo true/false de si están configurados.
export async function GET() {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_WEB3AUTH_CLIENT_ID: !!process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID,
    NEXT_PUBLIC_SOLANA_RPC_URL: !!process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
    RAPIDAPI_KEY: !!process.env.RAPIDAPI_KEY,
    APISPORTS_KEY: !!process.env.APISPORTS_KEY,
    ORACLE_SECRET_KEY: !!process.env.ORACLE_SECRET_KEY,
  };

  let supabaseOk = false;
  let supabaseError: string | null = null;
  try {
    const { error } = await supabaseAdmin.from("profiles").select("id").limit(1);
    if (error) supabaseError = error.message;
    else supabaseOk = true;
  } catch (e) {
    supabaseError = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json({ env, supabaseOk, supabaseError, lastUserCall: diag.lastUserCall });
}
