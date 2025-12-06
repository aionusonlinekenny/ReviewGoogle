import React, { useState, useEffect } from 'react';
import { BusinessProfile } from './types';
import { BusinessConfig } from './components/BusinessConfig';
import { Dashboard } from './components/Dashboard';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';

export default function App() {
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('businessProfile');
    if (savedProfile) {
      try {
        setBusinessProfile(JSON.parse(savedProfile));
      } catch (e) {
        console.error("Failed to parse saved profile");
      }
    }
  }, []);

  const handleConnectProfile = (profile: BusinessProfile) => {
    setBusinessProfile(profile);
    localStorage.setItem('businessProfile', JSON.stringify(profile));
  };

  const handleDisconnect = () => {
    setBusinessProfile(null);
    localStorage.removeItem('businessProfile');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-sm">
              <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              ReviewReply AI
            </h1>
          </div>
          {businessProfile && (
             <div className="flex items-center space-x-4">
                <div className="hidden md:flex flex-col items-end">
                   <span className="text-sm font-semibold text-slate-800">{businessProfile.name}</span>
                   <span className="text-xs text-green-600 flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                      Connected
                   </span>
                </div>
             </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-4 sm:p-8">
        {!businessProfile ? (
          <div className="flex flex-col items-center justify-center min-h-[80vh] animate-fade-in-up">
            <BusinessConfig onConnect={handleConnectProfile} />
          </div>
        ) : (
          <div className="animate-fade-in">
             <Dashboard 
                businessProfile={businessProfile} 
                onLogout={handleDisconnect}
             />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
          <p>&copy; {new Date().getFullYear()} ReviewReply AI. Powered by Google Gemini.</p>
        </div>
      </footer>
    </div>
  );
}