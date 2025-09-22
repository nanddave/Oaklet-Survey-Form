interface DropdownQuestionProps {
  questionId: string;
  question: string;
  options: string[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

export const DropdownQuestion = ({ 
  questionId,
  options, 
  value, 
  onChange, 
  placeholder = "Select your state of residence",
  required = false 
}: DropdownQuestionProps) => {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className="form-group">
      <div className="dropdown">
        <select
          id={questionId}
          name={questionId}
          value={value || ''}
          onChange={handleChange}
          required={required}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
