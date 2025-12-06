import React, { useState, useEffect } from 'react';
import { BusinessProfile, GoogleReview, Tone, Language } from '../types';
import { fetchGoogleReviews, postReplyToGoogle } from '../services/googleBusinessService';
import { generateReviewReply } from '../services/geminiService';
import { 
  StarIcon, 
  ArrowPathIcon, 
  CheckCircleIcon, 
  PaperAirplaneIcon, 
  SparklesIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/solid';

interface DashboardProps {
  businessProfile: BusinessProfile;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ businessProfile, onLogout }) => {
  const [reviews, setReviews] = useState<GoogleReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Settings
  const [tone, setTone] = useState<Tone>(Tone.Professional);
  const [language, setLanguage] = useState<Language>(Language.Vietnamese);

  useEffect(() => {
    if (businessProfile.accessToken) {
      loadReviews();
    }
  }, [businessProfile.accessToken]);

  const loadReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use the real service
      const data = await fetchGoogleReviews(businessProfile.accessToken, businessProfile.locationId);
      setReviews(data);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to load reviews. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const generateReply = async (review: GoogleReview) => {
    setProcessingId(review.id);
    try {
      const reply = await generateReviewReply({
        businessProfile,
        review: {
          reviewerName: review.reviewerName,
          rating: review.rating,
          content: review.content
        },
        tone,
        language
      });

      setReviews(prev => prev.map(r => 
        r.id === review.id ? { ...r, status: 'drafted', replyContent: reply } : r
      ));
    } catch (e) {
      console.error(e);
      alert("AI Generation failed.");
    } finally {
      setProcessingId(null);
    }
  };

  const autoGenerateAll = async () => {
    const pendingReviews = reviews.filter(r => r.status === 'pending');
    for (const review of pendingReviews) {
      await generateReply(review);
    }
  };

  const postReply = async (reviewId: string, content: string) => {
    setProcessingId(reviewId);
    try {
      await postReplyToGoogle(businessProfile.accessToken, reviewId, content);
      setReviews(prev => prev.map(r => 
        r.id === reviewId ? { ...r, status: 'replied' } : r
      ));
    } catch (e) {
      console.error(e);
      alert("Failed to post to Google. Check if your API quota is active or if CORS is blocking requests.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReplyChange = (id: string, text: string) => {
    setReviews(prev => prev.map(r => 
      r.id === id ? { ...r, replyContent: text } : r
    ));
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Dashboard Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{businessProfile.name}</h2>
            <p className="text-slate-500 text-xs mt-1">ID: {businessProfile.locationId}</p>
          </div>
          
          <div className="flex items-center space-x-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
            <select 
              value={tone}
              onChange={(e) => setTone(e.target.value as Tone)}
              className="bg-transparent text-sm font-medium text-slate-700 outline-none cursor-pointer"
            >
              {Object.values(Tone).map(t => <option key={t} value={t}>{t} Tone</option>)}
            </select>
            <div className="h-4 w-px bg-slate-300"></div>
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-transparent text-sm font-medium text-slate-700 outline-none cursor-pointer"
            >
              {Object.values(Language).map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div className="flex space-x-3">
             <button 
              onClick={onLogout}
              className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-medium"
            >
              Disconnect
            </button>
            <button 
              onClick={autoGenerateAll}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-semibold transition shadow-md active:scale-95"
            >
              <SparklesIcon className="w-5 h-5" />
              <span>Auto-Draft All</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6 flex items-start space-x-3">
          <ExclamationTriangleIcon className="w-6 h-6 text-red-600 flex-shrink-0" />
          <div>
            <h3 className="text-red-800 font-semibold">Connection Error</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
            <button 
              onClick={loadReviews}
              className="mt-2 text-red-600 text-sm font-bold hover:underline flex items-center"
            >
              <ArrowPathIcon className="w-4 h-4 mr-1" /> Retry
            </button>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        {loading ? (
           <div className="text-center py-20 text-slate-400">
             <ArrowPathIcon className="w-10 h-10 animate-spin mx-auto mb-4" />
             <p>Syncing reviews from Google Business Profile...</p>
           </div>
        ) : reviews.length === 0 && !error ? (
          <div className="text-center py-20 bg-white rounded-xl border border-slate-200 border-dashed">
            <p className="text-slate-500">No reviews found for this location.</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className={`bg-white rounded-xl shadow-sm border transition-all duration-300 ${review.status === 'replied' ? 'border-green-100 bg-green-50/10' : 'border-slate-200'}`}>
              <div className="p-6">
                {/* Review Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    {review.reviewerAvatar ? (
                      <img src={review.reviewerAvatar} alt={review.reviewerName} className="w-10 h-10 rounded-full" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                        {review.reviewerName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold text-slate-800">{review.reviewerName}</h4>
                      <div className="flex items-center space-x-2 text-sm text-slate-500">
                        <div className="flex text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <StarIcon key={i} className={`w-4 h-4 ${i < review.rating ? 'text-amber-400' : 'text-slate-200'}`} />
                          ))}
                        </div>
                        <span>•</span>
                        <span>{review.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                    ${review.status === 'pending' ? 'bg-red-100 text-red-600' : 
                      review.status === 'drafted' ? 'bg-amber-100 text-amber-600' : 
                      'bg-green-100 text-green-600'}`}>
                    {review.status}
                  </div>
                </div>

                {/* Review Content */}
                <p className="text-slate-700 mb-6 pl-14">{review.content}</p>

                {/* Action Area */}
                <div className="pl-14">
                  {review.status === 'replied' ? (
                    <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                      <div className="flex items-center text-green-700 font-semibold text-sm mb-2">
                        <CheckCircleIcon className="w-4 h-4 mr-2" />
                        Posted Reply
                      </div>
                      <p className="text-slate-600 text-sm">{review.replyContent}</p>
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                      {review.status === 'pending' ? (
                        <div className="flex justify-between items-center">
                           <span className="text-slate-500 text-sm italic">No reply yet.</span>
                           <button
                            onClick={() => generateReply(review)}
                            disabled={processingId === review.id}
                            className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 font-medium text-sm disabled:opacity-50"
                          >
                            {processingId === review.id ? (
                              <ArrowPathIcon className="w-4 h-4 animate-spin" />
                            ) : (
                              <SparklesIcon className="w-4 h-4" />
                            )}
                            <span>Generate AI Reply</span>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center mb-1">
                             <span className="text-xs font-semibold text-slate-500 uppercase">Draft Reply</span>
                             <button
                                onClick={() => generateReply(review)} // Re-generate
                                className="text-xs text-indigo-600 hover:underline flex items-center"
                              >
                                <ArrowPathIcon className="w-3 h-3 mr-1" /> Regenerate
                              </button>
                          </div>
                          <textarea
                            value={review.replyContent}
                            onChange={(e) => handleReplyChange(review.id, e.target.value)}
                            className="w-full p-3 text-sm rounded-md border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                            rows={3}
                          />
                          <div className="flex justify-end">
                            <button
                              onClick={() => postReply(review.id, review.replyContent || '')}
                              disabled={processingId === review.id}
                              className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                            >
                               {processingId === review.id ? (
                                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                ) : (
                                  <PaperAirplaneIcon className="w-4 h-4" />
                                )}
                              <span>Post Reply</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
