"use client";

import Link from "next/link";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started",
    features: [
      "5 AI mentor sessions / month",
      "Basic coding challenges",
      "Progress tracking",
      "Community access",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$12",
    period: "/ month",
    description: "For serious learners",
    features: [
      "Unlimited AI mentor sessions",
      "Advanced challenges & topics",
      "Detailed analytics & insights",
      "Priority AI feedback",
      "Custom learning paths",
      "Avatar mentor access",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Team",
    price: "$29",
    period: "/ seat / month",
    description: "For teams & classrooms",
    features: [
      "Everything in Pro",
      "Team dashboard & leaderboards",
      "Admin controls",
      "Bulk seat management",
      "Custom topic curation",
      "Priority support",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
] as const;

export function Pricing() {
  return (
    <section id="pricing" className="relative py-28 px-5">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="text-center mb-16">
          <span
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5
                        border border-[var(--color-border)] bg-[var(--color-bg-card)]
                        shadow-[var(--shadow-sm)] text-xs font-medium text-[var(--color-text-muted)] mb-4"
          >
            Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--color-text)]">
            Simple, transparent
            <span className="bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
              {" "}pricing
            </span>
          </h2>
          <p className="mt-4 mx-auto max-w-xl text-[var(--color-text-muted)]">
            Start free and upgrade when you&apos;re ready. No credit card required.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid gap-8 md:grid-cols-3 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-8 transition-all duration-300
                hover:shadow-[var(--shadow-lg)] hover:-translate-y-1
                ${
                  plan.highlighted
                    ? "border-blue-400/50 dark:border-blue-500/30 bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-950/20 shadow-[var(--shadow-lg)] scale-[1.02]"
                    : "border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-sm)]"
                }`}
            >
              {plan.highlighted && (
                <div
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full
                              bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-1
                              text-xs font-semibold text-white shadow-[var(--shadow-md)]"
                >
                  Most Popular
                </div>
              )}

              <h3 className="text-lg font-bold text-[var(--color-text)]">{plan.name}</h3>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">{plan.description}</p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-[var(--color-text)]">
                  {plan.price}
                </span>
                <span className="text-sm text-[var(--color-text-muted)]">{plan.period}</span>
              </div>

              <Link
                href="/sign-in"
                className={`mt-8 flex w-full items-center justify-center rounded-xl py-3 text-sm
                  font-semibold transition-all duration-200
                  hover:-translate-y-0.5
                  ${
                    plan.highlighted
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)]"
                      : "border border-[var(--color-border)] text-[var(--color-text)] bg-[var(--color-bg-card)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]"
                  }`}
              >
                {plan.cta}
              </Link>

              <ul className="mt-8 space-y-3">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-3 text-sm text-[var(--color-text-muted)]">
                    <Check className="h-4 w-4 mt-0.5 shrink-0 text-emerald-500" />
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
