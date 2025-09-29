interface LikertQuestionProps {
  questionId: string;
  question: string;
  subtitle?: string;
  value?: string;
  onChange: (value: string) => void;
  required?: boolean;
}

const LIKERT_OPTIONS = [
  'Very Often',
  'Often',
  'Sometimes',
  'Rarely',
  'Never'
];

export const LikertQuestion = ({ 
  questionId,
  subtitle,
  value, 
  onChange, 
  required = false 
}: LikertQuestionProps) => {
  const handleChange = (selectedValue: string) => {
    onChange(selectedValue);
  };

  return (
    <div className="form-group">
      {subtitle && (
        <p className="question-subtitle">{subtitle}</p>
      )}
      <div className="likert-group">
        {LIKERT_OPTIONS.map((option, index) => {
          const optionId = `${questionId}_${index}`;
          const isSelected = value === option;
          
          return (
            <div key={optionId} className="likert-option">
              <input
                type="radio"
                id={optionId}
                name={questionId}
                value={option}
                checked={isSelected}
                onChange={() => handleChange(option)}
                required={required}
              />
              <label htmlFor={optionId} className="likert-label">
                {option}
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
};
