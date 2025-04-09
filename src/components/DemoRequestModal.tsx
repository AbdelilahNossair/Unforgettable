import React, { useState } from 'react';
import { X } from 'lucide-react';

interface DemoRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DemoRequestData {
  eventName: string;
  eventDescription: string;
  attendeeCount: string;
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string;
}

export const DemoRequestModal: React.FC<DemoRequestModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState<DemoRequestData>({
    eventName: '',
    eventDescription: '',
    attendeeCount: '',
    requesterName: '',
    requesterEmail: '',
    requesterPhone: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');
    
    try {
      // Send the estimate request via the API endpoint
      const response = await fetch('/api/send-demo-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send estimate request');
      }
      
      setSubmitSuccess(true);
      setSubmitMessage('Your estimate request has been sent successfully! We will contact you soon with pricing details.');
      
      // Reset form after successful submission
      setFormData({
        eventName: '',
        eventDescription: '',
        attendeeCount: '',
        requesterName: '',
        requesterEmail: '',
        requesterPhone: ''
      });
      
      // Close modal after 3 seconds
      setTimeout(() => {
        onClose();
        setSubmitSuccess(false);
        setSubmitMessage('');
      }, 3000);
      
    } catch (error) {
      console.error('Error sending estimate request:', error);
      setSubmitSuccess(false);
      setSubmitMessage('Failed to send your request. Please try again or contact us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>
      
      {/* Modal */}
      <div className="bg-white dark:bg-gray-800 w-full max-w-md p-6 rounded shadow-lg z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-medium">Request Estimate</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Explanatory message at the top */}
        <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-md mb-6 text-sm">
          <p className="text-blue-800 dark:text-blue-300">
            Please provide details about your event to receive a personalized cost estimate. Our team will review your information and contact you with pricing options tailored to your specific needs.
          </p>
        </div>
        
        {submitSuccess ? (
          <div className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 p-4 rounded-md mb-4">
            {submitMessage}
          </div>
        ) : submitMessage ? (
          <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 p-4 rounded-md mb-4">
            {submitMessage}
          </div>
        ) : null}
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-white">
                Event Name
              </label>
              <input
                type="text"
                name="eventName"
                value={formData.eventName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                placeholder="Wedding, Conference, Concert, etc."
              />
            </div>
            
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-white">
                Event Description
              </label>
              <textarea
                name="eventDescription"
                value={formData.eventDescription}
                onChange={handleChange}
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                placeholder="Brief description of your event"
              ></textarea>
            </div>
            
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-white">
                Expected Number of Attendees
              </label>
              <input
                type="number"
                name="attendeeCount"
                value={formData.attendeeCount}
                onChange={handleChange}
                required
                min="1"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                placeholder="100"
              />
            </div>
            
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-white">
                Your Name
              </label>
              <input
                type="text"
                name="requesterName"
                value={formData.requesterName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                placeholder="Your full name"
              />
            </div>
            
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-white">
                Email Address
              </label>
              <input
                type="email"
                name="requesterEmail"
                value={formData.requesterEmail}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                placeholder="your.email@example.com"
              />
            </div>
            
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-white">
                Phone Number
              </label>
              <input
                type="tel"
                name="requesterPhone"
                value={formData.requesterPhone}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                placeholder="+212 666 123456"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Sending...' : 'Submit Estimate Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};