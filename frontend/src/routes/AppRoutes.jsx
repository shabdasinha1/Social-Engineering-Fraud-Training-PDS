import { Navigate, Route, Routes } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { RequireAdmin } from '@/routes/RequireAdmin'
import { RequireCandidate } from '@/routes/RequireCandidate'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { AdminAttemptDetailPage } from '@/pages/AdminAttemptDetailPage'
import { AdminAttemptsPage } from '@/pages/AdminAttemptsPage'
import { AdminAuditPage } from '@/pages/AdminAuditPage'
import { AdminDashboardPage } from '@/pages/AdminDashboardPage'
import { AdminLoginPage } from '@/pages/AdminLoginPage'
import { AdminScenarioDetailPage } from '@/pages/AdminScenarioDetailPage'
import { AdminScenariosPage } from '@/pages/AdminScenariosPage'
import { AdminSettingsPage } from '@/pages/AdminSettingsPage'
import { AssessmentPage } from '@/pages/AssessmentPage'
import { BriefingPage } from '@/pages/BriefingPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { HistoryPage } from '@/pages/HistoryPage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ResultPage } from '@/pages/ResultPage'
import { SimulationPage } from '@/pages/SimulationPage'

/**
 * `/assessment` is the six-stage simulation (UI-001). The legacy 40-scenario journey
 * still exists behind `/assessment/legacy` - the pipeline it drives is untouched and its
 * tests still pass - but it is no longer where a candidate is sent.
 *
 * Both sit behind RequireCandidate, and the server enforces the same boundary
 * independently: no assessment route is reachable without a candidate session.
 *
 * The admin tree is a separate branch behind its own guard; a candidate session never
 * satisfies RequireAdmin. ADMIN-006 nests the instructor screens inside `AdminLayout`, so
 * every one of them inherits the guard, the header and the navigation - a new admin screen
 * cannot accidentally be added outside the boundary. ENHANCEMENT-001 makes `/admin` itself
 * the dashboard.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={ROUTES.LOGIN} replace />} />
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />

      <Route element={<RequireCandidate />}>
        <Route path={ROUTES.BRIEFING} element={<BriefingPage />} />
        <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
        <Route path={ROUTES.ASSESSMENT} element={<SimulationPage />} />
        <Route path={ROUTES.LEGACY_ASSESSMENT} element={<AssessmentPage />} />
        <Route path={ROUTES.RESULT} element={<ResultPage />} />
        <Route path={ROUTES.HISTORY} element={<HistoryPage />} />
      </Route>

      <Route path={ROUTES.ADMIN_LOGIN} element={<AdminLoginPage />} />
      <Route element={<RequireAdmin />}>
        <Route element={<AdminLayout />}>
          <Route path={ROUTES.ADMIN} element={<AdminDashboardPage />} />
          <Route path={ROUTES.ADMIN_SCENARIOS} element={<AdminScenariosPage />} />
          <Route path={ROUTES.ADMIN_SCENARIO} element={<AdminScenarioDetailPage />} />
          <Route path={ROUTES.ADMIN_ATTEMPTS} element={<AdminAttemptsPage />} />
          <Route path={ROUTES.ADMIN_ATTEMPT} element={<AdminAttemptDetailPage />} />
          <Route path={ROUTES.ADMIN_SETTINGS} element={<AdminSettingsPage />} />
          <Route path={ROUTES.ADMIN_AUDIT} element={<AdminAuditPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
