// Auth Manager Component - Handles authentication flow and saves workflow state
import React, { useState, useEffect } from 'react';
import { LoginModal } from './LoginModal';
import { SignupModal } from './SignupModal';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { useAuth } from '../../contexts/AuthContext';

type AuthModalType = 'login' | 'signup' | 'forgot-password' | null;

interface AuthManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialMode?: AuthModalType;
}

export const AuthManager: React.FC<AuthManagerProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
}) => {
  const [activeModal, setActiveModal] = useState<AuthModalType>(initialMode);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      handleSuccess();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isOpen) {
      setActiveModal(initialMode);
    }
  }, [isOpen, initialMode]);

  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  const handleClose = () => {
    setActiveModal(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <LoginModal
        isOpen={activeModal === 'login'}
        onClose={handleClose}
        onSwitchToSignup={() => setActiveModal('signup')}
        onSwitchToForgotPassword={() => setActiveModal('forgot-password')}
        onSuccess={handleSuccess}
      />
      <SignupModal
        isOpen={activeModal === 'signup'}
        onClose={handleClose}
        onSwitchToLogin={() => setActiveModal('login')}
        onSuccess={handleSuccess}
      />
      <ForgotPasswordModal
        isOpen={activeModal === 'forgot-password'}
        onClose={handleClose}
        onSwitchToLogin={() => setActiveModal('login')}
      />
    </>
  );
};

// Hook to save and restore workflow state
export const useSavedWorkflow = () => {
  const saveWorkflowState = (file: File | null, workflowData: any) => {
    if (file) {
      // Save file to localStorage as base64
      const reader = new FileReader();
      reader.onload = () => {
        const savedData = {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileData: reader.result,
          workflowData,
          timestamp: Date.now(),
        };
        localStorage.setItem('savedWorkflow', JSON.stringify(savedData));
      };
      reader.readAsDataURL(file);
    }
  };

  const getSavedWorkflow = () => {
    const saved = localStorage.getItem('savedWorkflow');
    if (!saved) return null;

    try {
      const data = JSON.parse(saved);
      // Check if saved data is less than 24 hours old
      if (Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
        localStorage.removeItem('savedWorkflow');
        return null;
      }
      return data;
    } catch {
      return null;
    }
  };

  const clearSavedWorkflow = () => {
    localStorage.removeItem('savedWorkflow');
  };

  const restoreFileFromData = async (fileData: string, fileName: string, fileType: string): Promise<File> => {
    const response = await fetch(fileData);
    const blob = await response.blob();
    return new File([blob], fileName, { type: fileType });
  };

  return {
    saveWorkflowState,
    getSavedWorkflow,
    clearSavedWorkflow,
    restoreFileFromData,
  };
};
