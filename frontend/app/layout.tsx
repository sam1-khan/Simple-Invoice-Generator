import "./globals.css";
import { FontProvider } from "@/components/font-provider";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "@/components/navbar";
import { Suspense } from "react";
import Loading from "@/app/loading";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          href="/fonts/Inter-VariableFont_opsz,wght.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/Manrope-VariableFont_wght.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/Geist[wght].woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/GeistMono[wght].woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <FontProvider initialFont="inter" storageKey="app-font">
            <AuthProvider>
              <Navbar />
              <Suspense fallback={<Loading />}>
                <main>{children}</main>
                <Toaster />
              </Suspense>
            </AuthProvider>
          </FontProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}