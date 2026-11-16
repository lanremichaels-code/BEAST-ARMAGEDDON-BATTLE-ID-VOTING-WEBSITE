import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AOW3 Battle Arena",
  description: "Submit your Art of War 3 battle ID and vote for the next gameplay feature.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
