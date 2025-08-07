// client/src/App.js

// imports at the top obviously
import React, { useState } from 'react';
import './App.css';

function App() {
  // basic form fields - keeps track of what the user has selected
  const [date, setDate] = useState('');
  const [interests, setInterests] = useState([]); // array since they can pick multiple interests
  const [budget, setBudget] = useState('');

  // time range for the trip - default 9am to 6pm
  const [timeRange, setTimeRange] = useState([9, 18]); // 24-hour format

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
        
        // create a fake itinerary based on what they selected
        const mockItinerary = generateMockItinerary(formData);
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

  // creates a fake itinerary based on what interests the user picked
  // this is temporary until we get real london attractions data
  const generateMockItinerary = (formData) => {
    const activities = [];
    const [startHour, endHour] = formData.timeRange;
    
    // helper function to format time
    const formatTime = (hour) => {
      if (hour === 0 || hour === 24) return '12:00 AM';
      if (hour < 12) return `${hour}:00 AM`;
      if (hour === 12) return '12:00 PM';
      return `${hour - 12}:00 PM`;
    };
    
    // calculate available time slots based on user's time range
    let currentHour = startHour;
    let activityCount = 0;
    
    // add different activities based on what they're interested in
    if (formData.interests.includes('Museums') && currentHour < endHour - 1) {
      activities.push({
        time: formatTime(currentHour),
        title: 'Natural History Museum',
        description: 'Explore dinosaurs and interactive exhibits',
        duration: '2 hours',
        budgetLevel: formData.budget
      });
      currentHour += 2;
      activityCount++;
    }
    
    if (formData.interests.includes('Markets') && currentHour < endHour - 1) {
      activities.push({
        time: formatTime(currentHour),
        title: 'Borough Market Food Adventure',
        description: 'Sample delicious treats and explore the historic food market',
        duration: '1.5 hours',
        budgetLevel: formData.budget
      });
      currentHour += 1.5;
      activityCount++;
    }
    
    if (formData.interests.includes('Hidden Gems') && currentHour < endHour - 0.5) {
      activities.push({
        time: formatTime(Math.floor(currentHour)),
        title: 'Neal\'s Yard Secret Garden',
        description: 'Discover this colorful hidden courtyard in Covent Garden',
        duration: '45 minutes',
        budgetLevel: formData.budget
      });
      currentHour += 0.75;
      activityCount++;
    }

    if (formData.interests.includes('Animals & Zoos') && currentHour < endHour - 2.5) {
      activities.push({
        time: formatTime(Math.floor(currentHour)),
        title: 'London Zoo Experience',
        description: 'Meet amazing animals and enjoy interactive exhibits',
        duration: '3 hours',
        budgetLevel: formData.budget
      });
      currentHour += 3;
      activityCount++;
    }

    if (formData.interests.includes('Historical Sites') && currentHour < endHour - 2) {
      activities.push({
        time: formatTime(Math.floor(currentHour)),
        title: 'Tower of London Family Tour',
        description: 'Explore the historic fortress and see the Crown Jewels',
        duration: '2.5 hours',
        budgetLevel: formData.budget
      });
      currentHour += 2.5;
      activityCount++;
    }

    if (formData.interests.includes('Parks') && currentHour < endHour - 1) {
      activities.push({
        time: formatTime(Math.floor(currentHour)), 
        title: 'Hyde Park Adventure',
        description: 'Playground time and picnic lunch',
        duration: '1.5 hours',
        budgetLevel: formData.budget
      });
      currentHour += 1.5;
      activityCount++;
    }
    
    if (formData.interests.includes('Art Galleries') && currentHour < endHour - 1) {
      activities.push({
        time: formatTime(Math.floor(currentHour)),
        title: 'Tate Modern Family Workshop',
        description: 'Interactive art activities and child-friendly exhibitions',
        duration: '1.5 hours',
        budgetLevel: formData.budget
      });
      currentHour += 1.5;
      activityCount++;
    }

    if (formData.interests.includes('Adventure Activities') && currentHour < endHour - 0.5) {
      activities.push({
        time: formatTime(Math.floor(currentHour)),
        title: 'Thames Clipper Boat Adventure',
        description: 'Exciting boat ride along the Thames with stunning city views',
        duration: '1 hour',
        budgetLevel: formData.budget
      });
      currentHour += 1;
      activityCount++;
    }

    if (formData.interests.includes('Great Food') && currentHour < endHour - 0.5) {
      activities.push({
        time: formatTime(Math.floor(currentHour)),
        title: 'Family-Friendly Café',
        description: 'Delicious treats and child-friendly menu',
        duration: '1 hour',
        budgetLevel: formData.budget
      });
      currentHour += 1;
      activityCount++;
    }

    if (formData.interests.includes('Theatre & Shows') && currentHour < endHour - 1.5) {
      activities.push({
        time: formatTime(Math.floor(currentHour)),
        title: 'West End Family Show',
        description: 'Age-appropriate musical or puppet show in the theatre district',
        duration: '2 hours',
        budgetLevel: formData.budget
      });
      currentHour += 2;
      activityCount++;
    }
    
    // fallback activity if they didn't pick any specific interests or have remaining time
    if (activities.length === 0 || (currentHour < endHour - 1 && activities.length < 3)) {
      activities.push({
        time: formatTime(activities.length === 0 ? startHour : Math.floor(currentHour)),
        title: 'London Eye',
        description: 'Family fun with amazing city views',
        duration: '1 hour',
        budgetLevel: formData.budget
      });
    }

    // calculate total duration more accurately
    const totalHours = Math.max(endHour - startHour, activities.length * 1.5);
    const totalDuration = `${Math.floor(totalHours)} hours ${totalHours % 1 === 0.5 ? '30 minutes' : ''}`;

    // return all the trip data that the results page will display
    return {
      date: formData.date,
      children: formData.children,
      activities,
      totalDuration: totalDuration.trim(),
      timeRange: formData.timeRange
    };
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
              <input 
                id="date-input"
                type="date" 
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  // clear the error message as soon as they pick a date
                  if (errors.date) setErrors(prev => ({ ...prev, date: undefined }));
                }}
                className={errors.date ? 'error' : ''}
              />
              {errors.date && <span className="error-message">{errors.date}</span>}
            </div>

            <div className="form-section">
              <label>What time would you like to start and finish?</label>
              <div className="time-range-container">
                <div className="time-range-labels">
                  <span className="time-label start-time">
                    Start: {timeRange[0] === 0 ? '12:00 AM' : timeRange[0] <= 12 ? `${timeRange[0]}:00 AM` : `${timeRange[0] - 12}:00 PM`}
                  </span>
                  <span className="time-label end-time">
                    End: {timeRange[1] === 0 ? '12:00 AM' : timeRange[1] <= 12 ? `${timeRange[1]}:00 ${timeRange[1] === 12 ? 'PM' : 'AM'}` : `${timeRange[1] - 12}:00 PM`}
                  </span>
                </div>
                <div className="time-slider-container">
                  <div className="time-slider-track">
                    <div 
                      className="time-slider-range"
                      style={{
                        left: `${(timeRange[0] - 6) / 18 * 100}%`,
                        width: `${(timeRange[1] - timeRange[0]) / 18 * 100}%`
                      }}
                    ></div>
                    <input
                      type="range"
                      min="6"
                      max="24"
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
                      min="6"
                      max="24"
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
                    {[6, 9, 12, 15, 18, 21, 24].map(hour => (
                      <div key={hour} className="time-marker" style={{left: `${(hour - 6) / 18 * 100}%`}}>
                        <span className="time-marker-label">
                          {hour === 0 || hour === 24 ? '12AM' : hour <= 12 ? `${hour}${hour === 12 ? 'PM' : 'AM'}` : `${hour - 12}PM`}
                        </span>
                      </div>
                    ))}
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
                <p><strong>Children:</strong> {tripData.children.length} child{tripData.children.length > 1 ? 'ren' : ''}</p>
                <p><strong>Total Duration:</strong> {tripData.totalDuration}</p>
              </div>
            </div>

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