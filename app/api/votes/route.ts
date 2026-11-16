import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const body = await request.json();
  const pollId = String(body.poll_id ?? "");
  const optionId = String(body.option_id ?? "");
  const voterKey = String(body.voter_key ?? "");
  if (!pollId || !optionId || voterKey.length < 20 || voterKey.length > 100) {
    return NextResponse.json({ error: "Invalid vote details." }, { status: 400 });
  }
  const { data: poll } = await supabaseAdmin.from("battle_polls").select("id,is_active").eq("id", pollId).single();
  if (!poll || !poll.is_active) return NextResponse.json({ error: "This poll is closed." }, { status: 400 });
  const { data: option } = await supabaseAdmin.from("battle_poll_options").select("id").eq("id", optionId).eq("poll_id", pollId).single();
  if (!option) return NextResponse.json({ error: "That option does not belong to this poll." }, { status: 400 });
  const voterHash = createHash("sha256").update(voterKey).digest("hex");
  const { error } = await supabaseAdmin.from("battle_votes").insert({ poll_id: pollId, option_id: optionId, voter_hash: voterHash });
  if (error?.code === "23505") return NextResponse.json({ error: "You have already voted in this poll." }, { status: 409 });
  if (error) return NextResponse.json({ error: "Vote could not be saved." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
