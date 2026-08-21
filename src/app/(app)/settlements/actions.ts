"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Load, SettlementStatus } from "@/lib/types/database";

export async function previewSettlement(driverId: string, periodStart: string, periodEnd: string) {
  const supabase = await createClient();

  const { data: driver } = await supabase.from("drivers").select("pay_type, pay_rate").eq("id", driverId).single();
  if (!driver) return { error: "Driver not found" };

  const { data: loads } = await supabase
    .from("loads")
    .select("*")
    .eq("driver_id", driverId)
    .eq("status", "delivered")
    .gte("delivery_date", periodStart)
    .lte("delivery_date", periodEnd);

  const deliveredLoads = (loads ?? []) as Load[];

  let grossPay = 0;
  if (driver.pay_type === "per_mile") {
    grossPay = deliveredLoads.reduce((sum, l) => sum + Number(l.miles ?? 0) * Number(driver.pay_rate), 0);
  } else if (driver.pay_type === "percentage") {
    grossPay = deliveredLoads.reduce((sum, l) => sum + Number(l.revenue) * Number(driver.pay_rate), 0);
  } else {
    grossPay = deliveredLoads.length * Number(driver.pay_rate);
  }

  return {
    grossPay: Math.round(grossPay * 100) / 100,
    loadCount: deliveredLoads.length,
    loads: deliveredLoads.map((l) => ({ id: l.id, load_number: l.load_number, revenue: l.revenue, miles: l.miles })),
    payType: driver.pay_type,
    payRate: driver.pay_rate,
  };
}

export async function createSettlement(input: {
  driverId: string;
  periodStart: string;
  periodEnd: string;
  grossPay: number;
  loadCount: number;
  bonus: number;
  fuelDeduction: number;
  tollsDeduction: number;
  advancesDeduction: number;
  expensesDeduction: number;
  otherDeductions: number;
  notes: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized" };

  const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single();
  if (!profile) return { error: "no tenant" };

  const { error } = await supabase.from("settlements").insert({
    tenant_id: profile.tenant_id,
    driver_id: input.driverId,
    period_start: input.periodStart,
    period_end: input.periodEnd,
    gross_pay: input.grossPay,
    load_count: input.loadCount,
    bonus: input.bonus,
    fuel_deduction: input.fuelDeduction,
    tolls_deduction: input.tollsDeduction,
    advances_deduction: input.advancesDeduction,
    expenses_deduction: input.expensesDeduction,
    other_deductions: input.otherDeductions,
    notes: input.notes || null,
    status: "draft",
  });

  if (error) return { error: error.message };
  revalidatePath("/settlements");
  return { error: null };
}

export async function updateSettlementStatus(id: string, status: SettlementStatus) {
  const supabase = await createClient();
  await supabase
    .from("settlements")
    .update({ status, paid_at: status === "paid" ? new Date().toISOString() : null })
    .eq("id", id);
  revalidatePath("/settlements");
}
