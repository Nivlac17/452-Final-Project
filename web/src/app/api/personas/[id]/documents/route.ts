import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { splitIntoChunks } from "@/lib/text-chunks";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Context) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to upload content." }, { status: 401 });
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "Add OPENAI_API_KEY to web/.env.local before indexing text." }, { status: 503 });
  const { id: personaId } = await params;
  const { data: persona } = await supabase.from("personas").select("id").eq("id", personaId).single();
  if (!persona) return NextResponse.json({ error: "Persona not found." }, { status: 404 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".txt")) return NextResponse.json({ error: "Choose a .txt file." }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "Text files must be 10 MB or smaller." }, { status: 400 });
  const text = (await file.text()).replace(/\0/g, "").trim();
  if (text.length < 20) return NextResponse.json({ error: "This file does not contain enough readable text." }, { status: 400 });
  if (text.length > 500_000) return NextResponse.json({ error: "For the first version, each file must contain under 500,000 characters." }, { status: 400 });
  const chunks = splitIntoChunks(text);
  if (!chunks.length) return NextResponse.json({ error: "No readable text was found." }, { status: 400 });

  const documentId = crypto.randomUUID();
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  const storagePath = `${user.id}/${personaId}/${documentId}-${cleanName}`;
  const { error: uploadError } = await supabase.storage.from("persona-text").upload(storagePath, file, { contentType: "text/plain" });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 400 });

  const { error: documentError } = await supabase.from("documents").insert({ id: documentId, user_id: user.id, persona_id: personaId, file_name: file.name.slice(0, 255), storage_path: storagePath, status: "processing" });
  if (documentError) {
    await supabase.storage.from("persona-text").remove([storagePath]);
    return NextResponse.json({ error: documentError.message }, { status: 400 });
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const embeddingModel = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";
    const rows = [];
    for (let offset = 0; offset < chunks.length; offset += 64) {
      const batch = chunks.slice(offset, offset + 64);
      const embedded = await openai.embeddings.create({ model: embeddingModel, input: batch });
      for (let index = 0; index < batch.length; index++) {
        rows.push({ user_id: user.id, persona_id: personaId, document_id: documentId, chunk_index: offset + index, content: batch[index], embedding: embedded.data[index].embedding });
      }
    }
    const { error: chunkError } = await supabase.from("chunks").insert(rows);
    if (chunkError) throw chunkError;
    const { error: readyError } = await supabase.from("documents").update({ status: "ready", chunk_count: rows.length }).eq("id", documentId);
    if (readyError) throw readyError;
    return NextResponse.json({ documentId, fileName: file.name, chunkCount: rows.length });
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "Text indexing failed.";
    await supabase.from("documents").delete().eq("id", documentId);
    await supabase.storage.from("persona-text").remove([storagePath]);
    return NextResponse.json({ error: `Could not index this file: ${message}` }, { status: 500 });
  }
}
