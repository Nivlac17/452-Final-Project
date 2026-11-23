import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PersonaBuilder — a life in their words",
  description: "Build evidence-grounded AI personas from the writing and memories you provide.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased"><body className="min-h-full flex flex-col">{children}</body></html>
  );
}
