import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/context/StoreContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { UserProfileModal } from "@/components/layout/UserProfileModal";
import { AppPrivyProvider } from "@/providers/PrivyProvider";
import { AuthProvider } from "@/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Playrs - Ecosistema de Inteligencia Deportiva",
  description: "Plataforma de coleccionismo digital y predicción deportiva basada en el rendimiento real de jugadores de fútbol élite",
  keywords: ["fútbol", "trading", "deportes", "NFT", "inversión", "playrs"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased light`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground" suppressHydrationWarning>
        <AppPrivyProvider>
          <AuthProvider>
            <ThemeProvider>
              <LanguageProvider>
                <StoreProvider>
                  {children}
                  <UserProfileModal />
                </StoreProvider>
              </LanguageProvider>
            </ThemeProvider>
          </AuthProvider>
        </AppPrivyProvider>
      </body>
    </html>
  );
}
