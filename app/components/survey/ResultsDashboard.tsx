// app/components/survey/ResultsDashboard.tsx
'use client';

import { useEffect, useState } from 'react';

interface QuestionResult {
  question_id: string;
  question_text: string;
  total_responses: number;
  answers: {
    value: string;
    count: number;
    percentage: number;
  }[];
}

interface SurveyStats {
  survey_id: string;
  survey_title: string;
  total_started: number;
  total_completed: number;
  completion_rate: number;
  questions: QuestionResult[];
}

interface ResultsDashboardProps {
  surveyId: string;
}

export function ResultsDashboard({ surveyId }: ResultsDashboardProps) {
  const [stats, setStats] = useState<SurveyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchResults = async () => {
    try {
      const response = await fetch(`/api/survey/${surveyId}/results`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch results');
      }

      const data = await response.json();
      setStats(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching results:', err);
      setError(err instanceof Error ? err.message : 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
    const interval = setInterval(fetchResults, 30000);
    return () => clearInterval(interval);
  }, [surveyId]);

  const handleExport = async (format: 'csv' | 'json' = 'csv') => {
    try {
      const response = await fetch(`/api/survey/${surveyId}/export?format=${format}`);
      if (!response.ok) throw new Error('Export failed');

      if (format === 'csv') {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `survey-${surveyId}-export-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `survey-${surveyId}-export-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export data. Please try again.');
    }
  };

  /* ------------------ Loading ------------------ */

  if (loading) {
    return (
      <section className="survey-loading">
        <div className="spinner" />
        <p>Loading results…</p>
      </section>
    );
  }

  /* ------------------ Error ------------------ */

  if (error) {
    return (
      <section className="stack">
        <div className="survey-error">
          <h3>Error Loading Results</h3>
          <p>{error}</p>
          <button className="btn" onClick={fetchResults}>
            Try Again
          </button>
        </div>
      </section>
    );
  }

  if (!stats) {
    return (
      <section className="stack">
        <div className="survey-error">
          <p>No survey data found.</p>
        </div>
      </section>
    );
  }

  /* ------------------ Main ------------------ */

  return (
    <section className="results-dashboard stack">
      {/* Header */}
      <div className="results-header">
        <div>
          <h1>{stats.survey_title}</h1>
          <p className="text-dim">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>

        <div className="row">
          <button
            className="export-button"
            onClick={() => handleExport('csv')}
          >
            Export CSV
          </button>
          <button
            className="btn btn--neutral"
            onClick={() => handleExport('json')}
          >
            JSON
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="results-stats">
        <div className="stat-card">
          <div className="stat-label">Total Started</div>
          <div className="stat-value">{stats.total_started}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Completed</div>
          <div className="stat-value">{stats.total_completed}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Completion Rate</div>
          <div className="stat-value">
            {Math.round(stats.completion_rate)}%
          </div>
        </div>
      </div>

      {/* Question Results */}
      {stats.questions.map((question, idx) => (
        <div
          key={question.question_id}
          className="results-question"
        >
          <h3>
            Question {idx + 1}: {question.question_text}
          </h3>

          <p className="text-dim">
            {question.total_responses}{' '}
            {question.total_responses === 1 ? 'response' : 'responses'}
          </p>

          {question.answers.map((answer, answerIdx) => (
            <div
              key={`${answer.value}-${answerIdx}`}
              className="results-answer-bar"
            >
              <div className="answer-label">
                <span>{answer.value}</span>
                <span className="answer-count">
                  {answer.count} · {Math.round(answer.percentage)}%
                </span>
              </div>

              <div className="answer-bar-bg">
                <div
                  className="answer-bar-fill"
                  style={{ width: `${answer.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ))}

      <p className="text-dim" style={{ textAlign: 'center', marginTop: '24px' }}>
        Auto-refreshing every 30 seconds
      </p>
    </section>
  );
}
