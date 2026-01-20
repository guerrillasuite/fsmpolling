'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ClipboardList } from 'lucide-react';

interface Survey {
  id: string;
  title: string;
  description: string;
}

export default function SelectSurveyPage() {
  const params = useParams();
  const router = useRouter();
  const listId = params.listId as string;

  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [listName, setListName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load surveys
      const surveysRes = await fetch('/api/surveys/list');
      const surveysData = await surveysRes.json();
      setSurveys(surveysData.surveys || []);

      // Load list info
      const listRes = await fetch(`/api/dials/lists/${listId}/contacts`);
      const listData = await listRes.json();
      setListName(listData.list_name || 'Call List');
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startDialing = (surveyId: string | null) => {
    if (surveyId) {
      router.push(`/dials/${listId}?survey=${surveyId}`);
    } else {
      router.push(`/dials/${listId}`);
    }
  };

  if (loading) {
    return (
      <div className="dials-loading">
        <div>Loading surveys...</div>
      </div>
    );
  }

  return (
    <section className="stack">
      <div>
        <h1 className="crm-page-title">Select Survey</h1>
        <p className="crm-page-subtitle">
          Choose a survey for: {listName}
        </p>
      </div>

      <div className="stack">
        {/* Option to dial without survey */}
        <button
          onClick={() => startDialing(null)}
          className="dials-list-card"
          style={{ textAlign: 'left', width: '100%' }}
        >
          <div className="dials-list-header">
            <div className="dials-list-content">
              <h2 className="dials-list-title">
                No Survey (Just Dial)
              </h2>
              <p className="dials-list-desc">
                Make calls without collecting survey responses
              </p>
            </div>
          </div>
        </button>

        {/* Survey options */}
        {surveys.map((survey) => (
          <button
            key={survey.id}
            onClick={() => startDialing(survey.id)}
            className="dials-list-card"
            style={{ textAlign: 'left', width: '100%' }}
          >
            <div className="dials-list-header">
              <div className="dials-list-content">
                <h2 className="dials-list-title">
                  <ClipboardList size={20} style={{ display: 'inline', marginRight: '8px' }} />
                  {survey.title}
                </h2>
                {survey.description && (
                  <p className="dials-list-desc">
                    {survey.description}
                  </p>
                )}
              </div>
            </div>
          </button>
        ))}

        {surveys.length === 0 && (
          <div className="dials-empty-state">
            <ClipboardList size={48} className="dials-empty-icon" />
            <h3 className="dials-empty-title">
              No Surveys Available
            </h3>
            <p className="dials-empty-message">
              You can still dial without a survey
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
