import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, FileText, UserRound } from "lucide-react";
import { DocumentUploader } from "@/components/document-uploader";
import { PersonaChat } from "@/components/persona-chat";
import { PersonaEditor } from "@/components/persona-editor";
import { createClient } from "@/lib/supabase/server";

export default async function PersonaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  if (!supabase) redirect("/");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: persona } = await supabase.from("personas").select("id,name,description,relationship,image_path,created_at").eq("id", id).single();
  if (!persona) notFound();
  const { data: documents } = await supabase.from("documents").select("id,file_name,status,chunk_count,uploaded_at").eq("persona_id", id).order("uploaded_at", { ascending: false });
  let imageUrl: string | null = null;
  if (persona.image_path) {
    const { data } = await supabase.storage.from("persona-images").createSignedUrl(persona.image_path, 3600);
    imageUrl = data?.signedUrl ?? null;
  }

  const { data: conversation } = await supabase.from("conversations").select("id").eq("persona_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  let initialMessages: { id: string; role: "user" | "assistant"; content: string; sources?: { label: string; fileName: string; passage: number; excerpt: string }[] }[] = [];
  if (conversation) {
    const { data: messages } = await supabase.from("messages").select("id,role,content,sources").eq("conversation_id", conversation.id).order("created_at", { ascending: true }).limit(60);
    initialMessages = (messages ?? []).map((message) => ({ id: message.id, role: message.role as "user" | "assistant", content: message.content, sources: message.sources as { label: string; fileName: string; passage: number; excerpt: string }[] }));
  }

  const readyDocuments = (documents ?? []).filter((document) => document.status === "ready");
  return <main className="shell">
    <header className="topbar"><Link href="/" className="brand"><span className="brand-mark">p</span>personabuilder</Link><Link href="/" className="pill-button">All personas</Link></header>
    <Link href="/" className="back-link"><ArrowLeft size={14} />Your personas</Link>
    <section className="detail-head">
      <div className="detail-portrait">{imageUrl ? <Image src={imageUrl} alt={persona.name} width={500} height={625} unoptimized /> : <div className="portrait-initial"><UserRound size={50} strokeWidth={1.1} /></div>}</div>
      <div className="detail-copy"><div className="eyebrow">Your person, remembered</div><h1>{persona.name}</h1><p>{persona.relationship && <strong style={{ color: "var(--ink)" }}>{persona.relationship} · </strong>}{persona.description || "Add a little introduction to help set the scene."}</p><PersonaEditor persona={{ id: persona.id, name: persona.name, description: persona.description, relationship: persona.relationship }} /></div>
    </section>
    <DocumentUploader personaId={persona.id} />
    <section style={{ marginTop: 26 }}><div className="section-row" style={{ marginTop: 25 }}><div><h2>Source library</h2><p>{readyDocuments.length} indexed {readyDocuments.length === 1 ? "document" : "documents"}</p></div></div>
      {documents?.length ? <div className="document-list">{documents.map((document) => <div className="document-row" key={document.id}><span style={{ display: "flex", gap: 9, alignItems: "center" }}><FileText size={15} color="var(--accent)" />{document.file_name}</span><span>{document.status === "ready" ? `${document.chunk_count} passages · Ready` : document.status}</span></div>)}</div> : <div className="document-row" style={{ color: "var(--muted)" }}>No source files yet. Upload a text file to begin.</div>}</section>
    <PersonaChat personaId={persona.id} initialMessages={initialMessages} initialConversationId={conversation?.id ?? null} hasDocuments={readyDocuments.length > 0} />
    <footer className="footer-note">This persona is an AI-generated interpretation of uploaded material—not the person themselves.</footer>
  </main>;
}
