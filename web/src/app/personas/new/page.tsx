import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PersonaForm } from "@/components/persona-form";
import { createClient } from "@/lib/supabase/server";

export default async function NewPersonaPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  return <main className="shell">
    <header className="topbar"><Link href="/" className="brand"><span className="brand-mark">p</span>personabuilder</Link><Link className="pill-button" href="/">Back to personas</Link></header>
    <div className="form-wrap">
      <Link href="/" className="back-link"><ArrowLeft size={14} />All personas</Link>
      <PersonaForm />
    </div>
  </main>;
}
