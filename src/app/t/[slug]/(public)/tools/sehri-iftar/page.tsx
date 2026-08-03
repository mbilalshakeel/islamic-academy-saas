import { getPublicTenantContext } from "@/lib/public-tenant";
import SehriIftarClient from "./SehriIftarClient";

export default async function SehriIftarPage({ params }: { params: { slug: string } }) {
  const { tenant } = await getPublicTenantContext(params.slug);
  return <SehriIftarClient slug={params.slug} tenantId={tenant.id} />;
}
