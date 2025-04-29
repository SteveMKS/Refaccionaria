import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeProvider } from "next-themes";
import { ModeToggle } from "@/components/ModeToogle";
import { SyncCart } from "@/components/CartSync";
import { AuthProvider } from "@/components/Auth";
import { HydrateUser } from "@/components/HydrateUser";


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
                        <HydrateUser />
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
