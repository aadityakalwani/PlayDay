// client/src/App.js

// imports at the top obviously
import React, { useState, useEffect, useRef } from 'react';
import './App.css';

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

  // holds the generated itinerary data once the form is submitted
  const [tripData, setTripData] = useState(null);

  // track which activities are completed
  const [completedActivities, setCompletedActivities] = useState(new Set());

  // track personal notes for activities
  const [activityNotes, setActivityNotes] = useState({});

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
        
        // create an AI-powered itinerary based on what they selected
        const mockItinerary = await generateMockItinerary(formData);
        setTripData(mockItinerary);
        setShowResults(true); // switch to showing the results page
      } else {
        alert('Error planning trip. Please try again.');
      }
    } catch (error) {
      // catches network errors or if server is down
      console.error('Error:', error);
      alert('Error connecting to server. Please try again.');
    }
  };

  // creates an AI-powered itinerary using Hugging Face
  const generateMockItinerary = async (formData) => {

    const prompt = `
      You are London's most experienced family tour guide with 20+ years of expertise. Create a meticulously planned, timed itinerary for a family day out in London. Consider EVERY detail to ensure a smooth, enjoyable experience.

      === FAMILY DETAILS ===
      • Date & Weather: ${new Date(formData.date).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} (consider typical London weather for this date and season)
      • Time Frame: From ${formatTimeRange([formData.timeRange[0], 0]).split(' - ')[0]} to ${formatTimeRange([formData.timeRange[1], 0]).split(' - ')[0]}
      • Children: ${formData.children.map((child, i) => {
        const age = child.age;
        const ageGroup = age <= 3 ? "Toddler" : age <= 6 ? "Preschooler" : age <= 10 ? "Primary School" : age <= 14 ? "Tween" : "Teenager";
        return `Child ${i+1}: ${age} years old (${ageGroup})${child.preferences ? `, Special notes: ${child.preferences}` : ''}`;
      }).join('; ')}
      • Primary Interests: ${formData.interests.join(', ')}
      • Budget Level: ${formData.budget} (£ = budget-conscious, ££ = moderate, £££ = comfortable, ££££ = luxury)

      === CRITICAL CONSIDERATIONS ===
      🚇 TRANSPORT & LOGISTICS:
      - Calculate realistic travel times between locations using London public transport
      - Consider rush hour periods (8-9:30am, 5-7pm) and plan accordingly
      - Factor in walking distances from stations to venues
      - Include transport costs in budget considerations
      - Suggest the most family-friendly routes (lifts vs stairs, step-free access)

      👥 CROWD MANAGEMENT:
      - Identify peak times for each venue and suggest optimal visiting windows
      - Recommend advance bookings where necessary
      - Consider school holiday periods and weekend crowds
      - Suggest alternative routes through popular areas to avoid bottlenecks

      🍽️ DIETARY & HEALTH:
      - Include meal planning with child-friendly options
      - Consider common allergies (nuts, dairy, gluten) and dietary restrictions
      - Suggest venues with good baby/toddler facilities if applicable
      - Plan for snack breaks and hydration stops

      🌦️ WEATHER CONTINGENCIES:
      - Include indoor backup options for each outdoor activity
      - Consider seasonal factors (daylight hours, temperature, typical weather patterns)
      - Suggest appropriate clothing recommendations

      👶 AGE-APPROPRIATE LOGISTICS:
      - Consider nap times for younger children
      - Include toilet break planning
      - Factor in attention spans (toddlers: 15-30min, school age: 1-2hrs)
      - Suggest stroller-friendly routes if needed

      💰 BUDGET OPTIMIZATION:
      - Look for family discounts, free activities, and combo tickets
      - Consider packed lunch options vs restaurant costs
      - Include realistic cost estimates for the day
      - Suggest money-saving tips specific to chosen activities

      🎯 ENGAGEMENT STRATEGIES:
      - Tailor each activity explanation to the children's ages and interests
      - Include interactive elements and hands-on experiences
      - Suggest conversation starters and educational opportunities
      - Plan variety in activity types (active, educational, creative, relaxing)

      === OUTPUT REQUIREMENTS ===
      Provide a structured JSON response with this exact format:
      {
        "summary": "A brief overview of the day and why these choices work perfectly for this family",
        "logistics": {
          "totalWalkingTime": "Estimated total walking time",
          "transportMethod": "Recommended transport method (Oyster card, day pass, etc.)",
          "weatherBackup": "Quick weather contingency summary"
        },
        "activities": [
          {
            "time": "9:00 AM",
            "duration": "2 hours",
            "title": "Activity Name",
            "description": "Detailed, child-friendly explanation of the activity and why it's perfect for this family",
            "location": {
              "address": "Full address",
              "nearestTube": "Nearest tube station with distance",
              "accessibility": "Accessibility notes (lifts, ramps, etc.)"
            },
            "crowdLevel": "Low/Medium/High with time-specific notes",
            "costEstimate": "£X-Y per person or family rate",
            "childEngagement": "Specific tips for keeping these particular children engaged",
            "practicalTips": "Booking requirements, what to bring, insider tips",
            "transportToNext": "How to get to next activity (time and method)"
          }
        ],
        "mealPlanning": {
          "breakfast": "Suggestion if early start",
          "lunch": "Recommended lunch spot with child-friendly options",
          "snacks": "Strategic snack planning",
          "dietary": "Allergy/dietary accommodation notes"
        },
        "emergencyInfo": {
          "nearestHospital": "Closest hospital to main activity area",
          "pharmacies": "24hr or nearby pharmacy options",
          "toilets": "Public toilet locations along the route"
        }
      }

      Make this THE definitive family day out plan that anticipates every possible need and challenge. Be specific, practical, and thorough.
    `;

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
          throw new Error(`Service unavailable (503). The model is loading, please wait. Response: ${errorText}`);
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
            activities = parsedResponse.activities.map(activity => ({
              time: activity.time,
              title: activity.title,
              description: activity.description,
              duration: activity.duration,
              budgetLevel: formData.budget,
              // Store additional details for potential future use
              location: activity.location,
              crowdLevel: activity.crowdLevel,
              costEstimate: activity.costEstimate,
              childEngagement: activity.childEngagement,
              practicalTips: activity.practicalTips,
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
            time: formatTimeRange([currentTime, currentTime]).split(' - ')[0],
            title: 'TK Natural History Museum',
            description: 'Explore dinosaurs and interactive exhibits',
            duration: '2 hours',
            budgetLevel: formData.budget
          });
          currentTime += 4;
        }
        
        if (formData.interests.includes('Parks') && currentTime < formData.timeRange[1] - 3) {
          activities.push({
            time: formatTimeRange([currentTime, currentTime]).split(' - ')[0],
            title: 'TK Hyde Park Adventure',
            description: 'Playground time and open space to run around',
            duration: '1.5 hours',
            budgetLevel: formData.budget
          });
          currentTime += 3;
        }
        
        // Fallback activity if no others match
        if (activities.length === 0) {
          activities.push({
            time: formatTimeRange([formData.timeRange[0], formData.timeRange[0]]).split(' - ')[0],
            title: 'TK London Eye',
            description: 'Family-friendly observation wheel with amazing views',
            duration: '1 hour',
            budgetLevel: formData.budget
          });
        }
      }
      
      // Return data including the AI's structured response
      return {
        date: formData.date,
        children: formData.children,
        activities,
        totalDuration: formatTimeRange(formData.timeRange),
        timeRange: formData.timeRange,
        aiResponse: parsedResponse ? 
          `AI Planning Summary: ${parsedResponse.summary || 'Comprehensive itinerary generated successfully!'}` : 
          `Raw AI Response: "${aiText.substring(0, 500)}${aiText.length > 500 ? '...' : ''}"`
      };

    } catch (error) {
      console.error('AI Error:', error);
      
      // Fallback if AI fails - all with TK prefix
      return {
        date: formData.date,
        children: formData.children,
        activities: [
          {
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

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    
    if (dragIndex === dropIndex) return;

    const newActivities = [...tripData.activities];
    const draggedItem = newActivities[dragIndex];
    
    // Remove dragged item and insert at new position
    newActivities.splice(dragIndex, 1);
    newActivities.splice(dropIndex, 0, draggedItem);
    
    setTripData({
      ...tripData,
      activities: newActivities
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

  return (
    <div className="App">
      <header className="App-header">
        <h1>PlayDay Trip Planner</h1>
        <p>Fill in the details below to plan your perfect day out in London with your children!</p>
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
              <label>What are you interested in?</label>
              <div className="button-group">
                {/* create a button for each interest option */}
                {['Museums', 'Parks', 'Great Food', 'Hidden Gems', 'Art Galleries', 'Theatre & Shows', 'Markets', 'Animals & Zoos', 'Adventure Activities', 'Historical Sites'].map(interest => (
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
            
            <button type="submit" className="submit-button">Build My Trip</button>

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
                    <div className="drag-handle">
                      <span className="drag-icon">⋮⋮</span>
                    </div>
                    
                    <div className="activity-checkbox">
                      <input
                        type="checkbox"
                        checked={completedActivities.has(index)}
                        onChange={() => toggleActivityCompletion(index)}
                        className="activity-check"
                      />
                    </div>
                    
                    <div className="activity-time">
                      <span className="time">{activity.time}</span>
                      <span className="duration">{activity.duration}</span>
                    </div>
                    
                    <div className="activity-details">
                      <h4>{activity.title}</h4>
                      <p>{activity.description}</p>
                      <div className="activity-meta">
                        <span className="budget-indicator">Budget: {activity.budgetLevel}</span>
                        <span className="activity-number">Activity {index + 1}</span>
                      </div>
                      
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
          </div>
        )}
      </main>
    </div>
  );
}

export default App;