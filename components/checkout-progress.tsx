"use client"

import { CheckCircle, Circle, CreditCard, MapPin, User, ShoppingBag } from "lucide-react"

interface CheckoutStep {
  id: number
  title: string
  icon: any
  completed: boolean
  current: boolean
}

interface CheckoutProgressProps {
  currentStep: number
  className?: string
}

export const CheckoutProgress = ({ currentStep, className = "" }: CheckoutProgressProps) => {
  const steps: CheckoutStep[] = [
    { 
      id: 1, 
      title: "Details", 
      icon: User, 
      completed: currentStep > 1, 
      current: currentStep === 1 
    },
    { 
      id: 2, 
      title: "Checkout", 
      icon: CreditCard, 
      completed: currentStep > 2, 
      current: currentStep === 2 
    },
    { 
      id: 3, 
      title: "Confirmation", 
      icon: CheckCircle, 
      completed: currentStep > 3, 
      current: currentStep === 3 
    },
  ]

  return (
    <div className={`w-full max-w-4xl mx-auto mb-6 sm:mb-8 ${className}`}>
      {/* Progress Bar Container */}
      <div className="relative">
        {/* Background Progress Bar */}
        <div className="w-full h-3 bg-gray-200 rounded-full" />
        
        {/* Filled Progress Bar */}
        <div 
          className="absolute top-0 left-0 h-3 bg-blue-500 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${Math.max(0, (currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />
        
        {/* Step Circles with Numbers */}
        <div className="absolute top-0 left-0 w-full h-3 flex justify-between items-center px-1">
          {steps.map((step) => (
            <div 
              key={step.id} 
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                step.id <= currentStep 
                  ? 'bg-blue-500 text-white border-2 border-white shadow-sm' 
                  : 'bg-gray-300 text-gray-600 border-2 border-white'
              }`}
            >
              {step.id}
            </div>
          ))}
        </div>
      </div>
      
      {/* Step Labels */}
      <div className="flex justify-between mt-4">
        {steps.map((step) => (
          <div 
            key={step.id} 
            className={`text-sm font-medium text-center transition-colors duration-300 ${
              step.id <= currentStep 
                ? 'text-blue-600' 
                : 'text-gray-500'
            }`}
          >
            {step.title}
          </div>
        ))}
      </div>
    </div>
  )
}
