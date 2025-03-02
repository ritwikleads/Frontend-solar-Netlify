import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CheckCircle, Home, Phone, Mail, MapPin, Sun, Zap, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

const SequentialForm = () => {
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
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
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const [attemptedNext, setAttemptedNext] = useState(false);

  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);
  const addressInputRef = useRef(null);
  const autocompleteRef = useRef(null);

  // Load Google Maps API script
  useEffect(() => {
    // Only load the script once and when we're close to needing it
    if (!googleScriptLoaded && (currentStep === 2 || currentStep === 3)) {
      // Fetch the API key from the backend
      fetch('https://backend-code-vercel-k2nf9mi3d-ritwik-singhs-projects-c0425c8d.vercel.app/api/maps-key')
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
          
          console.log('Successfully fetched Maps API key, loading script...');
          
          const googleMapScript = document.createElement('script');
          googleMapScript.src = `https://maps.googleapis.com/maps/api/js?key=${data.apiKey}&libraries=places&callback=initGoogleMaps`;
          googleMapScript.async = true;
          googleMapScript.defer = true;
          
          // Define a global callback function for the script
          window.initGoogleMaps = () => {
            console.log('Google Maps initialized successfully');
            setGoogleScriptLoaded(true);
            const indicator = document.getElementById('maps-loading-indicator');
            if (indicator) indicator.remove();
          };
          
          // Add error handling for the script
          googleMapScript.onerror = () => {
            console.error('Failed to load Google Maps script');
            const indicator = document.getElementById('maps-loading-indicator');
            if (indicator) {
              indicator.innerText = 'Failed to load Google Maps. Please enter address manually.';
              indicator.style.color = '#e53e3e';
            }
          };
          
          window.document.body.appendChild(googleMapScript);
        })
        .catch(error => {
          console.error('Error in Google Maps initialization:', error);
          setGoogleScriptLoaded(false);
          // Show a fallback message to the user
          const addressField = document.querySelector('.form-field-container p');
          if (addressField) {
            addressField.innerText = 'Address autocomplete unavailable. Please enter your address manually.';
            addressField.style.color = '#e53e3e';
          }
        });

      return () => {
        // Clean up global callback if component unmounts
        if (window.initGoogleMaps) {
          window.initGoogleMaps = undefined;
        }
        
        // Remove loading indicator
        const indicator = document.getElementById('maps-loading-indicator');
        if (indicator) indicator.remove();
      };
    }
  }, [googleScriptLoaded, currentStep]);

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
        // Check if Google Maps API is properly loaded
        if (!window.google || !window.google.maps || !window.google.maps.places) {
          console.error('Google Maps API not fully loaded');
          return;
        }
        
        console.log('Initializing address autocomplete...');
        
        // Initialize autocomplete with options for better results
        autocompleteRef.current = new window.google.maps.places.Autocomplete(
          addressInputRef.current,
          { 
            types: ['address'],
            componentRestrictions: { country: 'us' }, // Restrict to US addresses for better results
            fields: ['formatted_address', 'address_components'] // Specify fields to improve performance
          }
        );

        // When a place is selected, update the form data
        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace();
          console.log('Place selected:', place);
          
          if (place && place.formatted_address) {
            handleChange('address', place.formatted_address);
          }
        });

        return () => {
          // Clean up listeners when component unmounts or step changes
          if (autocompleteRef.current) {
            window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
          }
        };
      } catch (error) {
        console.error('Error initializing Google Maps autocomplete:', error);
        // Provide feedback in the UI
        const addressField = document.querySelector('.form-field-container p');
        if (addressField) {
          addressField.innerText = 'Address autocomplete unavailable. Please enter your address manually.';
          addressField.style.color = '#e53e3e';
        }
      }
    }
  }, [googleScriptLoaded, currentStep, handleChange]);

  // Format phone number as user types
  const formatPhoneNumber = (value) => {
    // Strip all non-digits
    const phoneDigits = value.replace(/\D/g, '');
    
    // Apply formatting based on length
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

  // Handle next step
  const goToNextStep = () => {
    const currentField = Object.keys(formData)[currentStep];
    setAttemptedNext(true);
    
    if (validation[currentField]) {
      setCurrentStep(currentStep + 1);
      setAttemptedNext(false);
      // Hide swipe hint after first navigation
      if (showSwipeHint) setShowSwipeHint(false);
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
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Only proceed with submission if user clicked the submit button
    // This prevents auto-submission when simply navigating to step 8
    if (currentStep === 7) {
      setIsSubmitting(true);
      
      // Send data to the API endpoint
      fetch('https://backend-code-vercel-k2nf9mi3d-ritwik-singhs-projects-c0425c8d.vercel.app/api/submit-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Form submitted successfully:', data);
        setIsSubmitting(false);
        setCurrentStep(8); // Move to thank you page after submission
      })
      .catch(error => {
        console.error('Error submitting form:', error);
        setIsSubmitting(false);
        // You could add error handling/display here
        alert('There was an error submitting your form. Please try again.');
      });
    }
  };

  // Touch handlers for swipe functionality
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (isLeftSwipe && currentStep < 7) {
      const currentField = Object.keys(formData)[currentStep];
      setAttemptedNext(true);
      if (validation[currentField]) {
        goToNextStep();
      }
    }
    if (isRightSwipe && currentStep > 0) goToPreviousStep();
  };

  // Determine which form field to show based on current step
  const renderFormField = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="form-field-container">
            <label className="block mb-2 text-lg font-medium">
              <div className="flex items-center">
                <Home className="mr-2" size={20} />
                Name
                {validation.name && (
                  <CheckCircle className="ml-2 text-green-500" size={16} />
                )}
              </div>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`w-full p-3 rounded-lg border-2 ${
                validation.name 
                  ? 'border-green-500' 
                  : attemptedNext && !validation.name
                  ? 'border-red-500' 
                  : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="Enter your full name"
            />
            {attemptedNext && errors.name && (
              <div className="text-red-500 mt-2 flex items-center">
                <AlertCircle size={16} className="mr-1" />
                {errors.name}
              </div>
            )}
          </div>
        );
      case 1:
        return (
          <div className="form-field-container">
            <label className="block mb-2 text-lg font-medium">
              <div className="flex items-center">
                <Phone className="mr-2" size={20} />
                Phone Number
                {validation.phone && (
                  <CheckCircle className="ml-2 text-green-500" size={16} />
                )}
              </div>
            </label>
            <input
              type="tel"
              value={formatPhoneNumber(formData.phone)}
              onChange={(e) => handleChange('phone', e.target.value)}
              className={`w-full p-3 rounded-lg border-2 ${
                validation.phone 
                  ? 'border-green-500' 
                  : attemptedNext && !validation.phone
                  ? 'border-red-500' 
                  : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="(123) 456-7890"
            />
            {attemptedNext && errors.phone && (
              <div className="text-red-500 mt-2 flex items-center">
                <AlertCircle size={16} className="mr-1" />
                {errors.phone}
              </div>
            )}
          </div>
        );
      case 2:
        return (
          <div className="form-field-container">
            <label className="block mb-2 text-lg font-medium">
              <div className="flex items-center">
                <Mail className="mr-2" size={20} />
                Email
                {validation.email && (
                  <CheckCircle className="ml-2 text-green-500" size={16} />
                )}
              </div>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={`w-full p-3 rounded-lg border-2 ${
                validation.email 
                  ? 'border-green-500' 
                  : attemptedNext && !validation.email
                  ? 'border-red-500' 
                  : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="example@email.com"
            />
            {attemptedNext && errors.email && (
              <div className="text-red-500 mt-2 flex items-center">
                <AlertCircle size={16} className="mr-1" />
                {errors.email}
              </div>
            )}
          </div>
        );
      case 3:
        return (
          <div className="form-field-container">
            <label className="block mb-2 text-lg font-medium">
              <div className="flex items-center">
                <MapPin className="mr-2" size={20} />
                Address
                {validation.address && (
                  <CheckCircle className="ml-2 text-green-500" size={16} />
                )}
              </div>
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              ref={addressInputRef}
              className={`w-full p-3 rounded-lg border-2 ${
                validation.address 
                  ? 'border-green-500' 
                  : attemptedNext && !validation.address
                  ? 'border-red-500' 
                  : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="Start typing your address..."
            />
            <p className="text-sm text-gray-500 mt-1">
              {googleScriptLoaded ? "Start typing for suggestions" : "Loading Google Maps..."}
            </p>
            {attemptedNext && errors.address && (
              <div className="text-red-500 mt-2 flex items-center">
                <AlertCircle size={16} className="mr-1" />
                {errors.address}
              </div>
            )}
          </div>
        );
      case 4:
        return (
          <div className="form-field-container">
            <label className="block mb-2 text-lg font-medium">
              <div className="flex items-center">
                <Home className="mr-2" size={20} />
                Are you the owner of the house?
                {validation.isOwner && (
                  <CheckCircle className="ml-2 text-green-500" size={16} />
                )}
              </div>
            </label>
            <div className="flex gap-4 mt-3">
              <button
                type="button"
                onClick={() => handleChange('isOwner', true)}
                className={`flex-1 p-3 rounded-lg ${
                  formData.isOwner === true
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100'
                } transition-all duration-300 hover:shadow-md`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => handleChange('isOwner', false)}
                className={`flex-1 p-3 rounded-lg ${
                  formData.isOwner === false
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100'
                } transition-all duration-300 hover:shadow-md`}
              >
                No
              </button>
            </div>
            {attemptedNext && errors.isOwner && (
              <div className="text-red-500 mt-2 flex items-center">
                <AlertCircle size={16} className="mr-1" />
                {errors.isOwner}
              </div>
            )}
          </div>
        );
      case 5:
        return (
          <div className="form-field-container">
            <label className="block mb-2 text-lg font-medium">
              <div className="flex items-center">
                <Home className="mr-2" size={20} />
                Let us know what type of roof do you have
                {validation.roofType && (
                  <CheckCircle className="ml-2 text-green-500" size={16} />
                )}
              </div>
            </label>
            
            {/* Simple colored squares for roof types */}
            <div className="flex justify-center my-4 h-32">
              {formData.roofType === 'flat' && (
                <div className="h-full w-64 bg-blue-400 rounded-lg flex items-center justify-center text-white font-bold">
                  Flat Roof
                </div>
              )}
              {formData.roofType === 'pitched' && (
                <div className="h-full w-64 bg-green-400 rounded-lg flex items-center justify-center text-white font-bold">
                  Pitched Roof
                </div>
              )}
              {formData.roofType === 'steep-pitched' && (
                <div className="h-full w-64 bg-red-400 rounded-lg flex items-center justify-center text-white font-bold">
                  Steep-Pitched Roof
                </div>
              )}
              {!formData.roofType && (
                <div className="h-full w-32 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                  <Home size={32} className="text-gray-400" />
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 gap-3 mt-3">
              <button
                type="button"
                onClick={() => handleChange('roofType', 'flat')}
                className={`p-4 rounded-lg ${
                  formData.roofType === 'flat'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100'
                } transition-all duration-300 hover:shadow-md`}
              >
                Flat Roof
              </button>
              <button
                type="button"
                onClick={() => handleChange('roofType', 'pitched')}
                className={`p-4 rounded-lg ${
                  formData.roofType === 'pitched'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100'
                } transition-all duration-300 hover:shadow-md`}
              >
                Pitched Roof
              </button>
              <button
                type="button"
                onClick={() => handleChange('roofType', 'steep-pitched')}
                className={`p-4 rounded-lg ${
                  formData.roofType === 'steep-pitched'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100'
                } transition-all duration-300 hover:shadow-md`}
              >
                Steep-Pitched Roof
              </button>
            </div>
            {attemptedNext && errors.roofType && (
              <div className="text-red-500 mt-2 flex items-center">
                <AlertCircle size={16} className="mr-1" />
                {errors.roofType}
              </div>
            )}
          </div>
        );
      case 6:
        return (
          <div className="form-field-container">
            <label className="block mb-2 text-lg font-medium">
              <div className="flex items-center">
                <Sun className="mr-2" size={20} />
                <div>
                  <span className="font-bold">How much sunlight</span> your home gets?
                </div>
                {validation.sunlight && (
                  <CheckCircle className="ml-2 text-green-500" size={16} />
                )}
              </div>
            </label>
            
            {/* Simple colored squares for sunlight options */}
            <div className="flex justify-center my-4 h-32">
              {formData.sunlight === 'full' && (
                <div className="h-full w-64 bg-yellow-400 rounded-lg flex items-center justify-center text-white font-bold">
                  Full Sunlight
                </div>
              )}
              {formData.sunlight === 'partial' && (
                <div className="h-full w-64 bg-yellow-200 rounded-lg flex items-center justify-center text-gray-700 font-bold">
                  Partial Sunlight
                </div>
              )}
              {formData.sunlight === 'little' && (
                <div className="h-full w-64 bg-gray-400 rounded-lg flex items-center justify-center text-white font-bold">
                  Little Sunlight
                </div>
              )}
              {!formData.sunlight && (
                <div className="h-full w-64 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                  <Sun size={32} className="text-gray-400" />
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 gap-3 mt-3">
              <button
                type="button"
                onClick={() => handleChange('sunlight', 'full')}
                className={`p-4 rounded-lg ${
                  formData.sunlight === 'full'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100'
                } transition-all duration-300 hover:shadow-md`}
              >
                Full Sunlight
              </button>
              <button
                type="button"
                onClick={() => handleChange('sunlight', 'partial')}
                className={`p-4 rounded-lg ${
                  formData.sunlight === 'partial'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100'
                } transition-all duration-300 hover:shadow-md`}
              >
                Partial Sunlight
              </button>
              <button
                type="button"
                onClick={() => handleChange('sunlight', 'little')}
                className={`p-4 rounded-lg ${
                  formData.sunlight === 'little'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100'
                } transition-all duration-300 hover:shadow-md`}
              >
                Little To No Sunlight
              </button>
            </div>
            {attemptedNext && errors.sunlight && (
              <div className="text-red-500 mt-2 flex items-center">
                <AlertCircle size={16} className="mr-1" />
                {errors.sunlight}
              </div>
            )}
          </div>
        );
      case 7:
        return (
          <div className="form-field-container">
            <label className="block mb-2 text-lg font-medium">
              <div className="flex items-center">
                <Zap className="mr-2" size={20} />
                What's your average electricity Bill?
              </div>
            </label>
            <div className="mt-6">
              <input
                type="range"
                min="0"
                max="1500"
                step="10"
                value={formData.electricityBill}
                onChange={(e) => handleChange('electricityBill', Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-center mt-2">
                <span className="text-2xl font-bold text-blue-500">
                  ${formData.electricityBill}
                </span>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="form-field-container">
            <h2 className="text-xl font-bold text-center">Thank you!</h2>
            <p className="text-center mt-3">
              We've received your information and will be in touch soon.
            </p>
          </div>
        );
    }
  };

  // Progress bar calculation
  const progressPercentage = ((currentStep) / 7) * 100;

  return (
    <div 
      className="min-h-screen bg-gradient-radial from-blue-50 to-white flex items-start justify-center p-4 pt-8"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative overflow-hidden">
        {/* Progress bar */}
        <div className="w-full h-2 bg-gray-200 rounded-full mb-6">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        
        {/* Step indicator */}
        <div className="text-sm text-gray-500 mb-6">
          {currentStep <= 7 ? (
            `Step ${currentStep + 1} of 8`
          ) : (
            "Completed"
          )}
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="relative overflow-hidden min-h-72">
            <div
              className={`transform transition-all duration-500 ${
                currentStep > 0 ? '-translate-x-full opacity-0 absolute' : 'translate-x-0 opacity-100'
              }`}
            >
              {currentStep === 0 && renderFormField()}
            </div>
            
            {Array.from({ length: 8 }).map((_, index) => (
              index > 0 && (
                <div
                  key={index}
                  className={`transform transition-all duration-500 ${
                    currentStep === index
                      ? 'translate-x-0 opacity-100'
                      : currentStep < index
                      ? 'translate-x-full opacity-0 absolute'
                      : '-translate-x-full opacity-0 absolute'
                  }`}
                >
                  {currentStep === index && renderFormField()}
                </div>
              )
            ))}
          </div>
          
          {/* Navigation buttons */}
          <div className="flex justify-between mt-8">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={goToPreviousStep}
                className="px-4 py-2 text-blue-500 hover:text-blue-700 transition-colors"
              >
                Back
              </button>
            )}
            
            <div className="ml-auto">
              {currentStep < 7 ? (
                <button
                  type="button"
                  onClick={goToNextStep}
                  className={`px-6 py-3 rounded-lg bg-blue-500 text-white flex items-center ${
                    validation[Object.keys(formData)[currentStep]]
                      ? 'hover:bg-blue-600 transform hover:scale-105 hover:shadow-lg'
                      : 'hover:bg-blue-600'
                  } transition-all duration-300`}
                >
                  Next <ArrowRight className="ml-2" size={16} />
                </button>
              ) : (
                <button
                  type="button" /* Changed from type="submit" to prevent auto-submission */
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-lg bg-green-500 text-white flex items-center hover:bg-green-600 transform hover:scale-105 hover:shadow-lg transition-all duration-300"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 animate-spin" size={16} />
                      Submitting...
                    </>
                  ) : (
                    <>Submit</>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
        
        {/* Mobile swipe hint */}
        {showSwipeHint && (
          <div className="absolute bottom-2 left-0 right-0 text-center text-sm text-gray-500 animate-pulse">
            Swipe left/right to navigate
          </div>
        )}
      </div>
    </div>
  );
};

export default SequentialForm;