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
  const handleSubmit = (e) => {
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

    const formDataString = JSON.stringify(formData, null, 2);
    alert("Form Submitted! Here's the data:\n\n" + formDataString);
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
      </main>
    </div>
  );
}

export default App;