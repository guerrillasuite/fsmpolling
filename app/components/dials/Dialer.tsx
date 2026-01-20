'use client';

import { useState, useEffect } from 'react';
import { Phone, SkipForward, CheckCircle2, ArrowLeft } from 'lucide-react';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  status: string;
}

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  options: string[] | null;
  required: boolean;
  order_index: number;
}

interface DialerProps {
  listId: string;
  surveyId?: string;
}

export default function Dialer({ listId, surveyId }: DialerProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [currentContact, setCurrentContact] = useState<Contact | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Survey state
  const [survey, setSurvey] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { value: string; text?: string }>>({});
  const [otherText, setOtherText] = useState('');
  const [multiSelectValues, setMultiSelectValues] = useState<string[]>([]);

  // Contact verification state
  const [editedContact, setEditedContact] = useState<{
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
  } | null>(null);

  // Call state - NEW FLOW: idle -> selecting_result -> (if Connected) -> in_survey -> completed
  const [callStatus, setCallStatus] = useState<'idle' | 'selecting_result' | 'in_survey' | 'completed'>('idle');
  const [callResult, setCallResult] = useState<string>('');
  const [callNotes, setCallNotes] = useState('');

  const loadContacts = async () => {
    try {
      const res = await fetch(`/api/dials/lists/${listId}/contacts`);
      const data = await res.json();
      setContacts(data.contacts || []);
      if (data.contacts?.length > 0) {
        setCurrentContact(data.contacts[0]);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
    // Load survey if provided
    if (surveyId && surveyId !== 'null') {
      loadSurvey(surveyId);
    }
  }, [listId, surveyId]);

  const loadSurvey = async (surveyId: string) => {
    try {
      const res = await fetch(`/api/survey/${surveyId}`);
      const data = await res.json();
      setSurvey(data.survey);
      setQuestions(data.questions || []);
    } catch (error) {
      console.error('Error loading survey:', error);
    }
  };

  const startCall = () => {
    // Start by asking for call result
    setCallStatus('selecting_result');
    setAnswers({});
    setCurrentQuestionIndex(0);
    setCallResult('');
    setCallNotes('');
    setOtherText('');
    setMultiSelectValues([]);
    setEditedContact(currentContact ? {
      first_name: currentContact.first_name,
      last_name: currentContact.last_name,
      phone: currentContact.phone || '',
      email: currentContact.email || ''
    } : null);
  };

  const handleCallResult = (result: string) => {
    setCallResult(result);

    // If connected AND there's a survey, go to survey
    if (result === 'Connected' && survey && questions.length > 0) {
      setCallStatus('in_survey');
    } else {
      // Otherwise, skip to completed (save without survey)
      setCallStatus('completed');
    }
  };

  const answerQuestion = (value: string, isOther = false) => {
    const currentQuestion = questions[currentQuestionIndex];
    setAnswers({
      ...answers,
      [currentQuestion.id]: {
        value: isOther ? 'other' : value,
        text: isOther ? otherText : undefined
      }
    });

    // Move to next question or complete
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setOtherText('');
      setMultiSelectValues([]);
    } else {
      setCallStatus('completed');
    }
  };

  const answerMultiSelect = () => {
    const currentQuestion = questions[currentQuestionIndex];
    setAnswers({
      ...answers,
      [currentQuestion.id]: {
        value: JSON.stringify(multiSelectValues),
        text: otherText || undefined
      }
    });

    // Move to next question or complete
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setOtherText('');
      setMultiSelectValues([]);
    } else {
      setCallStatus('completed');
    }
  };

  const answerContactVerification = () => {
    const currentQuestion = questions[currentQuestionIndex];
    setAnswers({
      ...answers,
      [currentQuestion.id]: {
        value: JSON.stringify(editedContact),
      }
    });

    // Move to next question or complete
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setCallStatus('completed');
    }
  };

  const toggleMultiSelect = (option: string) => {
    if (multiSelectValues.includes(option)) {
      setMultiSelectValues(multiSelectValues.filter(v => v !== option));
    } else {
      setMultiSelectValues([...multiSelectValues, option]);
    }
  };

  const goBackFromCallResult = () => {
    setCallStatus('idle');
    setCallResult('');
  };

  const goBackInSurvey = () => {
    if (currentQuestionIndex > 0) {
      // Go to previous question
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setOtherText('');
      setMultiSelectValues([]);
    } else {
      // Go back to call result selection
      setCallStatus('selecting_result');
      setAnswers({});
    }
  };

  const goBackFromCompleted = () => {
    if (callResult === 'Connected' && survey && questions.length > 0) {
      // Go back to last survey question
      setCallStatus('in_survey');
      setCurrentQuestionIndex(questions.length - 1);
    } else {
      // Go back to call result selection
      setCallStatus('selecting_result');
    }
  };

  const saveCall = async () => {
    if (!currentContact) return;

    try {
      await fetch(`/api/dials/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: currentContact.id,
          listId,
          surveyId: survey?.id,
          result: callResult,
          notes: callNotes,
          answers: callResult === 'Connected' ? answers : undefined
        })
      });

      // Move to next contact
      nextContact();
    } catch (error) {
      console.error('Error saving call:', error);
    }
  };

  const nextContact = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < contacts.length) {
      setCurrentIndex(nextIndex);
      setCurrentContact(contacts[nextIndex]);
      setCallStatus('idle');
      setAnswers({});
      setCurrentQuestionIndex(0);
      setCallNotes('');
      setCallResult('');
      setEditedContact(null);
    } else {
      setCurrentContact(null);
    }
  };

  if (loading) {
    return <div className="dialer-loading">Loading...</div>;
  }

  if (!currentContact) {
    return (
      <div className="dialer-complete">
        <CheckCircle2 size={48} className="dialer-complete-icon" />
        <h2 className="dialer-complete-title">All Done!</h2>
        <p className="dialer-complete-message">You've completed this dial list.</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="dialer-container">
      {/* Contact Info */}
      <div className="dialer-contact-card">
        <div className="dialer-contact-progress">
          Contact {currentIndex + 1} of {contacts.length}
        </div>
        <h2 className="dialer-contact-name">
          {currentContact.first_name} {currentContact.last_name}
        </h2>
        <a href={`tel:${currentContact.phone}`} className="dialer-contact-phone">
          {currentContact.phone}
        </a>
        {currentContact.email && (
          <a href={`mailto:${currentContact.email}`} className="dialer-contact-email">
            {currentContact.email}
          </a>
        )}
      </div>

      {/* Start Call Button */}
      {callStatus === 'idle' && (
        <>
          <a
            href={`tel:${currentContact.phone}`}
            onClick={startCall}
            className="dialer-start-btn"
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Phone size={20} />
            Start Call
          </a>
          <button onClick={nextContact} className="dialer-skip-btn">
            <SkipForward size={16} />
            Skip Contact
          </button>
        </>
      )}

      {/* Call Result Selection - FIRST */}
      {callStatus === 'selecting_result' && (
        <div className="dialer-result-container">
          <button onClick={goBackFromCallResult} className="dialer-back-btn">
            <ArrowLeft size={16} />
            Back
          </button>
          <h3 className="dialer-result-title">Call Result</h3>
          <div className="dialer-result-grid">
            {['Connected', 'No Answer', 'Left Message', 'Busy', 'Wrong Number', 'Do Not Call'].map((result) => (
              <button
                key={result}
                onClick={() => handleCallResult(result)}
                className="dialer-result-btn"
              >
                {result}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Survey Questions - ONLY if Connected */}
      {callStatus === 'in_survey' && currentQuestion && (
        <div className="dialer-question-card">
          <button onClick={goBackInSurvey} className="dialer-back-btn">
            <ArrowLeft size={16} />
            Back
          </button>
          <div className="dialer-question-progress">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
          <h3 className="dialer-question-text">
            {currentQuestion.question_text}
          </h3>

          {/* Contact verification with editable fields */}
          {currentQuestion.question_type === 'contact_verification' && editedContact && (
            <div className="dialer-options-container">
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label className="contact-verification-label">First Name</label>
                  <input
                    type="text"
                    value={editedContact.first_name}
                    onChange={(e) => setEditedContact({...editedContact, first_name: e.target.value})}
                    className="contact-verification-input-normal"
                  />
                </div>
                <div>
                  <label className="contact-verification-label">Last Name</label>
                  <input
                    type="text"
                    value={editedContact.last_name}
                    onChange={(e) => setEditedContact({...editedContact, last_name: e.target.value})}
                    className="contact-verification-input-normal"
                  />
                </div>
                <div>
                  <label className="contact-verification-label">Phone</label>
                  <input
                    type="tel"
                    value={editedContact.phone}
                    onChange={(e) => setEditedContact({...editedContact, phone: e.target.value})}
                    className="contact-verification-input-normal"
                  />
                </div>
                <div>
                  <label className="contact-verification-label-small">Email (Optional)</label>
                  <input
                    type="email"
                    value={editedContact.email}
                    onChange={(e) => setEditedContact({...editedContact, email: e.target.value})}
                    className="contact-verification-input-normal"
                  />
                </div>
              </div>
              <button
                onClick={answerContactVerification}
                className="dialer-option-btn"
                style={{ width: '100%', marginTop: '16px' }}
              >
                Continue
              </button>
            </div>
          )}

          {/* Multi-select question */}
          {currentQuestion.question_type === 'multiple_select_with_other' && (
            <div className="dialer-options-container">
              <p style={{ color: 'rgb(var(--text-muted))', fontSize: '14px', marginBottom: '12px' }}>
                Select up to 3 options:
              </p>
              {currentQuestion.options?.map((option) => (
                <button
                  key={option}
                  onClick={() => toggleMultiSelect(option)}
                  className={`dialer-option-btn ${multiSelectValues.includes(option) ? 'selected' : ''}`}
                  style={{
                    background: multiSelectValues.includes(option)
                      ? 'rgba(var(--gold-primary), 0.2)'
                      : undefined,
                    borderColor: multiSelectValues.includes(option)
                      ? 'rgb(var(--gold-primary))'
                      : undefined
                  }}
                >
                  {multiSelectValues.includes(option) && '✓ '}
                  {option}
                </button>
              ))}

              <div style={{ marginTop: '12px' }}>
                <input
                  type="text"
                  placeholder="Other (specify)"
                  value={otherText}
                  onChange={(e) => setOtherText(e.target.value)}
                  className="dialer-other-input"
                />
              </div>

              <button
                onClick={answerMultiSelect}
                disabled={multiSelectValues.length === 0 && !otherText.trim()}
                className={`dialer-save-btn ${(multiSelectValues.length > 0 || otherText.trim()) ? 'enabled' : 'disabled'}`}
                style={{ marginTop: '16px' }}
              >
                Continue ({multiSelectValues.length} selected)
              </button>
            </div>
          )}

          {/* Regular single-choice questions */}
          {currentQuestion.question_type !== 'contact_verification' &&
           currentQuestion.question_type !== 'multiple_select_with_other' && (
            <div className="dialer-options-container">
              {currentQuestion.options?.map((option) => (
                <button
                  key={option}
                  onClick={() => answerQuestion(option)}
                  className="dialer-option-btn"
                >
                  {option}
                </button>
              ))}

              {currentQuestion.question_type.includes('other') && (
                <div>
                  <input
                    type="text"
                    placeholder="Other (specify)"
                    value={otherText}
                    onChange={(e) => setOtherText(e.target.value)}
                    className="dialer-other-input"
                  />
                  <button
                    onClick={() => answerQuestion('other', true)}
                    disabled={!otherText.trim()}
                    className={`dialer-other-submit ${otherText.trim() ? 'enabled' : 'disabled'}`}
                  >
                    Submit Other
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Final Notes - After survey or if not connected */}
      {callStatus === 'completed' && (
        <div className="dialer-result-container">
          <button onClick={goBackFromCompleted} className="dialer-back-btn">
            <ArrowLeft size={16} />
            Back
          </button>
          <h3 className="dialer-result-title">Call Notes</h3>
          <p style={{ color: 'rgb(var(--text-muted))', marginBottom: '16px' }}>
            Result: <strong style={{ color: 'rgb(var(--text-bright))' }}>{callResult}</strong>
          </p>

          <textarea
            placeholder="Add notes about this call (optional)"
            value={callNotes}
            onChange={(e) => setCallNotes(e.target.value)}
            className="dialer-notes-textarea"
          />

          <button
            onClick={saveCall}
            className="dialer-save-btn enabled"
          >
            Save & Next Contact
          </button>
        </div>
      )}

      {/* Skip Contact (only during survey) */}
      {callStatus === 'in_survey' && (
        <button onClick={() => {
          setCallStatus('completed');
          setCallResult('Skipped');
        }} className="dialer-skip-btn">
          <SkipForward size={16} />
          Skip Survey
        </button>
      )}
    </div>
  );
}
