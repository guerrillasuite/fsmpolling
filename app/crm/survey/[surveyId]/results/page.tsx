// app/crm/survey/[surveyId]/results/page.tsx
import { ResultsDashboard } from '@/app/components/survey/ResultsDashboard';

interface SurveyResultsPageProps {
  params: Promise<{
    surveyId: string;
  }>;
}

export default async function SurveyResultsPage({
  params,
}: SurveyResultsPageProps) {
  const { surveyId } = await params;

  return (
    <section className="results-dashboard">
      <ResultsDashboard surveyId={surveyId} />
    </section>
  );
}
