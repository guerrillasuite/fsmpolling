// app/dials/[listId]/[index]/page.tsx
'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Person = {
  person_id: string;
  walklist_item_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  occupation?: string | null;
  employer?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
};

const RESULTS = [
  'connected','no_answer','left_voicemail','bad_number','wrong_number',
  'call_back','do_not_call','not_interested','moved','other'
] as const;
type ResultKey = typeof RESULTS[number];

// TODO: Connect to CiviCRM
// This will eventually fetch from CiviCRM API instead of local state
async function fetchPeopleFromCiviCRM(listId: string): Promise<Person[]> {
  // Placeholder: Replace with CiviCRM API call
  // Example: GET /api/civicrm/contacts?list_id={listId}
  return [];
}

// TODO: Connect to CiviCRM
// This will eventually save call results to CiviCRM
async function saveCallToCiviCRM(data: {
  personId: string;
  result: string;
  notes: string;
  duration: number | null;
  opportunity?: any;
}): Promise<void> {
  // Placeholder: Replace with CiviCRM API call
  // Example: POST /api/civicrm/activities
  console.log('TODO: Save to CiviCRM', data);
}

export default function CallScreen({ params }: { params: Promise<{ listId: string; index: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const idxFromUrl = Number(resolvedParams.index);

  const [idx, setIdx] = useState<number>(
    Number.isFinite(idxFromUrl) && idxFromUrl >= 0 ? idxFromUrl : 0
  );

  const [people, setPeople] = useState<Person[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [result, setResult] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [mkOpp, setMkOpp] = useState(false);

  // opportunity fields
  const [oppTitle, setOppTitle] = useState('');
  const [oppStage, setOppStage] =
    useState<'new'|'contacted'|'qualified'|'proposal'|'won'|'lost'|''>('');
  const [oppValue, setOppValue] = useState<number | ''>('');
  const [oppDue, setOppDue] = useState<string>(''); // yyyy-mm-dd
  const [oppPriority, setOppPriority] =
    useState<'low'|'normal'|'high'|''>('');
  const [oppNotes, setOppNotes] = useState('');

  // Reset when moving to a different target
  useEffect(() => {
    setStartedAt(null);
    setResult('');
    setNotes('');
    setMkOpp(false);
    setOppTitle('');
    setOppStage('');
    setOppValue('');
    setOppDue('');
    setOppPriority('');
    setOppNotes('');
  }, [idx]);

  // Load people from CiviCRM (placeholder)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setErr(null);
        setPeople(null);

        // TODO: Replace with CiviCRM fetch
        const peopleData = await fetchPeopleFromCiviCRM(resolvedParams.listId);

        if (!cancelled) {
          setPeople(peopleData);
          const clamped = Math.max(0, Math.min(idx, Math.max(0, peopleData.length - 1)));
          if (clamped !== idx) setIdx(clamped);
        }
      } catch (e: any) {
        if (!cancelled) {
          setErr(e?.message || "Failed to load contacts");
          setPeople([]);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [resolvedParams.listId, idx]);

  const p = useMemo(() => (people && people[idx]) || null, [people, idx]);

  if (err) return <p className="muted">Error: {err}</p>;
  if (!people) return <p className="muted">Loading…</p>;
  if (!p) {
    return (
      <div className="stack">
        <div className="list-item">
          <h4>Done with this list</h4>
          <p className="muted">You worked through all targets.</p>
        </div>
        <Link href={`/dials/${resolvedParams.listId}`} className="press-card call-screen-back-link">
          ‹ Back to list
        </Link>
      </div>
    );
  }

  const fullName = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || 'Unknown';
  const onStartInteraction = () => { if (!startedAt) setStartedAt(Date.now()); };

  async function saveAndNext() {
    if (!p) return;

    try {
      const duration = startedAt ? Math.round((Date.now() - startedAt) / 1000) : null;

      const callData = {
        personId: p.person_id,
        result,
        notes,
        duration,
        opportunity: mkOpp ? {
          title: oppTitle.trim() || `Follow-up: ${fullName}`,
          stage: oppStage || null,
          value: oppValue === '' ? null : Number(oppValue),
          dueDate: oppDue || null,
          priority: oppPriority || null,
          notes: oppNotes || null,
        } : undefined,
      };

      // TODO: Save to CiviCRM
      await saveCallToCiviCRM(callData);

      router.replace(`/dials/${resolvedParams.listId}/${idx + 1}`);
      router.refresh();
    } catch (e: any) {
      alert(e?.message || 'Save failed');
    }
  }

  return (
    <div className="stack">
      <div className="row">
        <Link href={`/dials/${resolvedParams.listId}`} className="press-card call-screen-back-link">
          ‹ Back
        </Link>
        <div className="press-card call-screen-position">
          {idx + 1} of {people.length}
        </div>
      </div>

      <div className="list-item">
        <h4 className="call-screen-contact-name">{fullName}</h4>
        <p className="muted">
          {p.occupation || '—'}{p.employer ? ` • ${p.employer}` : ''}
        </p>
        {p.address && <p className="muted call-screen-contact-meta">{p.address}</p>}

        <div className="row call-screen-actions">
          {p.phone && (
            <a
              className="press-card call-screen-action-link"
              href={`tel:${encodeURIComponent(p.phone)}`}
              onClick={onStartInteraction}
            >
              Call
            </a>
          )}
          {p.email && (
            <a
              className="press-card call-screen-action-link"
              href={`mailto:${encodeURIComponent(p.email)}`}
              onClick={onStartInteraction}
            >
              Email
            </a>
          )}
        </div>
      </div>

      <div className="list-item">
        <label htmlFor="callResult" className="muted call-screen-result-label">Call result</label>
        <select
          id="callResult"
          className="gg-field gg-select"
          value={result}
          onChange={(e) => {
            if (!startedAt) setStartedAt(Date.now());
            setResult(e.target.value);
          }}
        >
          <option value="" disabled>Select…</option>
          {RESULTS.map((r) => (
            <option key={r} value={r}>
              {r.replaceAll('_', ' ')}
            </option>
          ))}
        </select>

        <label htmlFor="callNotes" className="muted call-screen-notes-label">Notes</label>
        <textarea
          id="callNotes"
          rows={3}
          className="gg-field"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes for this call…"
        />

        <label className="row call-screen-opp-checkbox">
          <input
            type="checkbox"
            checked={mkOpp}
            onChange={(e) => setMkOpp(e.target.checked)}
          />
          <span className="muted">Create opportunity linked to this call</span>
        </label>

        {mkOpp && (
          <div className="list-item call-screen-opp-container">
            <div>
              <label htmlFor="oppTitle" className="muted">Title</label>
              <input
                id="oppTitle"
                className="gg-field"
                value={oppTitle}
                onChange={(e) => setOppTitle(e.target.value)}
                placeholder={`${fullName}`}
              />
            </div>

            <div className="row call-screen-opp-row">
              <div className="call-screen-opp-field">
                <label htmlFor="oppStage" className="muted">Stage</label>
                <select
                  id="oppStage"
                  className="gg-field gg-select"
                  value={oppStage}
                  onChange={(e) => setOppStage(e.target.value as any)}
                >
                  <option value="" disabled>Select…</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="proposal">Proposal</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
              </div>

              <div className="call-screen-opp-field">
                <label htmlFor="oppValue" className="muted">Value (USD)</label>
                <input
                  id="oppValue"
                  type="number"
                  min={0}
                  step={1}
                  className="gg-field"
                  placeholder="e.g. 250"
                  value={oppValue}
                  onChange={(e) => setOppValue(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>

              <div className="call-screen-opp-field">
                <label htmlFor="oppDue" className="muted">Follow-up date</label>
                <input
                  id="oppDue"
                  type="date"
                  className="gg-field"
                  value={oppDue}
                  onChange={(e) => setOppDue(e.target.value)}
                />
              </div>

              <div className="call-screen-opp-field">
                <label htmlFor="oppPriority" className="muted">Priority</label>
                <select
                  id="oppPriority"
                  className="gg-field gg-select"
                  value={oppPriority}
                  onChange={(e) => setOppPriority(e.target.value as any)}
                >
                  <option value="" disabled>Select…</option>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="call-screen-opp-notes">
              <label htmlFor="oppNotes" className="muted">Opportunity notes</label>
              <textarea
                id="oppNotes"
                rows={3}
                className="gg-field"
                value={oppNotes}
                onChange={(e) => setOppNotes(e.target.value)}
                placeholder="Context, commitment, next steps…"
              />
            </div>
          </div>
        )}

        <div className="row call-screen-save-row">
          <button
            className="press-card call-screen-back-link"
            onClick={() => { router.replace(`/dials/${resolvedParams.listId}/${idx + 1}`); router.refresh(); }}
            type="button"
          >
            Skip
          </button>

          <button
            className="press-card call-screen-back-link"
            onClick={saveAndNext}
            disabled={!result}
            title={result ? '' : 'Select a call result first'}
            type="button"
          >
            Save & Next
          </button>
        </div>
      </div>
    </div>
  );
}
