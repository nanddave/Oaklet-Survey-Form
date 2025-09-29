import { SurveyQuestion } from '../types/survey';

export const surveyQuestions: SurveyQuestion[] = [
  // Section B - Past Psychiatric & Medical History
  {
    id: 'psychiatric_diagnosis',
    type: 'yesno',
    question: 'Have you ever been diagnosed with a psychiatric condition?',
    required: true,
    conditionalFields: {
      showIf: { questionId: 'psychiatric_diagnosis', answer: 'Yes' },
      fieldType: 'textarea',
      placeholder: 'Please specify the condition(s)...'
    }
  },
  {
    id: 'medical_diagnosis',
    type: 'yesno',
    question: 'Have you ever been diagnosed with a medical condition?',
    required: true,
    conditionalFields: {
      showIf: { questionId: 'medical_diagnosis', answer: 'Yes' },
      fieldType: 'textarea',
      placeholder: 'Please specify the condition(s)...'
    }
  },
  {
    id: 'current_medications',
    type: 'textarea',
    question: 'What medications are you currently taking?',
    subtitle: 'Please list name, dose, and frequency for each medication.',
    required: true,
    placeholder: 'List all current medications with dosages and frequency...'
  },
  {
    id: 'psychiatric_hospitalizations',
    type: 'yesno',
    question: 'Have you ever been hospitalized for psychiatric reasons?',
    required: true,
    conditionalFields: {
      showIf: { questionId: 'psychiatric_hospitalizations', answer: 'Yes' },
      fieldType: 'textarea',
      placeholder: 'Please provide details about number of hospitalizations and reasons...'
    }
  },
  {
    id: 'family_psychiatric_history',
    type: 'yesno',
    question: 'Is there a family history of psychiatric disorders?',
    required: true,
    conditionalFields: {
      showIf: { questionId: 'family_psychiatric_history', answer: 'Yes' },
      fieldType: 'textarea',
      placeholder: 'Please specify which family members and conditions...'
    }
  },
  {
    id: 'family_adhd_history',
    type: 'radio',
    question: 'Is there a family history of ADHD?',
    options: ['Yes', 'No', 'Unknown'],
    required: true
  },

  // Section C - Childhood History
  {
    id: 'academic_difficulties',
    type: 'yesno',
    question: 'Did you have academic difficulties in school?',
    required: true,
    conditionalFields: {
      showIf: { questionId: 'academic_difficulties', answer: 'Yes' },
      fieldType: 'textarea',
      placeholder: 'Please describe the difficulties...'
    }
  },
  {
    id: 'hyperactive_impulsive',
    type: 'yesno',
    question: 'Were you described as hyperactive or impulsive as a child?',
    required: true
  },
  {
    id: 'social_difficulties',
    type: 'yesno',
    question: 'Did you have trouble making or keeping friends?',
    required: true
  },
  {
    id: 'home_stress',
    type: 'yesno',
    question: 'Was there significant stress or instability at home?',
    required: true
  },
  {
    id: 'childhood_trauma',
    type: 'yesno',
    question: 'Do you have a history of trauma or abuse?',
    required: true,
    conditionalFields: {
      showIf: { questionId: 'childhood_trauma', answer: 'Yes' },
      fieldType: 'textarea',
      placeholder: 'Please describe (you can be as general or specific as you feel comfortable)...'
    }
  },

  // Section D - ADHD Symptoms (Conners-style)
  {
    id: 'careless_mistakes',
    type: 'likert',
    question: 'How often do you make careless mistakes in work or activities?',
    required: true
  },
  {
    id: 'sustaining_attention',
    type: 'likert',
    question: 'How often do you have difficulty sustaining attention?',
    required: true
  },
  {
    id: 'restless_fidgety',
    type: 'likert',
    question: 'How often do you feel restless or fidgety?',
    required: true
  },
  {
    id: 'interrupt_others',
    type: 'likert',
    question: 'How often do you interrupt others while they are speaking?',
    required: true
  },
  {
    id: 'procrastinate',
    type: 'likert',
    question: 'How often do you procrastinate on important tasks?',
    required: true
  },
  {
    id: 'lose_things',
    type: 'likert',
    question: 'How often do you lose things necessary for tasks or activities?',
    required: true
  },

  // Section E - ASRS v1.1 Screener
  {
    id: 'finish_details',
    type: 'likert',
    question: 'How often do you have trouble finishing the final details of a project?',
    required: true
  },
  {
    id: 'organize_tasks',
    type: 'likert',
    question: 'How often do you have difficulty organizing tasks?',
    required: true
  },
  {
    id: 'remember_appointments',
    type: 'likert',
    question: 'How often do you have problems remembering appointments or obligations?',
    required: true
  },
  {
    id: 'delay_starting',
    type: 'likert',
    question: 'How often do you delay starting tasks that require thought?',
    required: true
  },
  {
    id: 'fidget_sitting',
    type: 'likert',
    question: 'How often do you fidget or squirm when sitting for long periods?',
    required: true
  },
  {
    id: 'overly_active',
    type: 'likert',
    question: 'How often do you feel overly active or "driven by a motor"?',
    required: true
  },

  // Section F - Mood Screening (Rapid Mood Screener)
  {
    id: 'elevated_mood',
    type: 'yesno',
    question: 'Have you had periods of elevated or irritable mood lasting several days?',
    required: true
  },
  {
    id: 'increased_energy',
    type: 'yesno',
    question: 'Have you had periods of increased energy or activity noticed by others?',
    required: true
  },
  {
    id: 'less_sleep',
    type: 'yesno',
    question: 'Have you had periods where you needed less sleep than usual but still felt rested?',
    required: true
  },
  {
    id: 'more_talkative',
    type: 'yesno',
    question: 'Have you had periods of being more talkative or having racing thoughts?',
    required: true
  },
  {
    id: 'risky_behaviors',
    type: 'yesno',
    question: 'Have you engaged in risky behaviors (spending, sexual, etc.) during these periods?',
    required: true
  },
  {
    id: 'mood_problems',
    type: 'yesno',
    question: 'Did these periods cause problems at work, school, or in relationships?',
    required: true
  },

  // Section G - Anxiety Screening (GAD-7)
  {
    id: 'nervous_anxious',
    type: 'radio',
    question: 'Feeling nervous, anxious, or on edge',
    subtitle: 'Over the last 2 weeks, how often have you been bothered by:',
    options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
    required: true
  },
  {
    id: 'unable_control_worry',
    type: 'radio',
    question: 'Not being able to stop or control worrying',
    options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
    required: true
  },
  {
    id: 'worrying_too_much',
    type: 'radio',
    question: 'Worrying too much about different things',
    options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
    required: true
  },
  {
    id: 'trouble_relaxing',
    type: 'radio',
    question: 'Trouble relaxing',
    options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
    required: true
  },
  {
    id: 'restlessness',
    type: 'radio',
    question: 'Being so restless that it is hard to sit still',
    options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
    required: true
  },
  {
    id: 'irritability',
    type: 'radio',
    question: 'Becoming easily annoyed or irritable',
    options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
    required: true
  },
  {
    id: 'fear_awful',
    type: 'radio',
    question: 'Feeling afraid, as if something awful might happen',
    options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
    required: true
  },

  // Section H - Depression Screening (PHQ-9)
  {
    id: 'little_interest',
    type: 'radio',
    question: 'Little interest or pleasure in doing things',
    subtitle: 'Over the last 2 weeks, how often have you been bothered by:',
    options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
    required: true
  },
  {
    id: 'feeling_down',
    type: 'radio',
    question: 'Feeling down, depressed, or hopeless',
    options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
    required: true
  },
  {
    id: 'sleep_problems',
    type: 'radio',
    question: 'Trouble falling or staying asleep, or sleeping too much',
    options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
    required: true
  },
  {
    id: 'feeling_tired',
    type: 'radio',
    question: 'Feeling tired or having little energy',
    options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
    required: true
  },
  {
    id: 'appetite_problems',
    type: 'radio',
    question: 'Poor appetite or overeating',
    options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
    required: true
  },
  {
    id: 'feeling_bad_self',
    type: 'radio',
    question: 'Feeling bad about yourself - or that you are a failure or have let yourself or your family down',
    options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
    required: true
  },
  {
    id: 'trouble_concentrating',
    type: 'radio',
    question: 'Trouble concentrating on things, such as reading the newspaper or watching television',
    options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
    required: true
  },
  {
    id: 'psychomotor_changes',
    type: 'radio',
    question: 'Moving or speaking so slowly that other people could have noticed, or the opposite - being so fidgety or restless that you have been moving around a lot more than usual',
    options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
    required: true
  },
  {
    id: 'suicidal_thoughts',
    type: 'radio',
    question: 'Thoughts that you would be better off dead, or of hurting yourself',
    options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
    required: true
  },
  {
    id: 'anhedonia_expanded',
    type: 'yesno',
    question: 'In the past month, have you found it hard to enjoy things?',
    required: true,
    conditionalFields: {
      showIf: { questionId: 'anhedonia_expanded', answer: 'Yes' },
      fieldType: 'textarea',
      placeholder: 'Please describe what you have found difficult to enjoy...'
    }
  },

  // Section I - Childhood Trauma
  {
    id: 'home_stress_trauma',
    type: 'yesno',
    question: 'Was there significant stress, instability, or trauma at home?',
    required: true,
    conditionalFields: {
      showIf: { questionId: 'home_stress_trauma', answer: 'Yes' },
      fieldType: 'textarea',
      placeholder: 'Please describe...'
    }
  },
  {
    id: 'abuse_exposure',
    type: 'yesno',
    question: 'Were you exposed to physical, emotional, or sexual abuse?',
    required: true,
    conditionalFields: {
      showIf: { questionId: 'abuse_exposure', answer: 'Yes' },
      fieldType: 'textarea',
      placeholder: 'Please describe (you can be as general or specific as you feel comfortable)...'
    }
  },

  // Section J - Other Information
  {
    id: 'other_information',
    type: 'textarea',
    question: 'Is there anything else your clinician should know?',
    required: false,
    placeholder: 'Please share any additional information that might be helpful...'
  },

  // Keep existing contact and scheduling questions
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
