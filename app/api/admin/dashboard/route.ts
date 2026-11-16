import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [submissionsRes, pollsRes] = await Promise.all([
    supabaseAdmin.from("battle_submissions").select("id,battle_id,image_url,created_at").order("created_at", { ascending: false }),
    supabaseAdmin.from("battle_polls").select("id,title,is_active").order("created_at", { ascending: false }),
  ]);
  if (submissionsRes.error || pollsRes.error) return NextResponse.json({ error: "Could not load dashboard data." }, { status: 500 });
  const polls = await Promise.all((pollsRes.data ?? []).map(async (poll) => {
    const { count } = await supabaseAdmin.from("battle_votes").select("*", { count: "exact", head: true }).eq("poll_id", poll.id);
    return { ...poll, total_votes: count ?? 0 };
  }));
  return NextResponse.json({ submissions: submissionsRes.data ?? [], polls });
}
