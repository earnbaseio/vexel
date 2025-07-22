"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, forwardRef } from "react";
import { FieldError } from "react-hook-form";

interface FloatingInputProps {
  label: string;
  type?: string;
  placeholder?: string;
  error?: FieldError;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
  className?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  autoComplete?: string;
  disabled?: boolean;
  required?: boolean;
}

const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
  (
    {
      label,
      type = "text",
      placeholder,
      error,
      icon,
      rightIcon,
      onRightIconClick,
      className = "",
      value,
      onChange,
      onFocus,
      onBlur,
      autoComplete,
      disabled = false,
      required = false,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(false);

    const handleFocus = () => {
      setIsFocused(true);
      onFocus?.();
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      if (e.target) {
        setHasValue(e.target.value.length > 0);
      }
      onBlur?.();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target) {
        setHasValue(e.target.value.length > 0);
      }
      onChange?.(e);
    };

    const isLabelFloating = isFocused || hasValue || value;

    return (
      <div className={`relative ${className}`}>
        {/* Input Container */}
        <motion.div
          className={`relative transition-all duration-300 ${
            isFocused ? "scale-[1.02]" : ""
          }`}
        >
          {/* Icon */}
          {icon && (
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
              <motion.div
                className={`transition-colors duration-300 ${
                  isFocused ? "text-purple-400" : "text-white/50"
                }`}
                animate={{ scale: isFocused ? 1.1 : 1 }}
                transition={{ duration: 0.2 }}
              >
                {icon}
              </motion.div>
            </div>
          )}

          {/* Input Field */}
          <input
            ref={ref}
            type={type}
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            autoComplete={autoComplete}
            disabled={disabled}
            required={required}
            className={`
              w-full h-14 px-4 ${icon ? "pl-12" : ""} ${rightIcon ? "pr-12" : ""}
              bg-white/10 backdrop-blur-md border border-white/20 rounded-xl
              text-white placeholder-transparent
              focus:outline-none focus:border-purple-400 focus:bg-white/15
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-300
              ${error ? "border-red-400 focus:border-red-400" : ""}
            `}
            placeholder={placeholder || label}
            {...props}
          />

          {/* Floating Label */}
          <motion.label
            className={`
              absolute left-4 ${icon ? "left-12" : ""} pointer-events-none
              transition-all duration-300 ease-out
              ${
                isLabelFloating
                  ? "top-2 text-xs text-purple-400 font-medium"
                  : "top-1/2 transform -translate-y-1/2 text-white/70"
              }
              ${error && isLabelFloating ? "text-red-400" : ""}
            `}
            animate={{
              y: isLabelFloating ? -8 : 0,
              scale: isLabelFloating ? 0.85 : 1,
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {label}
            {required && <span className="text-red-400 ml-1">*</span>}
          </motion.label>

          {/* Right Icon */}
          {rightIcon && (
            <button
              type="button"
              onClick={onRightIconClick}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white transition-colors duration-200"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {rightIcon}
              </motion.div>
            </button>
          )}

          {/* Focus Ring */}
          <motion.div
            className="absolute inset-0 rounded-xl pointer-events-none"
            initial={false}
            animate={{
              boxShadow: isFocused
                ? "0 0 0 2px rgba(147, 51, 234, 0.3)"
                : "0 0 0 0px rgba(147, 51, 234, 0)",
            }}
            transition={{ duration: 0.2 }}
          />
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-2"
            >
              <div className="flex items-center space-x-2 text-red-400 text-sm">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="w-4 h-4 rounded-full bg-red-400/20 flex items-center justify-center"
                >
                  <span className="text-xs">!</span>
                </motion.div>
                <span>
                  {error.type === "required" && "This field is required"}
                  {error.type === "minLength" && "Password is too short"}
                  {error.type === "maxLength" && "Password is too long"}
                  {error.type === "pattern" && "Invalid format"}
                  {error.message && error.message}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Indicator */}
        <AnimatePresence>
          {!error && hasValue && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="absolute right-2 top-2 w-3 h-3 bg-green-400 rounded-full"
            />
          )}
        </AnimatePresence>
      </div>
    );
  }
);

FloatingInput.displayName = "FloatingInput";

export default FloatingInput;
