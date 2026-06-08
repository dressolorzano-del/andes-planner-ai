'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TravelerProfile, PlanResult, AppStep, ChatMessage, AppUser, SavedPlanSummary } from '@/types';

interface AndesStore {
  step: AppStep;
  profile: Partial<TravelerProfile>;
  result: PlanResult | null;
  isAnalyzing: boolean;
  analyzeProgress: string[];
  chatMessages: ChatMessage[];
  user: AppUser | null;
  savedPlans: SavedPlanSummary[];

  setStep: (step: AppStep) => void;
  updateProfile: (data: Partial<TravelerProfile>) => void;
  setResult: (result: PlanResult) => void;
  setAnalyzing: (v: boolean) => void;
  addAnalyzeProgress: (msg: string) => void;
  clearProgress: () => void;
  addChatMessage: (msg: ChatMessage) => void;
  setUser: (user: AppUser | null) => void;
  setSavedPlans: (plans: SavedPlanSummary[]) => void;
  reset: () => void;
}

const defaultProfile: Partial<TravelerProfile> = {
  destination: 'Ecuador',
  duration: 14,
  groupSize: 2,
  budget: 2500,
  currency: 'USD',
  targetMountains: ['Cotopaxi', 'Chimborazo'],
  mountainExperience: 'high_altitude',
  maxAltitudeReached: 4500,
  fitnessLevel: 'good',
  guideRequired: true,
  preferredLanguage: ['Español'],
  accommodationPrefs: ['Refugio', 'Hotel'],
  transportIncluded: false,
  gearIncluded: true,
  rescueInsurance: true,
  riskTolerance: 'moderate',
  medicalConditions: '',
  previousExperiences: '',
};

export const useAndesStore = create<AndesStore>()(
  persist(
    (set) => ({
      step: 'landing',
      profile: defaultProfile,
      result: null,
      isAnalyzing: false,
      analyzeProgress: [],
      chatMessages: [],
      user: null,
      savedPlans: [],

      setStep: (step) => set({ step }),
      updateProfile: (data) => set((s) => ({ profile: { ...s.profile, ...data } })),
      setResult: (result) => set({ result }),
      setAnalyzing: (v) => set({ isAnalyzing: v }),
      addAnalyzeProgress: (msg) => set((s) => ({ analyzeProgress: [...s.analyzeProgress, msg] })),
      clearProgress: () => set({ analyzeProgress: [] }),
      addChatMessage: (msg) => set((s) => ({ chatMessages: [...s.chatMessages, msg] })),
      setUser: (user) => set({ user }),
      setSavedPlans: (plans) => set({ savedPlans: plans }),
      reset: () => set({
        step: 'landing',
        profile: defaultProfile,
        result: null,
        isAnalyzing: false,
        analyzeProgress: [],
        chatMessages: [],
      }),
    }),
    {
      name: 'andes-planner-store',
      partialize: (s) => ({ profile: s.profile, result: s.result, user: s.user }),
    }
  )
);
