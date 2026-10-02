import { BrowserRouter } from 'react-router-dom'
import { ScrollToTop } from '@/components/layout/ScrollToTop'
import { CandidateProvider } from '@/context/CandidateProvider'
import { AppRoutes } from '@/routes/AppRoutes'

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <CandidateProvider>
        <AppRoutes />
      </CandidateProvider>
    </BrowserRouter>
  )
}
