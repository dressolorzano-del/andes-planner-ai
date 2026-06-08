'use client';
import { useAndesStore } from '@/store';
import LandingView from '@/components/LandingView';
import ProfileForm from '@/components/ProfileForm';
import AnalyzingView from '@/components/AnalyzingView';
import ResultsView from '@/components/ResultsView';
import Dashboard from '@/components/Dashboard';

export default function HomePage() {
  const { step } = useAndesStore();
  return (
    <main>
      {step === 'landing'    && <LandingView />}
      {step === 'dashboard'  && <Dashboard />}
      {(step === 'profile-1' || step === 'profile-2') && <ProfileForm />}
      {step === 'analyzing'  && <AnalyzingView />}
      {(step === 'results' || step === 'chat') && <ResultsView />}
    </main>
  );
}
