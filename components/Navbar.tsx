"use client";

import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Book, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import NotificationPopover from "@/components/NotificationPopover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const paths = [
  { name: "Inicio", href: "/" },
  { name: "Canvas", href: "/canvasInfo" },
  { name: "Planificador", href: "/tracker" },
  { name: "Monitoreo Rendimiento", href: "/monitoreo" },
];

export default function Navbar() {
  const currentPath = usePathname();

  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="w-full border-b bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Logo + Search */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold">
            <Book className="h-6 w-6 text-blue-600" />
            <span>PUCito</span>
          </Link>
        </div>

        {/* Desktop Nav Links */}
        <div className="hidden items-center gap-6 text-sm font-medium md:flex">
          {paths.map((path) => (
            <Link
              key={path.name}
              href={path.href}
              className={`${
                currentPath === path.href ? "text-blue-600" : "text-gray-800 hover:text-blue-600"
              } transition-colors`}
            >
              {path.name}
            </Link>
          ))}
          <SignedOut>
            <SignInButton mode="modal" />
            <SignUpButton mode="modal" />
          </SignedOut>
          <SignedIn>
            <NotificationPopover />
            <UserButton />
          </SignedIn>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <Menu className="h-6 w-6 cursor-pointer" onClick={() => setMobileOpen(!mobileOpen)} />
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div className="space-y-3 border-t bg-white px-4 py-3 md:hidden">
          <Input type="text" placeholder="Search..." className="w-full" />
          <div className="flex flex-col gap-2 text-sm font-medium">
            <Link href="/" className="text-blue-600">
              Home
            </Link>
            <Link href="/canvasInfo">Canvas</Link>
            <Link href="/tracker">Planificador</Link>
            <SignedOut>
              <SignInButton mode="modal">
                <Button className="w-full">Sign In</Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <div className="flex items-center gap-2">
                <NotificationPopover />
                <UserButton />
              </div>
            </SignedIn>
          </div>
        </div>
      )}
    </nav>
  );
}
