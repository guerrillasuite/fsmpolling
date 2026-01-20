// app/consent/page.tsx
'use client';

import { useState } from 'react';

export default function ConsentPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    state: '',
    cellNumber: '',
    email: '',
    consent: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.state || !formData.cellNumber) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!formData.consent) {
      setError('You must consent to receive SMS messages to continue.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/consent/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to submit consent');
      }

      setIsComplete(true);
    } catch (err) {
      console.error('Error submitting consent:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // US States for dropdown
  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

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
            Your consent has been recorded. You'll receive SMS messages about the LNC Chair poll when it launches.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="survey-main-container">
      <div className="survey-main-inner">
        {/* Header Card */}
        <div className="survey-header-card" style={{ textAlign: 'center' }}>
          <h1 className="survey-title" style={{ fontSize: '28px', marginBottom: '12px' }}>
            Let Your Voice Be Heard
          </h1>
          <p style={{ color: 'rgb(var(--text-muted))', fontSize: '16px', margin: 0 }}>
            Take part in the next official poll about the LNC Chair race
          </p>
        </div>

        {/* Form Card */}
        <div className="survey-question-card">
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gap: '20px' }}>
              {/* First Name */}
              <div>
                <label className="contact-verification-label">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="contact-verification-input-normal"
                  placeholder="Enter your first name"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="contact-verification-label">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="contact-verification-input-normal"
                  placeholder="Enter your last name"
                />
              </div>

              {/* State */}
              <div>
                <label className="contact-verification-label">
                  State *
                </label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  required
                  className="contact-verification-input-normal"
                  style={{ appearance: 'auto' }}
                >
                  <option value="">Select your state</option>
                  {states.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>

              {/* Cell Number */}
              <div>
                <label className="contact-verification-label">
                  Cell Number *
                </label>
                <input
                  type="tel"
                  name="cellNumber"
                  value={formData.cellNumber}
                  onChange={handleChange}
                  required
                  className="contact-verification-input-normal"
                  placeholder="(555) 123-4567"
                />
              </div>

              {/* Email (Optional) */}
              <div>
                <label className="contact-verification-label-small">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="contact-verification-input-normal"
                  placeholder="your.email@example.com"
                />
              </div>

              {/* Consent Checkbox */}
              <div style={{
                padding: '16px',
                background: 'rgba(var(--card-gradient-end), 0.6)',
                borderRadius: '12px',
                border: '1px solid rgb(var(--border-light))'
              }}>
                <label style={{ display: 'flex', alignItems: 'start', gap: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="consent"
                    checked={formData.consent}
                    onChange={handleChange}
                    required
                    style={{
                      width: '20px',
                      height: '20px',
                      marginTop: '2px',
                      accentColor: 'rgb(var(--gold-primary))',
                      cursor: 'pointer'
                    }}
                  />
                  <span style={{
                    color: 'rgb(var(--text-bright))',
                    fontSize: '14px',
                    lineHeight: '1.5'
                  }}>
                    I consent to receive text messages about ONE official internal poll regarding the LNC Chair race.
                    Standard messaging rates may apply. I can opt out at any time.
                  </span>
                </label>
              </div>

              {/* Error Message */}
              {error && (
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(var(--error-600), 0.15)',
                  border: '1px solid rgb(var(--error-600))',
                  borderRadius: '8px',
                  color: 'rgb(var(--text-bright))'
                }}>
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !formData.consent}
                className="survey-nav-btn-submit"
                style={{ width: '100%' }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
