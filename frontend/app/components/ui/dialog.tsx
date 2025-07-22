"use client";

import React, { Fragment } from "react";
import { Dialog as HeadlessDialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  return (
    <Transition appear show={open} as={Fragment}>
      <HeadlessDialog as="div" className="relative z-50" onClose={() => onOpenChange(false)}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              {children}
            </Transition.Child>
          </div>
        </div>
      </HeadlessDialog>
    </Transition>
  );
};

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ children, className = "" }, ref) => {
    return (
      <HeadlessDialog.Panel
        ref={ref}
        className={`w-full transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all ${className}`}
      >
        {children}
      </HeadlessDialog.Panel>
    );
  }
);

DialogContent.displayName = "DialogContent";

const DialogHeader: React.FC<DialogHeaderProps> = ({ children, className = "" }) => {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      {children}
    </div>
  );
};

const DialogTitle: React.FC<DialogTitleProps> = ({ children, className = "" }) => {
  return (
    <HeadlessDialog.Title
      as="h3"
      className={`text-lg font-medium leading-6 text-gray-900 ${className}`}
    >
      {children}
    </HeadlessDialog.Title>
  );
};

const DialogDescription: React.FC<DialogDescriptionProps> = ({ children, className = "" }) => {
  return (
    <HeadlessDialog.Description className={`mt-2 text-sm text-gray-500 ${className}`}>
      {children}
    </HeadlessDialog.Description>
  );
};

// Close button component
interface DialogCloseProps {
  onClose: () => void;
  className?: string;
}

const DialogClose: React.FC<DialogCloseProps> = ({ onClose, className = "" }) => {
  return (
    <button
      type="button"
      className={`rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${className}`}
      onClick={onClose}
    >
      <span className="sr-only">Close</span>
      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
    </button>
  );
};

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose };
