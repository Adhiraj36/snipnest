"use client";

import { Navbar } from "./components/landing/navbar";
import { Hero } from "./components/landing/hero";
import { Features } from "./components/landing/features";
import { Footer } from "./components/landing/footer";

export default function Home() {
  return (
    <div className="landing-bg min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <Features />
      </main>
      <Footer />
    </div>
  );
}
