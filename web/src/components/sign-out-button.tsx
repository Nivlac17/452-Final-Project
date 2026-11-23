"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export function SignOutButton() {
  const router = useRouter();
  return <button className="pill-button" onClick={async () => { await createClient().auth.signOut(); router.refresh(); }}>Sign out</button>;
}
