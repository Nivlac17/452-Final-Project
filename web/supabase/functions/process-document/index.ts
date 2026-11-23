import { createClient } from "npm:@supabase/supabase-js@2";
import OpenAI from "npm:openai@4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function splitIntoChunks(text: string, size = 180, overlap = 35) {
  const words = text.replace(/\r\n/g, "\n").split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  for (let start = 0; start < words.length; start += size - overlap) {
    const content = words.slice(start, start + size).join(" ").trim();
    if (content) chunks.push(content);
  }
  return chunks;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return Response.json({ error: "Use POST." }, { status: 405, headers: corsHeaders });

  const authorization = request.headers.get("Authorization");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const publishableKey = Deno.env.get("SUPABASE_ANON_KEY");
  const openAiKey = Deno.env.get("OPENAI_API_KEY");
  if (!authorization || !supabaseUrl || !publishableKey || !openAiKey) {
    return Response.json({ error: "Function configuration is incomplete." }, { status: 503, headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, publishableKey, { global: { headers: { Authorization: authorization } } });
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return Response.json({ error: "Sign in to index this file." }, { status: 401, headers: corsHeaders });

  let documentId = "";
  try {
    const body = await request.json();
    documentId = typeof body.documentId === "string" ? body.documentId : "";
    if (!documentId) return Response.json({ error: "A document ID is required." }, { status: 400, headers: corsHeaders });

    const { data: document, error: documentError } = await supabase.from("documents")
      .select("id,user_id,persona_id,file_name,storage_path,status")
      .eq("id", documentId).single();
    if (documentError || !document || document.user_id !== authData.user.id) {
      return Response.json({ error: "Document not found." }, { status: 404, headers: corsHeaders });
    }

    await supabase.from("documents").update({ status: "processing", error_message: null }).eq("id", document.id);
    const { data: file, error: downloadError } = await supabase.storage.from("persona-text").download(document.storage_path);
    if (downloadError || !file) throw new Error(downloadError?.message ?? "Could not read uploaded text.");
    const text = (await file.text()).replace(/\0/g, "").trim();
    if (text.length < 20) throw new Error("This file does not contain enough readable text.");
    if (text.length > 500_000) throw new Error("Text files must contain under 500,000 characters each.");
    const chunks = splitIntoChunks(text);
    if (!chunks.length) throw new Error("No readable text was found.");

    const openai = new OpenAI({ apiKey: openAiKey });
    const embeddingModel = Deno.env.get("OPENAI_EMBEDDING_MODEL") ?? "text-embedding-3-small";
    let total = 0;
    for (let offset = 0; offset < chunks.length; offset += 64) {
      const batch = chunks.slice(offset, offset + 64);
      const embedded = await openai.embeddings.create({ model: embeddingModel, input: batch });
      const rows = batch.map((content, index) => ({
        user_id: authData.user!.id,
        persona_id: document.persona_id,
        document_id: document.id,
        chunk_index: offset + index,
        content,
        embedding: embedded.data[index].embedding,
      }));
      const { error: insertError } = await supabase.from("chunks").insert(rows);
      if (insertError) throw new Error(insertError.message);
      total += rows.length;
    }

    const { error: readyError } = await supabase.from("documents").update({ status: "ready", chunk_count: total, error_message: null }).eq("id", document.id);
    if (readyError) throw new Error(readyError.message);
    return Response.json({ documentId, chunkCount: total }, { headers: corsHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 400) : "Text indexing failed.";
    if (documentId) await supabase.from("documents").update({ status: "failed", error_message: message }).eq("id", documentId);
    return Response.json({ error: message }, { status: 400, headers: corsHeaders });
  }
});
