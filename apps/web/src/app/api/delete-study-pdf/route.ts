import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function DELETE(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get("authorization");
  const accessToken = authHeader?.replace("Bearer ", "");
  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
  );

  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  const { id } = await req.json() as { id: string };
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  // ── Fetch the record (verify ownership via RLS) ───────────────────────────
  const { data: record, error: fetchError } = await client
    .from("study_materials")
    .select("storage_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // ── Delete from storage ───────────────────────────────────────────────────
  const { error: storageError } = await client.storage
    .from("study-materials")
    .remove([record.storage_path]);

  if (storageError) {
    console.error("[delete-study-pdf] storage error:", storageError);
    // Continue anyway — remove DB record even if storage fails
  }

  // ── Delete DB record ──────────────────────────────────────────────────────
  const { error: dbError } = await client
    .from("study_materials")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (dbError) {
    return NextResponse.json({ error: `Database error: ${dbError.message}` }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
