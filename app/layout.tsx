import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "next-themes";
import { ModeToggle } from "@/components/mode-toogle";
import { SyncCart } from "@/components/sync-cart";
import { AuthProvider } from "@/components/Auth";
import { supabase } from "@/lib/supabase-browser"; // ✅ IMPORTACIÓN CORRECTA

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Frontera APP",
  description: "Refacciones de Calidad",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <SidebarProvider>
              <AppSidebar />
              <main className="flex-1">
                <SidebarTrigger />
                <ModeToggle />
                <SyncCart />
                {children}
              </main>
            </SidebarProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}



/*export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            >
          <SidebarProvider>
            <AppSidebar />
            <main className="flex-1">
              <SidebarTrigger />
              <ModeToggle />
              {children}
              </main>
            </SidebarProvider>

            <main className="flex-1">
              <SidebarTrigger />
               <ModeToggle />
               <SyncCart /> 
              {children}
            </main>
          </ThemeProvider>
      </body>
    </html>
  );
}*/
