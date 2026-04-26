import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Recruiter Agent Shortlist",
  description: "AI recruiter agent prototype for JD parsing, candidate matching, simulated outreach, and explainable shortlists."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
