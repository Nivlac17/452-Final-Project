"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ImagePlus, LoaderCircle } from "lucide-react";

export function PersonaForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(formData: FormData) {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/personas", { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not save persona.");
      router.push(`/personas/${result.id}`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save persona.");
      setBusy(false);
    }
  }

  return <section className="form-card">
    <div className="eyebrow">A new story</div>
    <h1>Create a persona</h1>
    <p className="intro">Start with the person’s profile. You can add their words now or upload more later.</p>
    <form ref={formRef} action={submit}>
      <div className="form-grid">
        <div className="field"><label htmlFor="persona-name">Name</label><input id="persona-name" name="name" required maxLength={80} placeholder="e.g. Grandma June" /></div>
        <div className="field"><label htmlFor="relationship">Your relationship</label><input id="relationship" name="relationship" maxLength={100} placeholder="e.g. Grandmother" /></div>
        <div className="field full"><label htmlFor="description">A short introduction</label><textarea id="description" name="description" maxLength={600} placeholder="Who are they? What should someone know before asking a question?" /><small>Up to 600 characters.</small></div>
        <div className="field full"><label htmlFor="image">Portrait (optional)</label><div className="upload-box"><ImagePlus size={23} /><span>Choose a JPG, PNG, or WebP image (max 5 MB)</span><input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp" /></div></div>
      </div>
      {error && <p className="error-text">{error}</p>}
      <div className="form-actions"><Link className="button ghost" href="/">Cancel</Link><button className="button primary" type="submit" disabled={busy}>{busy && <LoaderCircle className="animate-spin" size={15} />}Create persona</button></div>
    </form>
  </section>;
}
