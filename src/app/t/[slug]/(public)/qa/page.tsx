import { getPublicTenantContext } from "@/lib/public-tenant";
import QAClient from "./QAClient";

export default async function QAPage({ params }: { params: { slug: string } }) {
  const { supabase } = await getPublicTenantContext(params.slug);

  const { data: items } = await supabase
    .from("qa_items")
    .select("id, category, question, answer, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return <QAClient items={items ?? []} />;
}
