import { createClient } from "@/lib/supabase/server";
import { DocumentCenter } from "@/components/documents/document-center";

export default async function DocumentsPage() {
  const supabase = await createClient();

  const { data: documents } = await supabase
    .from("documents")
    .select("*, load:loads(load_number), carrier:carriers(name)")
    .order("created_at", { ascending: false });

  return <DocumentCenter documents={(documents ?? []) as never} />;
}
