import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to create a persona." }, { status: 401 });

  const form = await request.formData();
  const name = String(form.get("name") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const relationship = String(form.get("relationship") ?? "").trim();
  const image = form.get("image");
  if (!name || name.length > 80) return NextResponse.json({ error: "Enter a name up to 80 characters." }, { status: 400 });
  if (description.length > 600 || relationship.length > 100) return NextResponse.json({ error: "One of the profile fields is too long." }, { status: 400 });
  if (image instanceof File && image.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Choose an image under 5 MB." }, { status: 400 });

  const { data: persona, error } = await supabase.from("personas").insert({ user_id: user.id, name, description, relationship }).select("id").single();
  if (error || !persona) return NextResponse.json({ error: error?.message ?? "Could not create persona." }, { status: 400 });

  if (image instanceof File && image.size > 0) {
    if (!image.type.startsWith("image/") || !["image/jpeg", "image/png", "image/webp"].includes(image.type)) {
      await supabase.from("personas").delete().eq("id", persona.id);
      return NextResponse.json({ error: "Use a JPG, PNG, or WebP image." }, { status: 400 });
    }
    const path = `${user.id}/${persona.id}/${crypto.randomUUID()}.${image.type.split("/")[1]}`;
    const { error: uploadError } = await supabase.storage.from("persona-images").upload(path, image, { contentType: image.type, upsert: false });
    if (uploadError) {
      await supabase.from("personas").delete().eq("id", persona.id);
      return NextResponse.json({ error: uploadError.message }, { status: 400 });
    }
    await supabase.from("personas").update({ image_path: path }).eq("id", persona.id);
  }

  return NextResponse.json({ id: persona.id });
}
