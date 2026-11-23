"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FilePlus2, LoaderCircle } from "lucide-react";

export function DocumentUploader({ personaId }: { personaId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function upload() {
    const file = inputRef.current?.files?.[0];
    if (!file) { setError("Choose a .txt file first."); return; }
    setBusy(true); setError(""); setMessage("");
    const form = new FormData(); form.set("file", file);
    try {
      const response = await fetch(`/api/personas/${personaId}/documents`, { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Upload failed.");
      setMessage(`${result.fileName} is ready. Indexed ${result.chunkCount} passages.`);
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Upload failed.");
    } finally { setBusy(false); }
  }

  return <section className="form-card" style={{ padding: 22, marginTop: 20 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
      <div><h2 style={{ margin: 0, fontSize: 16 }}>Add their words</h2><p style={{ color: "var(--muted)", fontSize: 11, margin: "6px 0 0" }}>Upload a plain text file. It will be split into searchable passages.</p></div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}><input ref={inputRef} type="file" accept=".txt,text/plain" aria-label="Choose a text file" /><button className="button primary" type="button" onClick={upload} disabled={busy}>{busy ? <LoaderCircle size={14} className="animate-spin" /> : <FilePlus2 size={14} />}Upload file</button></div>
    </div>
    {message && <p className="success-text">{message}</p>}{error && <p className="error-text">{error}</p>}
  </section>;
}
