"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface PasswordRequirementsProps {
  password: string;
  isVisible: boolean;
}

const PasswordRequirements = ({ password, isVisible }: PasswordRequirementsProps) => {
  const requirements = [
    {
      id: "length",
      text: "At least 8 characters",
      test: (pwd: string) => pwd.length >= 8,
    },
    {
      id: "lowercase",
      text: "One lowercase letter",
      test: (pwd: string) => /[a-z]/.test(pwd),
    },
    {
      id: "uppercase",
      text: "One uppercase letter",
      test: (pwd: string) => /[A-Z]/.test(pwd),
    },
    {
      id: "number",
      text: "One number",
      test: (pwd: string) => /[0-9]/.test(pwd),
    },
    {
      id: "special",
      text: "One special character",
      test: (pwd: string) => /[^a-zA-Z0-9]/.test(pwd),
    },
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-3 p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl"
        >
          <h4 className="text-sm font-medium text-white/90 mb-3">
            Password Requirements:
          </h4>
          <div className="space-y-2">
            {requirements.map((req, index) => {
              const isValid = req.test(password);
              return (
                <motion.div
                  key={req.id}
                  className="flex items-center space-x-3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <motion.div
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors duration-300 ${
                      isValid 
                        ? "bg-green-500/20 border border-green-500/50" 
                        : "bg-white/10 border border-white/20"
                    }`}
                    animate={{ scale: isValid ? [1, 1.2, 1] : 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {isValid ? (
                      <CheckIcon className="h-3 w-3 text-green-400" />
                    ) : (
                      <XMarkIcon className="h-3 w-3 text-white/40" />
                    )}
                  </motion.div>
                  <span
                    className={`text-sm transition-colors duration-300 ${
                      isValid ? "text-green-400" : "text-white/60"
                    }`}
                  >
                    {req.text}
                  </span>
                </motion.div>
              );
            })}
          </div>
          
          {/* Overall Progress */}
          <div className="mt-4 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-white/70">Password Strength:</span>
              <span className={`font-medium ${
                requirements.filter(req => req.test(password)).length <= 2 
                  ? "text-red-400" 
                  : requirements.filter(req => req.test(password)).length <= 3 
                  ? "text-yellow-400" 
                  : requirements.filter(req => req.test(password)).length <= 4 
                  ? "text-blue-400" 
                  : "text-green-400"
              }`}>
                {requirements.filter(req => req.test(password)).length}/5
              </span>
            </div>
            <div className="flex space-x-1">
              {requirements.map((_, index) => (
                <motion.div
                  key={index}
                  className={`h-2 flex-1 rounded-full transition-colors duration-300 ${
                    index < requirements.filter(req => req.test(password)).length
                      ? requirements.filter(req => req.test(password)).length <= 2
                        ? "bg-red-500"
                        : requirements.filter(req => req.test(password)).length <= 3
                        ? "bg-yellow-500"
                        : requirements.filter(req => req.test(password)).length <= 4
                        ? "bg-blue-500"
                        : "bg-green-500"
                      : "bg-white/20"
                  }`}
                  initial={{ scaleX: 0 }}
                  animate={{ 
                    scaleX: index < requirements.filter(req => req.test(password)).length ? 1 : 0 
                  }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  style={{ transformOrigin: "left" }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PasswordRequirements;
