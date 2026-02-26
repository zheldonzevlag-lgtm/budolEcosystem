import { motion } from 'framer-motion';
import { Check, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

export default function Stepper({ steps, currentStep, setCurrentStep, completedSteps = [], isDisabled = false }) {
  return (
    <div className={clsx("mb-8", isDisabled && "opacity-60 pointer-events-none")}>
      <div className="flex items-center justify-between relative">
        {/* Progress Bar Background */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-10 rounded-full" />

        {/* Active Progress Bar */}
        <motion.div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 -z-10 rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          transition={{ duration: 0.3 }}
        />

        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep || completedSteps.includes(index);
          const isError = step.hasError;

          return (
            <div
              key={index}
              className={clsx(
                "flex flex-col items-center group",
                isDisabled ? "cursor-not-allowed" : "cursor-pointer"
              )}
              onClick={() => !isDisabled && setCurrentStep(index)}
            >
              <div
                className={clsx(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-white",
                  isActive ? "border-blue-600 text-blue-600 scale-110 shadow-md" :
                    isCompleted ? "border-green-500 bg-green-50 text-green-600" :
                      isError ? "border-red-500 text-red-500" : "border-slate-300 text-slate-400 group-hover:border-slate-400"
                )}
              >
                {isCompleted ? <Check size={20} /> : isError ? <AlertTriangle size={20} /> : <span className="font-semibold">{index + 1}</span>}
              </div>
              <span className={clsx(
                "mt-2 text-xs font-medium transition-colors duration-300 absolute top-10 w-32 text-center",
                isActive ? "text-blue-700 font-bold" : "text-slate-500"
              )}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
