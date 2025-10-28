"use client"
import * as React from "react"

import {
  BookOpen,
  Bot,
  GalleryVerticalEnd,
  Settings2,
  SquareTerminal,
} from "lucide-react"

import { NavMain } from "@/components/Sidebar/NavMain"
import { NavUser } from "@/components/Sidebar/NavUser"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar"

const data = {
  teams: [
    {
      name: "Frontera",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
  ],
  navMain: [
    {
      title: "Aceites",
      url: "/Aceites",
      icon: SquareTerminal,
      isActive: false,
      items: [
        { title: "Akron", url: "/Aceites/Akron" },
        { title: "Bardahl", url: "/Aceites/Bardahl" },
        { title: "Castrol", url: "/Aceites/Castrol" },
        { title: "Chevron", url: "/Aceites/Chevron" },
        { title: "Gonher", url: "/Aceites/Gonher" },
        { title: "Lucas Oil", url: "/Aceites/LucasOil" },
        { title: "Mobil", url: "/Aceites/Mobil" },
        { title: "Quaker State", url: "/Aceites/QuakerState" },
        { title: "STP", url: "/Aceites/STP" },
        { title: "Valucraft", url: "/Aceites/Valucraft" },
      ],
    },
    {
      title: "Balatas",
      url: "/Balatas",
      icon: BookOpen,
      items: [
        { title: "Delanteras", url: "/Balatas/Delanteras" },
        { title: "Traseras", url: "/Balatas/Traseras" },
      ],
    },
    {
      title: "Bujías",
      url: "/Bujias",
      icon: Settings2,
      items: [
        { title: "AutoLite", url: "/Bujias/AutoLite" },
        { title: "Bosch", url: "/Bujias/Bosch" },
        { title: "Bosch Platinum", url: "/Bujias/Bosch Platinum" },
        { title: "Champion", url: "/Bujias/Champion" },
        { title: "Denso", url: "/Bujias/Denso" },
        { title: "Denso Iridium TT", url: "/Bujias/Denso Iridium TT" },
        { title: "NGK", url: "/Bujias/NGK" },
        { title: "NGK Laser Iridium", url: "/Bujias/NGK Laser Iridium" },
      ],
    },
    {
      title: "Baterias",
      url: "/Baterias",
      icon: Bot,
      items: [
        { title: "Duralast", url: "/Baterias/Duralast" },
        { title: "Optima", url: "/Baterias/Optima" },
        { title: "Valucraft", url: "/Baterias/Valucraft" },
      ],
    },
  ],
  categories: [
    {
      title: "Categorias",
      url: "/Categorias",
      icon: BookOpen,
      isActive: false,
      items: [
        { title: "Refacciones", url: "/Categorias/Refacciones" },
        { title: "Interiores", url: "/Categorias/Interiores" },
        { title: "Exteriores", url: "/Categorias/Exteriores" },
        { title: "Herramientas", url: "/Categorias/Herramientas" },
        { title: "Otros", url: "/Categorias/Otros" },
      ],
    },
  ],
  Admin: [
    {
      title: "Administración",
      url: "/Admin",
      icon: BookOpen,
      isActive: false,
      items: [
        { title: "Gestion de Inventario", url: "/Admin/Inventario" },
        { title: "Recibos de Ventas", url: "/Admin/RecibosDeVentas" },
        { title: "Scaneo de Código", url: "/Admin/Scan" },
      ],
    },
  ],
};

export const categories = data.categories;

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        <NavMain items={data.navMain} categories={data.categories} Admin={data.Admin}/>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
