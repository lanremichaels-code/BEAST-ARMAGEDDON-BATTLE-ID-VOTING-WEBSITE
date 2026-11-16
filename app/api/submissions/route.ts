import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const battleId = String(form.get("battle_id") ?? "").trim();
    const image = form.get("image");
    if (!battleId || !(image instanceof File)) return NextResponse.json({ error: "Battle ID and screenshot are required." }, { status: 400 });
    if (!["image/jpeg", "image/png", "image/webp"].includes(image.type)) return NextResponse.json({ error: "Only JPG, PNG and WebP images are accepted." }, { status: 400 });
    if (image.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Image must be 5MB or smaller." }, { status: 400 });

    const extension = image.type === "image/png" ? "png" : image.type === "image/webp" ? "webp" : "jpg";
    const path = `${crypto.randomUUID()}.${extension}`;
    const bytes = Buffer.from(await image.arrayBuffer());
    const { error: uploadError } = await supabaseAdmin.storage.from("battle-images").upload(path, bytes, { contentType: image.type, upsert: false });
    if (uploadError) return NextResponse.json({ error: "Image upload failed. Please try again." }, { status: 500 });
    const { data: publicData } = supabaseAdmin.storage.from("battle-images").getPublicUrl(path);
    const { error: insertError } = await supabaseAdmin.from("battle_submissions").insert({ battle_id: battleId, image_url: publicData.publicUrl });
    if (insertError) {
      await supabaseAdmin.storage.from("battle-images").remove([path]);
      return NextResponse.json({ error: "Could not save your submission." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid submission. Please try again." }, { status: 400 });
  }
}
