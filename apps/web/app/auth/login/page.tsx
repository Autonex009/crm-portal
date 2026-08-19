import { LoginForm } from "@/components/auth/login-form";
import { TrendingUp, ShieldCheck, Layers, BarChart3, CheckCircle2 } from "lucide-react";

export const metadata = { title: "Sign In — DealBridge CRM" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen w-full bg-background overflow-hidden">
      {/* Left Panel: Brand & Feature Showcase */}
      <div className="hidden lg:flex flex-1 relative bg-slate-900 dark:bg-slate-950 p-12 flex-col justify-between overflow-hidden">
        {/* Subtle Low-Vibrancy Ambient Background */}
        <div className="absolute top-0 -left-1/4 w-96 h-96 bg-indigo-950/40 rounded-full blur-3xl pointer-events-none" />

        {/* Top Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden border border-slate-700 shadow-xs">
            <img src="/autonex_ai_logo.jpeg" alt="Autonex AI" className="h-full w-full object-cover" />
          </div>
          <div>
            <span className="font-extrabold text-xl text-white tracking-tight">DealBridge</span>
            <span className="ml-2 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              Enterprise CRM
            </span>
          </div>
        </div>

        {/* Hero Copy & Feature List */}
        <div className="relative z-10 max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700">
            <BarChart3 className="h-3.5 w-3.5 text-indigo-400" />
            <span className="text-xs font-semibold text-slate-300">Pipeline Intelligence Platform</span>
          </div>

          <h1 className="text-4xl font-extrabold text-white tracking-tight leading-tight">
            Accelerate your deals with real-time sales velocity.
          </h1>

          <p className="text-slate-400 text-sm leading-relaxed">
            Manage leads, generate instant GST quotes, track deal pipeline velocity, and stay focused on high-value sales tasks.
          </p>

          <div className="space-y-3 pt-2">
            {[
              "Automated deal probability & weighted pipeline forecasting",
              "Instant GST Tax Invoice engine & quote generator",
              "Needs-Attention action center for zero missed follow-ups",
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-slate-300 text-xs font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Metrics Card */}
        <div className="relative z-10 p-5 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-700 flex items-center justify-center border border-slate-600">
              <Layers className="h-4 w-4 text-indigo-300" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">$14.2M+ Active Pipeline</p>
              <p className="text-[11px] text-slate-400">Processed across active deals this month</p>
            </div>
          </div>
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
        </div>
      </div>

      {/* Right Panel: Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 relative bg-card">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Brand Title */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden border shadow-xs">
              <img src="/autonex_ai_logo.jpeg" alt="Autonex AI" className="h-full w-full object-cover" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-foreground">DealBridge</span>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
              Welcome back
            </h2>
            <p className="text-xs text-muted-foreground">
              Enter your credentials to access your sales workspace
            </p>
          </div>

          <div className="rounded-2xl border bg-background p-6 shadow-xs">
            <LoginForm />
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Protected by enterprise-grade encryption & 256-bit SSL security
          </p>
        </div>
      </div>
    </main>
  );
}
