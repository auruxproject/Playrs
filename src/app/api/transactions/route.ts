import { NextRequest, NextResponse } from "next/server";
import { PrivyClient } from "@privy-io/server-auth";
import { supabaseAdmin } from "@/lib/supabase";

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
);

// GET /api/transactions — historial de transacciones del usuario autenticado
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const claims = await privy.verifyAuthToken(authHeader.split(" ")[1]);

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("privy_did", claims.userId)
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
  } catch {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }
}
