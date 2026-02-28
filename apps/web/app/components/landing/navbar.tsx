"use client";

import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { GraduationCap, Menu, X } from "lucide-react";
import { useState } from "react";
import { DarkModeToggle } from "../ui/dark-mode-toggle";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#contact", label: "Contact" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav
      className="fixed top-0 inset-x-0 z-50 glass border-b border-[var(--color-border)]"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="mx-auto max-w-6xl px-5 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl
                        bg-gradient-to-br from-orange-500 to-orange-600 text-white
                        shadow-[var(--shadow-md)] transition-transform duration-200
                        group-hover:scale-105"
          >
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-[var(--color-text)]">
            Code Sarthi
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-4 py-2 text-sm font-medium text-[var(--color-text-muted)]
                         rounded-lg transition-colors duration-200
                         hover:text-[var(--color-text)] hover:bg-[var(--color-glass)]"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <DarkModeToggle />

          <SignedIn>
            <Link
              href="/dashboard"
              className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold rounded-xl
                         bg-gradient-to-r from-orange-500 to-orange-600 text-white
                         shadow-[var(--shadow-md)] transition-all duration-200
                         hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5"
            >
              Dashboard
            </Link>
            <UserButton />
          </SignedIn>

          <SignedOut>
            <Link
              href="/sign-in"
              className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold rounded-xl
                         border border-[var(--color-border)] text-[var(--color-text)]
                         bg-[var(--color-bg-card)] shadow-[var(--shadow-sm)]
                         transition-all duration-200
                         hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5"
            >
              Login
            </Link>
          </SignedOut>

          {/* Mobile toggle */}
          <button
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl
                       border border-[var(--color-border)] text-[var(--color-text-muted)]
                       bg-[var(--color-bg-card)] shadow-[var(--shadow-sm)]"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--color-border)] bg-[var(--color-bg-card)] animate-fade-in">
          <div className="px-5 py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-4 py-2.5 text-sm font-medium text-[var(--color-text-muted)]
                           rounded-lg transition-colors duration-200
                           hover:text-[var(--color-text)] hover:bg-[var(--color-glass)]"
              >
                {link.label}
              </a>
            ))}
            <SignedOut>
              <Link
                href="/sign-in"
                onClick={() => setMobileOpen(false)}
                className="mt-2 px-4 py-2.5 text-sm font-semibold text-center rounded-xl
                           border border-[var(--color-border)] text-[var(--color-text)]"
              >
                Login
              </Link>
            </SignedOut>
          </div>
        </div>
      )}
    </nav>
  );
}
