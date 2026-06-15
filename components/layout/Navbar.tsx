'use client';

import Link from 'next/link';
import { LogOut, Settings } from 'lucide-react';
import { User } from 'next-auth';
import { signOut } from 'next-auth/react';
import { usePolling } from '@/hooks/usePolling';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import UserAvatar from '@/components/shared/UserAvatar';
import { ThemeToggle } from './ThemeToggle';
import BoardSelector from './BoardSelector';

interface NavbarProps {
  user: User;
  boards: { id: string; title: string; emoji: string | null }[];
}

export default function Navbar({ user, boards }: NavbarProps) {
  usePolling(30000);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/60">
      <div className="container flex items-center h-16">
        <div className="flex items-center gap-3">
          <Link href="/boards" className="text-lg font-bold flex items-center gap-2">
            {/* Inline SVG logo - purple M mark */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M3 20V4l9 8 9-8v16"
                stroke="#7c3aed"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="font-bold tracking-tight">The Kanban Workspace</span>
          </Link>
          {/* Live indicator */}
          <span className="relative flex w-2 h-2">
            <span className="absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping bg-success"></span>
            <span className="relative inline-flex w-2 h-2 rounded-full bg-success"></span>
          </span>
        </div>

        <div className="flex items-center justify-end flex-1 space-x-3">
          <div className="hidden md:block">
            <BoardSelector boards={boards} />
          </div>
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative w-8 h-8 rounded-full">
                <UserAvatar name={user.name} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="cursor-pointer"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
