import React from 'react';
import { Link, useHistory } from 'react-router-dom';
import { LogOut, Menu } from 'lucide-react';

import Authentication from '@/service/auth';
import firebase from '@/firebase';
import logoBlue from '@/assets/images/logo_blue.png';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Navbar = () => {
  const history = useHistory();
  const { logout } = Authentication(firebase);

  const onLogout = async () => {
    await logout();
    history.push('/login');
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b border-oi-border bg-white/95 backdrop-blur-sm shadow-sm px-3 md:px-6">
      <SidebarTrigger
        className="shrink-0 md:hidden h-10 w-10 text-slate-700 hover:bg-transparent active:bg-slate-100 rounded-lg flex items-center justify-center transition-colors"
        aria-label="Abrir menu"
      >
        <Menu className="h-6 w-6 text-slate-700" />
      </SidebarTrigger>

      <Link to="/dashboard/organization" className="md:hidden inline-flex items-center shrink-0 mr-1">
        <img src={logoBlue} alt="Oi Tickets" className="h-6 w-auto object-contain block" />
      </Link>

      <div className="flex items-center gap-1 ml-auto shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Menu do usuário"
              className="h-9 w-9 rounded-full hover:ring-2 hover:ring-oi-blue/20"
            >
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-oi-blue/15 text-oi-blue text-sm font-medium">AD</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 z-[1202]" sideOffset={6}>
            <div className="px-3 py-2.5 border-b border-border text-sm font-semibold">Olá, Admin!</div>
            <div className="py-1">
              <DropdownMenuItem
                className="cursor-pointer gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                onClick={onLogout}
              >
                <LogOut className="w-4 h-4" />
                Sair
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Navbar;
