import { SurveyQuestion } from '../types/survey';

export const surveyQuestions: SurveyQuestion[] = [
  {
    id: 'q1',
    type: 'radio',
    question: 'Who are you answering on behalf of?',
    options: ['Me', 'Someone else'],
    required: true
  },
  {
    id: 'q2',
    type: 'radio',
    question: 'If you\'ve had any of these problems, how much have they made it harder to work, manage things at home, or get along with others?',
    subtitle: 'Answer should be based on the past two weeks.',
    options: [
      'Extremely difficult',
      'Very difficult', 
      'Somewhat difficult',
      'Not difficult at all'
    ],
    required: true,
    conditionalLogic: {
      showIf: { questionId: 'q1', answer: 'Me' }
    }
  },
  {
    id: 'q3',
    type: 'radio',
    question: 'How often do you have trouble concentrating on activities or tasks?',
    subtitle: 'Over the last 2 weeks.',
    options: [
      'Not at all',
      'Several days',
      'More than half the days',
      'Nearly every day'
    ],
    required: true
  },
  {
    id: 'q4',
    type: 'radio',
    question: 'How confident are you in managing your health care needs?',
    options: [
      'Very confident',
      'Somewhat confident',
      'Not very confident',
      'Not confident at all'
    ],
    required: true,
    conditionalLogic: {
      showIf: { questionId: 'q1', answer: 'Someone else' }
    }
  },
  {
    id: 'q5',
    type: 'radio',
    question: 'Are you currently taking any medication for ADHD or attention difficulties?',
    options: ['Yes', 'No', 'Not sure'],
    required: true
  },
  {
    id: 'location',
    type: 'dropdown',
    question: 'Which state do you live in?',
    subtitle: 'We\'ll connect you with a licensed ADHD specialist who can support you in your state.',
    options: [
      'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
      'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
      'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
      'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
      'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
      'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
      'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
      'Wisconsin', 'Wyoming'
    ],
    required: true
  },
  {
    id: 'contactInfo',
    type: 'contact',
    question: 'Please provide your contact information.',
    subtitle: 'Your provider needs your information saved so they can review your symptoms before your appointment.',
    required: true
  },
  {
    id: 'scheduling',
    type: 'scheduling',
    question: 'Schedule your consultation appointment.',
    subtitle: 'Select a convenient date and time for your consultation with one of our specialists.',
    required: true
  }
];
