
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/AuthProvider/Auth';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

type NavItemData = {
  title: string;
  url: string;
  icon?: LucideIcon;
  items?: NavItemData[];
};

type NavMainProps = {
  isCollapsed?: boolean;
  items: NavItemData[];
  categories: NavItemData[];
  Admin: NavItemData[];
};

const navItemVariants = {
  hidden: { opacity: 0, y: -6 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.18, ease: 'easeOut' },
  }),
};

const NavItem = ({ item, isCollapsed, customI }: { item: NavItemData; isCollapsed: boolean; customI: number }) => {
  const pathname = usePathname();
  const isActive = (url: string) => pathname === url || (url !== '/' && pathname.startsWith(url));

  const isParentActive = item.items ? item.items.some(sub => isActive(sub.url)) : false;

  if (item.items && item.items.length > 0) {
    return (
      <motion.div variants={navItemVariants} custom={customI} initial="hidden" animate="visible" exit="hidden">
        <Collapsible defaultOpen={isParentActive}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <CollapsibleTrigger asChild>
                  <Button
                    variant={isParentActive ? 'secondary' : 'ghost'}
                    className={cn('w-full justify-start h-10 px-3 gap-2', isParentActive && 'font-semibold')}
                  >
                    {item.icon && <item.icon className={cn('h-5 w-5 shrink-0', isParentActive ? 'text-primary' : 'text-muted-foreground')} />}
                    {!isCollapsed && <span className="flex-grow text-left">{item.title}</span>}
                    {!isCollapsed && <ChevronRight className="h-4 w-4 ml-2 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-90" />}
                  </Button>
                </CollapsibleTrigger>
              </TooltipTrigger>
              {isCollapsed && <TooltipContent side="right">{item.title}</TooltipContent>}
            </Tooltip>
          </TooltipProvider>

          <CollapsibleContent className="pl-3">
            <div className="flex flex-col gap-1 py-1">
              {item.items.map((sub, idx) => (
                <NavItem key={sub.url} item={sub} isCollapsed={isCollapsed} customI={idx} />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </motion.div>
    );
  }

  return (
    <motion.div variants={navItemVariants} custom={customI} initial="hidden" animate="visible" exit="hidden">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              asChild
              variant={usePathname() === item.url ? 'secondary' : 'ghost'}
              className={cn('w-full justify-start h-10 px-3 relative')}
            >
              <Link href={item.url} className="flex items-center w-full gap-3">
                {usePathname() === item.url && (
                  <motion.div layoutId="active-nav-indicator" className="absolute left-0 top-0 h-full w-1 bg-primary rounded-r-full" />
                )}
                {item.icon && <item.icon className="h-5 w-5 shrink-0" />}
                {!isCollapsed && <span className="flex-grow text-left">{item.title}</span>}
              </Link>
            </Button>
          </TooltipTrigger>
          {isCollapsed && <TooltipContent side="right">{item.title}</TooltipContent>}
        </Tooltip>
      </TooltipProvider>
    </motion.div>
  );
};

const NavGroup = ({ title, items, isCollapsed }: { title: string; items: NavItemData[]; isCollapsed: boolean }) => {
  if (!items || items.length === 0) return null;

  return (
    <div>
      {!isCollapsed && <div className="px-3 mt-6 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</div>}
      <div className="flex flex-col gap-1">
        <AnimatePresence>
          {items.map((it, i) => (
            <NavItem key={it.url} item={it} isCollapsed={isCollapsed} customI={i} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export function NavMain({ isCollapsed = false, items, categories, Admin }: NavMainProps) {
  const { userRole } = useAuth();

  const adminItems = (userRole === 'admin' || userRole === 'empleado') ? Admin : [];

  return (
    <nav className="flex flex-col px-2 py-4 bg-gradient-to-b from-background/50 to-background/30 rounded-lg shadow-sm">
      <div className="px-3 mb-3">
        {!isCollapsed && <h1 className="text-lg font-bold">Frontera</h1>}
      </div>
      <NavGroup title="Principal" items={items} isCollapsed={isCollapsed} />
      <div className="my-2 border-t border-border/60" />
      <NavGroup title="Categorías" items={categories} isCollapsed={isCollapsed} />
      <div className="my-2 border-t border-border/60" />
      <NavGroup title="Administración" items={adminItems} isCollapsed={isCollapsed} />
    </nav>
  );
}