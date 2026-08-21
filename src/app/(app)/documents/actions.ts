"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function uploadDocument(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized" };

  const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single();
  if (!profile) return { error: "no tenant" };

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { error: "No file selected" };

  const docType = (formData.get("docType") as string) || "other";
  const loadId = (formData.get("loadId") as string) || null;
  const carrierId = (formData.get("carrierId") as string) || null;
  const name = (formData.get("name") as string) || file.name;

  const ext = file.name.includes(".") ? file.name.split(".").pop() : null;
  const path = `${profile.tenant_id}/${crypto.randomUUID()}${ext ? `.${ext}` : ""}`;

  const { error: uploadError } = await supabase.storage.from("documents").upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  });
  if (uploadError) return { error: uploadError.message };

  const { error: insertError } = await supabase.from("documents").insert({
    tenant_id: profile.tenant_id,
    load_id: loadId,
    carrier_id: carrierId,
    name,
    doc_type: docType,
    file_url: path,
    status: "pending",
    uploaded_by: user.id,
  });
  if (insertError) {
    await supabase.storage.from("documents").remove([path]);
    return { error: insertError.message };
  }

  revalidatePath("/documents");
  if (loadId) revalidatePath(`/loads/${loadId}`);
  return { error: null };
}

export async function getDocumentUrl(documentId: string) {
  const supabase = await createClient();
  const { data: doc } = await supabase.from("documents").select("file_url").eq("id", documentId).single();
  if (!doc?.file_url) return { error: "No file attached to this document" };

  const { data, error } = await supabase.storage.from("documents").createSignedUrl(doc.file_url, 60);
  if (error) return { error: error.message };
  return { url: data.signedUrl };
}
