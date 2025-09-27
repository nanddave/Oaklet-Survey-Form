# Survey Form Backend Configuration

## Environment Variables

### Required Configuration

```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here

# DynamoDB Tables
PATIENTS_TABLE=Oaklet_Nest_Patients
APPOINTMENTS_TABLE=Oaklet_Nest_Appointments
QUESTIONNAIRE_RESPONSES_TABLE=Oaklet_Nest_Questionnaire_Responses
AUDIT_TABLE=Oaklet_Nest_AuditTrail

# Oaklet Nest Configuration
OAKLET_NEST_URL=http://localhost:3001
DEFAULT_ORGANIZATION_ID=your_org_id_here
DEFAULT_SESSION_TYPE=Initial Consultation

# Default Client Data (for pre-registration)
DEFAULT_CLIENT_FIRST_NAME=Survey
DEFAULT_CLIENT_LAST_NAME=User
DEFAULT_CLIENT_PHONE=
DEFAULT_CLIENT_DOB=
DEFAULT_CLIENT_STREET=
DEFAULT_CLIENT_CITY=
DEFAULT_CLIENT_ZIP=

# Widget Configuration
SURVEY_WIDGET_URL=http://localhost:5174
```

### Optional Configuration

```bash
# Survey Configuration
SURVEY_RATE_LIMIT_PER_HOUR=5
SURVEY_RATE_LIMIT_PER_DAY=10
SURVEY_SUBMISSION_TIMEOUT=30000
SURVEY_AUTO_ADVANCE_TIMEOUT=300

# Feature Flags
FEATURE_DUPLICATE_PREVENTION=true
FEATURE_RATE_LIMITING=true
FEATURE_SURVEY_CACHING=true

# Messages
SURVEY_EMAIL_EXISTS_MESSAGE=This email already has an appointment. Please use a different email.
SURVEY_SUBMISSION_EXISTS_MESSAGE=This submission has already been processed.
SURVEY_GENERIC_ERROR_MESSAGE=An error occurred. Please try again.
SURVEY_RATE_LIMIT_MESSAGE=Too many submissions. Please try again later.
SURVEY_SUCCESS_MESSAGE=Survey completed and appointment scheduled successfully!
SURVEY_NEXT_STEPS=Check your email for appointment confirmation,Complete your profile information before the appointment,An invoice will be sent within 24 hours

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174

# Encryption
ENCRYPTION_KEY=your_encryption_key_here
```

## Testing Configuration

### Development Testing
1. Set `NODE_ENV=development`
2. Enable all feature flags
3. Use local DynamoDB or test AWS account
4. Set rate limits to low values for testing

### Production Configuration
1. Set `NODE_ENV=production`
2. Use production AWS credentials
3. Set appropriate rate limits
4. Configure proper CORS origins
5. Use strong encryption keys

## Feature Flags

- `FEATURE_DUPLICATE_PREVENTION`: Enables email uniqueness checking
- `FEATURE_RATE_LIMITING`: Enables rate limiting middleware
- `FEATURE_SURVEY_CACHING`: Enables survey response caching

## Rate Limiting

- Per hour limit: `SURVEY_RATE_LIMIT_PER_HOUR` (default: 5)
- Per day limit: `SURVEY_RATE_LIMIT_PER_DAY` (default: 10)
- Email check limit: 10 per minute (hardcoded)

## Error Handling

All errors are mapped to user-friendly messages with appropriate HTTP status codes and retry actions.
