import React, { useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { ChevronDown, Menu, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import RouteList from '@/router/admin';
import OiLogo from './OiLogo';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const ACTIVE = 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/25';
const INACTIVE = 'text-slate-300 hover:bg-white/10 hover:text-white';
const TIP = 'bg-[#0B0F19] text-white border-slate-800';

const visibleItems = (route) => route.list.filter((item) => !item.hide);

const SubMenuPopover = ({ route, isGroupActive, hasSelected, handleClick }) => {
  const [open, setOpen] = useState(false);

  return (
    <Tooltip open={open ? false : undefined}>
      <Popover open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <SidebarMenuButton
              isActive={isGroupActive}
              className={cn(
                'size-11 mx-auto p-0 justify-center rounded-xl text-sm font-medium transition-all duration-200',
                isGroupActive ? ACTIVE : INACTIVE
              )}
            >
              <route.icon className="w-5 h-5 shrink-0" />
            </SidebarMenuButton>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="right" className={TIP}>
          {route.title}
        </TooltipContent>
        <PopoverContent
          side="right"
          align="start"
          sideOffset={14}
          onCloseAutoFocus={(e) => e.preventDefault()}
          className="w-56 p-2 z-[1300] bg-[#0B0F19] text-white border border-slate-800/80 rounded-xl shadow-2xl"
        >
          <div className="px-3 py-2 border-b border-white/[0.08] mb-1">
            <p className="text-xs font-semibold text-white tracking-wide">{route.title}</p>
          </div>
          <div className="flex flex-col gap-1">
            {visibleItems(route).map((item) => (
              <button
                key={item.path}
                type="button"
                onPointerDown={() => {
                  setOpen(false);
                  handleClick(item.path);
                }}
                className={cn(
                  'flex w-full items-center rounded-lg px-3 py-2 text-left text-xs font-medium',
                  'border-0 bg-transparent cursor-pointer appearance-none transition-colors',
                  hasSelected(item.path) ? 'bg-blue-600 text-white font-semibold shadow-sm' : INACTIVE
                )}
              >
                {item.title}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </Tooltip>
  );
};

const NavItem = ({ route, handleClick, openTitle, setOpenTitle }) => {
  const { pathname } = useLocation();
  const { state: sidebarState, isMobile } = useSidebar();
  const isCollapsed = sidebarState === 'collapsed' && !isMobile;

  // "Clientes" fica ativo também no formulário (/organization/:id), a não ser
  // que outro item irmão seja mais específico.
  const hasSelected = (path) => {
    const full = '/dashboard' + path;
    if (pathname === full) return true;
    if (!pathname.startsWith(full + '/')) return false;
    const moreSpecific = visibleItems(route).some((item) => {
      const p = '/dashboard' + item.path;
      return p !== full && p.length > full.length && (pathname === p || pathname.startsWith(p + '/'));
    });
    return !moreSpecific;
  };

  const isGroupActive = route.list.some((item) => hasSelected(item.path));
  const isOpen = openTitle === route.title;

  if (isCollapsed) {
    return (
      <SidebarMenuItem className="flex justify-center">
        <SubMenuPopover
          route={route}
          isGroupActive={isGroupActive}
          hasSelected={hasSelected}
          handleClick={handleClick}
        />
      </SidebarMenuItem>
    );
  }

  const showParentActive = isGroupActive && !isOpen;

  return (
    <SidebarMenuItem>
      <Collapsible
        open={isOpen}
        className="group/collapsible"
        onOpenChange={(val) => setOpenTitle(val ? route.title : null)}
      >
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            isActive={showParentActive}
            className={cn(
              'h-11 px-3.5 rounded-xl text-sm font-medium transition-all',
              showParentActive ? ACTIVE : isOpen ? 'bg-white/[0.08] text-white font-medium' : INACTIVE
            )}
          >
            <route.icon className="w-5 h-5 shrink-0" />
            <span className="truncate">{route.title}</span>
            <ChevronDown className="ml-auto h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
          </SidebarMenuButton>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <SidebarMenuSub className="gap-1 mt-1.5 ml-3 pl-3 border-l border-white/10 py-1">
            {visibleItems(route).map((item) => {
              const isSelected = hasSelected(item.path);
              return (
                <SidebarMenuSubItem key={item.path}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={isSelected}
                    className={cn(
                      'min-h-9 h-auto py-1.5 px-2.5 rounded-lg text-sm font-medium transition-colors',
                      isSelected
                        ? 'bg-blue-600 text-white font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                    )}
                  >
                    <button type="button" onClick={() => handleClick(item.path)}>
                      <span className="leading-snug">{item.title}</span>
                    </button>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
};

const AppSidebar = () => {
  const history = useHistory();
  const { pathname } = useLocation();
  const { isMobile, setOpenMobile, toggleSidebar, state } = useSidebar();
  const isCollapsed = state === 'collapsed' && !isMobile;

  const [openTitle, setOpenTitle] = useState(() => {
    const group = RouteList.find((r) => r.list?.some((item) => pathname.startsWith('/dashboard' + item.path)));
    return group ? group.title : null;
  });

  const handleClick = (path) => {
    history.push('/dashboard' + path);
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className="z-[1200] border-r border-white/[0.06] bg-[#0B0F19] text-white shadow-xl"
    >
      <SidebarHeader className="h-16 shrink-0 justify-center px-4 py-0 group-data-[collapsible=icon]:px-3 border-b border-white/[0.06] transition-all duration-300">
        <div className="flex h-full items-center justify-between group-data-[collapsible=icon]:justify-center">
          {isCollapsed ? (
            <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={toggleSidebar}
                    className="flex items-center justify-center size-11 rounded-xl text-white hover:bg-white/10 transition-all border-0 bg-transparent cursor-pointer"
                    aria-label="Expandir menu"
                  >
                    <Menu className="h-5 w-5 text-white" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className={TIP}>
                  Expandir menu
                </TooltipContent>
              </Tooltip>
          ) : (
            <>
              <OiLogo collapsed={false} />
              {isMobile ? (
                <button
                  type="button"
                  onClick={() => setOpenMobile(false)}
                  className="flex md:hidden items-center justify-center rounded-lg h-9 w-9 text-slate-400 hover:text-white hover:bg-white/10 transition-colors border-0 bg-transparent cursor-pointer"
                  aria-label="Fechar menu"
                >
                  <X className="h-5 w-5" />
                </button>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={toggleSidebar}
                      className="hidden md:flex items-center justify-center rounded-lg h-8 w-8 shrink-0 border border-white/20 bg-white/10 text-white hover:bg-white/20 hover:border-white/30 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      aria-label="Recolher menu"
                    >
                      <Menu className="h-4 w-4 text-white" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className={TIP}>
                    Recolher menu
                  </TooltipContent>
                </Tooltip>
              )}
            </>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="py-4 px-3 overflow-y-auto overflow-x-hidden no-scrollbar group-data-[collapsible=icon]:px-2 transition-[padding] duration-300">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {RouteList.map((route) => (
                <NavItem
                  key={route.title}
                  route={route}
                  handleClick={handleClick}
                  openTitle={openTitle}
                  setOpenTitle={setOpenTitle}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
