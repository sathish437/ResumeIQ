import { useContext } from 'react';
import { ResumeContext } from './ResumeContextInstance';
import type { ResumeContextType } from './ResumeContextInstance';

export function useResume(): ResumeContextType {
  const context = useContext(ResumeContext);
  if (!context) {
    throw new Error('useResume must be used within a ResumeProvider');
  }
  return context;
}
