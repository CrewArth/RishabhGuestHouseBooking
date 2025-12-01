import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { toast } from 'react-toastify';
import axios from 'axios';
import './contactUs.css';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    countryCode: '+62',
    phone: '',
    message: ''
  });
  const [charCount, setCharCount] = useState(0);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setCharCount(formData.message.length);
  }, [formData.message]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (formData.phone.replace(/\D/g, '').length < 6) {
      newErrors.phone = 'Phone number must be at least 6 digits';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.length > 120) {
      newErrors.message = 'Message must be 120 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post('http://localhost:5000/api/contact/submit', {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        countryCode: formData.countryCode,
        phone: formData.phone.trim(),
        message: formData.message.trim()
      });

      // Show success toast
      toast.success(response.data.message || 'Thank you for contacting us! We will get back to you soon.', {
        position: 'top-right',
        autoClose: 3000,
      });
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        countryCode: '+62',
        phone: '',
        message: ''
      });
      setCharCount(0);
      setErrors({});
    } catch (error) {
      console.error('Error submitting contact form:', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit form. Please try again later.';
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-page-container">
      <Navbar />
      <div className="contact-hero-section">
        <div className="contact-container">
          <div className="contact-two-column">
            {/* Left Column */}
            <div className="contact-left-column">
              <h1 className="contact-main-heading">Contact Us</h1>
              <p className="contact-description">
                We're here to help! Reach out to us with any questions, feedback, or inquiries.
              </p>
              
              <div className="contact-info-block">
                <p className="contact-info-item">
                  <strong>Email:</strong> <a href="mailto:sales@rishabhsoft.com">sales@rishabhsoft.com</a>
                </p>
                <p className="contact-info-item">
                  <strong>Phone:</strong> <a href="tel:+919913414224">+91 9913414224</a>
                </p>
              </div>


              <div className="contact-info-blocks">
                <div className="contact-info-card">
                  <h3>Customer Support</h3>
                  <p>Get help with bookings, cancellations, and account issues. Our support team is available 24/7.</p>
                </div>
                <div className="contact-info-card">
                  <h3>Feedback & Suggestions</h3>
                  <p>Share your thoughts and help us improve our services. We value your feedback.</p>
                </div>
                <div className="contact-info-card">
                  <h3>Media Inquiries</h3>
                  <p>For press and media related questions, please contact our communications team.</p>
                </div>
              </div>
            </div>

            {/* Right Column - Form Card */}
            <div className="contact-right-column">
              <div className="contact-form-card">
                <h2 className="contact-form-title">Get in Touch</h2>
                <form onSubmit={handleSubmit} className="contact-form">
                  <div className="contact-form-row">
                    <div className="contact-form-group">
                      <label htmlFor="firstName">First Name</label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className={errors.firstName ? 'error' : ''}
                        placeholder="John"
                      />
                      {errors.firstName && <span className="error-message">{errors.firstName}</span>}
                    </div>
                    <div className="contact-form-group">
                      <label htmlFor="lastName">Last Name</label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className={errors.lastName ? 'error' : ''}
                        placeholder="Doe"
                      />
                      {errors.lastName && <span className="error-message">{errors.lastName}</span>}
                    </div>
                  </div>

                  <div className="contact-form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={errors.email ? 'error' : ''}
                      placeholder="john.doe@example.com"
                    />
                    {errors.email && <span className="error-message">{errors.email}</span>}
                  </div>

                  <div className="contact-form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <div className="contact-phone-input">
                      <select
                        id="countryCode"
                        name="countryCode"
                        value={formData.countryCode}
                        onChange={handleChange}
                        className="contact-country-select"
                      >
                        <option value="+62">+62</option>
                        <option value="+1">+1</option>
                        <option value="+44">+44</option>
                        <option value="+91">+91</option>
                        <option value="+61">+61</option>
                      </select>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className={`contact-phone-number ${errors.phone ? 'error' : ''}`}
                        placeholder="123 456 789"
                      />
                    </div>
                    {errors.phone && <span className="error-message">{errors.phone}</span>}
                  </div>

                  <div className="contact-form-group">
                    <label htmlFor="message">Message</label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      className={errors.message ? 'error' : ''}
                      placeholder="Your message here..."
                      rows="5"
                      maxLength="120"
                    />
                    <div className="contact-char-counter">
                      <span className={charCount > 120 ? 'char-over' : ''}>{charCount}/120</span>
                    </div>
                    {errors.message && <span className="error-message">{errors.message}</span>}
                  </div>

                  <button 
                    type="submit" 
                    className="contact-submit-btn"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                  </button>

                  <p className="contact-legal-text">
                    By contacting us, you agree to our <a href="/terms">Terms of service</a> and <a href="/terms">Privacy Policy</a>.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ContactUs;
