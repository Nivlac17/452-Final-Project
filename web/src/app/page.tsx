import Link from "next/link";
import Image from "next/image";
import { Plus, Sparkles, UserRound } from "lucide-react";
import { SignInButton } from "@/components/sign-in-button";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  if (!supabase) {
    return <main className="center-screen"><section className="login-card">
      <div className="brand"><span className="brand-mark">p</span>personabuilder</div>
      <div className="eyebrow" style={{ marginTop: 34 }}>A life, in their words</div>
      <h1>Keep their stories close.</h1>
      <p>Build a thoughtful AI persona from the writing and memories you provide. Ask questions, explore what they shared, and see the words behind every answer.</p>
      <SignInButton disabled />
      <div className="config-note">The app foundation is ready. Add your Supabase URL and public anon key in <code>web/.env.local</code> to enable secure sign-in.</div>
    </section></main>;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <main className="center-screen"><section className="login-card">
    <div className="brand"><span className="brand-mark">p</span>personabuilder</div>
    <div className="eyebrow" style={{ marginTop: 34 }}>A life, in their words</div>
    <h1>Keep their stories close.</h1>
    <p>Build a thoughtful AI persona from the writing and memories you provide. Ask questions, explore what they shared, and see the words behind every answer.</p>
    <SignInButton />
    <div className="footer-note" style={{ border: 0, padding: "22px 0 0" }}>Answers are AI-generated best guesses grounded in the material you upload.</div>
  </section></main>;

  const { data: personas } = await supabase.from("personas").select("id,name,description,relationship,image_path,created_at").order("created_at", { ascending: false });
  const cards = await Promise.all((personas ?? []).map(async (persona) => {
    let imageUrl: string | null = null;
    if (persona.image_path) {
      const { data } = await supabase.storage.from("persona-images").createSignedUrl(persona.image_path, 3600);
      imageUrl = data?.signedUrl ?? null;
    }
    return { ...persona, imageUrl };
  }));

  return <main className="shell">
    <header className="topbar"><Link href="/" className="brand"><span className="brand-mark">p</span>personabuilder</Link>
      <div className="top-actions"><span>{user.email}</span><SignOutButton /></div>
    </header>
    <section className="hero"><div className="eyebrow"><Sparkles size={13} style={{ display: "inline", verticalAlign: "-2px", marginRight: 7 }} />Your people, remembered</div>
      <h1>Who would you like<br />to spend time with?</h1>
      <p>Choose a persona to ask a question, revisit their stories, or add more of what they shared.</p>
    </section>
    <div className="section-row"><div><h2>Your personas</h2><p>{cards.length} {cards.length === 1 ? "story" : "stories"} in your collection</p></div></div>
    <section className="persona-grid">
      <Link href="/personas/new" className="add-card"><span className="plus"><Plus size={27} strokeWidth={1.6} /></span><strong>Create a persona</strong></Link>
      {cards.map((persona) => <Link key={persona.id} href={`/personas/${persona.id}`} className="persona-card">
        <div className="portrait">{persona.imageUrl ? <Image src={persona.imageUrl} alt={persona.name} width={500} height={625} unoptimized /> : <div className="portrait-initial"><UserRound size={56} strokeWidth={1.1} /></div>}<div className="portrait-shade" /><div className="portrait-caption"><b>{persona.name}</b><span>{persona.relationship || "A person worth remembering"}</span></div></div>
      </Link>)}
    </section>
    <footer className="footer-note">A best guess, grounded in their words. Every answer should point back to the stories it draws from.</footer>
  </main>;
}
