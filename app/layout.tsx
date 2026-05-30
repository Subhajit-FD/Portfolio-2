import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "next-themes";
import LenisSmoothScroll from "@/components/custom/lenis";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistHeading = Geist({ subsets: ["latin"], variable: "--font-heading" });

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Subhajit | Portfolio",
  description: "Portfolio of Subhajit, a Full-Stack Developer specializing in building scalable web applications, modern UI/UX, and robust backend solutions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        geistHeading.variable,
        "font-sans",
      )}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider attribute={"class"} enableSystem>
          <LenisSmoothScroll />
          {children}
          <Toaster position="bottom-right"/>
        </ThemeProvider>
      </body>
    </html>
  );
}
