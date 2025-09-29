interface YesNoQuestionProps {
  questionId: string;
  question: string;
  subtitle?: string;
  value?: string;
  onChange: (value: string) => void;
  required?: boolean;
  conditionalFields?: {
    showIf: { questionId: string; answer: string };
    fieldType: 'textarea' | 'text';
    placeholder?: string;
  };
  conditionalValue?: string;
  onConditionalChange?: (value: string) => void;
}

const YES_NO_OPTIONS = ['Yes', 'No'];

export const YesNoQuestion = ({ 
  questionId,
  subtitle,
  value, 
  onChange, 
  required = false,
  conditionalFields,
  conditionalValue,
  onConditionalChange
}: YesNoQuestionProps) => {
  const handleChange = (selectedValue: string) => {
    onChange(selectedValue);
  };

  const showConditionalField = conditionalFields && value === conditionalFields.showIf.answer;

  return (
    <div className="form-group">
      {subtitle && (
        <p className="question-subtitle">{subtitle}</p>
      )}
      <div className="yesno-group">
        {YES_NO_OPTIONS.map((option, index) => {
          const optionId = `${questionId}_${index}`;
          const isSelected = value === option;
          
          return (
            <div key={optionId} className="yesno-option">
              <input
                type="radio"
                id={optionId}
                name={questionId}
                value={option}
                checked={isSelected}
                onChange={() => handleChange(option)}
                required={required}
              />
              <label htmlFor={optionId} className="yesno-label">
                {option}
              </label>
            </div>
          );
        })}
      </div>
      
      {showConditionalField && (
        <div className="conditional-field">
          {conditionalFields.fieldType === 'textarea' ? (
            <textarea
              id={`${questionId}_conditional`}
              name={`${questionId}_conditional`}
              value={conditionalValue || ''}
              onChange={(e) => onConditionalChange?.(e.target.value)}
              placeholder={conditionalFields.placeholder || 'Please describe...'}
              rows={3}
              className="conditional-textarea"
              required={true}
            />
          ) : (
            <input
              type="text"
              id={`${questionId}_conditional`}
              name={`${questionId}_conditional`}
              value={conditionalValue || ''}
              onChange={(e) => onConditionalChange?.(e.target.value)}
              placeholder={conditionalFields.placeholder || 'Please specify...'}
              className="conditional-text"
              required={true}
            />
          )}
        </div>
      )}
    </div>
  );
};
