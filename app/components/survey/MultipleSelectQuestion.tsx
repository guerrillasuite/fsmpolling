// app/components/survey/MultipleSelectQuestion.tsx
'use client';

import { useState, useEffect } from 'react';

interface MultipleSelectQuestionProps {
  questionId: string;
  options: string[];
  maxSelections?: number;
  hasOther?: boolean;
  required?: boolean;
  onAnswer: (values: string[], otherText?: string, positions?: number[]) => void;
  initialValues?: string[];
  initialOtherText?: string;
  randomize?: boolean;
}

export function MultipleSelectQuestion({
  questionId,
  options,
  maxSelections = 3,
  hasOther = false,
  required = true,
  onAnswer,
  initialValues = [],
  initialOtherText = '',
  randomize = false
}: MultipleSelectQuestionProps) {
  const [selectedValues, setSelectedValues] = useState<Set<string>>(new Set(initialValues));
  const [otherText, setOtherText] = useState(initialOtherText);
  const [displayOptions, setDisplayOptions] = useState<string[]>([]);
  const [optionPositions, setOptionPositions] = useState<Map<string, number>>(new Map());

  const shuffleArrayWithPositions = (array: string[]) => {
    const shuffled = array.map((item, idx) => ({ item, originalIndex: idx }));
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const posMap = new Map<string, number>();
    shuffled.forEach(({ item, originalIndex }) => {
      posMap.set(item, originalIndex);
    });

    setOptionPositions(posMap);
    return shuffled.map(s => s.item);
  };

  useEffect(() => {
    if (randomize) {
      setDisplayOptions(shuffleArrayWithPositions(options));
    } else {
      const posMap = new Map<string, number>();
      options.forEach((opt, idx) => posMap.set(opt, idx));
      setOptionPositions(posMap);
      setDisplayOptions(options);
    }
  }, [options, randomize]);

  const handleToggle = (value: string) => {
    const newSelected = new Set(selectedValues);

    if (newSelected.has(value)) {
      newSelected.delete(value);
    } else {
      if (newSelected.size >= maxSelections) {
        return; // Max selections reached
      }
      newSelected.add(value);
    }

    setSelectedValues(newSelected);

    const values = Array.from(newSelected);
    const positions = values.map(v => optionPositions.get(v) ?? -1);

    if (newSelected.has('other')) {
      if (otherText.trim()) {
        onAnswer(values, otherText, positions);
      }
    } else {
      setOtherText('');
      onAnswer(values, undefined, positions);
    }
  };

  const handleOtherTextChange = (text: string) => {
    setOtherText(text);
    if (selectedValues.has('other') && text.trim()) {
      const values = Array.from(selectedValues);
      const positions = values.map(v => optionPositions.get(v) ?? -1);
      onAnswer(values, text, positions);
    }
  };

  return (
    <div className="multiselect-container">
      <p className="multiselect-hint">
        Select up to {maxSelections} options
      </p>

      {displayOptions.map((option) => {
        const isSelected = selectedValues.has(option);
        const isDisabled = selectedValues.size >= maxSelections && !isSelected;
        const labelClass = `multiselect-option-label ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`;

        return (
          <label key={option} className={labelClass}>
            <input
              type="checkbox"
              name={questionId}
              value={option}
              checked={isSelected}
              onChange={() => handleToggle(option)}
              disabled={isDisabled}
              className="multiselect-checkbox"
            />
            <span className={`multiselect-option-text ${isSelected ? 'selected' : ''}`}>
              {option}
            </span>
          </label>
        );
      })}

      {hasOther && (
        <div className="multiselect-other-container">
          <label className={`multiselect-option-label ${selectedValues.has('other') ? 'selected' : ''} ${selectedValues.size >= maxSelections && !selectedValues.has('other') ? 'disabled' : ''}`}>
            <input
              type="checkbox"
              name={questionId}
              value="other"
              checked={selectedValues.has('other')}
              onChange={() => handleToggle('other')}
              disabled={selectedValues.size >= maxSelections && !selectedValues.has('other')}
              className="multiselect-checkbox"
            />
            <span className={`multiselect-option-text ${selectedValues.has('other') ? 'selected' : ''}`}>
              Other
            </span>
          </label>

          {selectedValues.has('other') && (
            <input
              type="text"
              value={otherText}
              onChange={(e) => handleOtherTextChange(e.target.value)}
              placeholder="Please specify..."
              autoFocus
              className="multiselect-other-input"
            />
          )}
        </div>
      )}
    </div>
  );
}
