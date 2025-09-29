interface TextAreaQuestionProps {
  questionId: string;
  question: string;
  subtitle?: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
}

export const TextAreaQuestion = ({ 
  questionId,
  value, 
  onChange, 
  placeholder = 'Please provide details...',
  required = false,
  rows = 4
}: TextAreaQuestionProps) => {
  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className="form-group">
      <div className="textarea-group">
        <textarea
          id={questionId}
          name={questionId}
          value={value || ''}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          rows={rows}
          className="textarea-input"
        />
      </div>
    </div>
  );
};
