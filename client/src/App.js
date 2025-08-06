// client/src/App.js

import React, { useState } from 'react';
import './App.css';

function App() {
  // State for single-value fields remains the same
  const [date, setDate] = useState('');
  const [interests, setInterests] = useState([]);
  const [budget, setBudget] = useState('');

  // 'children' is now an array of objects.
  // We start with one child by default.
  const [children, setChildren] = useState([
    { age: '', preferences: '' }
  ]);

  // Add error state
  const [errors, setErrors] = useState({});
  
  // Add state to track if we should show results
  const [showResults, setShowResults] = useState(false);
  const [tripData, setTripData] = useState(null);

  // Function to add a new child to the array ---
  const handleAddChild = () => {
    setChildren([...children, { age: '', preferences: '' }]);
  };

  //  A more complex handler for child inputs ---
  // It needs to know which child to update (using the 'index')
  const handleChildChange = (index, event) => {
    // Create a new array so we don't directly change the state
    const newChildren = [...children];
    // Update the specific child's age or preferences
    newChildren[index][event.target.name] = event.target.value;
    setChildren(newChildren);
    
    // Clear errors for this field when user starts typing
    const errorKey = `child-${index}-${event.target.name}`;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: undefined }));
    }
  };

  // Validation function
  const validateForm = () => {
    const newErrors = {};

    // Date validation
    if (!date) {
      newErrors.date = 'Please select a date';
    } else if (new Date(date) < new Date().setHours(0,0,0,0)) {
      newErrors.date = 'Date cannot be in the past';
    }

    // Children validation
    children.forEach((child, index) => {
      if (!child.age) {
        newErrors[`child-${index}-age`] = 'Age is required';
      } else if (isNaN(child.age) || !Number.isInteger(Number(child.age)) || child.age < 0) {
        newErrors[`child-${index}-age`] = 'Age must be a whole number';
      } else if (child.age > 18) {
        newErrors[`child-${index}-age`] = 'Age must be 18 or under';
      }
    });

    // Interests validation
    if (interests.length === 0) {
      newErrors.interests = 'Please select at least one interest';
    }

    // Budget validation
    if (!budget) {
      newErrors.budget = 'Please select a budget';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Updated submit function
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const formData = {
      date,
      children,
      interests,
      budget,
    };

    try {
      // Send data to backend
      const response = await fetch('http://localhost:3001/api/plan-trip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Generate a mock itinerary for now
        const mockItinerary = generateMockItinerary(formData);
        setTripData(mockItinerary);
        setShowResults(true);
      } else {
        alert('Error planning trip. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error connecting to server. Please try again.');
    }
  };

  // Function to generate a mock itinerary based on user preferences
  const generateMockItinerary = (formData) => {
    const activities = [];
    
    // Generate activities based on interests
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
    
    // Add a default activity if no specific interests match
    if (activities.length === 0) {
      activities.push({
        time: '11:00 AM',
        title: 'London Eye',
        description: 'Family fun with amazing city views',
        duration: '1 hour',
        budgetLevel: formData.budget
      });
    }

    return {
      date: formData.date,
      children: formData.children,
      activities,
      totalDuration: activities.length * 1.5 + ' hours'
    };
  };

  const handleInterestClick = (interest) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else {
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
          // Show the form
          <form className="itinerary-form" onSubmit={handleSubmit} noValidate>
            
            <div className="form-section">
              <label htmlFor="date-input">When are you going?</label>
              <input 
                id="date-input"
                type="date" 
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (errors.date) setErrors(prev => ({ ...prev, date: undefined }));
                }}
                className={errors.date ? 'error' : ''}
              />
              {errors.date && <span className="error-message">{errors.date}</span>}
            </div>

            {/* --- UPDATED: Child Details Section --- */}
            <div className="form-section">
              <label>Child Details</label>
              {/* We use .map() to create a form for each child in the array */}
              {children.map((child, index) => (
                <div className="child-form" key={index}>
                  <h4>Child {index + 1}</h4>
                  <input 
                    type="text"
                    name="age" // 'name' attribute is important now
                    placeholder="Age"
                    value={child.age}
                    onChange={(e) => handleChildChange(index, e)}
                    className={errors[`child-${index}-age`] ? 'error' : ''}
                  />
                  {errors[`child-${index}-age`] && (
                    <span className="error-message">{errors[`child-${index}-age`]}</span>
                  )}
                  <textarea 
                    name="preferences" // 'name' attribute is important now
                    placeholder="Preferences (e.g., loves dinosaurs, requires a stroller)"
                    value={child.preferences}
                    onChange={(e) => handleChildChange(index, e)}
                  />
                </div>
              ))}
              {/* The "Add Child" button calls our new function */}
              <button type="button" className="add-child-button" onClick={handleAddChild}>
                + Add Another Child
              </button>
            </div>

            <div className="form-section">
              <label>What are you interested in?</label>
              <div className="button-group">
                {['Museums', 'Parks', 'Great Food', 'Hidden Gems', 'Art Galleries'].map(interest => (
                  <button 
                    type="button" 
                    key={interest}
                    onClick={() => {
                      handleInterestClick(interest);
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
                {['£', '££', '£££', '££££'].map(b => (
                  <button 
                    type="button" 
                    key={b}
                    onClick={() => {
                      setBudget(b);
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
          // Show the results
          <div className="results-container">
            <div className="results-header">
              <h2>Your Perfect PlayDay! 🎉</h2>
              <p>Here's your personalized itinerary for {new Date(tripData.date).toLocaleDateString()}</p>
              <button 
                className="back-button" 
                onClick={() => setShowResults(false)}
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