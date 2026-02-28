import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function Page() {
  return (
    <div className="relative min-h-screen flex items-center justify-center landing-bg overflow-hidden">
      {/* Decorative gradient orbs */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-[28rem] w-[28rem] rounded-full bg-orange-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[32rem] w-[32rem] rounded-full bg-orange-600/8 blur-[140px]" />
      <div className="pointer-events-none absolute top-1/3 right-1/4 h-64 w-64 rounded-full bg-amber-500/6 blur-[100px]" />

      {/* Content card */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-4 w-full max-w-md animate-[fadeInUp_0.5s_ease-out]">
        {/* Brand header */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-[0_4px_20px_rgba(249,115,22,0.3)] group-hover:shadow-[0_6px_28px_rgba(249,115,22,0.4)] transition-shadow">
            <span className="text-white font-bold text-lg">CS</span>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            Code Sarthi
          </span>
        </Link>

        {/* Clerk sign-in widget */}
        <SignIn
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "glass !border-[var(--color-border)] !shadow-xl !rounded-2xl w-full",
              headerTitle: "!text-[var(--color-text)]",
              headerSubtitle: "!text-[var(--color-text-muted)]",
              formFieldLabel: "!text-[var(--color-text-muted)]",
              formFieldInput:
                "!bg-[rgba(24,24,27,0.6)] !border-[var(--color-border)] !text-[var(--color-text)] !rounded-lg focus:!border-orange-500/50 focus:!ring-orange-500/20",
              formButtonPrimary:
                "!bg-gradient-to-r !from-orange-500 !to-orange-600 !text-white !shadow-[0_4px_16px_rgba(249,115,22,0.25)] hover:!shadow-[0_6px_24px_rgba(249,115,22,0.35)] !rounded-xl !font-semibold !transition-all",
              footerActionLink: "!text-orange-400 hover:!text-orange-300",
              identityPreviewEditButton: "!text-orange-400",
              formFieldAction: "!text-orange-400",
              socialButtonsBlockButton:
                "!bg-[rgba(24,24,27,0.5)] !border-[var(--color-border)] !text-[var(--color-text-muted)] hover:!border-orange-500/40 hover:!text-[var(--color-text)] !rounded-lg !transition-colors",
              socialButtonsBlockButtonText: "!font-medium",
              dividerLine: "!bg-[var(--color-border)]",
              dividerText: "!text-[var(--color-text-muted)]",
              footer: "!bg-transparent",
              footerAction: "!text-[var(--color-text-muted)]",
              internal: "",
              otpCodeFieldInput:
                "!bg-[rgba(24,24,27,0.6)] !border-[var(--color-border)] !text-[var(--color-text)]",
            },
          }}
        />

        {/* Footer tagline */}
        <p className="text-xs text-[var(--color-text-muted)] text-center">
          AI-powered coding mentor &mdash; practice, learn, and level up.
        </p>
      </div>
    </div>
  );
}
