"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { analyzeDocumentFile, type DocumentAnalysis } from "@/lib/ai/gemini";

const EXT_MIME: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

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

export async function analyzeDocument(documentId: string): Promise<{ analysis: DocumentAnalysis | null; error?: string }> {
  const supabase = await createClient();
  const { data: doc } = await supabase.from("documents").select("id, name, file_url, load_id, tenant_id").eq("id", documentId).single();
  if (!doc?.file_url) return { analysis: null, error: "No file attached to this document" };

  const { data: blob, error: downloadError } = await supabase.storage.from("documents").download(doc.file_url);
  if (downloadError || !blob) return { analysis: null, error: downloadError?.message ?? "Could not download file" };

  const ext = doc.file_url.includes(".") ? doc.file_url.split(".").pop()!.toLowerCase() : "";
  const mimeType = EXT_MIME[ext] ?? blob.type ?? "application/octet-stream";
  const bytes = Buffer.from(await blob.arrayBuffer());

  const { analysis, error } = await analyzeDocumentFile(bytes, mimeType, doc.name);
  if (!analysis) return { analysis: null, error: error ?? "Analysis failed" };

  await supabase
    .from("documents")
    .update({
      ocr_text: `${analysis.summary}\n\n${analysis.extracted_text}`,
      status: analysis.issues.length === 0 ? "validated" : "pending",
    })
    .eq("id", documentId);

  revalidatePath("/documents");
  if (doc.load_id) revalidatePath(`/loads/${doc.load_id}`);

  return { analysis };
}
