// app/components/survey/ContactVerification.tsx
'use client';

import { useState, useEffect } from 'react';

interface ContactVerificationProps {
  questionId: string;
  contactId: string;
  onAnswer: (data: ContactData) => void;
  initialData?: ContactData;
  existingContact?: ExistingContactData;
}

interface ContactData {
  name_correct?: boolean;
  name?: string;
  email_correct?: boolean;
  email?: string;
  phone_correct?: boolean;
  phone?: string;
  phone_type?: 'cell' | 'landline';
  additional_phone?: string;
  additional_phone_type?: 'cell' | 'landline';
  address?: string;
}

interface ExistingContactData {
  name?: string;
  email?: string;
  phone?: string;
}

export function ContactVerification({
  questionId,
  contactId,
  onAnswer,
  initialData = {},
  existingContact = {}
}: ContactVerificationProps) {
  const [formData, setFormData] = useState<ContactData>(initialData);

  useEffect(() => {
    // Auto-save on any change - only call if formData has actual values
    if (Object.keys(formData).length > 0) {
      onAnswer(formData);
    }
  }, [formData, onAnswer]);

  const handleChange = (field: keyof ContactData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const hasExistingName = !!existingContact.name;
  const hasExistingEmail = !!existingContact.email;
  const hasExistingPhone = !!existingContact.phone;

  return (
    <div className="contact-verification-container">

      {/* Name Verification */}
      {hasExistingName ? (
        <div>
          <label className="contact-verification-label">
            Is this your correct name?
          </label>
          <div className="contact-verification-display">
            {existingContact.name}
          </div>
          <div className="contact-verification-radio-group">
            <label className={`contact-verification-radio-label ${formData.name_correct === true ? 'selected' : ''}`}>
              <input
                type="radio"
                name={`${questionId}-name`}
                checked={formData.name_correct === true}
                onChange={() => handleChange('name_correct', true)}
                className="contact-verification-radio"
              />
              <span className="contact-verification-radio-text">Yes, correct</span>
            </label>
            <label className={`contact-verification-radio-label ${formData.name_correct === false ? 'selected' : ''}`}>
              <input
                type="radio"
                name={`${questionId}-name`}
                checked={formData.name_correct === false}
                onChange={() => handleChange('name_correct', false)}
                className="contact-verification-radio"
              />
              <span className="contact-verification-radio-text">No, incorrect</span>
            </label>
          </div>
          {formData.name_correct === false && (
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter correct name"
              className="contact-verification-input"
            />
          )}
        </div>
      ) : (
        <div>
          <label className="contact-verification-label-small">
            Full Name (Optional)
          </label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Enter your full name"
            className="contact-verification-input-normal"
          />
        </div>
      )}

      {/* Email Verification */}
      {hasExistingEmail ? (
        <div>
          <label className="contact-verification-label">
            Is this your correct email?
          </label>
          <div className="contact-verification-display">
            {existingContact.email}
          </div>
          <div className="contact-verification-radio-group">
            <label className={`contact-verification-radio-label ${formData.email_correct === true ? 'selected' : ''}`}>
              <input
                type="radio"
                name={`${questionId}-email`}
                checked={formData.email_correct === true}
                onChange={() => handleChange('email_correct', true)}
                className="contact-verification-radio"
              />
              <span className="contact-verification-radio-text">Yes, correct</span>
            </label>
            <label className={`contact-verification-radio-label ${formData.email_correct === false ? 'selected' : ''}`}>
              <input
                type="radio"
                name={`${questionId}-email`}
                checked={formData.email_correct === false}
                onChange={() => handleChange('email_correct', false)}
                className="contact-verification-radio"
              />
              <span className="contact-verification-radio-text">No, incorrect</span>
            </label>
          </div>
          {formData.email_correct === false && (
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="Enter correct email"
              className="contact-verification-input"
            />
          )}
        </div>
      ) : (
        <div>
          <label className="contact-verification-label-small">
            Email Address (Optional)
          </label>
          <input
            type="email"
            value={formData.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="your.email@example.com"
            className="contact-verification-input-normal"
          />
        </div>
      )}

      {/* Phone Verification */}
      {hasExistingPhone ? (
        <div>
          <label className="contact-verification-label">
            Is this your correct phone number?
          </label>
          <div className="contact-verification-display">
            {existingContact.phone}
          </div>
          <div className="contact-verification-radio-group">
            <label className={`contact-verification-radio-label ${formData.phone_correct === true ? 'selected' : ''}`}>
              <input
                type="radio"
                name={`${questionId}-phone`}
                checked={formData.phone_correct === true}
                onChange={() => handleChange('phone_correct', true)}
                className="contact-verification-radio"
              />
              <span className="contact-verification-radio-text">Yes, correct</span>
            </label>
            <label className={`contact-verification-radio-label ${formData.phone_correct === false ? 'selected' : ''}`}>
              <input
                type="radio"
                name={`${questionId}-phone`}
                checked={formData.phone_correct === false}
                onChange={() => handleChange('phone_correct', false)}
                className="contact-verification-radio"
              />
              <span className="contact-verification-radio-text">No, incorrect</span>
            </label>
          </div>

          {/* Phone Type Selection */}
          {formData.phone_correct === true && (
            <div style={{ marginBottom: '12px' }}>
              <label className="contact-verification-label-small">
                Is this number a cell phone or landline?
              </label>
              <div className="contact-verification-radio-group">
                <label className={`contact-verification-radio-label ${formData.phone_type === 'cell' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name={`${questionId}-phone-type`}
                    checked={formData.phone_type === 'cell'}
                    onChange={() => handleChange('phone_type', 'cell')}
                    className="contact-verification-radio"
                  />
                  <span className="contact-verification-radio-text">Cell</span>
                </label>
                <label className={`contact-verification-radio-label ${formData.phone_type === 'landline' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name={`${questionId}-phone-type`}
                    checked={formData.phone_type === 'landline'}
                    onChange={() => handleChange('phone_type', 'landline')}
                    className="contact-verification-radio"
                  />
                  <span className="contact-verification-radio-text">Landline</span>
                </label>
              </div>
            </div>
          )}

          {formData.phone_correct === false && (
            <input
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="Enter correct phone number"
              className="contact-verification-input"
              style={{ marginBottom: '12px' }}
            />
          )}

          {/* Additional Phone */}
          <div style={{ marginTop: '16px' }}>
            <label className="contact-verification-label-small">
              Additional Phone Number (Optional)
            </label>
            <input
              type="tel"
              value={formData.additional_phone || ''}
              onChange={(e) => handleChange('additional_phone', e.target.value)}
              placeholder="(555) 123-4567"
              className="contact-verification-input-normal"
              style={{ marginBottom: '12px' }}
            />
            {formData.additional_phone && (
              <div className="contact-verification-radio-group">
                <label className={`contact-verification-radio-label ${formData.additional_phone_type === 'cell' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name={`${questionId}-additional-phone-type`}
                    checked={formData.additional_phone_type === 'cell'}
                    onChange={() => handleChange('additional_phone_type', 'cell')}
                    className="contact-verification-radio"
                  />
                  <span className="contact-verification-radio-text">Cell</span>
                </label>
                <label className={`contact-verification-radio-label ${formData.additional_phone_type === 'landline' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name={`${questionId}-additional-phone-type`}
                    checked={formData.additional_phone_type === 'landline'}
                    onChange={() => handleChange('additional_phone_type', 'landline')}
                    className="contact-verification-radio"
                  />
                  <span className="contact-verification-radio-text">Landline</span>
                </label>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          <label className="contact-verification-label-small">
            Phone Number (Optional)
          </label>
          <input
            type="tel"
            value={formData.phone || ''}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="(555) 123-4567"
            className="contact-verification-input-normal"
          />
        </div>
      )}

      {/* Mailing Address - Always optional */}
      <div>
        <label className="contact-verification-label-small">
          Mailing Address (Optional)
        </label>
        <textarea
          value={formData.address || ''}
          onChange={(e) => handleChange('address', e.target.value)}
          placeholder="123 Main St, City, State ZIP"
          rows={3}
          className="contact-verification-textarea"
        />
      </div>
    </div>
  );
}
