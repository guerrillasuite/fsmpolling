// app/dials/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Phone, Users, CheckCircle2 } from 'lucide-react';

interface DialList {
  id: string;
  name: string;
  description: string;
  survey_id: string | null;
  survey_title: string | null;
  total_contacts: number;
  pending_contacts: number;
  completed_contacts: number;
}

export default function DialsPage() {
  const [lists, setLists] = useState<DialList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    try {
      const res = await fetch('/api/dials/lists');
      const data = await res.json();
      setLists(data.lists || []);
    } catch (error) {
      console.error('Error loading lists:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dials-loading">
        <div>Loading dial lists...</div>
      </div>
    );
  }

  return (
    <section className="stack">
      <div>
        <h1 className="crm-page-title">Dial Lists</h1>
        <p className="crm-page-subtitle">
          Make calls and conduct surveys
        </p>
      </div>

      {lists.length === 0 ? (
        <div className="dials-empty-state">
          <Phone size={48} className="dials-empty-icon" />
          <h3 className="dials-empty-title">
            No Dial Lists Yet
          </h3>
          <p className="dials-empty-message">
            Create a dial list to start making calls
          </p>
        </div>
      ) : (
        <div className="stack">
          {lists.map((list) => {
            const completionRate = list.total_contacts > 0
              ? Math.round((list.completed_contacts / list.total_contacts) * 100)
              : 0;

            return (
              <Link
                key={list.id}
                href={`/dials/${list.id}`}
                className="dials-list-card"
              >
                <div className="dials-list-header">
                  <div className="dials-list-content">
                    <h2 className="dials-list-title">
                      {list.name}
                    </h2>
                    {list.description && (
                      <p className="dials-list-desc">
                        {list.description}
                      </p>
                    )}
                    {list.survey_title && (
                      <div className="dials-survey-badge">
                        📋 {list.survey_title}
                      </div>
                    )}
                  </div>
                </div>

                <div className="dials-stats-grid">
                  <div className="dials-stat-card total">
                    <div className="dials-stat-label">
                      Total
                    </div>
                    <div className="dials-stat-value">
                      {list.total_contacts}
                    </div>
                  </div>
                  <div className="dials-stat-card pending">
                    <div className="dials-stat-label">
                      Pending
                    </div>
                    <div className="dials-stat-value">
                      {list.pending_contacts}
                    </div>
                  </div>
                  <div className="dials-stat-card done">
                    <div className="dials-stat-label">
                      Done
                    </div>
                    <div className="dials-stat-value">
                      {completionRate}%
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
