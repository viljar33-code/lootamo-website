import React from 'react';
import { FaExclamationTriangle, FaInfoCircle, FaCheckCircle, FaTimes } from 'react-icons/fa';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info' | 'success';
  confirmButtonClass?: string;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  confirmButtonClass
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <FaExclamationTriangle className="w-6 h-6 text-red-600" />;
      case 'info':
        return <FaInfoCircle className="w-6 h-6 text-blue-600" />;
      case 'success':
        return <FaCheckCircle className="w-6 h-6 text-green-600" />;
      default:
        return <FaExclamationTriangle className="w-6 h-6 text-yellow-600" />;
    }
  };

  const getDefaultButtonClass = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white';
      default:
        return 'bg-yellow-600 hover:bg-yellow-700 text-white';
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      style={{ background: "#000000ab" }}
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {getIcon()}
              <h3 className="text-lg font-semibold text-gray-900">
                {title}
              </h3>
            </div>
            <button
              style={{ cursor: "pointer" }}
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          {/* Message */}
          <div className="mb-6">
            <p className="text-gray-600 leading-relaxed">
              {message}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              style={{ cursor: "pointer" }}
            >
              {cancelText}
            </button>
            <button
              style={{ cursor: "pointer" }}
              onClick={handleConfirm}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                confirmButtonClass || getDefaultButtonClass()
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
