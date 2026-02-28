"use client";

import { GraduationCap } from "lucide-react";

export function Footer() {
  return (
    <footer
      id="contact"
      className="border-t border-[var(--color-border)] py-16 px-5"
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl
                            bg-gradient-to-br from-orange-500 to-orange-600 text-white"
              >
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold text-[var(--color-text)]">
                Code Sarthi
              </span>
            </div>
            <p className="text-sm text-[var(--color-text-muted)] leading-relaxed max-w-xs">
              AI-powered coding mentor for structured learning and deliberate practice.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold text-[var(--color-text)] mb-4">Product</h4>
            <ul className="space-y-2.5">
              {["Features", "Changelog", "Roadmap"].map((item) => (
                <li key={item}>
                  <a
                    href={`#${item.toLowerCase()}`}
                    className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-semibold text-[var(--color-text)] mb-4">Resources</h4>
            <ul className="space-y-2.5">
              {["Documentation", "Blog", "Community", "Support"].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-[var(--color-text)] mb-4">Contact</h4>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="mailto:hello@snipnest.dev"
                  className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                >
                  hello@snipnest.dev
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                >
                  Twitter / X
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-8 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--color-text-muted)]">
            &copy; {new Date().getFullYear()} Code Sarthi. All rights reserved.
          </p>
          <div className="flex gap-6">
            {["Privacy", "Terms", "Cookies"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
