"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Upload, ScanLine, Eye, Download, Bot, AlertTriangle, X, Loader2, FileX } from "lucide-react";
import { uploadDocument, getDocumentUrl } from "@/app/(app)/documents/actions";
import type { Document } from "@/lib/types/database";

type EnrichedDocument = Document & {
  load: { load_number: string } | null;
  carrier: { name: string } | null;
};

const STATUS_LABEL: Record<string, { label: string; variant: "success" | "warning" | "danger" | "neutral" }> = {
  validated: { label: "Validated", variant: "success" },
  active: { label: "Active", variant: "success" },
  pending: { label: "Pending", variant: "warning" },
  expired: { label: "Expired", variant: "danger" },
};

const DOC_TYPES = ["rate_confirmation", "bol", "pod", "invoice", "insurance_certificate", "w9", "other"];
const FILTERS = ["All", "Validated", "Pending", "Active", "Expired"] as const;

export function DocumentCenter({
  documents,
  loads,
  carriers,
}: {
  documents: EnrichedDocument[];
  loads: { id: string; load_number: string }[];
  carriers: { id: string; name: string }[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [showUpload, setShowUpload] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return documents.filter((d) => {
      const matchesFilter = filter === "All" || (STATUS_LABEL[d.status]?.label ?? d.status) === filter;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.load?.load_number.toLowerCase().includes(q) ||
        d.carrier?.name.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [documents, query, filter]);

  const total = documents.length;
  const complete = documents.filter((d) => d.status === "validated" || d.status === "active").length;
  const completeness = total > 0 ? Math.round((complete / total) * 100) : 100;
  const missing = documents.filter((d) => d.status === "pending").length;
  const expiring = documents.filter((d) => d.status === "expired").length;

  async function openDocument(id: string) {
    setOpeningId(id);
    const res = await getDocumentUrl(id);
    setOpeningId(null);
    if (res.error) {
      alert(res.error);
      return;
    }
    window.open(res.url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Document Intelligence Center</h1>
          <p className="text-sm text-muted-foreground">{total} documents on file</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <ScanLine className="h-3.5 w-3.5" /> Scan / OCR
          </Button>
          <Button size="sm" onClick={() => setShowUpload(true)}>
            <Upload className="h-3.5 w-3.5" /> Upload
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative max-w-sm flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search documents, loads, carriers…" className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="flex gap-1.5">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    filter === f ? "border-accent-teal bg-accent-teal/15 text-accent-teal" : "border-border text-muted-foreground"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <Card>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Document</th>
                    <th className="px-4 py-3 font-medium">Load / Carrier</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((doc) => {
                    const status = STATUS_LABEL[doc.status] ?? { label: doc.status, variant: "neutral" as const };
                    const hasFile = !!doc.file_url;
                    return (
                      <tr key={doc.id} className="border-b border-border last:border-0 hover:bg-accent/50">
                        <td className="px-4 py-3 font-medium">{doc.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{doc.load?.load_number ?? doc.carrier?.name ?? "—"}</td>
                        <td className="px-4 py-3">
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {hasFile ? (
                              <>
                                <Button size="sm" variant="ghost" disabled={openingId === doc.id} onClick={() => openDocument(doc.id)}>
                                  {openingId === doc.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
                                </Button>
                                <Button size="sm" variant="ghost" disabled={openingId === doc.id} onClick={() => openDocument(doc.id)}>
                                  <Download className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            ) : (
                              <span title="No file uploaded" className="flex h-8 w-8 items-center justify-center text-muted-foreground">
                                <FileX className="h-3.5 w-3.5" />
                              </span>
                            )}
                            <Button size="sm" variant="ghost"><Bot className="h-3.5 w-3.5" /></Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No documents match.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <Bot className="h-4 w-4 text-accent-teal" /> AI Insights
            </CardTitle>
            <CardDescription>Document completeness across your fleet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span>Completeness</span>
                <span className="font-semibold">{completeness}%</span>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-accent-teal" style={{ width: `${completeness}%` }} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
              <span className="flex items-center gap-1.5"><AlertTriangle className="h-4 w-4 text-warning" /> Missing documents</span>
              <span className="font-semibold">{missing}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
              <span className="flex items-center gap-1.5"><AlertTriangle className="h-4 w-4 text-danger" /> Expired / expiring</span>
              <span className="font-semibold">{expiring}</span>
            </div>
            <Button variant="outline" size="sm" className="w-full">Request New Document</Button>
          </CardContent>
        </Card>
      </div>

      {showUpload && <UploadModal loads={loads} carriers={carriers} onClose={() => setShowUpload(false)} />}
    </div>
  );
}

function UploadModal({
  loads,
  carriers,
  onClose,
}: {
  loads: { id: string; load_number: string }[];
  carriers: { id: string; name: string }[];
  onClose: () => void;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [docType, setDocType] = useState("rate_confirmation");
  const [associate, setAssociate] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Choose a file first");
      return;
    }
    setSaving(true);
    setError(null);

    const formData = new FormData();
    formData.set("file", file);
    formData.set("name", fileName || file.name);
    formData.set("docType", docType);
    if (associate.startsWith("load:")) formData.set("loadId", associate.slice(5));
    if (associate.startsWith("carrier:")) formData.set("carrierId", associate.slice(8));

    const res = await uploadDocument(formData);
    setSaving(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={submit}>
          <CardContent className="space-y-3 pt-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Upload Document</h2>
              <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              required
              accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none file:mr-3 file:rounded-md file:border-0 file:bg-accent-teal/15 file:px-2.5 file:py-1 file:text-xs file:text-accent-teal"
            />

            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              {DOC_TYPES.map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
              ))}
            </select>

            <select
              value={associate}
              onChange={(e) => setAssociate(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">No association</option>
              <optgroup label="Loads">
                {loads.map((l) => (
                  <option key={l.id} value={`load:${l.id}`}>{l.load_number}</option>
                ))}
              </optgroup>
              <optgroup label="Carriers">
                {carriers.map((c) => (
                  <option key={c.id} value={`carrier:${c.id}`}>{c.name}</option>
                ))}
              </optgroup>
            </select>

            {error && <p className="text-xs text-danger">{error}</p>}
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Uploading…" : "Upload"}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
