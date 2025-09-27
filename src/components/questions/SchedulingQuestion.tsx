import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import { format, addDays } from 'date-fns';
import axios from 'axios';
import { config } from '../../config/environment';
import 'react-calendar/dist/Calendar.css';

interface SchedulingQuestionProps {
  questionId: string;
  value?: string;
  onChange: (value: string) => void;
  required?: boolean;
  organizationId?: string;
}

// Real availability data from Oaklet-Nest API
interface AvailabilityData {
  [date: string]: string[];
}

export const SchedulingQuestion = ({ 
  value, 
  onChange,
  organizationId = config.organization.defaultId
}: SchedulingQuestionProps) => {
  console.log('🔧 SchedulingQuestion Debug:', { organizationId });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<AvailabilityData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch availability from Oaklet-Nest API
  const fetchAvailability = async (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Don't fetch if we already have data for this date
    if (availableSlots[dateStr]) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${config.api.baseUrl}/api/survey/availability`, {
        params: {
          date: dateStr,
          organizationId: organizationId
        }
      });
      
      if (response.data.success) {
        setAvailableSlots(prev => ({
          ...prev,
          [dateStr]: response.data.availableSlots || []
        }));
        setError(null); // Clear any previous errors
      } else {
        setError(`Failed to fetch availability for ${dateStr}`);
      }
    } catch (err) {
      console.error('Error fetching availability:', err);
      setError(`Unable to load available times for ${dateStr}`);
      // Clear cached data for this date on error
      setAvailableSlots(prev => {
        const updated = { ...prev };
        delete updated[dateStr];
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  // Load availability for next 7 days on component mount (optimized)
  useEffect(() => {
    const today = new Date();
    for (let i = 1; i <= 7; i++) {
      const date = addDays(today, i);
      fetchAvailability(date);
    }
  }, [organizationId]);

  const handleDateChange = (value: any) => {
    const date = value as Date;
    if (date && date instanceof Date) {
      setSelectedDate(date);
      setSelectedTime(''); // Reset time when date changes
    }
  };

  const handleTimeSelect = (time: string) => {
    if (selectedDate) {
      setSelectedTime(time);
      // Set the appointment value for display but don't auto-book
      const appointmentValue = `${format(selectedDate, 'yyyy-MM-dd')}T${timeTo24Hour(time)}:00Z`;
      onChange(appointmentValue);
    }
  };

  // Helper function to convert time to 24-hour format
  const timeTo24Hour = (time: string): string => {
    const [timePart, period] = time.split(' ');
    const [hours, minutes] = timePart.split(':');
    let hour24 = parseInt(hours);
    
    if (period === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (period === 'AM' && hour24 === 12) {
      hour24 = 0;
    }
    
    return `${hour24.toString().padStart(2, '0')}:${minutes}`;
  };

  const getAvailableTimes = (date: Date): string[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return availableSlots[dateStr] || [];
  };

  const tileDisabled = ({ date }: { date: Date }) => {
    // Disable past dates and dates with no available slots
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) return true;
    
    const availableTimes = getAvailableTimes(date);
    return availableTimes.length === 0;
  };

  const tileClassName = ({ date }: { date: Date }) => {
    const availableTimes = getAvailableTimes(date);
    if (availableTimes.length > 0) {
      return 'available-date';
    }
    return null;
  };

  const selectedDateTimes = selectedDate ? getAvailableTimes(selectedDate) : [];

  return (
    <div className="form-group">
      <div className="scheduling-container">
        {error && (
          <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
            {error}
          </div>
        )}
        
        <div className="calendar-section">
          <h3>Select a Date</h3>
          {loading && (
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              Loading available times...
            </div>
          )}
          <Calendar
            onChange={handleDateChange}
            value={selectedDate}
            tileDisabled={tileDisabled}
            tileClassName={tileClassName}
            minDate={new Date()}
            maxDate={addDays(new Date(), 7)}
          />
        </div>
        
        {selectedDate && selectedDateTimes.length > 0 && (
          <div className="time-slots-section">
            <h3>Available Times for {format(selectedDate, 'MMMM d, yyyy')}</h3>
            <div className="time-slots">
              {selectedDateTimes.map((time) => (
                <button
                  key={time}
                  type="button"
                  className={`time-slot ${selectedTime === time ? 'selected' : ''}`}
                  onClick={() => handleTimeSelect(time)}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {selectedDate && selectedDateTimes.length === 0 && (
          <div className="no-times-message">
            <p>No available times for this date. Please select another date.</p>
          </div>
        )}
        
        {value && selectedDate && selectedTime && (
          <div className="selected-appointment">
            <p><strong>Selected:</strong> {format(selectedDate, 'EEEE, MMMM d, yyyy')} at {selectedTime}</p>
          </div>
        )}
      </div>
    </div>
  );
};
