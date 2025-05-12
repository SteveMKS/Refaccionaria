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
import { useAuth } from '@/components/Auth';
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
    <SidebarGroup>
      <SidebarMenu>
        {items.filter(item => !item.items || item.items.length === 0).map((item) => (
          <SidebarMenuItem key={item.title}>
            <Link href={item.url} passHref>
              <SidebarMenuButton 
                tooltip={item.title}
                className={cn(
                  "transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800",
                  isActive(item.url) ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" : ""
                )}
              >
                {item.icon && <item.icon className={cn(
                  "h-5 w-5",
                  isActive(item.url) ? "text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400"
                )} />}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>

      <SidebarGroupLabel className="mt-6 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium px-3">
        Piezas
      </SidebarGroupLabel>
      <SidebarMenu>
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
                    "transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800",
                    isActive(item.url) ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" : ""
                  )}
                >
                  {item.icon && <item.icon className={cn(
                    "h-5 w-5",
                    isActive(item.url) ? "text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400"
                  )} />}
                  <span>{item.title}</span>
                  <ChevronRight className="ml-auto h-4 w-4 shrink-0 transition-transform duration-200 text-slate-400 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton 
                        asChild
                        className={cn(
                          "transition-all duration-200",
                          isActive(subItem.url) ? "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20" : ""
                        )}
                      >
                        <Link href={subItem.url}>
                          {subItem.icon && <subItem.icon className="h-4 w-4 mr-2" />}
                          <span>{subItem.title}</span>
                          {isActive(subItem.url) && (
                            <motion.div
                              layoutId="activeIndicator"
                              className="absolute left-0 w-1 h-5 bg-blue-600 dark:bg-blue-400 rounded-r-md"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.2 }}
                            />
                          )}
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

      <SidebarGroupLabel className="mt-6 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium px-3">
        Categorías
      </SidebarGroupLabel>
      <SidebarMenu>
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
                    "transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800",
                    isActive(category.url) ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" : ""
                  )}
                >
                  {category.icon && <category.icon className={cn(
                    "h-5 w-5",
                    isActive(category.url) ? "text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400"
                  )} />}
                  <span>{category.title}</span>
                  <ChevronRight className="ml-auto h-4 w-4 shrink-0 transition-transform duration-200 text-slate-400 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {category.items?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton 
                        asChild
                        className={cn(
                          "transition-all duration-200",
                          isActive(subItem.url) ? "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20" : ""
                        )}
                      >
                        <Link href={subItem.url}>
                          {subItem.icon && <subItem.icon className="h-4 w-4 mr-2" />}
                          <span>{subItem.title}</span>
                          {isActive(subItem.url) && (
                            <motion.div
                              layoutId="activeIndicator"
                              className="absolute left-0 w-1 h-5 bg-blue-600 dark:bg-blue-400 rounded-r-md"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.2 }}
                            />
                          )}
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

      {(userRole === 'admin' || userRole === 'empleado') && (
        <>
          <SidebarGroupLabel className="mt-6 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium px-3">
            Administración
          </SidebarGroupLabel>
          <SidebarMenu>
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
                        "transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800",
                        isActive(admin.url) ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" : ""
                      )}
                    >
                      {admin.icon && <admin.icon className={cn(
                        "h-5 w-5",
                        isActive(admin.url) ? "text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400"
                      )} />}
                      <span>{admin.title}</span>
                      <ChevronRight className="ml-auto h-4 w-4 shrink-0 transition-transform duration-200 text-slate-400 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {admin.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton 
                            asChild
                            className={cn(
                              "transition-all duration-200",
                              isActive(subItem.url) ? "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20" : ""
                            )}
                          >
                            <Link href={subItem.url}>
                              {subItem.icon && <subItem.icon className="h-4 w-4 mr-2" />}
                              <span>{subItem.title}</span>
                              {isActive(subItem.url) && (
                                <motion.div
                                  layoutId="activeIndicator"
                                  className="absolute left-0 w-1 h-5 bg-blue-600 dark:bg-blue-400 rounded-r-md"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ duration: 0.2 }}
                                />
                              )}
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