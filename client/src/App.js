// client/src/App.js

// imports at the top obviously
import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { generatePrompt } from './config/aiPrompt';

function App() {
  // basic form fields - keeps track of what the user has selected
  const [date, setDate] = useState('');
  const [interests, setInterests] = useState([]); // array since they can pick multiple interests
  const [budget, setBudget] = useState('');

  // time range for the trip - default 9am to 6pm
  const [timeRange, setTimeRange] = useState([18, 36]); // Using 30-minute increments: 6AM = 12, 9AM = 18, 6PM = 36, Midnight = 48

  // children is an array of objects because we can have multiple kids
  // start with one empty child form by default
  const [children, setChildren] = useState([
    { age: '', preferences: '' }
  ]);

  // keeps track of any validation errors to show red boxes and messages
  const [errors, setErrors] = useState({});
  
  // controls whether we show the form or the results page
  // either show one of the other, not both at the same time
  const [showResults, setShowResults] = useState(false);

  // Loading states for user feedback
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');

  // holds the generated itinerary data once the form is submitted
  const [tripData, setTripData] = useState(null);

  // track which activities are completed
  const [completedActivities, setCompletedActivities] = useState(new Set());

  // track personal notes for activities
  const [activityNotes, setActivityNotes] = useState({});

  // Store fetched image URLs
  const [activityImages, setActivityImages] = useState({});
  const [imageLoading, setImageLoading] = useState(true);

  // custom date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const datePickerRef = useRef(null);

  // Handle click outside to close date picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
    };

    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDatePicker]);

  // custom date picker functions
  const formatDateDisplay = (dateString) => {
    if (!dateString) return 'Select a date';
    const date = new Date(dateString);
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    // Get the day of week (0 = Sunday, 6 = Saturday)
    const day = new Date(year, month, 1).getDay();
    // Convert to Monday = 0, Sunday = 6
    return day === 0 ? 6 : day - 1;
  };

  const handleDateSelect = (day) => {
    const selectedDate = new Date(currentYear, currentMonth, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Don't allow past dates
    if (selectedDate < today) return;
    
    const dateString = selectedDate.toISOString().split('T')[0];
    setDate(dateString);
    setShowDatePicker(false);
    
    // clear any error message
    if (errors.date) setErrors(prev => ({ ...prev, date: undefined }));
  };

  const navigateMonth = (direction) => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const today = new Date();
    const selectedDate = date ? new Date(date) : null;
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="calendar-day other-month"></div>
      );
    }
    
    // Add days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(currentYear, currentMonth, day);
      const isToday = currentDate.toDateString() === today.toDateString();
      const isSelected = selectedDate && currentDate.toDateString() === selectedDate.toDateString();
      const isPast = currentDate < today.setHours(0, 0, 0, 0);
      
      let className = 'calendar-day';
      if (isToday) className += ' today';
      if (isSelected) className += ' selected';
      if (isPast) className += ' past';
      
      days.push(
        <div
          key={day}
          className={className}
          onClick={() => handleDateSelect(day)}
        >
          {day}
        </div>
      );
    }
    
    return days;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Helper function to format time range display
  const formatTimeRange = (timeRange) => {
    const formatHour = (halfHourIndex) => {
      const totalMinutes = halfHourIndex * 30;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      
      if (hours === 0 || hours === 24) {
        return `12:${minutes.toString().padStart(2, '0')} AM`;
      } else if (hours < 12) {
        return `${hours}:${minutes.toString().padStart(2, '0')} AM`;
      } else if (hours === 12) {
        return `12:${minutes.toString().padStart(2, '0')} PM`;
      } else {
        return `${hours - 12}:${minutes.toString().padStart(2, '0')} PM`;
      }
    };
    
    return `${formatHour(timeRange[0])} - ${formatHour(timeRange[1])}`;
  };

  // adds another empty child form when user clicks the "add child" button
  const handleAddChild = () => {
    setChildren([...children, { age: '', preferences: '' }]);
  };

  // handles typing in the child form inputs (age and preferences)
  // needs the index to know which specific child is being updated
  const handleChildChange = (index, event) => {
    // make a copy of the children array so we don't mess with react state directly
    const newChildren = [...children];
    // update the specific field (age or preferences) for the specific child
    newChildren[index][event.target.name] = event.target.value;
    setChildren(newChildren);
    
    // clear any error message for this field as soon as user starts typing
    const errorKey = `child-${index}-${event.target.name}`;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: undefined }));
    }
  };

  // checks if all the form fields are properly filled out
  const validateForm = () => {
    const newErrors = {};

    // make sure they've picked a date and it's not in the past
    if (!date) {
      newErrors.date = 'Please select a date';
    } else if (new Date(date) < new Date().setHours(0,0,0,0)) {
      newErrors.date = 'Date cannot be in the past';
    }

    // check each child's age is valid
    children.forEach((child, index) => {
      if (!child.age) {
        newErrors[`child-${index}-age`] = 'Age is required';
      } else if (isNaN(child.age) || !Number.isInteger(Number(child.age)) || child.age < 0) {
        // catches text like "seven", decimals like "3.5", and negative numbers
        newErrors[`child-${index}-age`] = 'Age must be a whole number';
      } else if (child.age > 18) {
        newErrors[`child-${index}-age`] = 'Age must be 18 or under';
      }
    });

    // must pick at least one interest
    if (interests.length === 0) {
      newErrors.interests = 'Please select at least one interest';
    }

    // must pick a budget level
    if (!budget) {
      newErrors.budget = 'Please select a budget';
    }

    setErrors(newErrors);
    // return true if no errors found
    return Object.keys(newErrors).length === 0;
  };

  // handles form submission when user clicks "build my trip"
  const handleSubmit = async (e) => {
    e.preventDefault(); // stops the page from refreshing
    
    // don't do anything if the form has errors
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setLoadingStatus('Building your perfect day...');

    // package up all the form data to send to the server
    const formData = {
      date,
      children,
      interests,
      budget,
      timeRange, // include the time range
    };

    try {
      // send the data to our backend server
      const response = await fetch('http://localhost:3001/api/plan-trip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        
        setLoadingStatus('Gemini is cooking your itinerary...');
        // create an AI-powered itinerary based on what they selected
        const mockItinerary = await generateMockItinerary(formData);
        setTripData(mockItinerary);
        setShowResults(true); // switch to showing the results page
        setIsLoading(false);
      } else {
        setIsLoading(false);
        alert('Error planning trip. Please try again.');
      }
    } catch (error) {
      // catches network errors or if server is down
      console.error('Error:', error);
      setIsLoading(false);
      alert('Error connecting to server. Please try again.');
    }
  };

  // Helper function to format duration from decimal hours to "X hours Y mins" format
  const formatDuration = (duration) => {
    if (!duration) return '1 hour';
    
    // If it's already in the right format, return as is
    if (typeof duration === 'string' && (duration.includes('hour') || duration.includes('min'))) {
      return duration;
    }
    
    // Check if it's a decimal number (like "1.5" or "1.6666667")
    const decimalMatch = duration.toString().match(/^(\d+\.?\d*)\s*hours?$/);
    if (decimalMatch) {
      const totalHours = parseFloat(decimalMatch[1]);
      const hours = Math.floor(totalHours);
      const minutes = Math.round((totalHours - hours) * 60);
      
      if (hours === 0) {
        return `${minutes} mins`;
      } else if (minutes === 0) {
        return hours === 1 ? '1 hour' : `${hours} hours`;
      } else {
        const hourText = hours === 1 ? '1 hour' : `${hours} hours`;
        return `${hourText} ${minutes} mins`;
      }
    }
    
    return duration; // fallback to original if no match
  };

  // Calculate total walking time and breakdown from individual transport durations
  const calculateWalkingTimeBreakdown = (activities) => {
    const walkingSegments = [];
    let totalMinutes = 0;

    activities.forEach((activity, index) => {
      if (activity.transportToNext && index < activities.length - 1) {
        const transport = activity.transportToNext;
        
        // Only include walking segments
        if (transport.mode && transport.mode.toLowerCase().includes('walk')) {
          const durationStr = transport.duration || '';
          
          // Extract minutes from duration string (e.g. "15 minutes", "20 mins", "1 hour")
          const minutesMatch = durationStr.match(/(\d+)\s*(?:minute|min)/i);
          const hoursMatch = durationStr.match(/(\d+)\s*hour/i);
          
          let minutes = 0;
          if (minutesMatch) {
            minutes += parseInt(minutesMatch[1]);
          }
          if (hoursMatch) {
            minutes += parseInt(hoursMatch[1]) * 60;
          }
          
          if (minutes > 0) {
            const nextActivity = activities[index + 1];
            walkingSegments.push({
              from: activity.name,
              to: nextActivity.name,
              duration: transport.duration,
              minutes: minutes
            });
            totalMinutes += minutes;
          }
        }
      }
    });

    // Format total time
    let totalTimeStr = '';
    if (totalMinutes >= 60) {
      const hours = Math.floor(totalMinutes / 60);
      const remainingMinutes = totalMinutes % 60;
      if (remainingMinutes > 0) {
        totalTimeStr = `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minutes`;
      } else {
        totalTimeStr = `${hours} hour${hours > 1 ? 's' : ''}`;
      }
    } else if (totalMinutes > 0) {
      totalTimeStr = `${totalMinutes} minutes`;
    } else {
      totalTimeStr = 'No walking required';
    }

    return {
      totalWalkingTime: totalTimeStr,
      walkingBreakdown: walkingSegments
    };
  };

  // creates an AI-powered itinerary using Hugging Face
  const generateMockItinerary = async (formData, retryCount = 0) => {
    const maxRetries = 5;
    const retryDelay = 2000; // 2 seconds

    const prompt = generatePrompt(formData, formatTimeRange);

    try {

      const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response body:', errorText);
        
        if (response.status === 404) {
          throw new Error(`Model not found (404). The model might not be available or needs to be loaded. Response: ${errorText}`);
        } else if (response.status === 503) {
          // Handle 503 errors with automatic retry logic
          if (retryCount < maxRetries) {
            console.log(`Gemini API overloaded (503). Attempt ${retryCount + 1} of ${maxRetries + 1}. Retrying in ${retryDelay/1000} seconds...`);
            
            setLoadingStatus(`503 error. Retrying in 2 seconds... (Attempt ${retryCount + 1} of ${maxRetries + 1})`);
            
            // Wait for the retry delay
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            
            setLoadingStatus('Gemini is cooking your itinerary...');
            
            // Recursive call with incremented retry count
            return await generateMockItinerary(formData, retryCount + 1);
          } else {
            // Max retries reached, throw error to use fallback
            throw new Error(`Service unavailable (503). The model is overloaded after ${maxRetries + 1} attempts. Response: ${errorText}`);
          }
        } else {
          throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
        }
      }

      const data = await response.json();
      console.log('Gemini API Response:', data);
      
      // Extract the AI's response text from Gemini's response format
      const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'AI response received but no text found.';
      console.log('Extracted AI Text:', aiText);
      
      // Try to parse the JSON response from Gemini
      let parsedResponse = null;
      let activities = [];
      
      try {
        // Clean the response to extract JSON (remove markdown formatting if present)
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
          console.log('Parsed AI Response:', parsedResponse);
          
          // Extract activities from the structured response
          if (parsedResponse.activities && Array.isArray(parsedResponse.activities)) {
            activities = parsedResponse.activities.map((activity, index) => ({
              id: `activity-${Date.now()}-${index}`, // Add unique ID
              time: activity.time,
              title: activity.title,
              description: activity.description,
              duration: formatDuration(activity.duration) || '1 hour', // format duration properly
              budgetLevel: formData.budget,
              // Store additional details for potential future use
              location: activity.location,
              crowdLevel: activity.crowdLevel,
              costEstimate: activity.practicalInfo?.estimatedCost || activity.costEstimate,
              childEngagement: activity.practicalInfo?.childEngagement || activity.childEngagement,
              practicalTips: activity.practicalInfo?.accessibility || activity.practicalTips,
              transportToNext: activity.transportToNext
            }));
          }
        }
      } catch (parseError) {
        console.error('Failed to parse AI JSON response:', parseError);
      }
      
      // Fallback activities with TK prefix if parsing failed or no activities found
      if (activities.length === 0) {
        console.log('Using fallback activities due to parsing failure or empty response');
        let currentTime = formData.timeRange[0];
        
        // Add activities based on interests - these are fallback activities
        if (formData.interests.includes('Museums')) {
          activities.push({
            id: `fallback-museum-${Date.now()}`, // Add unique ID
            time: formatTimeRange([currentTime, currentTime]).split(' - ')[0],
            title: 'TK Natural History Museum',
            description: 'Explore dinosaurs and interactive exhibits',
            duration: '2 hours',
            budgetLevel: formData.budget,
            costEstimate: 'FREE'
          });
          currentTime += 4;
        }
        
        if (formData.interests.includes('Parks') && currentTime < formData.timeRange[1] - 3) {
          activities.push({
            id: `fallback-park-${Date.now()}`, // Add unique ID
            time: formatTimeRange([currentTime, currentTime]).split(' - ')[0],
            title: 'TK Hyde Park Adventure',
            description: 'Playground time and open space to run around',
            duration: '1.5 hours',
            budgetLevel: formData.budget,
            costEstimate: 'FREE'
          });
          currentTime += 3;
        }
        
        // Fallback activity if no others match
        if (activities.length === 0) {
          activities.push({
            id: `fallback-londoneye-${Date.now()}`, // Add unique ID
            time: formatTimeRange([formData.timeRange[0], formData.timeRange[0]]).split(' - ')[0],
            title: 'TK London Eye',
            description: 'Family-friendly observation wheel with amazing views',
            duration: '1 hour',
            budgetLevel: formData.budget,
            costEstimate: '£25'
          });
        }
      }
      
      // Calculate total estimated cost from individual activity costs
      const calculateTotalCost = (activities) => {
        let totalCost = 0;
        let hasCosts = false;
        
        activities.forEach(activity => {
          if (activity.costEstimate) {
            hasCosts = true;
            // Skip FREE activities
            if (activity.costEstimate.toUpperCase().includes('FREE')) {
              return;
            }
            
            // Try to extract numeric values from cost strings like "£25", "£15 per person", "£25 for family"
            const costMatches = activity.costEstimate.match(/£(\d+)/g);
            if (costMatches) {
              // Take the first/main cost mentioned
              const mainCost = parseInt(costMatches[0].replace('£', ''));
              totalCost += mainCost;
            }
          }
        });
        
        // Add estimated transport costs (rough estimate)
        const transportCost = 15; // Rough daily transport cost for a family
        totalCost += transportCost;
        
        return hasCosts && totalCost > 0 ? `£${totalCost}` : 'Cost estimates being calculated...';
      };
      
      // Calculate walking time from actual transport data
      const walkingData = calculateWalkingTimeBreakdown(activities);
      
      // Return data including the AI's structured response
      return {
        date: formData.date,
        children: formData.children,
        activities,
        totalDuration: formatTimeRange(formData.timeRange),
        timeRange: formData.timeRange,
        // Include the rich structured data from AI
        logistics: parsedResponse?.logistics ? {
          transportMethod: parsedResponse.logistics.transportAdvice,
          totalWalkingTime: walkingData.totalWalkingTime,
          walkingBreakdown: walkingData.walkingBreakdown,
          weatherBackup: parsedResponse.logistics.weatherContingency
        } : parsedResponse?.logistics,
        overallBudget: calculateTotalCost(activities), // calculate total from individual activity costs
        mealPlanning: parsedResponse?.mealPlan ? {
          breakfast: null,
          lunch: `${parsedResponse.mealPlan.lunch?.venue} (${parsedResponse.mealPlan.lunch?.time})`,
          snacks: `${parsedResponse.mealPlan.snacks?.suggestion} (${parsedResponse.mealPlan.snacks?.time})`,
          dietary: parsedResponse.mealPlan.lunch?.dietaryNotes
        } : parsedResponse?.mealPlanning,
        emergencyInfo: parsedResponse?.emergencyInfo,
        aiResponse: parsedResponse ? 
          `AI Planning Summary: ${parsedResponse.summary || 'Comprehensive itinerary generated successfully!'}` : 
          `Raw AI Response: "${aiText.substring(0, 500)}${aiText.length > 500 ? '...' : ''}"`
      };

    } catch (error) {
      console.error('AI Error:', error);
      
      setLoadingStatus('Using fallback recommendations...');
      
      // Fallback if AI fails - all with TK prefix
      return {
        date: formData.date,
        children: formData.children,
        activities: [
          {
            id: `fallback-error-${Date.now()}`, // Add unique ID
            time: formatTimeRange([formData.timeRange[0], formData.timeRange[0]]).split(' - ')[0],
            title: 'TK London Eye',
            description: 'Family-friendly observation wheel with amazing city views',
            duration: '1 hour',
            budgetLevel: formData.budget
          }
        ],
        totalDuration: formatTimeRange(formData.timeRange),
        timeRange: formData.timeRange,
        aiResponse: `AI Error: ${error.message}. Using fallback recommendations.`
      };
    }
  };

  // handles drag and drop reordering of activities
  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', index);
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Helper function to convert duration string to half-hour increments
  const durationToHalfHours = (duration) => {
    if (!duration) return 2; // default 1 hour
    
    // Parse strings like "2 hours", "1 hour 30 mins", "45 mins"
    const hourMatch = duration.match(/(\d+)\s*hours?/i);
    const minMatch = duration.match(/(\d+)\s*mins?/i);
    
    let totalMinutes = 0;
    if (hourMatch) totalMinutes += parseInt(hourMatch[1]) * 60;
    if (minMatch) totalMinutes += parseInt(minMatch[1]);
    
    // If no matches found, try to parse decimal hours like "1.5 hours"
    if (totalMinutes === 0) {
      const decimalMatch = duration.match(/(\d+\.?\d*)\s*hours?/i);
      if (decimalMatch) {
        totalMinutes = parseFloat(decimalMatch[1]) * 60;
      }
    }
    
    // Convert to half-hour increments (round up to nearest 30 minutes)
    return totalMinutes > 0 ? Math.ceil(totalMinutes / 30) : 2;
  };

  // Helper function to recalculate activity times after reordering
  const recalculateActivityTimes = (activities, startTimeIndex) => {
    let currentTime = startTimeIndex;
    
    return activities.map(activity => {
      const duration = durationToHalfHours(activity.duration);
      const startTime = currentTime;
      const endTime = currentTime + duration;
      
      // Format the new time range
      const newTimeRange = `${formatTimeRange([startTime, startTime]).split(' - ')[0]} - ${formatTimeRange([endTime, endTime]).split(' - ')[0]}`;
      
      currentTime = endTime; // Next activity starts when this one ends
      
      return {
        ...activity,
        time: newTimeRange
      };
    });
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    
    if (dragIndex === dropIndex) return;

    const newActivities = [...tripData.activities];
    const draggedItem = newActivities[dragIndex];
    
    // Remove dragged item and insert at new position
    newActivities.splice(dragIndex, 1);
    newActivities.splice(dropIndex, 0, draggedItem);
    
    // Recalculate times for all activities based on the trip's start time
    const startTimeIndex = tripData.timeRange ? tripData.timeRange[0] : 18; // default to 9 AM if not available
    const activitiesWithNewTimes = recalculateActivityTimes(newActivities, startTimeIndex);
    
    setTripData({
      ...tripData,
      activities: activitiesWithNewTimes
    });
  };

  // toggle activity completion
  const toggleActivityCompletion = (index) => {
    const newCompleted = new Set(completedActivities);
    if (newCompleted.has(index)) {
      newCompleted.delete(index);
    } else {
      newCompleted.add(index);
    }
    setCompletedActivities(newCompleted);
  };

  // add/update activity notes
  const updateActivityNote = (index, note) => {
    setActivityNotes({
      ...activityNotes,
      [index]: note
    });
  };

  // reset all trip data when going back to form
  const resetTripData = () => {
    setShowResults(false);
    setCompletedActivities(new Set());
    setActivityNotes({});
  };

  // handles clicking on interest buttons (museums, parks, etc.)
  const handleInterestClick = (interest) => {
    if (interests.includes(interest)) {
      // if already selected, remove it
      setInterests(interests.filter(i => i !== interest));
    } else {
      // if not selected, add it to the array
      setInterests([...interests, interest]);
    }
  };

  // Helper function to get place images from our backend
  const getPlaceImage = async (placeName, activityId) => {
    // Return cached image if available
    if (activityImages[activityId]) {
      return activityImages[activityId];
    }

    try {
      const response = await fetch('http://localhost:3001/api/get-place-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeName }),
      });

      if (response.ok) {
        const data = await response.json();
        // Cache the fetched image URL using activityId
        setActivityImages(prev => ({ ...prev, [activityId]: data.imageUrl }));
        return data.imageUrl;
      }
    } catch (error) {
      console.error('Error fetching image:', error);
    }
    
    // Return a default fallback image on error
    return 'https://www.google.com/imgres?q=image%20of%20london&imgurl=https%3A%2F%2Fmedia.istockphoto.com%2Fid%2F1294454411%2Fphoto%2Flondon-symbols-with-big-ben-double-decker-buses-and-red-phone-booth-in-england-uk.jpg%3Fs%3D612x612%26w%3D0%26k%3D20%26c%3DIX4_XZC-_P60cq9ZZbxw1CbL68hlv1L5-r_vSgEfx4k%3D&imgrefurl=https%3A%2F%2Fwww.istockphoto.com%2Fphotos%2Flondon&docid=YjeuaRCYMx_u2M&tbnid=Ea1vY2b3HI0FtM&vet=12ahUKEwiPs7v90YWPAxU2SkEAHRpGG1IQM3oECC8QAA..i&w=612&h=408&hcb=2&ved=2ahUKEwiPs7v90YWPAxU2SkEAHRpGG1IQM3oECC8QAA';
  };

  // Effect to pre-fetch images when trip data is available
  useEffect(() => {
    if (tripData && tripData.activities) {
      setImageLoading(true);
      const fetchAllImages = async () => {
        const imagePromises = tripData.activities.map((activity) => 
          getPlaceImage(activity.title, activity.id)
        );
        await Promise.all(imagePromises);
        setImageLoading(false);
      };
      fetchAllImages();
    }
  }, [tripData]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>PlayDay Trip Planner</h1>
        {!showResults && <p>Fill in the details below to plan your perfect day out in London with your children!</p>}
      </header>

      <main>
        {!showResults ? (
          // show the form if we haven't submitted yet
          <form className="itinerary-form" onSubmit={handleSubmit} noValidate>
            
            <div className="form-section">
              <label htmlFor="date-input">When would you like to go?</label>
              <div className="date-picker-container" ref={datePickerRef}>
                <div 
                  className={`custom-date-input ${errors.date ? 'error' : ''}`}
                  onClick={() => setShowDatePicker(!showDatePicker)}
                >
                  {formatDateDisplay(date)}
                </div>
                {showDatePicker && (
                  <div className="date-picker-dropdown">
                    <div className="calendar-header">
                      <button
                        type="button"
                        className="calendar-nav-button"
                        onClick={() => navigateMonth('prev')}
                      >
                        ‹
                      </button>
                      <div className="calendar-month-year">
                        {monthNames[currentMonth]} {currentYear}
                      </div>
                      <button
                        type="button"
                        className="calendar-nav-button"
                        onClick={() => navigateMonth('next')}
                      >
                        ›
                      </button>
                    </div>
                    <div className="calendar-grid">
                      {dayNames.map(day => (
                        <div key={day} className="calendar-day-header">
                          {day}
                        </div>
                      ))}
                      {renderCalendarDays()}
                    </div>
                  </div>
                )}
              </div>
              {errors.date && <span className="error-message">{errors.date}</span>}
            </div>

            <div className="form-section">
              <label>What time would you like to start and finish?</label>
              <div className="time-range-container">
                <div className="time-range-labels">
                  <span className="time-label start-time">
                    Start: {formatTimeRange([timeRange[0], timeRange[0]]).split(' - ')[0]}
                  </span>
                  <span className="time-label end-time">
                    End: {formatTimeRange([timeRange[1], timeRange[1]]).split(' - ')[0]}
                  </span>
                </div>
                <div className="time-slider-container">
                  <div className="time-slider-track">
                    <div 
                      className="time-slider-range"
                      style={{
                        left: `${(timeRange[0] - 12) / 36 * 100}%`,
                        width: `${(timeRange[1] - timeRange[0]) / 36 * 100}%`
                      }}
                    ></div>
                    <input
                      type="range"
                      min="12"
                      max="48"
                      step="1"
                      value={timeRange[0]}
                      onChange={(e) => {
                        const newStart = parseInt(e.target.value);
                        if (newStart < timeRange[1]) {
                          setTimeRange([newStart, timeRange[1]]);
                        }
                      }}
                      className="time-slider time-slider-start"
                    />
                    <input
                      type="range"
                      min="12"
                      max="48"
                      step="1"
                      value={timeRange[1]}
                      onChange={(e) => {
                        const newEnd = parseInt(e.target.value);
                        if (newEnd > timeRange[0]) {
                          setTimeRange([timeRange[0], newEnd]);
                        }
                      }}
                      className="time-slider time-slider-end"
                    />
                  </div>
                  <div className="time-markers">
                    {[12, 18, 24, 30, 36, 42, 48].map(halfHourIndex => {
                      const totalMinutes = halfHourIndex * 30;
                      const hours = Math.floor(totalMinutes / 60);
                      let label;
                      if (hours === 0 || hours === 24) label = '12AM';
                      else if (hours <= 12) label = `${hours}${hours === 12 ? 'PM' : 'AM'}`;
                      else label = `${hours - 12}PM`;
                      
                      return (
                        <div key={halfHourIndex} className="time-marker" style={{left: `${(halfHourIndex - 12) / 36 * 100}%`}}>
                          <span className="time-marker-label">
                            {label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="form-section">
              <label>Child Details</label>
              {/* loop through each child and create a form for them */}
              {children.map((child, index) => (
                <div className="child-form" key={index}>
                  <h4>Child {index + 1}</h4>
                  <input 
                    type="text" // using text instead of number to catch invalid input like "seven"
                    name="age" // this tells handleChildChange which field is being updated
                    placeholder="Age"
                    value={child.age}
                    onChange={(e) => handleChildChange(index, e)}
                    className={errors[`child-${index}-age`] ? 'error' : ''}
                  />
                  {errors[`child-${index}-age`] && (
                    <span className="error-message">{errors[`child-${index}-age`]}</span>
                  )}
                  <textarea 
                    name="preferences" // this tells handleChildChange which field is being updated
                    placeholder="Preferences (e.g., loves dinosaurs, requires a stroller)"
                    value={child.preferences}
                    onChange={(e) => handleChildChange(index, e)}
                  />
                </div>
              ))}
              {/* button to add more children */}
              <button type="button" className="add-child-button" onClick={handleAddChild}>
                + Add Another Child
              </button>
            </div>

            <div className="form-section">
              <label>What are you and your family interested in?</label>
              <div className="button-group">
                {/* create a button for each interest option */}
                {['🏛️ Museums & Learning', '🌳 Parks & Playgrounds', '🍽️ Great Food Spots', '💎 Hidden Gems', '🎨 Art & Creativity', '🎭 Shows & Entertainment', '🛒 Markets & Shopping', '🦁 Animals & Wildlife', '🚀 Adventure & Thrills', '🏰 History & Castles', '🎡 Theme Parks', '🚢 River & Boats', '🍰 Sweet Treats', '📚 Story Time & Books', '⚽ Sports & Activities'].map(interest => (
                  <button 
                    type="button" 
                    key={interest}
                    onClick={() => {
                      handleInterestClick(interest);
                      // clear error message when they select an interest
                      if (errors.interests) setErrors(prev => ({ ...prev, interests: undefined }));
                    }}
                    className={interests.includes(interest) ? 'selected' : ''}
                  >
                    {interest}
                  </button>
                ))}
              </div>
              {errors.interests && <span className="error-message">{errors.interests}</span>}
            </div>

            <div className="form-section">
              <label>What's your budget?</label>
              <div className="button-group">
                {/* create a button for each budget level */}
                {['£', '££', '£££', '££££'].map(b => (
                  <button 
                    type="button" 
                    key={b}
                    onClick={() => {
                      setBudget(b);
                      // clear error message when they select a budget
                      if (errors.budget) setErrors(prev => ({ ...prev, budget: undefined }));
                    }}
                    className={budget === b ? 'selected' : ''}
                  >
                    {b}
                  </button>
                ))}
              </div>
              {errors.budget && <span className="error-message">{errors.budget}</span>}
            </div>
            
            <button type="submit" className="submit-button" disabled={isLoading}>
              {isLoading ? loadingStatus : 'Build My Trip'}
            </button>

          </form>
        ) : (
          // show the results page after form submission
          <div className="results-container">
            <div className="results-header">
              <h2>Your Perfect PlayDay! 🎉</h2>
              <p>Here's your personalised itinerary for {new Date(tripData.date).toLocaleDateString()}</p>
              <button 
                className="back-button" 
                onClick={resetTripData} // go back to the form and reset data
              >
                ← Plan Another Trip
              </button>
            </div>

            <div className="trip-summary">
              <h3>Trip Summary</h3>
              <div className="summary-details">
                <p><strong>Date:</strong> {new Date(tripData.date).toLocaleDateString()}</p>
                <p><strong>Time Range:</strong> {formatTimeRange(tripData.timeRange)}</p>
                <p><strong>Children:</strong> {tripData.children.length} child{tripData.children.length > 1 ? 'ren' : ''}</p>
                <p><strong>Total Duration:</strong> {tripData.totalDuration}</p>
              </div>
            </div>

            {tripData.aiResponse && (
              <div className="ai-response">
                <h3>🤖 AI Recommendation</h3>
                <div className="ai-response-text">
                  {tripData.aiResponse}
                </div>
              </div>
            )}

            <div className="itinerary">
              <div className="itinerary-header">
                <h3>Your Itinerary</h3>
                <p className="itinerary-subtitle">Drag activities to reorder them • Click checkboxes to mark as complete</p>
              </div>
              
              <div className="activities-list">
                {/* create a card for each activity in the itinerary */}
                {tripData.activities.map((activity, index) => (
                  <div 
                    key={index} 
                    className={`activity-card ${completedActivities.has(index) ? 'completed' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                  >
                    <div className="activity-controls">
                      <div className="drag-handle">
                        <span className="drag-icon">⋮⋮</span>
                      </div>
                      <span className="activity-number">Activity {index + 1}</span>
                      <div className="activity-checkbox">
                        <input
                          type="checkbox"
                          checked={completedActivities.has(index)}
                          onChange={() => toggleActivityCompletion(index)}
                          className="activity-check"
                        />
                      </div>
                    </div>
                    
                    <div className="activity-time">
                      <span className="time">{activity.time}</span>
                      <span className="duration">Duration: {activity.duration}</span>
                    </div>
                    
                    <div className="activity-image">
                      {imageLoading ? (
                        <div className="image-placeholder">Loading...</div>
                      ) : (
                        <img 
                          src={activityImages[activity.id]} 
                          alt={activity.title}
                          className="place-image"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1520637836862-4d197d17c35a?w=400&h=250&fit=crop';
                          }}
                        />
                      )}
                    </div>

                    <div className="activity-map">
                      <img 
                        src={`https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(activity.title + ', London, UK')}&zoom=12&size=260x120&markers=color:red%7C${encodeURIComponent(activity.title + ', London, UK')}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`}
                        alt={`Map of ${activity.title}`}
                        className="static-map"
                        onError={(e) => {
                          console.log('Map failed to load for:', activity.title);
                          console.log('Full map URL:', e.target.src);
                          console.log('API Key exists:', !!process.env.REACT_APP_GOOGLE_MAPS_API_KEY);
                          
                          // Create a placeholder instead
                          e.target.style.display = 'none';
                          const placeholder = document.createElement('div');
                          placeholder.className = 'map-placeholder';
                          placeholder.innerHTML = `📍 ${activity.title}<br><small>Map unavailable</small>`;
                          e.target.parentElement.appendChild(placeholder);
                        }}
                        onLoad={() => {
                          console.log('Map loaded successfully for:', activity.title);
                        }}
                      />
                    </div>
                    
                    <div className="activity-details">
                      <h4>{activity.title}</h4>
                      <p>{activity.description}</p>
                      
                      {/* Enhanced details from AI */}
                      {activity.location && (
                        <div className="activity-location">
                          <strong>📍 Location: </strong> 
                          {typeof activity.location === 'string' ? (
                            activity.location
                          ) : (
                            <>
                              {activity.location.address}
                              {activity.location.nearestTube && (
                                <span className="tube-info"> • 🚇 {activity.location.nearestTube}</span>
                              )}
                            </>
                          )}
                        </div>
                      )}
                      
                      {activity.crowdLevel && (
                        <div className="crowd-level">
                          <strong>👥 Crowd Level:</strong> {activity.crowdLevel}
                        </div>
                      )}
                      
                      {activity.costEstimate && (
                        <div className="cost-estimate">
                          <strong>💰 Cost:</strong> {activity.costEstimate}
                        </div>
                      )}
                      
                      {activity.childEngagement && (
                        <div className="child-engagement">
                          <strong>🎯 Keep Kids Engaged:</strong> {typeof activity.childEngagement === 'string' ? activity.childEngagement : JSON.stringify(activity.childEngagement)}
                        </div>
                      )}
                      
                      {activity.practicalTips && (
                        <div className="practical-tips">
                          <strong>💡 Tips:</strong> {typeof activity.practicalTips === 'string' ? activity.practicalTips : JSON.stringify(activity.practicalTips)}
                        </div>
                      )}
                      
                      {activity.transportToNext && (
                        <div className="transport-next">
                          <strong>🚶‍♀️ To Next Activity:</strong> 
                          {typeof activity.transportToNext === 'string' ? (
                            activity.transportToNext
                          ) : (
                            <div>
                              <div>{activity.transportToNext.mode} - {activity.transportToNext.duration}</div>
                              {activity.transportToNext.details && <div>{activity.transportToNext.details}</div>}
                              {activity.transportToNext.contingencyAdvice && <div><em>{activity.transportToNext.contingencyAdvice}</em></div>}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="activity-notes">
                        <textarea
                          placeholder="Add personal notes..."
                          value={activityNotes[index] || ''}
                          onChange={(e) => updateActivityNote(index, e.target.value)}
                          className="notes-input"
                          rows="2"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="itinerary-actions">
                <button className="print-button" onClick={() => window.print()}>
                  🖨️ Print Itinerary
                </button>
                <button className="share-button" onClick={() => navigator.share ? navigator.share({title: 'My PlayDay Itinerary', text: 'Check out my London family trip!'}) : alert('Sharing not supported on this device')}>
                  📤 Share Trip
                </button>
              </div>
            </div>

            {tripData.overallBudget && (
              <div className="cost-summary">
                <h3>💰 Total Estimated Cost</h3>
                <div className="cost-display">
                  <span className="cost-amount">{tripData.overallBudget}</span>
                </div>
                  <p className="cost-note">This estimated cost factors in activities, meals, and transport costs based on your selected budget level.</p>
              </div>
            )}

            {tripData.logistics && (
              <div className="logistics-info">
                <h3>🚇 Transport & Logistics</h3>
                <div className="logistics-grid">
                  <div className="logistics-item">
                    <strong>Recommended Transport:</strong>
                    <span>{tripData.logistics.transportMethod}</span>
                  </div>
                  <div className="logistics-item">
                    <strong>Total Walking Time:</strong>
                    <span>{tripData.logistics.totalWalkingTime}</span>
                    {tripData.logistics.walkingBreakdown && tripData.logistics.walkingBreakdown.length > 0 && (
                      <div className="walking-breakdown">
                        <div className="breakdown-header">Breakdown:</div>
                        <ul className="breakdown-list">
                          {tripData.logistics.walkingBreakdown.map((walk, index) => (
                            <li key={index} className="breakdown-item">
                              {walk.duration} from {walk.from} to {walk.to}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="logistics-item">
                    <strong>Weather Backup Plan:</strong>
                    <span>{tripData.logistics.weatherBackup}</span>
                  </div>
                </div>
              </div>
            )}

            {tripData.mealPlanning && (
              <div className="meal-planning">
                <h3>🍽️ Meal Planning</h3>
                <div className="meal-grid">
                  {tripData.mealPlanning.breakfast && (
                    <div className="meal-item">
                      <strong>Breakfast:</strong>
                      <span>{tripData.mealPlanning.breakfast}</span>
                    </div>
                  )}
                  <div className="meal-item">
                    <strong>Lunch:</strong>
                    <span>{tripData.mealPlanning.lunch}</span>
                  </div>
                  <div className="meal-item">
                    <strong>Snacks:</strong>
                    <span>{tripData.mealPlanning.snacks}</span>
                  </div>
                  {tripData.mealPlanning.dietary && (
                    <div className="meal-item dietary">
                      <strong>Dietary Notes:</strong>
                      <span>{tripData.mealPlanning.dietary}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {tripData.emergencyInfo && (
              <div className="emergency-info">
                <h3>🏥 Emergency Information</h3>
                <div className="emergency-grid">
                  <div className="emergency-item">
                    <strong>Nearest Hospital:</strong>
                    <span>{tripData.emergencyInfo.nearestHospital}</span>
                  </div>
                  <div className="emergency-item">
                    <strong>Pharmacies:</strong>
                    <span>{tripData.emergencyInfo.pharmacies}</span>
                  </div>
                  <div className="emergency-item">
                    <strong>Public Toilets:</strong>
                    <span>{tripData.emergencyInfo.toilets}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;