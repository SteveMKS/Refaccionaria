"use client";

import Link from "next/link";
import useAuth from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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
} from "lucide-react";

export function NavUser() {
  const router = useRouter();
  const { user, loading } = useAuth(); // Ahora `user` tiene nombre y apellido

  if (loading) {
    return <p>Cargando...</p>; // 🔹 Evita mostrar datos incompletos
  }

  if (!user) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <Link href="/login">
            <SidebarMenuButton size="lg">
              <span className="truncate font-semibold">Iniciar sesión</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh(); // 🔹 Forzar actualización del estado del usuario
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar || ""} alt={user.nombre || "Usuario"} />
                <AvatarFallback className="rounded-lg">
                  {user?.nombre?.[0] || "U"}{user?.apellido?.[0] || "S"}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {user.nombre} {user.apellido}
                </span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar || ""} alt={user.nombre || "Usuario"} />
                  <AvatarFallback className="rounded-lg">
                    {user?.nombre?.[0] || "U"}{user?.apellido?.[0] || "S"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {user.nombre} {user.apellido}
                  </span>
                  <span className="truncate text-xs">{user.correo}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuSeparator />
              <Link href="/Perfil" passHref>
                <DropdownMenuItem>
                  <BadgeCheck />
                  Perfil
                </DropdownMenuItem>
              </Link>
              <Link href="/Compras" passHref>
              <DropdownMenuItem>
                <ShoppingCart />
                Mis compras
              </DropdownMenuItem>
              </Link>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut />
              Salir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
