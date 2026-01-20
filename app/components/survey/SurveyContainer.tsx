// app/components/survey/SurveyContainer.tsx
'use client';

import { useState, useEffect } from 'react';
import { MultipleChoiceQuestion } from './MultipleChoiceQuestion';
import { MultipleSelectQuestion } from './MultipleSelectQuestion';
import { ContactVerification } from './ContactVerification';

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  options: string[] | null;
  required: boolean;
  order_index: number;
}

interface Survey {
  id: string;
  title: string;
  description: string;
}

interface SurveyContainerProps {
  surveyId: string;
  contactId: string;
  randomizeOptions?: boolean;
}

export function SurveyContainer({ 
  surveyId, 
  contactId,
  randomizeOptions = false 
}: SurveyContainerProps) {
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, { value: string; text?: string }>>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchSurvey();
  }, [surveyId, contactId]);
  
  const fetchSurvey = async () => {
    try {
      // First check if this session is already completed
      const sessionCheck = await fetch('/api/survey/session-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crm_contact_id: contactId,
          survey_id: surveyId
        })
      });

      if (sessionCheck.ok) {
        const sessionData = await sessionCheck.json();
        if (sessionData.completed) {
          setIsComplete(true);
          setLoading(false);
          return;
        }
      }

      // Load survey questions
      const response = await fetch(`/api/survey/${surveyId}`);
      if (!response.ok) throw new Error('Failed to fetch survey');

      const data = await response.json();
      setSurvey(data.survey);
      setQuestions(data.questions);
    } catch (err) {
      setError('Failed to load survey. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const saveAnswer = async (questionId: string, value: string, text?: string, position?: number) => {
    try {
      const response = await fetch('/api/survey/response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crm_contact_id: contactId,
          survey_id: surveyId,
          question_id: questionId,
          answer_value: value,
          answer_text: text,
          original_position: position
        })
      });
      
      if (!response.ok) throw new Error('Failed to save answer');
      
      setAnswers(new Map(answers.set(questionId, { value, text })));
    } catch (err) {
      console.error('Error saving answer:', err);
      setError('Failed to save answer. Please try again.');
    }
  };
  
  const handleAnswer = async (value: string, text?: string, position?: number) => {
    const currentQuestion = questions[currentQuestionIndex];
    await saveAnswer(currentQuestion.id, value, text, position);
  };
  
  const handleMultiSelectAnswer = async (values: string[], text?: string, positions?: number[]) => {
    const currentQuestion = questions[currentQuestionIndex];
    const combinedValue = JSON.stringify(values);
    await saveAnswer(currentQuestion.id, combinedValue, text, positions?.[0]);
    
    setAnswers(new Map(answers.set(currentQuestion.id, { 
      value: combinedValue, 
      text 
    })));
  };
  
  const handleContactVerification = async (data: any) => {
    const currentQuestion = questions[currentQuestionIndex];
    const jsonData = JSON.stringify(data);
    await saveAnswer(currentQuestion.id, jsonData);
    
    setAnswers(new Map(answers.set(currentQuestion.id, { 
      value: jsonData
    })));
  };
  
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };
  
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/survey/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crm_contact_id: contactId,
          survey_id: surveyId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Survey submission failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          contactId,
          surveyId
        });
        throw new Error(errorData.error || 'Failed to submit survey');
      }

      setIsComplete(true);
    } catch (err) {
      console.error('Error submitting survey:', err);
      setError('Failed to submit survey. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="survey-loading-container">
        <div className="survey-loading-inner">
          <div className="survey-spinner" />
          <div className="survey-loading-text">
            Loading survey...
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="survey-error-container">
        <div className="survey-error-card">
          <div className="survey-error-icon">
            ⚠️
          </div>
          <h3 className="survey-error-title">
            Oops! Something went wrong
          </h3>
          <p className="survey-error-message">
            {error}
          </p>
        </div>
      </div>
    );
  }
  
  if (isComplete) {
    return (
      <div className="survey-error-container">
        <div className="survey-error-card">
          <div className="survey-success-icon">
            ✓
          </div>
          <h2 className="survey-success-title">
            Thank You!
          </h2>
          <p className="survey-success-message">
            Your response has been recorded successfully.
          </p>

          {/* FSM Promotional Section */}
          <div style={{
            marginTop: '32px',
            paddingTop: '24px',
            borderTop: '1px solid rgb(var(--border-600))',
            textAlign: 'center'
          }}>
            <p style={{
              marginBottom: '16px',
              fontSize: '16px',
              color: 'rgb(var(--text-200))'
            }}>
              Check out the recent shows from Free Speech Media Network!
            </p>
            <a
              href="https://freespeechmedia.live"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                transition: 'opacity 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.opacity = '0.7'}
              onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
            >
              <img
                src="/fsm-logo.png"
                alt="Free Speech Media Network"
                style={{
                  height: '64px',
                  width: 'auto'
                }}
              />
            </a>
          </div>
        </div>
      </div>
    );
  }
  
  if (!survey || questions.length === 0) {
    return (
      <div className="survey-error-container">
        <div className="survey-error-card">
          <div className="survey-info-icon">
            ℹ️
          </div>
          <h3 className="survey-error-title">
            Survey Not Found
          </h3>
          <p className="survey-error-message">
            This survey doesn't exist or is no longer available.
          </p>
        </div>
      </div>
    );
  }
  
  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers.get(currentQuestion.id);
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  
  // Can proceed if: answer exists OR question is not required
  const canProceed = currentAnswer || !currentQuestion.required;
  
  // Determine if this question should randomize (not Yes/No or numeric ranges)
  const shouldRandomize = randomizeOptions && !['lnc-chair-q2', 'lnc-chair-q6'].includes(currentQuestion.id);
  
  return (
    <div className="survey-main-container">
      <div className="survey-main-inner">

        {/* FSM Logo - Top Left */}
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          zIndex: 10
        }}>
          <img
            src="/fsm-logo.png"
            alt="Free Speech Media Network"
            style={{
              height: '48px',
              width: 'auto'
            }}
          />
        </div>

        {/* Header Card */}
        <div className="survey-header-card">
          <h1 className="survey-title">
            {survey.title}
          </h1>
        </div>

        {/* Progress Bar */}
        <div className="survey-progress-card">
          <div className="survey-progress-header">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="survey-progress-bg">
            <div className="survey-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Question Card */}
        <div className="survey-question-card">
          <h2 className="survey-question-title">
            {currentQuestion.question_text}
            {currentQuestion.required && (
              <span className="survey-question-required">*</span>
            )}
          </h2>
          
          {currentQuestion.question_type === 'multiple_choice_with_other' && (
            <MultipleChoiceQuestion
              questionId={currentQuestion.id}
              options={currentQuestion.options || []}
              hasOther={true}
              required={currentQuestion.required}
              onAnswer={handleAnswer}
              initialValue={currentAnswer?.value || ''}
              initialOtherText={currentAnswer?.text || ''}
              randomize={shouldRandomize}
            />
          )}
          
          {currentQuestion.question_type === 'multiple_choice' && (
            <MultipleChoiceQuestion
              questionId={currentQuestion.id}
              options={currentQuestion.options || []}
              hasOther={false}
              required={currentQuestion.required}
              onAnswer={handleAnswer}
              initialValue={currentAnswer?.value || ''}
              randomize={shouldRandomize}
            />
          )}
          
          {currentQuestion.question_type === 'multiple_select_with_other' && (
            <MultipleSelectQuestion
              questionId={currentQuestion.id}
              options={currentQuestion.options || []}
              maxSelections={3}
              hasOther={true}
              required={currentQuestion.required}
              onAnswer={handleMultiSelectAnswer}
              initialValues={currentAnswer?.value ? JSON.parse(currentAnswer.value) : []}
              initialOtherText={currentAnswer?.text || ''}
              randomize={shouldRandomize}
            />
          )}
          
          {currentQuestion.question_type === 'contact_verification' && (
            <ContactVerification
              questionId={currentQuestion.id}
              contactId={contactId}
              onAnswer={handleContactVerification}
              initialData={currentAnswer?.value ? JSON.parse(currentAnswer.value) : {}}
              existingContact={{
                name: 'John Smith',  // TODO: Fetch from CRM
                email: 'john.smith@example.com',  // TODO: Fetch from CRM
                phone: '(555) 123-4567'  // TODO: Fetch from CRM
              }}
            />
          )}
        </div>
        
        {/* Navigation */}
        <div className="survey-nav-container">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="survey-nav-btn"
          >
            ← Previous
          </button>

          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              disabled={!canProceed || isSubmitting}
              className="survey-nav-btn-submit"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Survey ✓'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canProceed}
              className="survey-nav-btn-primary"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}