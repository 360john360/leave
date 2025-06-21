
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { KeyIcon, BellAlertIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const changePasswordMock = async (userId: string, oldPass: string, newPass: string): Promise<{success: boolean, message: string}> => {
    console.log(`Password change attempt for ${userId}: old '${oldPass}', new '${newPass}'`);
    return new Promise(resolve => {
        setTimeout(() => {
            if (!oldPass || !newPass) { // Basic validation
                resolve({success: false, message: "Old and new passwords are required (mock)."});
                return;
            }
            if (oldPass === "password123") { 
                 resolve({success: true, message: "Password changed successfully."});
            } else {
                 resolve({success: false, message: "Incorrect current password. Please try again."});
            }
        }, 1000);
    });
};

const SettingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [prefsMessage, setPrefsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);


  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
        setPasswordMessage({ type: 'error', text: 'New password must be at least 8 characters long.' });
        return;
    }
    if (!currentUser) return;

    setIsChangingPassword(true);
    const result = await changePasswordMock(currentUser.id, currentPassword, newPassword);
    setIsChangingPassword(false);

    setPasswordMessage({ type: result.success ? 'success' : 'error', text: result.message });
    if (result.success) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    }
  };

  const handlePreferencesSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPrefsMessage(null);
    setIsSavingPrefs(true);
    // Mock saving preferences
    console.log("Saving preferences:", { emailNotifications, smsNotifications });
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API call
    setIsSavingPrefs(false);
    setPrefsMessage({type: 'success', text: "Notification preferences saved successfully."});
  };


  if (!currentUser) {
    return (
         <div className="flex justify-center items-center h-full p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary"></div>
            <span className="ml-3 text-brand-text-secondary">Loading settings...</span>
        </div>
    );
  }

  const renderMessage = (message: {type: 'success' | 'error', text: string} | null) => {
    if (!message) return null;
    return (
        <div className={`p-3 rounded-md text-sm mt-1 ${message.type === 'success' ? 'bg-green-50 text-brand-success' : 'bg-red-50 text-brand-error'}`}>
            {message.text}
        </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-brand-text">Settings</h1>
        <p className="mt-1 text-sm text-brand-text-secondary">Manage your account preferences and security settings.</p>
      </div>

      <div className="bg-white shadow-xl rounded-lg border border-brand-border">
        <div className="p-5 sm:p-6 border-b border-brand-border">
            <h2 className="text-lg font-semibold text-brand-text flex items-center">
                <KeyIcon className="h-5 w-5 mr-2 text-brand-primary" />
                Change Password
            </h2>
        </div>
        <form onSubmit={handlePasswordChange} className="p-5 sm:p-6 space-y-4">
          <Input
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            autoComplete="current-password"
            wrapperClassName="max-w-md"
          />
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            autoComplete="new-password"
            wrapperClassName="max-w-md"
            placeholder="Minimum 8 characters"
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            wrapperClassName="max-w-md"
          />
          {renderMessage(passwordMessage)}
          <div className="pt-2 flex justify-end">
            <Button type="submit" variant="primary" isLoading={isChangingPassword} disabled={isChangingPassword}>
              Update Password
            </Button>
          </div>
        </form>
      </div>

      <div className="bg-white shadow-xl rounded-lg border border-brand-border">
        <div className="p-5 sm:p-6 border-b border-brand-border">
            <h2 className="text-lg font-semibold text-brand-text flex items-center">
                <BellAlertIcon className="h-5 w-5 mr-2 text-brand-primary" />
                Notification Preferences
            </h2>
        </div>
        <form onSubmit={handlePreferencesSave} className="p-5 sm:p-6 space-y-5">
            <fieldset className="space-y-3">
                <legend className="sr-only">Notification Types</legend>
                <div className="relative flex items-start">
                    <div className="flex h-6 items-center">
                    <input 
                        id="emailNotifications" 
                        name="emailNotifications"
                        type="checkbox" 
                        checked={emailNotifications} 
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                        className="h-4 w-4 rounded border-brand-border text-brand-primary focus:ring-brand-primary"
                    />
                    </div>
                    <div className="ml-3 text-sm leading-6">
                        <label htmlFor="emailNotifications" className="font-medium text-brand-text">
                            Email Notifications
                        </label>
                        <p className="text-xs text-brand-text-secondary">Receive emails for leave approvals, shift changes, and system alerts.</p>
                    </div>
                </div>
                <div className="relative flex items-start">
                    <div className="flex h-6 items-center">
                    <input 
                        id="smsNotifications" 
                        name="smsNotifications"
                        type="checkbox" 
                        checked={smsNotifications} 
                        onChange={(e) => setSmsNotifications(e.target.checked)}
                        className="h-4 w-4 rounded border-brand-border text-brand-primary focus:ring-brand-primary"
                    />
                    </div>
                    <div className="ml-3 text-sm leading-6">
                        <label htmlFor="smsNotifications" className="font-medium text-brand-text">
                            SMS Alerts (Mock)
                        </label>
                        <p className="text-xs text-brand-text-secondary">Get text messages for urgent matters (e.g., last-minute shift changes).</p>
                    </div>
                </div>
            </fieldset>
            {renderMessage(prefsMessage)}
            <div className="pt-2 flex justify-end">
                <Button type="submit" variant="secondary" isLoading={isSavingPrefs} disabled={isSavingPrefs}>
                    Save Preferences
                </Button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
