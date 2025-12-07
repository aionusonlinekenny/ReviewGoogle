import React, { useState, useEffect } from 'react';
import { BusinessProfile } from '../types';
import { initGoogleAuth, fetchAccounts, fetchLocations } from '../services/googleBusinessService';
import { BuildingStorefrontIcon, ArrowPathIcon, KeyIcon, InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface BusinessConfigProps {
  onConnect: (profile: BusinessProfile) => void;
}

export const BusinessConfig: React.FC<BusinessConfigProps> = ({ onConnect }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [clientId, setClientId] = useState('');
  const [error, setError] = useState('');
  const [originWarning, setOriginWarning] = useState('');

  // Load saved Client ID on mount
  useEffect(() => {
    const savedClientId = localStorage.getItem('google_client_id');
    if (savedClientId) {
      setClientId(savedClientId);
    }

    // Check for common origin mismatch issues
    if (window.location.hostname === '127.0.0.1') {
      setOriginWarning("You are using '127.0.0.1'. Please change the URL in your browser address bar to 'localhost' (e.g., http://localhost:3000) to match Google's security policy.");
    }
  }, []);

  const handleAuth = () => {
    const cleanClientId = clientId.trim();
    
    if (!cleanClientId) {
      setError("Please enter a Google Cloud Client ID.");
      return;
    }

    if (window.location.protocol !== 'http:' && window.location.hostname === 'localhost') {
       // Just a soft warning, usually localhost works on http
    }
    
    // Save Client ID for future convenience
    localStorage.setItem('google_client_id', cleanClientId);
    
    setError('');
    setIsLoading(true);

    try {
      const tokenClient = initGoogleAuth(cleanClientId, async (tokenResponse: any) => {
        if (tokenResponse && tokenResponse.access_token) {
          await fetchBusinessData(tokenResponse.access_token);
        } else {
          console.error("Token response error:", tokenResponse);
          // Check for common error where user closes the popup
          if (tokenResponse?.error === 'popup_closed_by_user') {
            setError("Login cancelled.");
          } else if (tokenResponse?.error === 'access_denied') {
             setError("Access denied. You may have declined the permissions.");
          } else {
            setError("Failed to retrieve access token. Check console for details.");
          }
          setIsLoading(false);
        }
      });
      
      // @ts-ignore
      // Request access token with prompt 'consent' to ensure we get a fresh token
      tokenClient.requestAccessToken({ prompt: 'consent' });
      
    } catch (err: any) {
      setError("Error initializing Google Auth. " + (err.message || ""));
      console.error(err);
      setIsLoading(false);
    }
  };

  const fetchBusinessData = async (accessToken: string) => {
    try {
      // 1. Get Accounts
      const accountsData = await fetchAccounts(accessToken);
      
      if (!accountsData.accounts || accountsData.accounts.length === 0) {
        throw new Error("No Google Business accounts found. Ensure your Google account manages a business.");
      }
      
      const account = accountsData.accounts[0]; // Pick first account for simplicity

      // 2. Get Locations
      const locationsData = await fetchLocations(accessToken, account.name);
      
      if (!locationsData.locations || locationsData.locations.length === 0) {
        throw new Error("No verified locations found for this account.");
      }
      
      const location = locationsData.locations[0]; // Pick first location

      const profile: BusinessProfile = {
        name: location.title || "My Business",
        accountId: account.name,
        locationId: location.name,
        accessToken: accessToken,
        isConnected: true
      };

      onConnect(profile);
    } catch (err: any) {
      console.error(err);
      // specific error handling for 403
      if (err.message && err.message.includes('403')) {
        setError("Access Denied (403). Did you add your email to 'Test Users' in OAuth Consent Screen?");
      } else {
        setError(err.message || "Failed to fetch business profile data.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-2xl shadow-xl p-8 border border-slate-100 text-center animate-fade-in-up">
      <div className="mx-auto w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" 
          alt="Google Logo" 
          className="w-10 h-10"
        />
      </div>
      
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Connect Google Business</h2>
      <p className="text-slate-500 mb-6 text-sm px-4">
        Enter your OAuth 2.0 Client ID to connect your real business profile and manage reviews directly.
      </p>

      {originWarning && (
        <div className="mb-6 p-4 bg-amber-50 text-amber-800 text-xs rounded-xl text-left border border-amber-100 flex items-start">
           <ExclamationTriangleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
           <span>{originWarning}</span>
        </div>
      )}

      <div className="mb-6 text-left">
        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">OAuth 2.0 Client ID</label>
        <div className="relative">
          <KeyIcon className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            onBlur={() => setClientId(clientId.trim())} // Auto-trim on blur
            placeholder="e.g. 123456-abcde.apps.googleusercontent.com"
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm shadow-sm font-mono"
          />
        </div>
        <p className="text-[10px] text-slate-400 mt-1 ml-1">
          Found in Google Cloud Console &gt; APIs & Services &gt; Credentials
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 text-xs rounded-xl text-left border border-red-100 flex items-start">
           <InformationCircleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
           <span>{error}</span>
        </div>
      )}

      <button
        onClick={handleAuth}
        disabled={isLoading || !!originWarning}
        className="w-full flex items-center justify-center space-x-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition duration-200 transform active:scale-[0.98] shadow-md disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
      >
        {isLoading ? (
          <ArrowPathIcon className="w-5 h-5 animate-spin text-white" />
        ) : (
          <BuildingStorefrontIcon className="w-5 h-5 text-white" />
        )}
        <span>{isLoading ? 'Connecting...' : 'Sign in & Connect'}</span>
      </button>

      <div className="mt-8 text-xs text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-100 text-left">
        <strong className="block text-slate-700 mb-1">Setup Checklist for "Invalid Request" errors:</strong>
        <ul className="list-disc list-inside space-y-1">
          <li>Ensure you are accessing via <b>http://localhost:3000</b> (not 127.0.0.1).</li>
          <li>In Cloud Console, <b>Authorized Origins</b> must be exactly <code>http://localhost:3000</code> (no slash at end).</li>
          <li>Client ID must be type <b>Web Application</b>.</li>
          <li>Ensure no spaces in the Client ID field above.</li>
        </ul>
      </div>
    </div>
  );
};