'use client';

import { useState, useEffect } from 'react';

interface MultipleChoiceQuestionProps {
  questionId: string;
  options: string[];
  hasOther?: boolean;
  required?: boolean;
  onAnswer: (value: string, otherText?: string, position?: number) => void;
  initialValue?: string;
  initialOtherText?: string;
  randomize?: boolean;
}

export function MultipleChoiceQuestion({
  questionId,
  options,
  hasOther = false,
  required = true,
  onAnswer,
  initialValue = '',
  initialOtherText = '',
  randomize = false
}: MultipleChoiceQuestionProps) {
  const [selectedValue, setSelectedValue] = useState(initialValue);
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
    // Separate "Undecided" from other options if randomizing
    const undecidedOption = options.find(opt => opt.toLowerCase() === 'undecided');
    const regularOptions = options.filter(opt => opt.toLowerCase() !== 'undecided');

    if (randomize && undecidedOption) {
      // Randomize only the regular options (not "Undecided")
      const shuffled = regularOptions.map((item, idx) => ({ item, originalIndex: idx }));
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      const posMap = new Map<string, number>();
      shuffled.forEach(({ item, originalIndex }) => {
        posMap.set(item, originalIndex);
      });

      // Add undecided with its original position
      const undecidedIndex = options.indexOf(undecidedOption);
      posMap.set(undecidedOption, undecidedIndex);

      setOptionPositions(posMap);
      // Store undecided separately in display options (will be rendered separately)
      setDisplayOptions(shuffled.map(s => s.item));
    } else if (randomize) {
      setDisplayOptions(shuffleArrayWithPositions(regularOptions));
    } else {
      const posMap = new Map<string, number>();
      options.forEach((opt, idx) => posMap.set(opt, idx));
      setOptionPositions(posMap);
      setDisplayOptions(options);
    }
  }, [options, randomize]);

  const handleSelect = (value: string) => {
    setSelectedValue(value);
    const position = optionPositions.get(value) ?? -1;

    if (value === 'other') {
      if (otherText.trim()) {
        onAnswer(value, otherText, position);
      }
    } else {
      setOtherText('');
      onAnswer(value, undefined, position);
    }
  };

  const handleOtherTextChange = (text: string) => {
    setOtherText(text);
    if (selectedValue === 'other' && text.trim()) {
      const position = optionPositions.get('other') ?? -1;
      onAnswer('other', text, position);
    }
  };

  // Find undecided option to render separately
  const undecidedOption = options.find(opt => opt.toLowerCase() === 'undecided');
  const showUndecidedSeparately = randomize && undecidedOption;

  return (
    <div className="stack">
      {displayOptions.map((option) => (
        <label
          key={option}
          className={`survey-option ${selectedValue === option ? 'is-selected' : ''}`}
        >
          <input
            type="radio"
            name={questionId}
            value={option}
            checked={selectedValue === option}
            onChange={() => handleSelect(option)}
            required={required}
          />
          <span className="choice-label">{option}</span>
        </label>
      ))}

      {showUndecidedSeparately && (
        <label
          className={`survey-option ${selectedValue === undecidedOption ? 'is-selected' : ''}`}
        >
          <input
            type="radio"
            name={questionId}
            value={undecidedOption}
            checked={selectedValue === undecidedOption}
            onChange={() => handleSelect(undecidedOption)}
            required={required}
          />
          <span className="choice-label">{undecidedOption}</span>
        </label>
      )}

      {hasOther && (
        <div className="stack-sm">
          <label
            className={`survey-option ${selectedValue === 'other' ? 'is-selected' : ''}`}
          >
            <input
              type="radio"
              name={questionId}
              value="other"
              checked={selectedValue === 'other'}
              onChange={() => handleSelect('other')}
            />
            <span className="choice-label">Other</span>
          </label>

          {selectedValue === 'other' && (
            <input
              type="text"
              value={otherText}
              onChange={(e) => handleOtherTextChange(e.target.value)}
              placeholder="Please specify..."
              autoFocus
              className="input"
            />
          )}
        </div>
      )}
    </div>
  );
}
