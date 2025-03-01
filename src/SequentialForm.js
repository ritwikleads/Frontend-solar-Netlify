import React, { useState, useEffect, useRef } from 'react';
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
      const googleMapScript = document.createElement('script');
      googleMapScript.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
      googleMapScript.async = true;
      googleMapScript.defer = true;
      googleMapScript.onload = () => {
        setGoogleScriptLoaded(true);
      };
      window.document.body.appendChild(googleMapScript);

      return () => {
        // Clean up the script if component unmounts during loading
        if (googleMapScript.parentNode) {
          googleMapScript.parentNode.removeChild(googleMapScript);
        }
      };
    }
  }, [googleScriptLoaded, currentStep]);

  // Handle form field changes
  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });

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

    setValidation({
      ...validation,
      [field]: isValid
    });

    setErrors({
      ...errors,
      [field]: errorMessage
    });
  };

  // Initialize Google Maps autocomplete
  useEffect(() => {
    if (googleScriptLoaded && currentStep === 3 && addressInputRef.current) {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        addressInputRef.current,
        { types: ['address'] }
      );

      // When a place is selected, update the form data
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        if (place.formatted_address) {
          handleChange('address', place.formatted_address);
        }
      });

      return () => {
        // Clean up listeners when component unmounts or step changes
        if (autocompleteRef.current) {
          window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        }
      };
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
      
      // Simulate form submission
      setTimeout(() => {
        console.log('Form submitted:', formData);
        setIsSubmitting(false);
        setCurrentStep(8); // Move to thank you page after submission
      }, 2000);
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
            
            {/* SVG images for roof types */}
            <div className="flex justify-center my-4 h-32">
              {formData.roofType === 'flat' && (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 272.96 167.19" className="h-full">
                  <defs>
                    <style>
                      {`.cls-1{fill:#fff;}.cls-2,.cls-7{fill:#f76f72;}.cls-3,.cls-6{fill:#ebecec;}.cls-4{fill:#fccccc;}.cls-5{fill:none;}.cls-5,.cls-6,.cls-7{stroke:#4b4b4c;stroke-linecap:round;stroke-linejoin:round;stroke-width:6px;}`}
                    </style>
                  </defs>
                  <g id="Layer_2" data-name="Layer 2">
                    <g id="Stroke">
                      <path className="cls-1" d="M16.25,82.75v81.44H71.73V82.75Zm29.33,53.94a7.41,7.41,0,0,1-4.54-1.3,6.46,6.46,0,0,1-2.75-.26,6.31,6.31,0,0,1-2.9-1.53,6.36,6.36,0,0,1-2.2-2.4,14,14,0,0,1-1.07-2.63,19.8,19.8,0,0,1-.39-2.87,5.32,5.32,0,0,1,0-.89c.09-1,.22-1.93.4-2.88a5.6,5.6,0,0,1,.63-1.71,9.89,9.89,0,0,1,0-1.44,21.07,21.07,0,0,1,1.1-5.41c0-.5,0-1,0-1.52a8.24,8.24,0,0,1,2.73-6.16c.12-.12.24-.22.37-.33l.28-.21a7.62,7.62,0,0,1,.89-.59l.41-.23.4-.19a9.35,9.35,0,0,1,3.46-.83c5.53-.39,9.69,4.47,10.53,9.49a9.31,9.31,0,0,1,.58,1.43,13,13,0,0,1,.13,6.42c-.05.28-.2,1.19-.39,1.87.07.28.13.56.2.82a24.3,24.3,0,0,1,.72,4.81C54.39,132.92,50,136.49,45.58,136.69Z"></path>
                      <polygon className="cls-2" points="190.29 82.95 212.85 66.72 269.29 67.17 269.29 164.19 245.32 164.19 243.67 83.95 190.29 82.95"></polygon>
                      <polygon className="cls-3" points="23.68 33.3 3 82.75 70.97 82.75 71.05 50.53 54.35 48.49 64.83 33.3 23.68 33.3"></polygon>
                      <polygon className="cls-1" points="71.73 164.19 155.69 164.19 155.73 48.49 113.01 0.98 71.05 50.53 71.73 164.19"></polygon>
                      <path className="cls-3" d="M107.37,2.23C107.37,2.69,156,51.3,156,51.3l55-1L161.11.78Z"></path>
                      <polyline className="cls-3" points="155.69 164.19 155.73 48.49 201.85 49.16 201.85 73.97 188.21 82.95 188.21 97.95 188.21 164.19 156.44 164.68"></polyline>
                      <polygon className="cls-3" points="115.23 125.46 136.48 125.46 136.48 64.21 127.7 64.21 115.23 125.46"></polygon>
                      <polygon className="cls-3" points="54.35 48.49 70.97 48.49 117.32 13.42 104.14 3 54.35 48.49"></polygon>
                      <rect className="cls-4" x="188.21" y="83.95" width="55.46" height="80.24"></rect>
                      <path className="cls-1" d="M207.57,133.32h19.12l-.11-25.58s-9.4-13.67-19.26,0Z"></path>
                      <polyline className="cls-5" points="55.97 82.75 16.25 82.75 16.25 164.19 70.97 164.19 70.97 82.75"></polyline>
                      <polyline className="cls-5" points="27.89 82.75 3 82.75 23.68 33.3 64.83 33.3"></polyline>
                      <line className="cls-5" x1="70.97" y1="48.49" x2="70.97" y2="94.71"></line>
                      <polyline className="cls-5" points="104.14 3 154.73 48.49 181.26 48.49 212.85 48.49 160.9 3 104.14 3 52.87 48.49 70.97 48.49"></polyline>
                      <line className="cls-5" x1="16.25" y1="164.19" x2="269.96" y2="164.19"></line>
                      <line className="cls-5" x1="201.85" y1="49.49" x2="201.85" y2="73.97"></line>
                      <line className="cls-5" x1="155.69" y1="63.49" x2="155.69" y2="164.19"></line>
                      <line className="cls-5" x1="245.32" y1="83.95" x2="245.32" y2="164.19"></line>
                      <polyline className="cls-5" points="269.96 164.19 269.96 66.72 245.32 82.95"></polyline>
                      <line className="cls-5" x1="212.85" y1="66.73" x2="188.21" y2="82.95"></line>
                      <line className="cls-5" x1="188.21" y1="164.19" x2="188.21" y2="97.95"></line>
                      <line className="cls-5" x1="188.21" y1="82.95" x2="245.32" y2="82.95"></line>
                      <line className="cls-5" x1="212.85" y1="66.73" x2="269.96" y2="66.73"></line>
                      <path className="cls-6" d="M52.84,111.76a9.56,9.56,0,0,0-19.12,0v22H52.84Z"></path>
                      <path className="cls-7" d="M226.33,113.27v-1.51a9.56,9.56,0,0,0-19.12,0v21h19.12V113.27Z"></path>
                      <line className="cls-5" x1="103.16" y1="24.77" x2="70.97" y2="48.49"></line>
                      <rect className="cls-5" x="89.07" y="64.21" width="47.88" height="61.25"></rect>
                      <line className="cls-5" x1="89.07" y1="94.83" x2="124.95" y2="94.83"></line>
                      <line className="cls-5" x1="113.01" y1="125.46" x2="113.01" y2="76.21"></line>
                    </g>
                  </g>
                </svg>
              )}
              {formData.roofType === 'pitched' && (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 272.96 167.19" className="h-full">
                  <defs>
                    <style>
                      {`.cls-1{fill:#fff;}.cls-2,.cls-6{fill:#ebecec;}.cls-3{fill:#fccccc;}.cls-4{fill:#f76f72;}.cls-5{fill:none;}.cls-5,.cls-6{stroke:#4b4b4c;stroke-linecap:round;stroke-linejoin:round;stroke-width:6px;}`}
                    </style>
                  </defs>
                  <g id="Layer_2" data-name="Layer 2">
                    <g id="Stroke">
                      <path className="cls-1" d="M16.25,82.75v81.44H71.73V82.75Zm29.33,53.94a7.41,7.41,0,0,1-4.54-1.3,6.46,6.46,0,0,1-2.75-.26,6.31,6.31,0,0,1-2.9-1.53,6.36,6.36,0,0,1-2.2-2.4,14,14,0,0,1-1.07-2.63,19.8,19.8,0,0,1-.39-2.87,5.32,5.32,0,0,1,0-.89c.09-1,.22-1.93.4-2.88a5.6,5.6,0,0,1,.63-1.71,9.89,9.89,0,0,1,0-1.44,21.07,21.07,0,0,1,1.1-5.41c0-.5,0-1,0-1.52a8.24,8.24,0,0,1,2.73-6.16c.12-.12.24-.22.37-.33l.28-.21a7.62,7.62,0,0,1,.89-.59l.41-.23.4-.19a9.35,9.35,0,0,1,3.46-.83c5.53-.39,9.69,4.47,10.53,9.49a9.31,9.31,0,0,1,.58,1.43,13,13,0,0,1,.13,6.42c-.05.28-.2,1.19-.39,1.87.07.28.13.56.2.82a24.3,24.3,0,0,1,.72,4.81C54.39,132.92,50,136.49,45.58,136.69Z"></path>
                      <polygon className="cls-2" points="190.29 82.95 212.85 66.72 269.29 67.17 269.29 164.19 245.32 164.19 243.67 83.95 190.29 82.95"></polygon>
                      <polygon className="cls-2" points="23.68 33.3 3 82.75 70.97 82.75 71.05 50.53 54.35 48.49 64.83 33.3 23.68 33.3"></polygon>
                      <polygon className="cls-3" points="71.73 164.19 155.69 164.19 155.73 48.49 113.01 0.98 71.05 50.53 71.73 164.19"></polygon>
                      <path className="cls-4" d="M107.37,2.23C107.37,2.69,156,51.3,156,51.3l55-1L161.11.78Z"></path>
                      <polyline className="cls-4" points="155.69 164.19 155.73 48.49 201.85 49.16 201.85 73.97 188.21 82.95 188.21 97.95 188.21 164.19 156.44 164.68"></polyline>
                      <polygon className="cls-4" points="115.23 125.46 136.48 125.46 136.48 64.21 127.7 64.21 115.23 125.46"></polygon>
                      <polygon className="cls-4" points="54.35 48.49 70.97 48.49 117.32 13.42 104.14 3 54.35 48.49"></polygon>
                      <rect className="cls-1" x="188.21" y="83.95" width="55.46" height="80.24"></rect>
                      <path className="cls-1" d="M207.57,133.32h19.12l-.11-25.58s-9.4-13.67-19.26,0Z"></path>
                      <polyline className="cls-5" points="55.97 82.75 16.25 82.75 16.25 164.19 70.97 164.19 70.97 82.75"></polyline>
                      <polyline className="cls-5" points="27.89 82.75 3 82.75 23.68 33.3 64.83 33.3"></polyline>
                      <line className="cls-5" x1="70.97" y1="48.49" x2="70.97" y2="94.71"></line>
                      <polyline className="cls-5" points="104.14 3 154.73 48.49 181.26 48.49 212.85 48.49 160.9 3 104.14 3 52.87 48.49 70.97 48.49"></polyline>
                      <line className="cls-5" x1="16.25" y1="164.19" x2="269.96" y2="164.19"></line>
                      <line className="cls-5" x1="201.85" y1="49.49" x2="201.85" y2="73.97"></line>
                      <line className="cls-5" x1="155.69" y1="63.49" x2="155.69" y2="164.19"></line>
                      <line className="cls-5" x1="245.32" y1="83.95" x2="245.32" y2="164.19"></line>
                      <polyline className="cls-5" points="269.96 164.19 269.96 66.72 245.32 82.95"></polyline>
                      <line className="cls-5" x1="212.85" y1="66.73" x2="188.21" y2="82.95"></line>
                      <line className="cls-5" x1="188.21" y1="164.19" x2="188.21" y2="97.95"></line>
                      <line className="cls-5" x1="188.21" y1="82.95" x2="245.32" y2="82.95"></line>
                      <line className="cls-5" x1="212.85" y1="66.73" x2="269.96" y2="66.73"></line>
                      <path className="cls-6" d="M52.84,111.76a9.56,9.56,0,0,0-19.12,0v22H52.84Z"></path>
                      <path className="cls-6" d="M226.33,113.27v-1.51a9.56,9.56,0,0,0-19.12,0v21h19.12V113.27Z"></path>
                      <line className="cls-5" x1="103.16" y1="24.77" x2="70.97" y2="48.49"></line>
                      <rect className="cls-5" x="89.07" y="64.21" width="47.88" height="61.25"></rect>
                      <line className="cls-5" x1="89.07" y1="94.83" x2="124.95" y2="94.83"></line>
                      <line className="cls-5" x1="113.01" y1="125.46" x2="113.01" y2="76.21"></line>
                    </g>
                  </g>
                </svg>
              )}
              {formData.roofType === 'steep-pitched' && (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 272.96 167.19" className="h-full">
                  <defs>
                    <style>
                      {`.cls-1{fill:#fccccc;}.cls-2,.cls-7{fill:#ebecec;}.cls-3,.cls-6{fill:#f76f72;}.cls-4{fill:#fff;}.cls-5{fill:none;}.cls-5,.cls-6,.cls-7{stroke:#4b4b4c;stroke-linecap:round;stroke-linejoin:round;stroke-width:6px;}`}
                    </style>
                  </defs>
                  <g id="Layer_2" data-name="Layer 2">
                    <g id="Stroke">
                      <path className="cls-1" d="M16.25,82.75v81.44H71.73V82.75Zm29.33,53.94a7.41,7.41,0,0,1-4.54-1.3,6.46,6.46,0,0,1-2.75-.26,6.31,6.31,0,0,1-2.9-1.53,6.36,6.36,0,0,1-2.2-2.4,14,14,0,0,1-1.07-2.63,19.8,19.8,0,0,1-.39-2.87,5.32,5.32,0,0,1,0-.89c.09-1,.22-1.93.4-2.88a5.6,5.6,0,0,1,.63-1.71,9.89,9.89,0,0,1,0-1.44,21.07,21.07,0,0,1,1.1-5.41c0-.5,0-1,0-1.52a8.24,8.24,0,0,1,2.73-6.16c.12-.12.24-.22.37-.33l.28-.21a7.62,7.62,0,0,1,.89-.59l.41-.23.4-.19a9.35,9.35,0,0,1,3.46-.83c5.53-.39,9.69,4.47,10.53,9.49a9.31,9.31,0,0,1,.58,1.43,13,13,0,0,1,.13,6.42c-.05.28-.2,1.19-.39,1.87.07.28.13.56.2.82a24.3,24.3,0,0,1,.72,4.81C54.39,132.92,50,136.49,45.58,136.69Z"></path>
                      <polygon className="cls-2" points="190.29 82.95 212.85 66.72 269.29 67.17 269.29 164.19 245.32 164.19 243.67 83.95 190.29 82.95"></polygon>
                      <polygon className="cls-3" points="23.68 33.3 3 82.75 70.97 82.75 71.05 50.53 54.35 48.49 64.83 33.3 23.68 33.3"></polygon>
                      <polygon className="cls-4" points="71.73 164.19 155.69 164.19 155.73 48.49 113.01 0.98 71.05 50.53 71.73 164.19"></polygon>
                      <path className="cls-2" d="M107.37,2.23C107.37,2.69,156,51.3,156,51.3l55-1L161.11.78Z"></path>
                      <polyline className="cls-2" points="155.69 164.19 155.73 48.49 201.85 49.16 201.85 73.97 188.21 82.95 188.21 97.95 188.21 164.19 156.44 164.68"></polyline>
                      <polygon className="cls-2" points="115.23 125.46 136.48 125.46 136.48 64.21 127.7 64.21 115.23 125.46"></polygon>
                      <polygon className="cls-2" points="54.35 48.49 70.97 48.49 117.32 13.42 104.14 3 54.35 48.49"></polygon>
                      <rect className="cls-4" x="188.21" y="83.95" width="55.46" height="80.24"></rect>
                      <path className="cls-4" d="M207.57,133.32h19.12l-.11-25.58s-9.4-13.67-19.26,0Z"></path>
                      <polyline className="cls-5" points="55.97 82.75 16.25 82.75 16.25 164.19 70.97 164.19 70.97 82.75"></polyline>
                      <polyline className="cls-5" points="27.89 82.75 3 82.75 23.68 33.3 64.83 33.3"></polyline>
                      <line className="cls-5" x1="70.97" y1="48.49" x2="70.97" y2="94.71"></line>
                      <polyline className="cls-5" points="104.14 3 154.73 48.49 181.26 48.49 212.85 48.49 160.9 3 104.14 3 52.87 48.49 70.97 48.49"></polyline>
                      <line className="cls-5" x1="16.25" y1="164.19" x2="269.96" y2="164.19"></line>
                      <line className="cls-5" x1="201.85" y1="49.49" x2="201.85" y2="73.97"></line>
                      <line className="cls-5" x1="155.69" y1="63.49" x2="155.69" y2="164.19"></line>
                      <line className="cls-5" x1="245.32" y1="83.95" x2="245.32" y2="164.19"></line>
                      <polyline className="cls-5" points="269.96 164.19 269.96 66.72 245.32 82.95"></polyline>
                      <line className="cls-5" x1="212.85" y1="66.73" x2="188.21" y2="82.95"></line>
                      <line className="cls-5" x1="188.21" y1="164.19" x2="188.21" y2="97.95"></line>
                      <line className="cls-5" x1="188.21" y1="82.95" x2="245.32" y2="82.95"></line>
                      <line className="cls-5" x1="212.85" y1="66.73" x2="269.96" y2="66.73"></line>
                      <path className="cls-6" d="M52.84,111.76a9.56,9.56,0,0,0-19.12,0v22H52.84Z"></path>
                      <path className="cls-7" d="M226.33,113.27v-1.51a9.56,9.56,0,0,0-19.12,0v21h19.12V113.27Z"></path>
                      <line className="cls-5" x1="103.16" y1="24.77" x2="70.97" y2="48.49"></line>
                      <rect className="cls-5" x="89.07" y="64.21" width="47.88" height="61.25"></rect>
                      <line className="cls-5" x1="89.07" y1="94.83" x2="124.95" y2="94.83"></line>
                      <line className="cls-5" x1="113.01" y1="125.46" x2="113.01" y2="76.21"></line>
                    </g>
                  </g>
                </svg>
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
            
            {/* SVG images for sunlight options */}
            <div className="flex justify-center my-4 h-32">
              {formData.sunlight === 'full' && (
                <svg viewBox="0 0 200 100" className="h-full">
                  <rect x="40" y="50" width="120" height="50" fill="#a0aec0" />
                  <polygon points="40,50 100,20 160,50" fill="#4a5568" />
                  <circle cx="160" cy="30" r="15" fill="#FFEB3B" />
                  <line x1="160" y1="5" x2="160" y2="15" stroke="#FFEB3B" strokeWidth="2" />
                  <line x1="160" y1="45" x2="160" y2="55" stroke="#FFEB3B" strokeWidth="2" />
                  <line x1="145" y1="30" x2="135" y2="30" stroke="#FFEB3B" strokeWidth="2" />
                  <line x1="185" y1="30" x2="175" y2="30" stroke="#FFEB3B" strokeWidth="2" />
                  <line x1="150" y1="20" x2="142" y2="12" stroke="#FFEB3B" strokeWidth="2" />
                  <line x1="170" y1="20" x2="178" y2="12" stroke="#FFEB3B" strokeWidth="2" />
                  <line x1="150" y1="40" x2="142" y2="48" stroke="#FFEB3B" strokeWidth="2" />
                  <line x1="170" y1="40" x2="178" y2="48" stroke="#FFEB3B" strokeWidth="2" />
                </svg>
              )}
              {formData.sunlight === 'partial' && (
                <svg viewBox="0 0 200 100" className="h-full">
                  <rect x="40" y="50" width="120" height="50" fill="#a0aec0" />
                  <polygon points="40,50 100,20 160,50" fill="#4a5568" />
                  <circle cx="160" cy="30" r="15" fill="#FFEB3B" />
                  <path d="M130,15 L180,15 L180,45 L130,45 Z" fill="#a0aec0" fillOpacity="0.5" />
                  <line x1="160" y1="5" x2="160" y2="15" stroke="#FFEB3B" strokeWidth="2" />
                  <line x1="160" y1="45" x2="160" y2="55" stroke="#FFEB3B" strokeWidth="2" strokeOpacity="0.5" />
                </svg>
              )}
              {formData.sunlight === 'little' && (
                <svg viewBox="0 0 200 100" className="h-full">
                  <rect x="40" y="50" width="120" height="50" fill="#a0aec0" />
                  <polygon points="40,50 100,20 160,50" fill="#4a5568" />
                  <circle cx="160" cy="30" r="15" fill="#FFEB3B" />
                  <rect x="120" y="5" width="70" height="60" fill="#718096" fillOpacity="0.7" />
                  <path d="M120,5 L145,20 L145,50 L120,65 Z" fill="#2D3748" fillOpacity="0.7" />
                </svg>
              )}
              {!formData.sunlight && (
                <svg viewBox="0 0 200 100" className="h-full">
                  <rect x="40" y="50" width="120" height="50" fill="#e2e8f0" stroke="#a0aec0" strokeWidth="2" strokeDasharray="5,5" />
                  <polygon points="40,50 100,20 160,50" fill="#e2e8f0" stroke="#a0aec0" strokeWidth="2" strokeDasharray="5,5" />
                  <circle cx="160" cy="30" r="15" fill="#e2e8f0" stroke="#a0aec0" strokeWidth="2" strokeDasharray="5,5" />
                </svg>
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