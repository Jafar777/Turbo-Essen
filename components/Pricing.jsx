// components/Pricing.jsx
'use client';
import { useState, useRef, useEffect } from 'react';
import { FiCheck, FiZap, FiStar, FiShield, FiHeadphones, FiTrendingUp, FiAward } from 'react-icons/fi';

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const cardRef = useRef(null);

  const handleToggle = () => {
    setIsFlipping(true);
    setTimeout(() => {
      setIsYearly(!isYearly);
      setIsFlipping(false);
    }, 300);
  };

  const features = {
    free: [
      { icon: FiCheck, text: 'Food delivery platform access' },
      { icon: FiCheck, text: 'Real-time order notifications' },
      { icon: FiCheck, text: 'Customer rating system' },
      { icon: FiCheck, text: 'Basic delivery tracking' },
      { icon: FiCheck, text: 'Mobile app for drivers' },
      { icon: FiCheck, text: '24/7 customer support' }
    ],
    pro: [
      { icon: FiStar, text: 'Complete restaurant management system' },
      { icon: FiTrendingUp, text: 'Advanced analytics dashboard' },
      { icon: FiShield, text: 'Priority customer support' },
      { icon: FiAward, text: 'Premium listing in search results' },
      { icon: FiHeadphones, text: 'Dedicated account manager' },
      { icon: FiZap, text: 'Custom promotion tools' },
      { icon: FiCheck, text: 'Multi-location management' },
      { icon: FiCheck, text: 'Staff management portal' }
    ]
  };

  return (
    <div id="pricing" className="py-16 bg-gradient-to-br from-gray-50 to-amber-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the plan that works best for your business. No hidden fees, no contracts.
          </p>
        </div>

        {/* Toggle Switch */}
        <div className="flex justify-center items-center space-x-4 mb-12">
          <span className={`text-lg font-medium ${!isYearly ? 'text-amber-600' : 'text-gray-500'}`}>
            Monthly
          </span>
          <button
            onClick={handleToggle}
            className="relative inline-flex h-6 w-12 items-center rounded-full bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          >
            <span
              className={`${
                isYearly ? 'translate-x-6' : 'translate-x-1'
              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ease-in-out`}
            />
          </button>
          <span className={`text-lg font-medium ${isYearly ? 'text-amber-600' : 'text-gray-500'}`}>
            Yearly <span className="text-sm text-green-600 font-normal">(Save 16%)</span>
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan - Always Visible */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden transform hover:scale-105 transition-all duration-300">
            <div className="p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                <p className="text-gray-600">Perfect for delivery drivers</p>
              </div>

              {/* Price */}
              <div className="text-center mb-8">
                <span className="text-5xl font-bold text-gray-900">$0</span>
                <span className="text-gray-600 text-lg">/forever</span>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {features.free.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <feature.icon className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{feature.text}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button className="w-full bg-gray-100 text-gray-800 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors duration-200">
                Start Delivering
              </button>
            </div>
          </div>

          {/* Pro Plan - With Flip Animation */}
          <div 
            ref={cardRef}
            className={`relative h-full ${isFlipping ? 'flipping' : ''}`}
          >
            <div className={`absolute inset-0 w-full h-full transition-all duration-300 ease-in-out ${
              isYearly ? 'opacity-0 rotate-y-90' : 'opacity-100 rotate-y-0'
            }`}>
              {/* Monthly View */}
              <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-xl overflow-hidden h-full transform hover:scale-105 transition-all duration-300">
                <div className="p-8 text-white">
                  {/* Badge */}
                  <div className="inline-flex items-center px-4 py-1 bg-white/20 rounded-full text-sm font-semibold mb-4">
                    <FiStar className="w-4 h-4 mr-1" />
                    Most Popular
                  </div>

                  {/* Header */}
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold mb-2">Restaurant Pro</h3>
                    <p className="text-amber-100">Everything you need to grow</p>
                  </div>

                  {/* Price */}
                  <div className="text-center mb-8">
                    <span className="text-5xl font-bold">$199</span>
                    <span className="text-amber-100 text-lg">/month</span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-4 mb-8">
                    {features.pro.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <feature.icon className="w-5 h-5 text-white mr-3 flex-shrink-0" />
                        <span>{feature.text}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button className="w-full bg-white text-amber-600 py-3 px-6 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200">
                    Start 14-Day Free Trial
                  </button>
                </div>
              </div>
            </div>

            <div className={`absolute inset-0 w-full h-full transition-all duration-300 ease-in-out ${
              isYearly ? 'opacity-100 rotate-y-0' : 'opacity-0 -rotate-y-90'
            }`}>
              {/* Yearly View */}
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl overflow-hidden h-full transform hover:scale-105 transition-all duration-300">
                <div className="p-8 text-white">
                  {/* Save Badge */}
                  <div className="inline-flex items-center px-4 py-1 bg-white/20 rounded-full text-sm font-semibold mb-4">
                    <FiTrendingUp className="w-4 h-4 mr-1" />
                    Save $388
                  </div>

                  {/* Header */}
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold mb-2">Restaurant Pro</h3>
                    <p className="text-green-100">Best value - yearly plan</p>
                  </div>

                  {/* Price */}
                  <div className="text-center mb-8">
                    <div className="flex items-baseline justify-center space-x-2">
                      <span className="text-5xl font-bold">$2,000</span>
                      <span className="text-green-100 text-lg">/year</span>
                    </div>
                    <p className="text-green-200 text-sm mt-2">
                      Equivalent to $167/month
                    </p>
                  </div>

                  {/* Features - Same as monthly */}
                  <ul className="space-y-4 mb-8">
                    {features.pro.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <feature.icon className="w-5 h-5 text-white mr-3 flex-shrink-0" />
                        <span>{feature.text}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button className="w-full bg-white text-green-600 py-3 px-6 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200">
                    Start 14-Day Free Trial
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-center mt-12">
          <p className="text-gray-600 text-lg">
            Both plans include our standard features. No credit card required to start.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center">
              <FiShield className="w-4 h-4 text-green-500 mr-2" />
              Secure payment processing
            </div>
            <div className="flex items-center">
              <FiHeadphones className="w-4 h-4 text-blue-500 mr-2" />
              24/7 customer support
            </div>
            <div className="flex items-center">
              <FiZap className="w-4 h-4 text-amber-500 mr-2" />
              Easy setup in minutes
            </div>
          </div>
        </div>

        <style jsx>{`
          .flipping {
            perspective: 1000px;
          }
          
          .rotate-y-0 {
            transform: rotateY(0deg);
          }
          
          .rotate-y-90 {
            transform: rotateY(90deg);
          }
          
          .-rotate-y-90 {
            transform: rotateY(-90deg);
          }
        `}</style>
      </div>
    </div>
  );
}