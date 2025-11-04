'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { useAuth } from '@/components/AuthProvider/Auth';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type NavItemProps = {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  items?: {
    title: string;
    url: string;
    icon?: LucideIcon;
  }[];
};

export function NavMain({
  items,
  categories,
  Admin,
}: {
  items: NavItemProps[];
  categories: NavItemProps[];
  Admin: NavItemProps[];
}) {
  const { userRole } = useAuth();
  const pathname = usePathname();
  
  const isActive = (url: string) => {
    return pathname === url || pathname.startsWith(`${url}/`);
  };

  return (
    <SidebarGroup className="gap-0">
      {/* Quick Actions Section */}
      <SidebarMenu>
        {items.filter(item => !item.items || item.items.length === 0).map((item) => (
          <SidebarMenuItem key={item.title} className="py-1.5">
            <Link href={item.url} passHref>
              <SidebarMenuButton 
                tooltip={item.title}
                className={cn(
                  "relative h-10 transition-all duration-200 group rounded-lg px-4",
                  isActive(item.url) 
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-50 font-semibold" 
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                )}
              >
                {/* Icon */}
                <div className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-md transition-all",
                  isActive(item.url) 
                    ? "bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900" 
                    : "text-slate-500 dark:text-slate-500 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
                )}>
                  {item.icon && <item.icon className="h-4 w-4" />}
                </div>
                <span className="font-medium text-sm">{item.title}</span>
                {isActive(item.url) && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute right-0 w-1 h-6 bg-slate-900 dark:bg-slate-50 rounded-l"
                  />
                )}
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>

      {/* Piezas Section */}
      <SidebarGroupLabel className="mt-6 mb-3 px-4 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
        Piezas
      </SidebarGroupLabel>
      <SidebarMenu className="gap-1">
        {items.filter(item => item.items && item.items.length > 0).map((item) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={isActive(item.url)}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton 
                  tooltip={item.title}
                  className={cn(
                    "relative h-10 transition-all duration-200 group rounded-lg px-4",
                    isActive(item.url) 
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-50 font-semibold" 
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  )}
                >
                  <div className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-md transition-all",
                    isActive(item.url) 
                      ? "bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900" 
                      : "text-slate-500 dark:text-slate-500 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
                  )}>
                    {item.icon && <item.icon className="h-4 w-4" />}
                  </div>
                  <span className="font-medium text-sm">{item.title}</span>
                  <div className="ml-auto flex items-center gap-2">
                    {item.items && item.items.length > 0 && (
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                        {item.items.length}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </div>
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-1">
                <SidebarMenuSub className="gap-0.5">
                  {item.items?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton 
                        asChild
                        className={cn(
                          "relative transition-all duration-200 rounded-lg px-3 h-9 text-xs",
                          isActive(subItem.url) 
                            ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-50 font-semibold" 
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        )}
                      >
                        <Link href={subItem.url} className="flex items-center gap-2 w-full">
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full transition-all",
                            isActive(subItem.url) 
                              ? "bg-slate-900 dark:bg-slate-50" 
                              : "bg-slate-400 dark:bg-slate-500"
                          )} />
                          <span>{subItem.title}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>

      {/* Categorías Section */}
      <SidebarGroupLabel className="mt-6 mb-3 px-4 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
        Categorías
      </SidebarGroupLabel>
      <SidebarMenu className="gap-1">
        {categories.map((category) => (
          <Collapsible
            key={category.title}
            asChild
            defaultOpen={isActive(category.url)}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton 
                  tooltip={category.title}
                  className={cn(
                    "relative h-10 transition-all duration-200 group rounded-lg px-4",
                    isActive(category.url) 
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-50 font-semibold" 
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  )}
                >
                  <div className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-md transition-all",
                    isActive(category.url) 
                      ? "bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900" 
                      : "text-slate-500 dark:text-slate-500 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
                  )}>
                    {category.icon && <category.icon className="h-4 w-4" />}
                  </div>
                  <span className="font-medium text-sm">{category.title}</span>
                  <ChevronRight className="ml-auto h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-1">
                <SidebarMenuSub className="gap-0.5">
                  {category.items?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton 
                        asChild
                        className={cn(
                          "relative transition-all duration-200 rounded-lg px-3 h-9 text-xs",
                          isActive(subItem.url) 
                            ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-50 font-semibold" 
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        )}
                      >
                        <Link href={subItem.url} className="flex items-center gap-2 w-full">
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full transition-all",
                            isActive(subItem.url) 
                              ? "bg-slate-900 dark:bg-slate-50" 
                              : "bg-slate-400 dark:bg-slate-500"
                          )} />
                          <span>{subItem.title}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>

      {/* Administración Section */}
      {(userRole === 'admin' || userRole === 'empleado') && (
        <>
          <SidebarGroupLabel className="mt-6 mb-3 px-4 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Administración
          </SidebarGroupLabel>
          <SidebarMenu className="gap-1">
            {Admin.map((admin) => (
              <Collapsible
                key={admin.title}
                asChild
                defaultOpen={isActive(admin.url)}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton 
                      tooltip={admin.title}
                      className={cn(
                        "relative h-10 transition-all duration-200 group rounded-lg px-4",
                        isActive(admin.url) 
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-50 font-semibold" 
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                      )}
                    >
                      <div className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-md transition-all",
                        isActive(admin.url) 
                          ? "bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900" 
                          : "text-slate-500 dark:text-slate-500 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
                      )}>
                        {admin.icon && <admin.icon className="h-4 w-4" />}
                      </div>
                      <span className="font-medium text-sm">{admin.title}</span>
                      <ChevronRight className="ml-auto h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-1">
                    <SidebarMenuSub className="gap-0.5">
                      {admin.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton 
                            asChild
                            className={cn(
                              "relative transition-all duration-200 rounded-lg px-3 h-9 text-xs",
                              isActive(subItem.url) 
                                ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-50 font-semibold" 
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            )}
                          >
                            <Link href={subItem.url} className="flex items-center gap-2 w-full">
                              <div className={cn(
                                "w-1.5 h-1.5 rounded-full transition-all",
                                isActive(subItem.url) 
                                  ? "bg-slate-900 dark:bg-slate-50" 
                                  : "bg-slate-400 dark:bg-slate-500"
                              )} />
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            ))}
          </SidebarMenu>
        </>
      )}
    </SidebarGroup>
  );
}