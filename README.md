# Oaklet Survey Form

A comprehensive patient pre-registration survey form for the Oaklet healthcare platform.

## Overview

The Oaklet Survey Form allows patients to complete pre-registration questionnaires and schedule appointments before their visit. It integrates with the Oaklet-Nest backend to create patient records and appointments.

## Features

- **Patient Pre-registration**: Collect patient information, medical history, and preferences
- **Appointment Scheduling**: Integrated calendar with available time slots
- **Multi-step Form**: Progressive form with validation and error handling
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Validation**: Email availability checking and form validation
- **Integration**: Seamless integration with Oaklet-Nest backend

## Architecture

### Frontend
- **React + TypeScript**: Modern React application with TypeScript
- **Vite**: Fast build tool and development server
- **SCSS**: Styled components with SCSS
- **Date-fns**: Date handling and formatting

### Backend
- **Node.js + Express**: RESTful API server
- **TypeScript**: Type-safe backend code
- **AWS Integration**: DynamoDB for data storage
- **JWT Authentication**: Secure authentication with Oaklet-Nest

## Project Structure

```
Survey_form/
├── backend/                 # Backend API server
│   ├── src/
│   │   ├── controllers/     # API route handlers
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Express middleware
│   │   └── types/          # TypeScript type definitions
│   └── package.json
├── src/                    # Frontend React application
│   ├── components/         # React components
│   ├── services/          # API client services
│   ├── hooks/             # Custom React hooks
│   ├── types/             # TypeScript type definitions
│   └── styles/            # SCSS stylesheets
├── widget/                # Embeddable widget version
└── scripts/               # Utility scripts
```

## Environment Configuration

### Frontend Environment Variables
- `VITE_API_BASE_URL`: Backend API URL
- `VITE_DEFAULT_ORG_ID`: Default organization ID
- `VITE_SERVICE_TOKEN`: Service authentication token

### Backend Environment Variables
- `DEFAULT_ORGANIZATION_ID`: Default organization ID for appointments
- `DEFAULT_PRACTICE_ID`: Default practice ID for appointments
- `OAKLET_NEST_URL`: Oaklet-Nest API URL
- `AWS_REGION`: AWS region for DynamoDB
- `SURVEY_SUBMISSIONS_TABLE`: DynamoDB table name

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Access to Oaklet-Nest backend

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Survey_form
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   npm install
   
   # Install backend dependencies
   cd backend
   npm install
   cd ..
   ```

3. **Environment configuration**
   ```bash
   # Copy environment files
   cp .env.example .env
   cd backend
   cp .env.example .env
   ```

4. **Start development servers**
   ```bash
   # Start backend server (port 3002)
   cd backend
   npm run dev
   
   # Start frontend server (port 5173)
   npm run dev
   ```

## API Endpoints

### Backend API
- `POST /api/survey/submit` - Submit survey and create appointment
- `GET /api/survey/availability` - Get available appointment slots
- `GET /api/survey/check-email` - Check email availability
- `GET /api/survey/test` - Health check endpoint

## Integration with Oaklet-Nest

The Survey Form integrates with Oaklet-Nest through:

1. **Authentication**: Uses JWT tokens for secure communication
2. **Client Creation**: Creates patient records in Oaklet-Nest
3. **Appointment Scheduling**: Creates appointments in Oaklet-Nest calendar
4. **Data Synchronization**: Ensures data consistency across platforms

## Development

### Available Scripts

#### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

#### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Testing

```bash
# Run frontend tests
npm test

# Run backend tests
cd backend
npm test
```

## Deployment

### Frontend Deployment
The frontend can be deployed to any static hosting service:
- Vercel
- Netlify
- AWS S3 + CloudFront
- GitHub Pages

### Backend Deployment
The backend can be deployed to:
- AWS Lambda
- AWS ECS
- Heroku
- DigitalOcean App Platform

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Copyright (c) 2025 Oaklet. All rights reserved.

## Support

For support and questions, please contact the Oaklet development team.