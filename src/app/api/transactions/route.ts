import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/transactions — historial de transacciones del usuario autenticado
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const userId = await verifyAuthToken(authHeader.split(" ")[1]);

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("privy_did", userId)
      .single();

    if (!profile) return NextResponse.json([], { status: 200 });

    const { data, error } = await supabaseAdmin
      .from("transactions")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Token inválido";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
