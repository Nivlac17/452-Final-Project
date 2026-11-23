"use client";

import { FormEvent, useState } from "react";
import { ArrowUp, LoaderCircle, Sparkles } from "lucide-react";

type Source = { label: string; documentId?: string; fileName: string; passage: number; excerpt: string };
type Message = { id: string; role: "user" | "assistant"; content: string; sources?: Source[] };

export function PersonaChat({ personaId, initialMessages = [], initialConversationId = null, hasDocuments }: {
  personaId: string;
  initialMessages?: Message[];
  initialConversationId?: string | null;
  hasDocuments: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = question.trim();
    if (!value || busy) return;
    setError(""); setQuestion(""); setBusy(true);
    const pendingUser: Message = { id: `user-${Date.now()}`, role: "user", content: value };
    setMessages((current) => [...current, pendingUser]);
    try {
      const response = await fetch(`/api/personas/${personaId}/chat`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: value, conversationId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not answer question.");
      setConversationId(result.conversationId);
      setMessages((current) => [...current, result.message]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not answer question.");
      setQuestion(value);
    } finally { setBusy(false); }
  }

  return <section className="chat-panel">
    <div className="chat-title"><div><h2>Ask a question</h2><span style={{ color: "var(--muted)", fontSize: 11, display: "block", marginTop: 5 }}>Answers are best guesses grounded in uploaded writing.</span></div><Sparkles size={18} color="var(--accent)" /></div>
    <div className="messages">
      {!messages.length && <div className="chat-empty">{hasDocuments ? <>Ask about a memory, a favorite, or a point of view.<br />The answer will include the source passages it draws from.</> : <>Add a text file to start a searchable conversation.<br />This persona can’t answer from a source archive yet.</>}</div>}
      {messages.map((message) => <article className={`bubble ${message.role}`} key={message.id}>
        {message.content}
        {!!message.sources?.length && <div className="sources">Sources: {message.sources.map((source) => <span key={source.label} title={source.excerpt}>{source.label} · {source.fileName}, passage {source.passage}{" "}</span>)}</div>}
      </article>)}
      {busy && <article className="bubble assistant" style={{ display: "flex", gap: 8, alignItems: "center" }}><LoaderCircle size={14} className="animate-spin" />Looking through their writing…</article>}
    </div>
    {error && <p className="error-text">{error}</p>}
    <form className="ask-form" onSubmit={ask}>
      <textarea className="chat-input" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask something about this person…" rows={1} maxLength={2000} aria-label="Your question" />
      <button className="button primary" type="submit" aria-label="Send question" disabled={busy || !question.trim()}><ArrowUp size={17} />Ask</button>
    </form>
  </section>;
}
