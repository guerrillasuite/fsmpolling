// app/crm/survey/page.tsx
import Link from 'next/link';
import { ClipboardList } from 'lucide-react';
import { getDatabase } from '@/lib/db/init';

export default function SurveyPage() {
  const db = getDatabase();

  try {
    const surveys = db.prepare(`
      SELECT 
        s.id,
        s.title,
        s.description,
        s.active,
        s.created_at,
        COUNT(DISTINCT ss.crm_contact_id) AS total_responses,
        COUNT(DISTINCT CASE 
          WHEN ss.completed_at IS NOT NULL 
          THEN ss.crm_contact_id 
        END) AS completed_responses
      FROM surveys s
      LEFT JOIN survey_sessions ss ON s.id = ss.survey_id
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `).all() as any[];

    db.close();

    return (
      <section className="stack">
        <header>
          <h1>Surveys</h1>
          <p className="text-dim">
            Manage and monitor your survey campaigns
          </p>
        </header>

        {surveys.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">
              <ClipboardList size={32} />
            </div>
            <h3>No Surveys Yet</h3>
            <p className="text-dim">
              Create your first survey to get started
            </p>
          </div>
        ) : (
          <div className="stack">
            {surveys.map((survey) => {
              const completionRate =
                survey.total_responses > 0
                  ? Math.round(
                      (survey.completed_responses /
                        survey.total_responses) *
                        100
                    )
                  : 0;

              return (
                <article key={survey.id} className="crm-card stack">
                  <div className="row">
                    <h2>{survey.title}</h2>
                    <span
                      className={
                        survey.active
                          ? 'badge badge--active'
                          : 'badge badge--inactive'
                      }
                    >
                      {survey.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {survey.description && (
                    <p className="text-dim">
                      {survey.description}
                    </p>
                  )}

                  <p className="muted">
                    Created:{' '}
                    {new Date(
                      survey.created_at
                    ).toLocaleDateString()}
                  </p>

                  <div className="stat-grid">
                    <div className="stat-tile stat-tile--blue">
                      <div className="stat-label">
                        Total Started
                      </div>
                      <div className="stat-value">
                        {survey.total_responses}
                      </div>
                    </div>

                    <div className="stat-tile stat-tile--green">
                      <div className="stat-label">
                        Completed
                      </div>
                      <div className="stat-value">
                        {survey.completed_responses}
                      </div>
                    </div>

                    <div className="stat-tile stat-tile--purple">
                      <div className="stat-label">
                        Completion Rate
                      </div>
                      <div className="stat-value">
                        {completionRate}%
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <Link
                      href={`/crm/survey/${survey.id}/results`}
                      className="btn btn--primary"
                    >
                      View Results
                    </Link>

                    <Link
                      href={`/survey/${survey.id}?contact_id=PREVIEW`}
                      target="_blank"
                      className="btn btn--neutral"
                    >
                      Preview
                    </Link>

                    <a
                      href={`/api/survey/${survey.id}/export`}
                      download
                      className="btn btn--success"
                    >
                      Export
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    );
  } catch (error) {
    console.error('Error loading surveys:', error);
    db.close();

    return (
      <section className="stack">
        <div className="survey-error">
          <h3>Error Loading Surveys</h3>
          <p>
            Please check that the database is initialized.
          </p>
          <p className="muted">
            Run:{' '}
            <code>npm run db:seed</code>
          </p>
        </div>
      </section>
    );
  }
}
