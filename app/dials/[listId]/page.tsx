// app/dials/[listId]/page.tsx
'use client';

import { useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Dialer from '@/app/components/dials/Dialer';

export default function DialSessionPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const listId = params.listId as string;
  const surveyId = searchParams.get('survey');

  // If no survey param, redirect to survey selection
  useEffect(() => {
    if (!searchParams.has('survey')) {
      router.push(`/dials/${listId}/select-survey`);
    }
  }, [listId, searchParams, router]);

  // Don't render dialer until we have survey param
  if (!searchParams.has('survey')) {
    return (
      <div className="dials-loading">
        <div>Loading...</div>
      </div>
    );
  }

  return <Dialer listId={listId} surveyId={surveyId || undefined} />;
}
