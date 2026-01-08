import axios from 'axios';
import { WordList, Word, Exercise, Question, Template, WordDetail, SentenceExample, UserPreferences, ExerciseTypePreferences, ImageDescriptionAnalysis, DescriptionExercise, VocabularyWordsResponse, WordDetailsResponse } from '../types';

// Retrieve tenant ID or JWT from storage
const getTenantId = () => localStorage.getItem('wordpecker-tenant-id');
const getAuthToken = () => localStorage.getItem('wordpecker-auth-token');

// Dynamically determine API URL
// If running in Manus proxy environment, use the proxy URL for port 3000
const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  
  const currentHost = window.location.hostname;
  if (currentHost.includes('manus.computer')) {
    // Replace 5173 with 3000 in the proxy domain
    return `https://${currentHost.replace('5173', '3000')}`;
  }
  
  return 'http://localhost:3000';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

console.log('API Base URL:', getBaseUrl());

// Add request interceptor to include multi-tenancy headers
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    const tenantId = getTenantId();
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    } else if (tenantId) {
      config.headers['x-tenant-id'] = tenantId;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors and unwrap data
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    // If 401 Unauthorized, redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('wordpecker-tenant-id');
      localStorage.removeItem('wordpecker-auth-token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Helper type for API responses
type ApiResponse<T> = Promise<T>;

// Response types
interface LearnStartResponse {
  sessionId: string;
  exercises: Exercise[];
  list: { id: string; name: string; context: string };
}

interface LearnExercisesResponse {
  exercises: Exercise[];
}

interface QuizStartResponse {
  questions: Question[];
  total_questions: number;
  list: { id: string; name: string; context: string };
}

interface QuizQuestionsResponse {
  questions: Question[];
}

// API service for WordPecker app
export const apiService = {
  // Auth
  login: (email: string, password: string): ApiResponse<{token: string, user: any}> => 
    api.post('/api/auth/login', { email, password }),
  register: (name: string, email: string, password: string): ApiResponse<{token: string, user: any}> => 
    api.post('/api/auth/register', { name, email, password }),

  // Lists
  getLists: (): ApiResponse<WordList[]> => api.get('/api/lists'),
  getList: (id: string): ApiResponse<WordList> => api.get(`/api/lists/${id}`),
  createList: (data: Partial<WordList>): ApiResponse<WordList> => api.post('/api/lists', data),
  updateList: (id: string, data: Partial<WordList>): ApiResponse<WordList> => api.put(`/api/lists/${id}`, data),
  deleteList: async (listId: string): Promise<void> => {
    await api.delete(`/api/lists/${listId}`);
  },

  // Words
  getWords: (listId: string): ApiResponse<Word[]> => api.get(`/api/lists/${listId}/words`),
  addWord: (listId: string, word: string, meaning?: string): ApiResponse<Word> => api.post(`/api/lists/${listId}/words`, { word, ...(meaning && { meaning }) }),
  deleteWord: (listId: string, wordId: string): ApiResponse<void> => api.delete(`/api/lists/${listId}/words/${wordId}`),
  validateFillBlankAnswer: (userAnswer: string, correctAnswer: string, question: string, context?: string): ApiResponse<{isValid: boolean}> => 
    api.post('/api/lists/validate-answer', { userAnswer, correctAnswer, question, context }),

  // Learning
  startLearning: (listId: string): ApiResponse<LearnStartResponse> => 
    api.post(`/api/learn/${listId}/start`),
  getExercises: (listId: string): ApiResponse<LearnExercisesResponse> => 
    api.post(`/api/learn/${listId}/more`),
  completeSession: (sessionId: string): ApiResponse<{message: string}> =>
    api.post(`/api/learn/sessions/${sessionId}/complete`),

  // Quiz
  startQuiz: (listId: string): ApiResponse<QuizStartResponse> => 
    api.post(`/api/quiz/${listId}/start`),
  getQuestions: (listId: string): ApiResponse<QuizQuestionsResponse> => 
    api.post(`/api/quiz/${listId}/more`),
  updateLearnedPoints: (listId: string, results: Array<{wordId: string, correct: boolean}>): ApiResponse<{message: string}> =>
    api.put(`/api/quiz/${listId}/learned-points`, { results }),

  // Templates
  getTemplates: (params?: {category?: string, difficulty?: string, search?: string, featured?: boolean}): ApiResponse<Template[]> => 
    api.get('/api/templates', { params }),
  getTemplate: (id: string): ApiResponse<Template> => api.get(`/api/templates/${id}`),
  cloneTemplate: (id: string, name?: string): ApiResponse<WordList> => 
    api.post(`/api/templates/${id}/clone`, { name }),
  getCategories: (): ApiResponse<string[]> => api.get('/api/templates/categories'),

  // Word Details
  getWordDetails: (wordId: string): ApiResponse<WordDetail> => api.get(`/api/lists/word/${wordId}`),
  generateWordSentences: (wordId: string, contextIndex?: number): ApiResponse<{word: string, examples: SentenceExample[]}> => 
    api.post(`/api/lists/word/${wordId}/sentences`, { contextIndex }),
  generateSimilarWords: (wordId: string, contextIndex?: number): ApiResponse<{
    word: string;
    meaning: string;
    context: string;
    similar_words: {
      synonyms: Array<{ word: string; meaning: string; example: string; usage_note?: string }>;
      interchangeable_words: Array<{ word: string; meaning: string; example: string; usage_note?: string }>;
    };
  }> => api.post(`/api/lists/word/${wordId}/similar`, { contextIndex }),

  // User Preferences
  getPreferences: (): ApiResponse<UserPreferences> => api.get('/api/preferences'),
  updatePreferences: (preferences: { 
    exerciseTypes?: ExerciseTypePreferences; 
    baseLanguage?: string; 
    targetLanguage?: string; 
  }): ApiResponse<UserPreferences> => 
    api.put('/api/preferences', preferences),

  // Language Validation
  validateLanguage: (language: string): ApiResponse<{
    isValid: boolean;
    languageCode: string | null;
    standardizedName: string | null;
    parameters: Array<{
      type: 'script' | 'dialect' | 'formality' | 'region' | 'learning_focus';
      value: string;
      description: string;
    }> | null;
    explanation: string | null;
  }> => api.post('/api/language-validation/validate', { language }),

  // Image Description Learning
  startDescriptionExercise: (context?: string, imageSource: 'ai' | 'stock' = 'ai'): ApiResponse<{
    context: string;
    image: { url: string; alt: string; id: string };
    instructions: string;
  }> => api.post('/api/describe/start', { 
    ...(context ? { context } : {}),
    imageSource 
  }),
  
  submitDescription: (data: {
    context: string;
    imageUrl: string;
    imageAlt: string;
    userDescription: string;
  }): ApiResponse<{
    exerciseId: string;
    analysis: ImageDescriptionAnalysis;
    message: string;
  }> => api.post('/api/describe/submit', data),
  
  addWordsToList: (data: {
    exerciseId: string;
    listId?: string;
    selectedWords: Array<{ word: string; meaning: string }>;
    createNewList?: boolean;
  }): ApiResponse<{
    message: string;
    addedWords: Array<{ word: string; meaning: string }>;
    listId: string;
    listName: string;
    createdNewList: boolean;
  }> => api.post('/api/describe/add-words', data),
  
  getDescriptionHistory: (limit?: number): ApiResponse<{
    exercises: DescriptionExercise[];
  }> => api.get('/api/describe/history', { params: { limit } }),
  
  getContextSuggestions: (): ApiResponse<{
    suggestions: string[];
  }> => api.get('/api/describe/context-suggestions'),

  // Vocabulary learning methods
  generateVocabularyWords: (context: string, difficulty: 'basic' | 'intermediate' | 'advanced' = 'intermediate', count?: number): ApiResponse<VocabularyWordsResponse> => 
    api.post('/api/vocabulary/generate-words', { context, difficulty, count }),
  
  getVocabularyWordDetails: (word: string, context: string): ApiResponse<WordDetailsResponse> => 
    api.post('/api/vocabulary/get-word-details', { word, context }),

  // Audio & Pronunciation
  generateAudio: (text: string, language?: string, voice?: string, speed?: number): ApiResponse<{
    success: boolean;
    data: {
      audioUrl: string;
      cacheKey: string;
      voice: string;
      duration?: number;
    };
  }> => api.post('/api/audio/generate', { text, language, voice, speed }),

  generateWordPronunciation: (word: string, language?: string, context?: string): ApiResponse<{
    success: boolean;
    data: {
      audioUrl: string;
      cacheKey: string;
      voice: string;
      word: string;
      language: string;
    };
  }> => api.post('/api/audio/word-pronunciation', { word, language, context }),

  generateSentencePronunciation: (sentence: string, language?: string, speed?: number): ApiResponse<{
    success: boolean;
    data: {
      audioUrl: string;
      cacheKey: string;
      voice: string;
      sentence: string;
      language: string;
      speed: number;
    };
  }> => api.post('/api/audio/sentence-pronunciation', { sentence, language, speed }),

  getAvailableVoices: (language?: string): ApiResponse<{
    voices: Array<{
      id: string;
      name: string;
      language: string;
      category: string;
    }>;
    total: number;
  }> => api.get('/api/audio/voices', { params: { language } }),

  // Light Reading
  generateLightReading: (listId: string, level: 'beginner' | 'intermediate' | 'advanced'): ApiResponse<{
    title: string;
    content: string;
    word_count: number;
    reading_time_minutes: number;
    highlighted_words: Array<{ word: string; definition: string; position: number }>;
    list_name: string;
    list_context?: string;
    level: string;
    words_included: number;
    total_words_in_list: number;
  }> => api.post(`/api/lists/${listId}/light-reading`, { level }),

  // Voice Agent
  createVoiceSession: (listId: string): ApiResponse<{
    success: boolean;
    data: {
      clientSecret: string;
      expiresAt: string;
      sessionId: string;
      listContext: {
        listId: string;
        listName: string;
        description?: string;
        context?: string;
      };
      userLanguages: {
        baseLanguage: string;
        targetLanguage: string;
      };
    };
  }> => api.post('/api/voice/session', { listId })
};
