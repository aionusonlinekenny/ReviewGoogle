import { GoogleGenAI } from "@google/genai";
import { GenerateReplyParams } from '../types';

// Initialize the API client
// Note: API Key is injected via process.env.API_KEY automatically in this environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateReviewReply = async (params: GenerateReplyParams): Promise<string> => {
  const { businessProfile, review, tone, language } = params;

  const prompt = `
    You are an expert social media manager and customer experience specialist for a business.
    
    Business Details:
    - Name: ${businessProfile.name}
    - Industry/Type: ${businessProfile.type || 'General Business'}
    ${businessProfile.signature ? `- Sign-off: ${businessProfile.signature}` : ''}

    The Customer Review:
    - Reviewer: ${review.reviewerName || "A valued customer"}
    - Rating: ${review.rating} / 5 stars
    - Content: "${review.content}"

    Your Task:
    Write a reply to this review in ${language}.
    
    Guidelines:
    1. Tone: ${tone}.
    2. Be specific to the review content. Address their specific praise or complaints.
    3. If the rating is low (1-3 stars), be apologetic, professional, and offer a way to resolve it (e.g., "please contact us").
    4. If the rating is high (4-5 stars), be grateful and inviting.
    5. Keep it concise but human-sounding. 
    6. Do not include placeholders like "[Phone Number]" unless you genericize it to "our office".
    7. Just output the reply text, no markdown formatting for headers.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7, // Balance between creativity and professionalism
        topK: 40,
        topP: 0.95,
      }
    });

    return response.text || "Could not generate a reply. Please try again.";
  } catch (error) {
    console.error("Error generating reply:", error);
    throw new Error("Failed to generate reply. Please check your connection or API limit.");
  }
};