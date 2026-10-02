import { useContext } from 'react'
import { CandidateContext } from '@/context/candidateContext'

export function useCandidate() {
  const context = useContext(CandidateContext)
  if (!context) throw new Error('useCandidate must be used inside CandidateProvider')
  return context
}
