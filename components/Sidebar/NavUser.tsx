'use client';

import { useState } from 'react';
import Link from "next/link";
import { useAuth } from '@/components/AuthProvider/Auth';
import { useRouter } from "next/navigation";
import { supabase } from '@/lib/supabase-browser';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import {
  BadgeCheck,
  LogOut,
  ShoppingCart,
  User,
  Moon,
  Sun,
  HelpCircle
} from "lucide-react";

export function NavUser() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4">
        <Link href="/login" className="w-full">
          <SidebarMenuButton 
            size="lg" 
            className="w-full justify-center bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
          >
            <span className="truncate font-medium">Iniciar sesión</span>
          </SidebarMenuButton>
        </Link>
      </div>
    );
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="p-4 border-t border-slate-200 dark:border-slate-800">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton 
            size="lg" 
            className="w-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Avatar className="h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-700">
              <AvatarImage src={user.avatar || ""} alt={user.nombre || "Usuario"} />
              <AvatarFallback className="rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                {user?.nombre?.[0] || "U"}{user?.apellido?.[0] || "S"}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">
                {user.nombre} {user.apellido}
              </span>
              <span className="truncate text-xs text-slate-500 dark:text-slate-400">{user.correo}</span>
            </div>
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-3 p-3 text-left">
              <Avatar className="h-10 w-10 rounded-lg border border-slate-200 dark:border-slate-700">
                <AvatarImage src={user.avatar || ""} alt={user.nombre || "Usuario"} />
                <AvatarFallback className="rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  {user?.nombre?.[0] || "U"}{user?.apellido?.[0] || "S"}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left leading-tight">
                <span className="font-medium">
                  {user.nombre} {user.apellido}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{user.correo}</span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <Link href="/Perfil" passHref>
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer p-3">
                <BadgeCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>Perfil</span>
              </DropdownMenuItem>
            </Link>
            <Link href="/Compras" passHref>
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer p-3">
                <ShoppingCart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>Mis compras</span>
              </DropdownMenuItem>
            </Link>
            <DropdownMenuItem 
              onClick={toggleTheme} 
              className="flex items-center gap-2 cursor-pointer p-3"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-4 w-4 text-amber-500" />
                  <span>Modo claro</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 text-slate-700" />
                  <span>Modo oscuro</span>
                </>
              )}
            </DropdownMenuItem>
            <Link href="/Ayuda" passHref>
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer p-3">
                <HelpCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>Ayuda</span>
              </DropdownMenuItem>
            </Link>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleLogout}
            className="flex items-center gap-2 cursor-pointer p-3 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
          >
            <LogOut className="h-4 w-4" />
            <span>Salir</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}