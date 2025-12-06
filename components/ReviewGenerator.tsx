import React, { useState } from 'react';
import { BusinessProfile, Language, ReviewData, Tone } from '../types';
import { generateReviewReply } from '../services/geminiService';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { StarIcon as StarIconOutline } from '@heroicons/react/24/outline';
import { 
  ClipboardDocumentCheckIcon, 
  ClipboardDocumentIcon, 
  SparklesIcon, 
  ArrowPathIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';

interface ReviewGeneratorProps {
  businessProfile: BusinessProfile;
  onEditProfile: () => void;
}

export const ReviewGenerator: React.FC<ReviewGeneratorProps> = ({ businessProfile, onEditProfile }) => {
  // Input State
  const [reviewerName, setReviewerName] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [reviewContent, setReviewContent] = useState('');
  const [tone, setTone] = useState<Tone>(Tone.Professional);
  const [language, setLanguage] = useState<Language>(Language.Vietnamese);

  // Output State
  const [generatedReply, setGeneratedReply] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!reviewContent.trim()) {
      setError("Please paste the review content first.");
      return;
    }
    setError('');
    setIsLoading(true);
    setGeneratedReply('');
    setCopied(false);

    try {
      const reviewData: ReviewData = {
        reviewerName,
        rating,
        content: reviewContent
      };

      const reply = await generateReviewReply({
        businessProfile,
        review: reviewData,
        tone,
        language
      });

      setGeneratedReply(reply);
    } catch (err) {
      setError("Failed to generate reply. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedReply) {
      navigator.clipboard.writeText(generatedReply);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const renderStars = () => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            className="focus:outline-none transition-transform active:scale-110"
            type="button"
          >
            {star <= rating ? (
              <StarIconSolid className="w-8 h-8 text-amber-400" />
            ) : (
              <StarIconOutline className="w-8 h-8 text-slate-300 hover:text-amber-200" />
            )}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      {/* Left Column: Input */}
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-800">{businessProfile.name}</h3>
              <p className="text-sm text-slate-500">{businessProfile.type}</p>
            </div>
            <button 
              onClick={onEditProfile}
              className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center font-medium"
            >
              <PencilSquareIcon className="w-4 h-4 mr-1" /> Edit Profile
            </button>
          </div>

          <div className="space-y-5">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Customer Rating</label>
              {renderStars()}
            </div>

            {/* Review Content */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Review Content <span className="text-red-500">*</span></label>
              <textarea
                value={reviewContent}
                onChange={(e) => setReviewContent(e.target.value)}
                placeholder="Paste the customer's review here..."
                className="w-full h-32 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none text-slate-700 placeholder-slate-400"
              />
            </div>

            {/* Optional: Reviewer Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Customer Name (Optional)</label>
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>

            {/* Settings Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as Tone)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  {Object.values(Tone).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  {Object.values(Language).map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isLoading || !reviewContent}
              className={`w-full py-3 px-6 rounded-lg font-semibold text-white shadow-md flex items-center justify-center space-x-2 transition-all
                ${isLoading || !reviewContent 
                  ? 'bg-slate-300 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg active:scale-[0.99]'}`}
            >
              {isLoading ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  <span>Generating Reply...</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5" />
                  <span>Generate AI Reply</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Output */}
      <div className="relative">
         <div className="sticky top-6 h-full min-h-[400px]">
            <div className={`h-full bg-white rounded-2xl shadow-lg border border-slate-100 p-8 flex flex-col transition-all duration-500 ${generatedReply ? 'opacity-100 translate-y-0' : 'opacity-90'}`}>
              
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">Generated Reply</h3>
                {generatedReply && (
                  <button
                    onClick={copyToClipboard}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                      ${copied 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {copied ? (
                      <>
                        <ClipboardDocumentCheckIcon className="w-4 h-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <ClipboardDocumentIcon className="w-4 h-4" />
                        <span>Copy Text</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="flex-grow">
                {generatedReply ? (
                  <div className="prose prose-slate max-w-none">
                     <textarea
                        readOnly
                        value={generatedReply}
                        className="w-full h-[350px] p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none font-sans text-base"
                      />
                      <p className="mt-4 text-xs text-slate-400 text-center">
                        AI-generated content may be inaccurate. Please review before posting.
                      </p>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 min-h-[300px]">
                    {isLoading ? (
                      <div className="flex flex-col items-center animate-pulse">
                         <div className="h-4 w-48 bg-slate-300 rounded mb-2"></div>
                         <div className="h-4 w-32 bg-slate-300 rounded mb-2"></div>
                         <div className="h-4 w-40 bg-slate-300 rounded"></div>
                      </div>
                    ) : (
                      <>
                        <SparklesIcon className="w-12 h-12 mb-3 text-slate-300" />
                        <p className="text-sm">Your reply will appear here</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
         </div>
      </div>
    </div>
  );
};
