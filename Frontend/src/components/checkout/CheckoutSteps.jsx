// Frontend/src/components/checkout/CheckoutSteps.jsx
import React from 'react';
import { Check, Circle } from 'lucide-react';

const CheckoutSteps = ({ currentStep, steps }) => {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                index < currentStep
                  ? 'bg-green-500 border-green-500 text-white'
                  : index === currentStep
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-gray-100 border-gray-300 text-gray-400'
              }`}
            >
              {index < currentStep ? (
                <Check className="h-6 w-6" />
              ) : (
                <span className="font-semibold">{index + 1}</span>
              )}
            </div>
            <span
              className={`text-sm mt-2 font-medium ${
                index <= currentStep ? 'text-gray-900' : 'text-gray-400'
              }`}
            >
              {step}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`flex-1 h-1 mx-4 transition-colors ${
                index < currentStep ? 'bg-green-500' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default CheckoutSteps;
