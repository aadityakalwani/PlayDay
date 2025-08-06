// client/src/App.js

import React, { useState } from 'react';
import './App.css';

function App() {
  // basic form fields - keeps track of what the user has selected
  const [date, setDate] = useState('');
  const [interests, setInterests] = useState([]); // array since they can pick multiple interests
  const [budget, setBudget] = useState('');

  // children is an array of objects because we can have multiple kids
  // start with one empty child form by default
  const [children, setChildren] = useState([
    { age: '', preferences: '' }
  ]);

  // keeps track of any validation errors to show red boxes and messages
  const [errors, setErrors] = useState({});
  
  // controls whether we show the form or the results page
  const [showResults, setShowResults] = useState(false);
  // holds the generated itinerary data once the form is submitted
  const [tripData, setTripData] = useState(null);

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
    
    // add different activities based on what they're interested in
    if (formData.interests.includes('Museums')) {
      activities.push({
        time: '10:00 AM',
        title: 'Natural History Museum',
        description: 'Explore dinosaurs and interactive exhibits',
        duration: '2 hours',
        budgetLevel: formData.budget
      });
    }
    
    if (formData.interests.includes('Parks')) {
      activities.push({
        time: '1:00 PM', 
        title: 'Hyde Park Adventure',
        description: 'Playground time and picnic lunch',
        duration: '1.5 hours',
        budgetLevel: formData.budget
      });
    }
    
    if (formData.interests.includes('Great Food')) {
      activities.push({
        time: '3:30 PM',
        title: 'Family-Friendly Café',
        description: 'Delicious treats and child-friendly menu',
        duration: '1 hour',
        budgetLevel: formData.budget
      });
    }
    
    // fallback activity if they didn't pick any specific interests
    if (activities.length === 0) {
      activities.push({
        time: '11:00 AM',
        title: 'London Eye',
        description: 'Family fun with amazing city views',
        duration: '1 hour',
        budgetLevel: formData.budget
      });
    }

    // return all the trip data that the results page will display
    return {
      date: formData.date,
      children: formData.children,
      activities,
      totalDuration: activities.length * 1.5 + ' hours' // rough estimate
    };
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
        <p>Fill in the details below to plan your perfect day out in London.</p>
      </header>

      <main>
        {!showResults ? (
          // show the form if we haven't submitted yet
          <form className="itinerary-form" onSubmit={handleSubmit} noValidate>
            
            <div className="form-section">
              <label htmlFor="date-input">When are you going?</label>
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
                {['Museums', 'Parks', 'Great Food', 'Hidden Gems', 'Art Galleries'].map(interest => (
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
                onClick={() => setShowResults(false)} // go back to the form
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
              <h3>Your Itinerary</h3>
              {/* create a card for each activity in the itinerary */}
              {tripData.activities.map((activity, index) => (
                <div key={index} className="activity-card">
                  <div className="activity-time">
                    <span className="time">{activity.time}</span>
                    <span className="duration">{activity.duration}</span>
                  </div>
                  <div className="activity-details">
                    <h4>{activity.title}</h4>
                    <p>{activity.description}</p>
                    <span className="budget-indicator">Budget: {activity.budgetLevel}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;