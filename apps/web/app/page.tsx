"use client"
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { GraduationCap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <nav className="border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-orange-400" />
            <span className="text-xl font-semibold">
              SnipNest Mentor
            </span>
          </div>
          <SignedIn>
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-zinc-300 hover:text-orange-400 transition">
                Dashboard
              </Link>
              <UserButton />
            </div>
          </SignedIn>
          <SignedOut>
            <Link href="/sign-in" className="px-4 py-2 rounded bg-orange-500 text-black font-semibold">
              Sign In
            </Link>
          </SignedOut>
        </div>
      </nav>
      <section className="max-w-5xl mx-auto px-4 py-24 text-center">
        <h1 className="text-5xl font-bold leading-tight">
          AI Coding Mentor for
          <span className="block text-orange-400">Structured Learning + Practice</span>
        </h1>
        <p className="mt-6 text-zinc-300 text-lg">
          Choose an interest, learn theory by topic, solve generated coding tasks in-browser, and gain points as you improve.
        </p>
        <div className="mt-10">
          <SignedOut>
            <Link href="/sign-in" className="px-6 py-3 rounded bg-orange-500 text-black font-semibold">
              Start Learning
            </Link>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" className="px-6 py-3 rounded bg-orange-500 text-black font-semibold">
              Go to Dashboard
            </Link>
          </SignedIn>
        </div>
      </section>
    </div>
  );
}
