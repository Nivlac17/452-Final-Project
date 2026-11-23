"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle, Pencil, X } from "lucide-react";

export function PersonaEditor({ persona }: { persona: { id: string; name: string; description: string | null; relationship: string | null } }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save(formData: FormData) {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/personas/${persona.id}`, { method: "PATCH", body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not update persona.");
      setOpen(false); router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update persona.");
    } finally { setBusy(false); }
  }

  return <>
    <button className="button ghost" onClick={() => setOpen((value) => !value)}>{open ? <X size={14} /> : <Pencil size={14} />}{open ? "Close" : "Edit persona"}</button>
    {open && <section className="form-card" style={{ margin: "18px 0", padding: 22 }}>
      <h2 style={{ margin: "0 0 18px", fontSize: 18 }}>Edit persona</h2>
      <form action={save} className="form-grid">
        <div className="field"><label htmlFor="edit-name">Name</label><input id="edit-name" name="name" defaultValue={persona.name} required maxLength={80} /></div>
        <div className="field"><label htmlFor="edit-relationship">Your relationship</label><input id="edit-relationship" name="relationship" defaultValue={persona.relationship ?? ""} maxLength={100} /></div>
        <div className="field full"><label htmlFor="edit-description">Short introduction</label><textarea id="edit-description" name="description" defaultValue={persona.description ?? ""} maxLength={600} /></div>
        <div className="field full"><label htmlFor="edit-image">Replace picture (optional)</label><input id="edit-image" name="image" type="file" accept="image/jpeg,image/png,image/webp" /></div>
        {error && <p className="error-text field full">{error}</p>}
        <div className="form-actions field full"><span style={{ color: "var(--muted)", fontSize: 11 }}>Leave picture empty to keep the current one.</span><button className="button primary" disabled={busy}>{busy ? <LoaderCircle size={14} className="animate-spin" /> : <Check size={14} />}Save changes</button></div>
      </form>
    </section>}
  </>;
}
