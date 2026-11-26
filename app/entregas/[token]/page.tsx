import { notFound } from "next/navigation";
import { getPrivateGalleryView } from "../../lib/deliveries/repository";
import { DeliveryGallery } from "./delivery-gallery";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export default async function ClientDeliveryPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const gallery = await getPrivateGalleryView(token).catch(() => null);
  if (!gallery) notFound();
  return <DeliveryGallery token={token} gallery={gallery} />;
}
