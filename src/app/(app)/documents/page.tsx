import { createClient } from "@/lib/supabase/server";
import { DocumentCenter } from "@/components/documents/document-center";

export default async function DocumentsPage() {
  const supabase = await createClient();

  const [{ data: documents }, { data: loads }, { data: carriers }] = await Promise.all([
    supabase
      .from("documents")
      .select("*, load:loads(load_number), carrier:carriers(name)")
      .order("created_at", { ascending: false }),
    supabase.from("loads").select("id, load_number").order("load_number"),
    supabase.from("carriers").select("id, name").order("name"),
  ]);

  return (
    <DocumentCenter
      documents={(documents ?? []) as never}
      loads={loads ?? []}
      carriers={carriers ?? []}
    />
  );
}
