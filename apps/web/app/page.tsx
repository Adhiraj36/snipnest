"use client"
import { SignedIn, SignedOut, RedirectToSignIn, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Code2, Zap, Lock, Share2, Clock, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Navigation */}
      <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Code2 className="w-8 h-8 text-cyan-400" />
            <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              SnipNest
            </span>
          </div>
          <SignedIn>
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-slate-400 hover:text-white transition">
                Dashboard
              </Link>
              <UserButton />
            </div>
          </SignedIn>
          <SignedOut>
            <Link href="/sign-in" className="text-slate-400 hover:text-white transition">
              Sign In
            </Link>
          </SignedOut>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center space-y-6 mb-20">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight">
            Save, Organize & Share Your
            <span className="block bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              Code Snippets
            </span>
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            Your personal library for all those useful code snippets. Never lose a great solution again. 
            Keep your code organized, searchable, and ready to use.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <SignedOut>
              <Link
                href="/sign-in"
                className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition transform hover:scale-105"
              >
                Get Started Free
              </Link>
              <button className="px-8 py-3 border border-slate-600 text-white font-semibold rounded-lg hover:border-slate-400 transition">
                Learn More
              </button>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition"
              >
                Go to Dashboard
              </Link>
            </SignedIn>
          </div>
        </div>

        {/* Hero Visual */}
        <div className="relative h-96 bg-gradient-to-b from-slate-800/20 to-transparent border border-slate-700/30 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="space-y-4 w-full max-w-2xl px-8">
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 backdrop-blur-sm">
                <p className="text-slate-500 text-sm font-mono">const buildAwesome = () =&gt; {"{}"}</p>
              </div>
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 backdrop-blur-sm">
                <p className="text-slate-500 text-sm font-mono">// Your snippets stored here</p>
              </div>
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 backdrop-blur-sm">
                <p className="text-slate-500 text-sm font-mono">return amazingThings;</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-800">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Powerful Features</h2>
          <p className="text-slate-400">Everything you need to manage your code snippets</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <Zap className="w-6 h-6" />,
              title: "Lightning Fast",
              description: "Create and save snippets in seconds. Lightning-fast search to find what you need instantly."
            },
            {
              icon: <Lock className="w-6 h-6" />,
              title: "Secure & Private",
              description: "Your code is encrypted and stored safely. Only you have access to your snippets."
            },
            {
              icon: <Share2 className="w-6 h-6" />,
              title: "Easy Sharing",
              description: "Share snippets with teammates or make them public. Control who sees what."
            },
            {
              icon: <Clock className="w-6 h-6" />,
              title: "Version History",
              description: "Track changes over time. Restore any previous version of your snippets."
            },
            {
              icon: <Sparkles className="w-6 h-6" />,
              title: "Smart Organization",
              description: "Tags, collections, and categories. Find your snippets exactly when you need them."
            },
            {
              icon: <Code2 className="w-6 h-6" />,
              title: "Multi-Language",
              description: "Support for JavaScript, Python, Java, Go, and 50+ programming languages."
            }
          ].map((feature, idx) => (
            <div
              key={idx}
              className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 rounded-xl p-6 hover:border-cyan-500/30 transition"
            >
              <div className="text-cyan-400 mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-slate-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-800">
        <div className="bg-gradient-to-r from-slate-800/40 to-slate-900/40 border border-cyan-500/30 rounded-2xl p-12 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to organize your code?</h2>
          <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
            Join thousands of developers who are already saving and organizing their code snippets with SnipNest.
          </p>
          <SignedOut>
            <Link
              href="/sign-in"
              className="inline-block px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition transform hover:scale-105"
            >
              Start for Free Today
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="inline-block px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition"
            >
              Open Dashboard
            </Link>
          </SignedIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-500">
          <p>&copy; 2024 SnipNest. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
