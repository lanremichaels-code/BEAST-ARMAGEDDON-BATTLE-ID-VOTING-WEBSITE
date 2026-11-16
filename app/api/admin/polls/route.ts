import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim();
  const ids = Array.isArray(body.submission_ids) ? [...new Set(body.submission_ids.filter((x: unknown) => typeof x === "string"))] : [];
  if (!title || ids.length < 2) return NextResponse.json({ error: "Add a title and select at least two battles." }, { status: 400 });
  const { data: entries, error: entriesError } = await supabaseAdmin.from("battle_submissions").select("id").in("id", ids);
  if (entriesError || !entries || entries.length !== ids.length) return NextResponse.json({ error: "One or more selected submissions could not be found." }, { status: 400 });
  const { data: poll, error } = await supabaseAdmin.from("battle_polls").insert({ title, description: description || null, is_active: true }).select("id").single();
  if (error || !poll) return NextResponse.json({ error: "Could not create poll." }, { status: 500 });
  const options = ids.map((submission_id: string) => ({ poll_id: poll.id, submission_id }));
  const { error: optionError } = await supabaseAdmin.from("battle_poll_options").insert(options);
  if (optionError) {
    await supabaseAdmin.from("battle_polls").delete().eq("id", poll.id);
    return NextResponse.json({ error: "Could not add poll options." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, poll_id: poll.id });
}

export async function PATCH(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { poll_id } = await request.json();
  if (!poll_id) return NextResponse.json({ error: "Missing poll ID." }, { status: 400 });
  const { error } = await supabaseAdmin.from("battle_polls").update({ is_active: false }).eq("id", poll_id);
  if (error) return NextResponse.json({ error: "Could not close poll." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
