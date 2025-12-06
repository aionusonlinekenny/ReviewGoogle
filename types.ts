export enum Tone {
  Professional = 'Professional',
  Friendly = 'Friendly',
  Empathetic = 'Empathetic',
  Grateful = 'Grateful',
  Witty = 'Witty'
}

export enum Language {
  Vietnamese = 'Vietnamese',
  English = 'English',
  French = 'French',
  Japanese = 'Japanese'
}

export interface BusinessProfile {
  name: string;
  accountId: string;  // Google Account Resource Name
  locationId: string; // Google Location Resource Name
  accessToken: string; // OAuth Access Token
  isConnected: boolean;
  type?: string;
  signature?: string;
}

export interface ReviewData {
  reviewerName: string;
  rating: number; // 1-5
  content: string;
}

export type ReviewStatus = 'pending' | 'drafted' | 'replied';

export interface GoogleReview {
  id: string; // Review Resource Name (accounts/x/locations/y/reviews/z)
  reviewId: string; // The short ID
  reviewerName: string;
  reviewerAvatar?: string;
  rating: number;
  content: string;
  date: string;
  status: ReviewStatus;
  replyContent?: string;
}

export interface GenerateReplyParams {
  businessProfile: BusinessProfile;
  review: ReviewData;
  tone: Tone;
  language: Language;
}