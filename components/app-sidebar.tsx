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
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    nombre: "Steve",
    apellido: "Alvarez",
    email: "SteveKS@gmail.com",
    avatar: "/avatars/shadcn.jpg",
  },
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
      isActive: true,
      items: [
        {
          title: "Akron",
          url: "/Aceites/Akron",
        },
        {
          title: "Bardahl",
          url: "/Aceites/Bardahl",
        },
        {
          title: "Castrol",
          url: "/Aceites/Castrol",
        },
        {
          title: "Chevron",
          url: "/Aceites/Chevron",
        },
        {
          title: "Gonher",
          url: "/Aceites/Gonher",
        },
        {
          title: "Lucas Oil",
          url: "/Aceites/LucasOil",
        },
        {
          title: "Mobil",
          url: "/Aceites/Mobil",
        },
        {
          title: "Quaker State",
          url: "/Aceites/QuakerState",
        },
        {
          title: "STP",
          url: "/Aceites/STP",
        },
        {
          title: "Valucraft",
          url: "/Aceites/Valucraft",
        },
      ],
    },
    {
      title: "Balatas",
      url: "/Balatas",
      icon: BookOpen,
      items: [
        {
          title: "Delanteras",
          url: "/Balatas/Delanteras",
        },
        {
          title: "Traseras",
          url: "/Balatas/Traseras",
        },
      ],
    },
    {
      title: "Bujías",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "AutoLite",
          url: "/Bujias/AutoLite",
        },
        {
          title: "Bosch",
          url: "/Bujias/Bosch",
        },
        {
          title: "Champion",
          url: "/Bujias/Champion",
        },
        {
          title: "Denso",
          url: "/Bujias/Denso",
        },
        {
          title: "NGK",
          url: "/Bujias/NGK",
        },
      ],
    },
    {
      title: "Baterias",
      url: "/Baterias",
      icon: Bot,
      items: [
        {
          title: "Duralast",
          url: "/Baterias/Duralast",
        },
        {
          title: "Optima",
          url: "/Baterias/Optima",
        },
        {
          title: "Valucraft",
          url: "Baterias/Valucraft",
        },
      ],
    },
  ],
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