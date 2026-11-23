import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to edit personas." }, { status: 401 });
  const { id } = await params;
  const form = await request.formData();
  const name = String(form.get("name") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const relationship = String(form.get("relationship") ?? "").trim();
  const image = form.get("image");
  if (!name || name.length > 80) return NextResponse.json({ error: "Enter a name up to 80 characters." }, { status: 400 });
  if (description.length > 600 || relationship.length > 100) return NextResponse.json({ error: "One of the profile fields is too long." }, { status: 400 });

  const { data: oldPersona, error: lookupError } = await supabase.from("personas").select("image_path").eq("id", id).single();
  if (lookupError || !oldPersona) return NextResponse.json({ error: "Persona not found." }, { status: 404 });

  let imagePath = oldPersona.image_path;
  if (image instanceof File && image.size > 0) {
    if (image.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(image.type)) {
      return NextResponse.json({ error: "Use a JPG, PNG, or WebP image under 5 MB." }, { status: 400 });
    }
    imagePath = `${user.id}/${id}/${crypto.randomUUID()}.${image.type.split("/")[1]}`;
    const { error: uploadError } = await supabase.storage.from("persona-images").upload(imagePath, image, { contentType: image.type });
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 400 });
  }

  const { error } = await supabase.from("personas").update({ name, description, relationship, image_path: imagePath }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (oldPersona.image_path && imagePath !== oldPersona.image_path) await supabase.storage.from("persona-images").remove([oldPersona.image_path]);
  return NextResponse.json({ ok: true });
}
