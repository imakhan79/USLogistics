"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, Eye, EyeOff, Bot, ShieldCheck, TrendingUp, MapPin, Flag, Truck } from "lucide-react";

const DEMO_PASSWORD = "Demo12345!";
const DEMO_ACCOUNTS = [
  { role: "Owner", email: "owner@demo.freight.co" },
  { role: "Admin", email: "admin@demo.freight.co" },
  { role: "Dispatcher", email: "dispatcher@demo.freight.co" },
  { role: "Driver", email: "driver@demo.freight.co" },
  { role: "Viewer", email: "viewer@demo.freight.co" },
];

const HIGHLIGHTS = [
  { icon: Bot, text: "Live AI Copilot watching every load" },
  { icon: ShieldCheck, text: "Predicts exceptions before they cost you" },
  { icon: TrendingUp, text: "Recovery plans prepared automatically" },
];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 320, damping: 26 } },
};

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function signIn(loginEmail: string, loginPassword: string, key: string) {
    setLoading(key);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
    setLoading(null);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await signIn(email, password, "manual");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-primary-dark p-10 text-white lg:flex">
        <img
          src="https://images.pexels.com/photos/28264496/pexels-photo-28264496.jpeg?auto=compress&cs=tinysrgb&w=1600"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-dark via-primary-dark/85 to-primary-dark/50" />

        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 flex items-center gap-2"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-teal text-sm font-bold text-primary-dark">
            AF
          </div>
          <span className="font-semibold">Autonomous Freight</span>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="relative z-10 max-w-md"
        >
          <motion.p
            variants={item}
            className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent-teal"
          >
            Autonomous USA Logistics OS
          </motion.p>
          <motion.h2 variants={item} className="text-3xl font-bold leading-tight tracking-tight">
            Monitor everything. Predict problems. Protect profit.
          </motion.h2>
          <div className="mt-8 space-y-4">
            {HIGHLIGHTS.map((h) => (
              <motion.div key={h.text} variants={item} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <h.icon className="h-4 w-4 text-accent-teal" />
                </div>
                <p className="text-sm text-white/85">{h.text}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            variants={item}
            className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white/70">LD-1042</span>
              <span className="flex items-center gap-1 rounded-full bg-accent-teal/15 px-2 py-0.5 text-[10px] font-medium text-accent-teal">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-teal" /> In Transit
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-white/50" />
              <div className="relative h-px flex-1 overflow-hidden bg-white/15">
                <motion.div
                  animate={{ x: ["-10%", "110%"] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-[7px] left-0 flex h-4 w-4 items-center justify-center rounded-full bg-accent-teal text-primary-dark"
                >
                  <Truck className="h-2.5 w-2.5" />
                </motion.div>
              </div>
              <Flag className="h-3.5 w-3.5 shrink-0 text-white/50" />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-white/60">
              <span>Seattle, WA</span>
              <span>Dallas, TX</span>
            </div>
          </motion.div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="relative z-10 text-xs text-white/40"
        >
          Autonomous Freight Command
        </motion.p>
      </div>

      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <motion.div variants={container} initial="hidden" animate="show" className="w-full max-w-sm">
          <motion.div variants={item} className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-teal text-sm font-bold text-primary-dark">
              AF
            </div>
            <span className="text-sm font-semibold">Autonomous Freight</span>
          </motion.div>

          <motion.h1 variants={item} className="text-2xl font-semibold tracking-tight">
            Welcome back
          </motion.h1>
          <motion.p variants={item} className="mt-1 text-sm text-muted-foreground">
            Sign in to your operations dashboard
          </motion.p>

          <motion.form variants={item} onSubmit={handleSubmit} className="mt-6 space-y-3">
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="email"
                required
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 pl-9"
              />
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 pl-9 pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {error && <p className="text-xs text-danger">{error}</p>}
            <Button type="submit" className="h-11 w-full" disabled={loading !== null}>
              {loading === "manual" ? "Signing in…" : "Sign in"}
            </Button>
          </motion.form>

          <motion.div variants={item} className="mt-6 border-t border-border pt-5">
            <p className="mb-2.5 text-center text-xs font-medium text-muted-foreground">
              Demo logins (one click, every role)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <Button
                  key={acc.email}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loading !== null}
                  onClick={() => signIn(acc.email, DEMO_PASSWORD, acc.email)}
                  className={acc.role === "Viewer" ? "col-span-2" : ""}
                >
                  {loading === acc.email ? "Signing in…" : acc.role}
                </Button>
              ))}
            </div>
          </motion.div>

          <motion.p variants={item} className="mt-5 text-center text-xs text-muted-foreground">
            No account?{" "}
            <Link href="/sign-up" className="text-accent-teal hover:underline">
              Create one
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
