interface RadioQuestionProps {
  questionId: string;
  question: string;
  options: string[];
  value?: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export const RadioQuestion = ({ 
  questionId,
  options, 
  value, 
  onChange, 
  required = false 
}: RadioQuestionProps) => {
  const handleChange = (selectedValue: string) => {
    onChange(selectedValue);
  };

  return (
    <div className="form-group">
      <div className="radio-group">
        {options.map((option, index) => {
          const optionId = `${questionId}_${index}`;
          const isSelected = value === option;
          
          return (
            <div key={optionId} className="radio-option">
              <input
                type="radio"
                id={optionId}
                name={questionId}
                value={option}
                checked={isSelected}
                onChange={() => handleChange(option)}
                required={required}
              />
              <label htmlFor={optionId} className="radio-label">
                {option}
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
};
