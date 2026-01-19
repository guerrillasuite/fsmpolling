// app/dials/[listId]/page.tsx
import Dialer from '@/app/components/dials/Dialer';

export default function DialSessionPage({
  params
}: {
  params: { listId: string }
}) {
  return <Dialer listId={params.listId} />;
}