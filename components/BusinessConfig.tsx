import React, { useState } from 'react';
import { BusinessProfile } from '../types';
import { initGoogleAuth, fetchAccounts, fetchLocations } from '../services/googleBusinessService';
import { BuildingStorefrontIcon, ArrowPathIcon, KeyIcon } from '@heroicons/react/24/outline';

interface BusinessConfigProps {
  onConnect: (profile: BusinessProfile) => void;
}

export const BusinessConfig: React.FC<BusinessConfigProps> = ({ onConnect }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [clientId, setClientId] = useState('');
  const [error, setError] = useState('');

  const handleAuth = () => {
    if (!clientId) {
      setError("Please enter a Google Cloud Client ID.");
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const tokenClient = initGoogleAuth(clientId, async (tokenResponse: any) => {
        if (tokenResponse && tokenResponse.access_token) {
          await fetchBusinessData(tokenResponse.access_token);
        } else {
          setError("Failed to retrieve access token.");
          setIsLoading(false);
        }
      });
      // @ts-ignore
      tokenClient.requestAccessToken();
    } catch (err: any) {
      setError("Error initializing Google Auth. Check console.");
      console.error(err);
      setIsLoading(false);
    }
  };

  const fetchBusinessData = async (accessToken: string) => {
    try {
      // 1. Get Accounts
      const accountsData = await fetchAccounts(accessToken);
      if (!accountsData.accounts || accountsData.accounts.length === 0) {
        throw new Error("No Google Business accounts found associated with this user.");
      }
      const account = accountsData.accounts[0]; // Pick first account for simplicity

      // 2. Get Locations
      const locationsData = await fetchLocations(accessToken, account.name);
      if (!locationsData.locations || locationsData.locations.length === 0) {
        throw new Error("No locations found for this account.");
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
      setError(err.message || "Failed to fetch business profile data.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 border border-slate-100 text-center">
      <div className="mx-auto w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" 
          alt="Google Logo" 
          className="w-10 h-10"
        />
      </div>
      
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Connect Google Business</h2>
      <p className="text-slate-500 mb-6 text-sm">
        To use the real API, you must provide a Client ID from Google Cloud Console with the <b>Google Business Profile API</b> enabled.
      </p>

      <div className="mb-6 text-left">
        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">OAuth 2.0 Client ID</label>
        <div className="relative">
          <KeyIcon className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="e.g. 123456-abcde.apps.googleusercontent.com"
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-lg text-left">
          {error}
        </div>
      )}

      <button
        onClick={handleAuth}
        disabled={isLoading}
        className="w-full flex items-center justify-center space-x-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition duration-200 transform active:scale-95 shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <ArrowPathIcon className="w-5 h-5 animate-spin text-white" />
        ) : (
          <BuildingStorefrontIcon className="w-5 h-5 text-white" />
        )}
        <span>{isLoading ? 'Connecting...' : 'Sign in & Connect'}</span>
      </button>

      <div className="mt-6 text-xs text-slate-400 bg-slate-50 p-3 rounded border border-slate-100 text-left">
        <strong>Dev Note:</strong> Ensure your Google Cloud Project has "Google Business Profile API" enabled and "http://localhost:3000" (or your domain) added to Authorized Javascript Origins.
      </div>
    </div>
  );
};
