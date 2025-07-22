"use client";

import { motion } from "framer-motion";
import { EnvelopeIcon, InformationCircleIcon } from "@heroicons/react/24/outline";

interface EmailVerificationNoticeProps {
  email: string;
  isVisible: boolean;
}

const EmailVerificationNotice = ({ email, isVisible }: EmailVerificationNoticeProps) => {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 max-w-md w-full shadow-2xl"
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <motion.div
            className="w-16 h-16 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-full flex items-center justify-center"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <EnvelopeIcon className="h-8 w-8 text-green-400" />
          </motion.div>
        </div>

        {/* Content */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-white mb-4">
            Check Your Email
          </h3>
          <p className="text-white/70 mb-6 leading-relaxed">
            We've sent a verification link to{" "}
            <span className="text-purple-400 font-medium">{email}</span>. 
            Please check your inbox and click the link to activate your account.
          </p>

          {/* Info Box */}
          <motion.div
            className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="flex items-start space-x-3">
              <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <p className="text-blue-300 text-sm font-medium mb-1">
                  Didn't receive the email?
                </p>
                <ul className="text-blue-200/80 text-xs space-y-1">
                  <li>• Check your spam/junk folder</li>
                  <li>• Make sure the email address is correct</li>
                  <li>• Wait a few minutes for delivery</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Actions */}
          <div className="space-y-3">
            <motion.button
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.href = "/login"}
            >
              Go to Login
            </motion.button>
            
            <motion.button
              className="w-full px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium rounded-xl hover:bg-white/20 transition-all duration-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                // Resend verification email logic here
                console.log("Resending verification email...");
              }}
            >
              Resend Email
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default EmailVerificationNotice;
