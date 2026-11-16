import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const { data: polls, error } = await supabaseAdmin.from("battle_polls").select("id,title,description").eq("is_active", true).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Could not load polls." }, { status: 500 });
  const result = await Promise.all((polls ?? []).map(async (poll) => {
    const { data: options } = await supabaseAdmin.from("battle_poll_options").select("id,submission_id,battle_submissions(battle_id,image_url)").eq("poll_id", poll.id);
    const { count } = await supabaseAdmin.from("battle_votes").select("*", { count: "exact", head: true }).eq("poll_id", poll.id);
    const mapped = await Promise.all((options ?? []).map(async (option: any) => {
      const { count: votes } = await supabaseAdmin.from("battle_votes").select("*", { count: "exact", head: true }).eq("option_id", option.id);
      const submission = Array.isArray(option.battle_submissions) ? option.battle_submissions[0] : option.battle_submissions;
      return { id: option.id, battle_id: submission?.battle_id ?? "", image_url: submission?.image_url ?? "", votes: votes ?? 0 };
    }));
    return { ...poll, options: mapped, total_votes: count ?? 0 };
  }));
  return NextResponse.json({ polls: result });
}
