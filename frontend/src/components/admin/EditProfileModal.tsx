import React, { useState, useEffect } from 'react';
import { FiX, FiUser, FiPhone, FiMail, FiSave, FiLoader } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface UserProfile {
  id: number;
  uuid: string;
  email: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  phone: string | null;
  avatar_url: string | null;
}

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onProfileUpdate: (updatedUser: UserProfile) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,  
  user,
  onProfileUpdate,
}) => {
  const { api } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
      });
      setErrors({});
    }
  }, [user, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.first_name && formData.first_name.length < 2) {
      newErrors.first_name = 'First name must be at least 2 characters';
    }

    if (formData.last_name && formData.last_name.length < 2) {
      newErrors.last_name = 'Last name must be at least 2 characters';
    }

    if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        first_name: formData.first_name.trim() || null,
        last_name: formData.last_name.trim() || null,
        phone: formData.phone.trim() || null,
      };

      const response = await api.put('/users/profile', updateData);
      
      onProfileUpdate(response.data);
      toast.success('Profile updated successfully!');
      onClose();
    } catch (error: unknown) {
      console.error('Failed to update profile:', error);
      
      const axiosError = error as { response?: { data?: { detail?: unknown } } };
      if (axiosError.response?.data?.detail) {
        if (typeof axiosError.response.data.detail === 'string') {
          toast.error(axiosError.response.data.detail);
        } else if (Array.isArray(axiosError.response.data.detail)) {
          const errorMessages = axiosError.response.data.detail.map((err: { msg?: string; message?: string }) => 
            err.msg || err.message || 'Validation error'
          ).join(', ');
          toast.error(errorMessages);
        } else {
          toast.error('Failed to update profile');
        }
      } else {
        toast.error('Failed to update profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: '#0000009e' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <FiUser className="text-white text-xl" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Edit Profile</h2>
                <p className="text-blue-100 text-sm">Update your account information</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              disabled={loading}
              style={{ cursor: 'pointer' }}
            >
              <FiX className="text-white text-xl" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {/* Email (Read-only) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed for security reasons</p>
          </div>

          {/* Username (Read-only) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Username
            </label>
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={user?.username || ''}
                disabled
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
          </div>

          {/* First Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              First Name
            </label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => handleInputChange('first_name', e.target.value)}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                errors.first_name 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-200 focus:border-blue-300'
              }`}
              placeholder="Enter first name"
              disabled={loading}
            />
            {errors.first_name && (
              <p className="text-red-600 text-sm mt-1">{errors.first_name}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Last Name
            </label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => handleInputChange('last_name', e.target.value)}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                errors.last_name 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-200 focus:border-blue-300'
              }`}
              placeholder="Enter last name"
              disabled={loading}
            />
            {errors.last_name && (
              <p className="text-red-600 text-sm mt-1">{errors.last_name}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  errors.phone 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-200 focus:border-blue-300'
                }`}
                placeholder="Enter phone number"
                disabled={loading}
              />
            </div>
            {errors.phone && (
              <p className="text-red-600 text-sm mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              disabled={loading}
              style={{ cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ cursor: 'pointer' }}
            >
              {loading ? (
                <>
                  <FiLoader className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <FiSave />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
