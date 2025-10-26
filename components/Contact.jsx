// components/Contact.jsx
'use client';
import { useState } from 'react';
import { 
  FiMail, 
  FiPhone, 
  FiMapPin, 
  FiSend,
  FiClock,
  FiMessageCircle,
  FiUser,
  FiCheckCircle
} from 'react-icons/fi';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      
      // Reset success message after 5 seconds
      setTimeout(() => setIsSubmitted(false), 5000);
    }, 2000);
  };

  const contactInfo = [
    {
      icon: FiMail,
      title: 'Email Us',
      content: 'info@turboessen.com',
      description: 'Send us an email anytime',
      link: 'mailto:info@turboessen.com'
    },
    {
      icon: FiPhone,
      title: 'Call Us',
      content: '+1 (555) 123-4567',
      description: 'Mon-Fri from 8am to 6pm',
      link: 'tel:+15551234567'
    },
    {
      icon: FiMapPin,
      title: 'Visit Us',
      content: '123 Food Street, City',
      description: 'Visit our headquarters',
      link: 'https://maps.google.com'
    },
    {
      icon: FiClock,
      title: 'Business Hours',
      content: '24/7 Support',
      description: 'Were here whenever you need us',
      link: null
    }
  ];

  return (
    <div id="contacts" className="py-20 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            Get In Touch
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Have questions about our platform? We'd love to hear from you. 
            Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold mb-6 flex items-center">
                <FiMessageCircle className="w-6 h-6 mr-3 text-amber-400" />
                Let's Start a Conversation
              </h3>
              <p className="text-gray-300 text-lg mb-8">
                Whether you're a restaurant owner looking to grow your business 
                or a delivery driver seeking opportunities, we're here to help 
                you succeed in the food delivery industry.
              </p>
            </div>

            {/* Contact Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {contactInfo.map((item, index) => (
                <div 
                  key={index}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-amber-500/50 transition-all duration-300 hover:transform hover:-translate-y-1"
                >
                  <div className="flex items-start space-x-4">
                    <div className="bg-amber-500/10 p-3 rounded-lg">
                      <item.icon className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">{item.title}</h4>
                      {item.link ? (
                        <a 
                          href={item.link}
                          className="text-amber-400 hover:text-amber-300 transition-colors block mb-1"
                        >
                          {item.content}
                        </a>
                      ) : (
                        <p className="text-amber-400 mb-1">{item.content}</p>
                      )}
                      <p className="text-gray-400 text-sm">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Additional Info */}
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl p-6 border border-amber-500/20">
              <h4 className="font-semibold text-amber-400 mb-2">Why Choose TurboEssen?</h4>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center">
                  <FiCheckCircle className="w-4 h-4 text-green-400 mr-2" />
                  Fast response time (usually within 2 hours)
                </li>
                <li className="flex items-center">
                  <FiCheckCircle className="w-4 h-4 text-green-400 mr-2" />
                  Dedicated support team
                </li>
                <li className="flex items-center">
                  <FiCheckCircle className="w-4 h-4 text-green-400 mr-2" />
                  Custom solutions for your business
                </li>
              </ul>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
            <h3 className="text-2xl font-bold mb-6 flex items-center">
              <FiSend className="w-6 h-6 mr-3 text-amber-400" />
              Send us a Message
            </h3>

            {isSubmitted ? (
              <div className="text-center py-12">
                <FiCheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h4 className="text-2xl font-bold text-white mb-2">Message Sent!</h4>
                <p className="text-gray-300">
                  Thank you for contacting us. We'll get back to you within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                      Full Name *
                    </label>
                    <div className="relative">
                      <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-white placeholder-gray-400 transition-all duration-200"
                        placeholder="Your full name"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-white placeholder-gray-400 transition-all duration-200"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-white placeholder-gray-400 transition-all duration-200"
                    placeholder="What's this about?"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-white placeholder-gray-400 transition-all duration-200 resize-none"
                    placeholder="Tell us how we can help you..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 px-6 rounded-lg font-semibold hover:from-amber-600 hover:to-orange-600 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Sending Message...
                    </>
                  ) : (
                    <>
                      <FiSend className="w-5 h-5 mr-2" />
                      Send Message
                    </>
                  )}
                </button>

                <p className="text-gray-400 text-sm text-center">
                  We typically respond within 2-4 hours during business days.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}