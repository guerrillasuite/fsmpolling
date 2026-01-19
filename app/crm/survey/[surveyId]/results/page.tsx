// app/crm/survey/[surveyId]/results/page.tsx
import { ResultsDashboard } from '@/app/components/survey/ResultsDashboard';

interface SurveyResultsPageProps {
  params: {
    surveyId: string;
  };
}

export default function SurveyResultsPage({
  params,
}: SurveyResultsPageProps) {
  return (
    <section className="results-dashboard">
      <ResultsDashboard surveyId={params.surveyId} />
    </section>
  );
}
