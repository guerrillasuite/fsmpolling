'use client';

import { useState, useEffect } from 'react';
import { Phone, SkipForward, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
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
}

export default function Dialer({ listId }: DialerProps) {
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

  // Call state
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'in-survey' | 'completed'>('idle');
  const [callResult, setCallResult] = useState<string>('');
  const [callNotes, setCallNotes] = useState('');

  const loadContacts = async () => {
    try {
      const res = await fetch(`/api/dials/list/${listId}/contacts`);
      const data = await res.json();
      setContacts(data.contacts || []);
      if (data.contacts?.length > 0) {
        setCurrentContact(data.contacts[0]);
        if (data.survey_id) {
          await loadSurvey(data.survey_id);
        }
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, [listId]);

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
    setCallStatus('calling');
    setAnswers({});
    setCurrentQuestionIndex(0);
    setCallResult('');
    setCallNotes('');
    setOtherText('');
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
    } else {
      setCallStatus('completed');
    }
  };

  const saveCall = async (result: string) => {
    if (!currentContact) return;

    try {
      await fetch(`/api/dials/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: currentContact.id,
          listId,
          surveyId: survey?.id,
          result,
          notes: callNotes,
          answers: callStatus === 'completed' ? answers : undefined
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
      </div>

      {/* Call Status */}
      {callStatus === 'idle' && (
        <button onClick={startCall} className="dialer-start-btn">
          <Phone size={20} />
          Start Call
        </button>
      )}

      {/* Survey Questions */}
      {(callStatus === 'calling' || callStatus === 'in-survey') && currentQuestion && (
        <div className="dialer-question-card">
          <div className="dialer-question-progress">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
          <h3 className="dialer-question-text">
            {currentQuestion.question_text}
          </h3>

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
        </div>
      )}

      {/* Call Complete */}
      {callStatus === 'completed' && (
        <div className="dialer-result-container">
          <h3 className="dialer-result-title">Call Result</h3>
          <div className="dialer-result-grid">
            {['Completed', 'No Answer', 'Busy', 'Wrong Number', 'Do Not Call'].map((result) => (
              <button
                key={result}
                onClick={() => setCallResult(result)}
                className={`dialer-result-btn ${callResult === result ? 'selected' : ''}`}
              >
                {result}
              </button>
            ))}
          </div>

          <textarea
            placeholder="Notes (optional)"
            value={callNotes}
            onChange={(e) => setCallNotes(e.target.value)}
            className="dialer-notes-textarea"
          />

          <button
            onClick={() => saveCall(callResult)}
            disabled={!callResult}
            className={`dialer-save-btn ${callResult ? 'enabled' : 'disabled'}`}
          >
            Save & Next Contact
          </button>
        </div>
      )}

      {/* Quick Actions */}
      {callStatus !== 'idle' && callStatus !== 'completed' && (
        <button onClick={() => saveCall('Skipped')} className="dialer-skip-btn">
          <SkipForward size={16} />
          Skip Contact
        </button>
      )}
    </div>
  );
}
