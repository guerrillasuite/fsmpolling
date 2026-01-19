// app/dials/[listId]/page.tsx
import Dialer from '@/app/components/dials/Dialer';

export default async function DialSessionPage({
  params
}: {
  params: Promise<{ listId: string }>
}) {
  const { listId } = await params;
  return <Dialer listId={listId} />;
}