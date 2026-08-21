"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Package,
  Truck,
  Users,
  Building2,
  User,
  FileText,
  AlertTriangle,
  Bot,
  DollarSign,
  Calculator,
  Wallet,
  ArrowRight,
} from "lucide-react";

// Content sourced verbatim from the product BRD provided this session —
// nothing here is invented marketing copy.

const MODULES = [
  { label: "Command Center", icon: LayoutDashboard },
  { label: "Loads", icon: Package },
  { label: "Dispatch", icon: Truck },
  { label: "Quoting", icon: Calculator },
  { label: "Customers", icon: Users },
  { label: "Carriers", icon: Building2 },
  { label: "Drivers", icon: User },
  { label: "Fleet", icon: Truck },
  { label: "Settlements", icon: Wallet },
  { label: "Documents", icon: FileText },
  { label: "Exceptions", icon: AlertTriangle },
  { label: "AI Command Center", icon: Bot },
  { label: "Finance", icon: DollarSign },
];

const EVOLUTION = ["System of Record", "System of Insight", "System of Decision", "System of Action", "Autonomous Logistics Operating System"];

const DIFFERENTIATORS = [
  { title: "Traditional Software", points: ['"What happened?"'] },
  { title: "Modern Software", points: ['"What is happening?"'] },
  {
    title: "Autonomous USA Logistics OS",
    points: [
      '"What is happening?"',
      '"What will probably happen?"',
      '"What should we do?"',
      '"What can AI safely do?"',
      '"What has already been fixed?"',
    ],
    highlight: true,
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export function LandingContent() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex h-16 items-center justify-between border-b border-border px-6 sm:px-10">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-teal text-sm font-bold text-primary-dark">
            AF
          </div>
          <span className="text-sm font-semibold">Autonomous Freight</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link href="/sign-up">
            <Button size="sm">Create Account</Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 py-16 sm:px-10 lg:grid-cols-2 lg:py-24">
        <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.5 }}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent-teal">
            Autonomous USA Logistics OS
          </p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            The Autonomous Operating System for U.S. Freight.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Your AI Operations Team watches every load, detects and predicts exceptions, protects profitability,
            automates approved workflows, prepares recovery plans, and learns from every completed shipment.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/sign-up">
              <Button size="default" className="h-11 px-6">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="default" className="h-11 px-6">Sign In</Button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="overflow-hidden rounded-2xl border border-border shadow-[var(--shadow-lg)]"
        >
          <img
            src="https://images.pexels.com/photos/28264496/pexels-photo-28264496.jpeg?auto=compress&cs=tinysrgb&w=1600"
            alt="Freight truck on a U.S. highway"
            className="h-full w-full object-cover"
          />
        </motion.div>
      </section>

      <section className="border-y border-border bg-card py-14">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-4xl px-6 text-center text-xl font-medium leading-relaxed sm:text-2xl"
        >
          &ldquo;Monitor everything. Predict problems. Protect profit. Recover automatically. Learn from every
          load.&rdquo;
        </motion.p>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-10">
        <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">Key Differentiators</h2>
        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {DIFFERENTIATORS.map((col, i) => (
            <motion.div
              key={col.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className={`rounded-2xl border p-6 ${col.highlight ? "border-accent-teal bg-accent-teal/5 shadow-[var(--shadow-md)]" : "border-border bg-card"}`}
            >
              <p className={`text-sm font-semibold ${col.highlight ? "text-accent-teal" : "text-muted-foreground"}`}>
                {col.title}
              </p>
              <ul className="mt-3 space-y-2">
                {col.points.map((p) => (
                  <li key={p} className="text-sm">{p}</li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card py-16">
        <div className="mx-auto max-w-7xl px-6 sm:px-10">
          <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">Product Evolution Path</h2>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            {EVOLUTION.map((step, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="flex items-center gap-2"
              >
                <span
                  className={`rounded-full px-4 py-2 text-sm font-medium ${
                    i === EVOLUTION.length - 1 ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                  }`}
                >
                  {step}
                </span>
                {i < EVOLUTION.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-10">
        <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">Everything in one platform</h2>
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {MODULES.map((m, i) => {
            const Icon = m.icon;
            return (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: (i % 4) * 0.05 }}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-teal/15 text-accent-teal">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">{m.label}</span>
              </motion.div>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-border px-6 py-8 sm:px-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-xs text-muted-foreground sm:flex-row">
          <span>Autonomous Freight Command — Autonomous USA Logistics OS</span>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-foreground">Sign In</Link>
            <Link href="/sign-up" className="hover:text-foreground">Create Account</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
