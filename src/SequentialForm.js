import React, { useState, useEffect, useRef, useCallback } from 'react';

const SkeletonForm = () => {
  // Form state management
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    isOwner: null,
    roofType: '',
    sunlight: '',
    electricityBill: 0
  });
  const [validation, setValidation] = useState({
    name: false,
    phone: false,
    email: false,
    address: false,
    isOwner: false,
    roofType: false,
    sunlight: false,
    electricityBill: false
  });
  const [errors, setErrors] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    isOwner: '',
    roofType: '',
    sunlight: '',
    electricityBill: ''
  });

  // Additional state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptedNext, setAttemptedNext] = useState(false);
  const [backendResponse, setBackendResponse] = useState(null);
  const [submissionError, setSubmissionError] = useState('');

  // Google Maps autocomplete state
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);
  const [googleScriptError, setGoogleScriptError] = useState(false);
  const addressInputRef = useRef(null);
  const autocompleteRef = useRef(null);

  // API endpoint - should be in environment variable in production
  const API_ENDPOINT = process.env.REACT_APP_API_ENDPOINT || '/api/submit';

  // Load Google Maps API script
  useEffect(() => {
    if (!googleScriptLoaded && !googleScriptError && (currentStep === 2 || currentStep === 3)) {
      fetch('/.netlify/functions/get-maps-key')
        .then(response => {
          if (!response.ok) {
            throw new Error(`API key fetch failed with status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          if (!data.apiKey) {
            throw new Error('No API key received from server');
          }
          
          const googleMapScript = document.createElement('script');
          googleMapScript.src = `https://maps.googleapis.com/maps/api/js?key=${data.apiKey}&libraries=places&callback=initGoogleMaps`;
          googleMapScript.async = true;
          googleMapScript.defer = true;
          
          window.initGoogleMaps = () => {
            setGoogleScriptLoaded(true);
          };
          
          window.document.body.appendChild(googleMapScript);
        })
        .catch(error => {
          console.error('Error in Google Maps initialization:', error);
          setGoogleScriptLoaded(false);
          setGoogleScriptError(true);
        });

      return () => {
        if (window.initGoogleMaps) {
          window.initGoogleMaps = undefined;
        }
      };
    }
  }, [googleScriptLoaded, googleScriptError, currentStep]);

  // Handle form field changes - wrapped in useCallback to prevent recreation on every render
  const handleChange = useCallback((field, value) => {
    setFormData(prevFormData => ({
      ...prevFormData,
      [field]: value
    }));

    // Validate the field
    let isValid = false;
    let errorMessage = '';

    switch (field) {
      case 'name':
        if (value.trim() === '') {
          errorMessage = 'Name is required';
        } else if (value.trim().length < 2) {
          errorMessage = 'Name must be at least 2 characters';
        } else {
          isValid = true;
        }
        break;
      case 'phone':
        const phoneDigits = value.replace(/\D/g, '');
        if (phoneDigits === '') {
          errorMessage = 'Phone number is required';
        } else if (phoneDigits.length !== 10) {
          errorMessage = 'Phone number must be 10 digits';
        } else {
          isValid = true;
        }
        break;
      case 'email':
        if (value.trim() === '') {
          errorMessage = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errorMessage = 'Please enter a valid email address';
        } else {
          isValid = true;
        }
        break;
      case 'address':
        if (value.trim() === '') {
          errorMessage = 'Address is required';
        } else if (value.trim().length < 3) {
          errorMessage = 'Address must be at least 3 characters';
        } else {
          isValid = true;
        }
        break;
      case 'isOwner':
        if (value === null) {
          errorMessage = 'Please select an option';
        } else {
          isValid = true;
        }
        break;
      case 'roofType':
        if (value === '') {
          errorMessage = 'Please select a roof type';
        } else {
          isValid = true;
        }
        break;
      case 'sunlight':
        if (value === '') {
          errorMessage = 'Please select a sunlight option';
        } else {
          isValid = true;
        }
        break;
      case 'electricityBill':
        isValid = true; // slider always has a value
        break;
      default:
        break;
    }

    setValidation(prevValidation => ({
      ...prevValidation,
      [field]: isValid
    }));

    setErrors(prevErrors => ({
      ...prevErrors,
      [field]: errorMessage
    }));
  }, []);

  // Initialize Google Maps autocomplete
  useEffect(() => {
    if (googleScriptLoaded && currentStep === 3 && addressInputRef.current) {
      try {
        if (!window.google || !window.google.maps || !window.google.maps.places) {
          console.error('Google Maps API not fully loaded');
          setGoogleScriptError(true);
          return;
        }
        
        autocompleteRef.current = new window.google.maps.places.Autocomplete(
          addressInputRef.current,
          { 
            types: ['address'],
            componentRestrictions: { country: 'us' }
          }
        );

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace();
          if (place && place.formatted_address) {
            handleChange('address', place.formatted_address);
          }
        });

        return () => {
          if (autocompleteRef.current) {
            window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
          }
        };
      } catch (error) {
        console.error('Error initializing Google Maps autocomplete:', error);
        setGoogleScriptError(true);
      }
    }
  }, [googleScriptLoaded, currentStep, handleChange]);

  // Format phone number as user types
  const formatPhoneNumber = (value) => {
    const phoneDigits = value.replace(/\D/g, '');
    
    let formattedPhone = '';
    if (phoneDigits.length <= 3) {
      formattedPhone = phoneDigits;
    } else if (phoneDigits.length <= 6) {
      formattedPhone = `(${phoneDigits.slice(0, 3)}) ${phoneDigits.slice(3)}`;
    } else {
      formattedPhone = `(${phoneDigits.slice(0, 3)}) ${phoneDigits.slice(3, 6)}-${phoneDigits.slice(6, 10)}`;
    }
    
    return formattedPhone;
  };

  // Verify all fields are valid before submission
  const validateAllFields = () => {
    const fieldsToValidate = Object.keys(formData);
    const allFieldsValid = fieldsToValidate.every(field => validation[field]);
    
    if (!allFieldsValid) {
      // Mark all fields as attempted to show errors
      setAttemptedNext(true);
    }
    
    return allFieldsValid;
  };

  // Handle next step
  const goToNextStep = () => {
    const currentField = Object.keys(formData)[currentStep];
    setAttemptedNext(true);
    
    if (validation[currentField]) {
      setCurrentStep(currentStep + 1);
      setAttemptedNext(false);
    }
  };

  // Handle previous step
  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setAttemptedNext(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
    }
    
    if (currentStep === 7) {
      // Verify all fields before submitting
      if (!validateAllFields()) {
        return;
      }
      
      setIsSubmitting(true);
      setSubmissionError('');
      
      try {
        console.log('Submitting form data to backend:', formData);
        
        const response = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }
        
        const responseData = await response.json();
        console.log('Response from server:', responseData);
        
        setBackendResponse(responseData);
        setCurrentStep(8);
      } catch (error) {
        console.error('Error submitting form:', error);
        setSubmissionError('There was a problem submitting your information. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Determine which form field to show based on current step
  const renderFormField = () => {
    switch (currentStep) {
      case 0:
        return (
          <div>
            <label>Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={validation.name ? 'valid' : attemptedNext && !validation.name ? 'invalid' : ''}
            />
            {attemptedNext && errors.name && <div className="error">{errors.name}</div>}
          </div>
        );
      case 1:
        return (
          <div>
            <label>Phone Number</label>
            <input
              type="tel"
              value={formatPhoneNumber(formData.phone)}
              onChange={(e) => handleChange('phone', e.target.value)}
              className={validation.phone ? 'valid' : attemptedNext && !validation.phone ? 'invalid' : ''}
            />
            {attemptedNext && errors.phone && <div className="error">{errors.phone}</div>}
          </div>
        );
      case 2:
        return (
          <div>
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={validation.email ? 'valid' : attemptedNext && !validation.email ? 'invalid' : ''}
            />
            {attemptedNext && errors.email && <div className="error">{errors.email}</div>}
          </div>
        );
      case 3:
        return (
          <div>
            <label>Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              ref={addressInputRef}
              className={validation.address ? 'valid' : attemptedNext && !validation.address ? 'invalid' : ''}
            />
            {googleScriptLoaded ? (
              <p className="helper-text">Start typing for address suggestions</p>
            ) : googleScriptError ? (
              <p className="helper-text">Enter your complete address manually</p>
            ) : (
              <p className="helper-text">Loading address suggestions...</p>
            )}
            {attemptedNext && errors.address && <div className="error">{errors.address}</div>}
          </div>
        );
      case 4:
        return (
          <div>
            <label>Are you the owner of the house?</label>
            <div className="button-group">
              <button
                type="button"
                onClick={() => handleChange('isOwner', true)}
                className={formData.isOwner === true ? 'selected' : ''}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => handleChange('isOwner', false)}
                className={formData.isOwner === false ? 'selected' : ''}
              >
                No
              </button>
            </div>
            {attemptedNext && errors.isOwner && <div className="error">{errors.isOwner}</div>}
          </div>
        );
      case 5:
        return (
          <div>
            <label>What type of roof do you have?</label>
            <div className="button-group">
              <button
                type="button"
                onClick={() => handleChange('roofType', 'flat')}
                className={formData.roofType === 'flat' ? 'selected' : ''}
              >
                Flat Roof
              </button>
              <button
                type="button"
                onClick={() => handleChange('roofType', 'pitched')}
                className={formData.roofType === 'pitched' ? 'selected' : ''}
              >
                Pitched Roof
              </button>
              <button
                type="button"
                onClick={() => handleChange('roofType', 'steep-pitched')}
                className={formData.roofType === 'steep-pitched' ? 'selected' : ''}
              >
                Steep-Pitched Roof
              </button>
            </div>
            {attemptedNext && errors.roofType && <div className="error">{errors.roofType}</div>}
          </div>
        );
      case 6:
        return (
          <div>
            <label>How much sunlight does your home get?</label>
            <div className="button-group">
              <button
                type="button"
                onClick={() => handleChange('sunlight', 'full')}
                className={formData.sunlight === 'full' ? 'selected' : ''}
              >
                Full Sunlight
              </button>
              <button
                type="button"
                onClick={() => handleChange('sunlight', 'partial')}
                className={formData.sunlight === 'partial' ? 'selected' : ''}
              >
                Partial Sunlight
              </button>
              <button
                type="button"
                onClick={() => handleChange('sunlight', 'little')}
                className={formData.sunlight === 'little' ? 'selected' : ''}
              >
                Little To No Sunlight
              </button>
            </div>
            {attemptedNext && errors.sunlight && <div className="error">{errors.sunlight}</div>}
          </div>
        );
      case 7:
        return (
          <div>
            <label>What's your average electricity bill?</label>
            <div className="slider-container">
              <input
                type="range"
                min="0"
                max="1500"
                step="10"
                value={formData.electricityBill}
                onChange={(e) => handleChange('electricityBill', Number(e.target.value))}
              />
              <div className="slider-value">${formData.electricityBill}</div>
            </div>
          </div>
        );
      default:
        return (
          <div className="completion-screen">
            <h2>Thank you!</h2>
            
            {submissionError ? (
              <div className="error-container">
                <p>{submissionError}</p>
                <button
                  type="button"
                  onClick={() => setCurrentStep(7)}
                  className="try-again-button"
                >
                  Try Again
                </button>
              </div>
            ) : isSubmitting ? (
              <div className="loading-container">
                <p>Processing your information...</p>
              </div>
            ) : backendResponse ? (
              <div className="results-container">
                <p>We've received your information and created your custom solar assessment.</p>
                
                {backendResponse.savings && (
                  <div className="savings-container">
                    <h3>Estimated Savings</h3>
                    <p className="savings-amount">${backendResponse.savings}/year</p>
                  </div>
                )}
                
                {backendResponse.recommendation && (
                  <div className="recommendation-container">
                    <h3>Our Recommendation</h3>
                    <p>{backendResponse.recommendation}</p>
                  </div>
                )}
                
                {backendResponse.reportUrl && (
                  <div className="report-container">
                    <a 
                      href={backendResponse.reportUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="report-button"
                    >
                      View Full Report
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <p>We've received your information and will be in touch soon.</p>
            )}
          </div>
        );
    }
  };

  // Progress calculation
  const progressPercentage = ((currentStep) / 7) * 100;

  return (
    <div className="skeleton-form">
      {/* Simple progress indicator */}
      <div className="progress-bar">
        <div className="progress" style={{ width: `${progressPercentage}%` }}></div>
      </div>
      
      {/* Step indicator */}
      <div className="step-indicator">
        {currentStep <= 7 ? `Step ${currentStep + 1} of 8` : "Completed"}
      </div>
      
      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="form-field">
          {renderFormField()}
        </div>
        
        {/* Navigation buttons */}
        <div className="form-navigation">
          {currentStep > 0 && currentStep <= 7 && (
            <button
              type="button"
              onClick={goToPreviousStep}
              className="back-button"
            >
              Back
            </button>
          )}
          
          {currentStep < 7 ? (
            <button
              type="button"
              onClick={goToNextStep}
              className="next-button"
            >
              Next
            </button>
          ) : currentStep === 7 ? (
            <button
              type="submit"
              disabled={isSubmitting}
              className="submit-button"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          ) : null}
        </div>
      </form>
      
      {/* Styles */}
      <style>
        {`
          .skeleton-form {
            max-width: 500px;
            margin: 0 auto;
            padding: 20px;
            font-family: sans-serif;
          }
          .progress-bar {
            height: 8px;
            background-color: #eee;
            border-radius: 4px;
            margin-bottom: 20px;
          }
          .progress {
            height: 100%;
            background-color: #4299e1;
            border-radius: 4px;
            transition: width 0.3s;
          }
          .step-indicator {
            margin-bottom: 20px;
            color: #666;
          }
          .form-field {
            margin-bottom: 20px;
          }
          label {
            display: block;
            margin-bottom: 8px;
            font-weight: bold;
          }
          input[type="text"],
          input[type="tel"],
          input[type="email"],
          input[type="range"] {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
          }
          input.valid {
            border-color: green;
          }
          input.invalid {
            border-color: red;
          }
          .error {
            color: red;
            margin-top: 4px;
            font-size: 14px;
          }
          .helper-text {
            color: #666;
            font-size: 14px;
            margin-top: 4px;
          }
          .button-group {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }
          button {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            background-color: #eee;
          }
          button.selected {
            background-color: #4299e1;
            color: white;
          }
          .back-button {
            background-color: #f7fafc;
            color: #4299e1;
            border: 1px solid #4299e1;
          }
          .next-button, .submit-button {
            background-color: #4299e1;
            color: white;
          }
          .form-navigation {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
          }
          .slider-container {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .slider-value {
            font-size: 18px;
            font-weight: bold;
            margin-top: 10px;
          }
          .completion-screen {
            text-align: center;
          }
          .savings-amount {
            font-size: 24px;
            font-weight: bold;
            color: #38a169;
          }
          .report-button {
            display: inline-block;
            padding: 10px 20px;
            background-color: #4299e1;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 20px;
          }
          .error-container {
            background-color: #fed7d7;
            border-left: 4px solid #e53e3e;
            padding: 10px;
            margin: 10px 0;
            border-radius: 4px;
          }
          .try-again-button {
            margin-top: 10px;
            background-color: #e53e3e;
            color: white;
          }
        `}
      </style>
    </div>
  );
};

export default SkeletonForm;