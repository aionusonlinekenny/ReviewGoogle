import { BusinessProfile, GoogleReview } from "../types";

/**
 * SCOPES needed for Google Business Profile
 */
const SCOPES = [
  'https://www.googleapis.com/auth/business.manage',
  'https://www.googleapis.com/auth/business.manage.comments' // Deprecated but sometimes needed for fallback
].join(' ');

/**
 * Initializes the Google Token Client
 */
export const initGoogleAuth = (clientId: string, callback: (response: any) => void) => {
  // @ts-ignore
  if (window.google && window.google.accounts) {
    // @ts-ignore
    return window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: callback,
    });
  }
  throw new Error("Google Identity Services script not loaded.");
};

/**
 * 1. Fetch Accounts
 * API: https://mybusinessaccountmanagement.googleapis.com/v1/accounts
 */
export const fetchAccounts = async (accessToken: string) => {
  const response = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) throw new Error('Failed to fetch accounts');
  return response.json();
};

/**
 * 2. Fetch Locations for an Account
 * API: https://mybusinessbusinessinformation.googleapis.com/v1/{accountId}/locations
 */
export const fetchLocations = async (accessToken: string, accountName: string) => {
  const response = await fetch(`https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title,storeCode,latlng`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) throw new Error('Failed to fetch locations');
  return response.json();
};

/**
 * 3. Fetch Reviews for a Location
 * Note: Reviews API is still largely on v4 in some contexts, but let's try the v4 endpoint which is standard for reviews.
 * API: https://mybusiness.googleapis.com/v4/{name}/reviews
 */
export const fetchGoogleReviews = async (accessToken: string, locationName: string): Promise<GoogleReview[]> => {
  // locationName format: accounts/{accountId}/locations/{locationId}
  const url = `https://mybusiness.googleapis.com/v4/${locationName}/reviews`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("API Error:", errorData);
    throw new Error('Failed to fetch reviews. Ensure API is enabled in GCP.');
  }

  const data = await response.json();
  
  if (!data.reviews) return [];

  return data.reviews.map((r: any) => ({
    id: r.name, // Full resource name
    reviewId: r.reviewId,
    reviewerName: r.reviewer.displayName,
    reviewerAvatar: r.reviewer.profilePhotoUrl,
    rating: ["ZERO", "ONE", "TWO", "THREE", "FOUR", "FIVE"].indexOf(r.starRating),
    content: r.comment || "(No content)",
    date: new Date(r.createTime).toLocaleDateString(),
    status: r.reviewReply ? 'replied' : 'pending',
    replyContent: r.reviewReply ? r.reviewReply.comment : undefined
  }));
};

/**
 * 4. Post Reply
 * API: PUT https://mybusiness.googleapis.com/v4/{name}/reply
 */
export const postReplyToGoogle = async (accessToken: string, reviewName: string, reply: string): Promise<boolean> => {
  const url = `https://mybusiness.googleapis.com/v4/${reviewName}/reply`;
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      comment: reply
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Reply Error:", errorData);
    throw new Error('Failed to post reply.');
  }

  return true;
};
