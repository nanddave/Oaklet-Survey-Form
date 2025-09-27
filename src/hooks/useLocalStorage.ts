import { useState, useEffect } from 'react';

interface StoredSubmission {
  id: string;
  timestamp: string;
  responses: Record<string, string>; // Changed to match SurveyState.responses
  appointment?: {
    appointmentId?: string;
    appointmentDate?: string;
    appointmentTime?: string;
    sessionType?: string;
  };
}

export const useLocalStorage = () => {
  const [submissions, setSubmissions] = useState<StoredSubmission[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('surveySubmissions');
    if (stored) {
      try {
        setSubmissions(JSON.parse(stored));
      } catch (error) {
        console.error('Error parsing stored submissions:', error);
        localStorage.removeItem('surveySubmissions');
      }
    }
  }, []);

  const addSubmission = (responses: Record<string, string>, appointment?: StoredSubmission['appointment']) => {
    const newSubmission: StoredSubmission = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      responses,
      appointment
    };

    const updated = [...submissions, newSubmission];
    setSubmissions(updated);
    localStorage.setItem('surveySubmissions', JSON.stringify(updated));
    
    
    return newSubmission;
  };

  const exportAllToCSV = () => {
    if (submissions.length === 0) {
      alert('No submissions to export');
      return;
    }

    const csvContent = submissions.map(sub => ({
      SubmissionID: sub.id,
      Date: sub.timestamp,
      Q1: sub.responses.q1,
      Q2: sub.responses.q2 || '',
      Q3: sub.responses.q3,
      Q4: sub.responses.q4 || '',
      Q5: sub.responses.q5,
      Location: sub.responses.location,
      Email: sub.responses.email,
      AppointmentDate: sub.appointment?.appointmentDate || '',
      AppointmentTime: sub.appointment?.appointmentTime || '',
      AppointmentID: sub.appointment?.appointmentId || '',
      SessionType: sub.appointment?.sessionType || ''
    }));

    // Convert to CSV format
    const headers = Object.keys(csvContent[0]);
    const csvRows = [
      headers.join(','),
      ...csvContent.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row];
          // Escape commas and quotes in CSV
          return typeof value === 'string' && value.includes(',') 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(',')
      )
    ];

    const csv = csvRows.join('\n');
    
    // Create and download file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `survey-submissions-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearAllSubmissions = () => {
    if (confirm('Are you sure you want to clear all stored submissions?')) {
      setSubmissions([]);
      localStorage.removeItem('surveySubmissions');
    }
  };

  const clearCache = () => {
    setSubmissions([]);
    localStorage.removeItem('surveySubmissions');
    localStorage.clear(); // Clear all localStorage
  };

  useEffect(() => {
    if (import.meta.env.DEV) {
      const lastClear = localStorage.getItem('lastCacheClear');
      const now = Date.now();
      const oneDayAgo = 24 * 60 * 60 * 1000;
      
      if (!lastClear || (now - parseInt(lastClear)) > oneDayAgo) {
        clearCache();
        localStorage.setItem('lastCacheClear', now.toString());
      }
    }
  }, []);

  return {
    submissions,
    addSubmission,
    exportAllToCSV,
    clearAllSubmissions,
    clearCache,
    totalSubmissions: submissions.length
  };
};
