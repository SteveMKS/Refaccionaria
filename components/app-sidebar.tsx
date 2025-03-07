"use client"
import * as React from "react"
//import data from "@/data"; // Asegura que data.navMain esté correctamente importado

import {
  BookOpen,
  Bot,
  GalleryVerticalEnd,
  Settings2,
  SquareTerminal,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
  PanelLeftOpen,
} from "@/components/ui/sidebar"

// This is sample data.
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
        { title: "Akron", url: "/Aceites/Akron", },
        { title: "Bardahl", url: "/Aceites/Bardahl", },
        { title: "Castrol", url: "/Aceites/Castrol", },
        { title: "Chevron", url: "/Aceites/Chevron", },
        { title: "Gonher", url: "/Aceites/Gonher", },
        { title: "Lucas Oil", url: "/Aceites/LucasOil", },
        { title: "Mobil", url: "/Aceites/Mobil", },
        { title: "Quaker State", url: "/Aceites/QuakerState", },
        { title: "STP", url: "/Aceites/STP", },
        { title: "Valucraft", url: "/Aceites/Valucraft", },
      ],
    },
    {
      title: "Balatas",
      url: "/Balatas",
      icon: BookOpen,
      items: [
        { title: "Delanteras", url: "/Balatas/Delanteras", },
        { title: "Traseras", url: "/Balatas/Traseras", },
      ],
    },
    {
      title: "Bujías",
      url: "/Bujias",
      icon: Settings2,
      items: [
        { title: "AutoLite", url: "/Bujias/AutoLite", },
        { title: "Bosch", url: "/Bujias/Bosch", },
        { title: "Champion", url: "/Bujias/Champion", },
        { title: "Denso", url: "/Bujias/Denso", },
        { title: "NGK", url: "/Bujias/NGK", },
      ],
    },
    {
      title: "Baterias",
      url: "/Baterias",
      icon: Bot,
      items: [
        { title: "Duralast", url: "/Baterias/Duralast", },
        { title: "Optima", url: "/Baterias/Optima", },
        { title: "Valucraft", url: "Baterias/Valucraft", },
      ],
    },
  ],
  categories: [
    {
      title: "Categorias",
      url: "/Categorias",
      icon: PanelLeftOpen,
      IsActive: false,
      items: [
        { title: "Refacciones", url: "/Caterorias/Refacciones", },
        { title: "Interiores", url: "/Caterorias/Interiores", },
        { title: "Exteriores", url: "/Caterorias/Exteriores", },
        { title: "Herramientas", url: "/Caterorias/Herramientas", },
        { title: "Otros", url: "/Caterorias/Refacciones", }
      ]
    }
  ]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}