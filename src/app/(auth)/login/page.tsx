"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const DEMO_PASSWORD = "Demo12345!";
const DEMO_ACCOUNTS = [
  { role: "Owner", email: "owner@demo.freight.co" },
  { role: "Admin", email: "admin@demo.freight.co" },
  { role: "Dispatcher", email: "dispatcher@demo.freight.co" },
  { role: "Driver", email: "driver@demo.freight.co" },
  { role: "Viewer", email: "viewer@demo.freight.co" },
];

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-lg">Autonomous Freight Command</CardTitle>
          <CardDescription>Sign in to your operations dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            {error && <p className="text-xs text-danger">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading !== null}>
              {loading === "manual" ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="mt-5 border-t border-border pt-4">
            <p className="mb-2 text-center text-xs font-medium text-muted-foreground">
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
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            No account?{" "}
            <Link href="/sign-up" className="text-accent-teal hover:underline">
              Create one
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
