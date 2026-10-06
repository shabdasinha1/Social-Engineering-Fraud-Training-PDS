import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import {
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  ScrollText,
  Settings,
  UserRound,
  X,
} from 'lucide-react'
import satarkLogo from '@/assets/images/logo_satark.jpeg'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { BRAND_NAME } from '@/constants/app'
import { ROUTES } from '@/constants/routes'
import { adminApi } from '@/services/adminApi'
import { cn } from '@/utils/cn'

/**
 * The instructor area shell (ADMIN-006, redesigned by ENHANCEMENT-001).
 *
 * Deliberately **not** the learner chrome. The learner-facing simulation carries its own
 * persistent simulation rail; this is the assessment administration console, and an
 * instructor needs to know at a glance which one they are looking at. It shares the design
 * system - the same tokens, Button and Alert - but carries its own dark console sidebar.
 *
 * There is ONE navigation element. At `lg` and wider it is a fixed sidebar; below that the
 * same element slides in as a drawer from the menu button, and while closed it is
 * `invisible`, which removes it from the tab order and the accessibility tree without a
 * second copy of the links. It is a real `<nav>` of real links, keyboard reachable in DOM
 * order, and marks the current page with `aria-current` as well as with weight and a bar -
 * never with colour alone.
 */

/** The admin content column: wide on a desktop, centred on an ultra-wide screen. */
const CONTAINER = 'mx-auto w-full max-w-admin px-4 sm:px-6 lg:px-8'

const NAV = [
  { to: ROUTES.ADMIN, label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: ROUTES.ADMIN_SCENARIOS, label: 'Scenarios', icon: FileText },
  { to: ROUTES.ADMIN_ATTEMPTS, label: 'Attempts', icon: ClipboardList },
  { to: ROUTES.ADMIN_SETTINGS, label: 'Settings', icon: Settings },
  { to: ROUTES.ADMIN_AUDIT, label: 'Audit log', icon: ScrollText },
]

export function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { admin } = useOutletContext()
  const [signingOut, setSigningOut] = useState(false)
  const [error, setError] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButtonRef = useRef(null)
  const closeButtonRef = useRef(null)
  const drawerOpened = useRef(false)

  // The drawer closes whenever the page changes, and on Escape.
  const [lastPath, setLastPath] = useState(location.pathname)
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname)
    setMenuOpen(false)
  }

  /**
   * The drawer sits before the header in DOM order, so without this a keyboard user who
   * opens it lands on "Sign out" with Tab and can only reach the links with Shift+Tab.
   * Focus moves into the drawer when it opens, and back to the menu button when it closes
   * while focus is still inside it (Escape, the close button, or a link that navigated) -
   * otherwise it would be left on a control that has just become invisible.
   */
  useEffect(() => {
    if (menuOpen) {
      drawerOpened.current = true
      // The drawer's `visibility` transition keeps it hidden - and so unfocusable - for the
      // first frame or two, so the focus is retried each frame until it takes.
      let frame = 0
      let tries = 0
      const focusDrawer = () => {
        const target = closeButtonRef.current
        target?.focus()
        if (target && document.activeElement !== target && tries++ < 10) {
          frame = requestAnimationFrame(focusDrawer)
        }
      }
      focusDrawer()
      return () => cancelAnimationFrame(frame)
    }
    if (!drawerOpened.current) return
    drawerOpened.current = false
    if (document.getElementById('admin-sidebar')?.contains(document.activeElement)) {
      menuButtonRef.current?.focus()
    }
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen])

  const handleSignOut = async () => {
    setSigningOut(true)
    setError('')
    try {
      await adminApi.signOut()
      navigate(ROUTES.ADMIN_LOGIN, { replace: true })
    } catch (signOutError) {
      setError(signOutError.message)
      setSigningOut(false)
    }
  }

  return (
    <div className="min-h-dvh console-grid lg:pl-60">
      <a
        href="#admin-main"
        className={cn(
          'sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50',
          'focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:font-semibold',
          'focus:ring-2 focus:ring-primary',
        )}
      >
        Skip to content
      </a>

      {/* --- sidebar / drawer ------------------------------------------------ */}
      <aside
        id="admin-sidebar"
        className={cn(
          'console-panel fixed inset-y-0 left-0 z-40 flex w-72 max-w-[85vw] flex-col lg:w-60',
          'border-r border-console-line text-console-text',
          'transition-[transform,visibility] duration-200 ease-out lg:visible lg:translate-x-0',
          menuOpen ? 'visible translate-x-0 shadow-lg' : 'invisible -translate-x-full',
        )}
      >
        <div className="flex items-center justify-between gap-2 px-4 pb-4 pt-5">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src={satarkLogo}
              alt=""
              width={813}
              height={496}
              className="h-9 w-auto max-w-none shrink-0 rounded-md ring-1 ring-console-accent/30"
            />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-bold tracking-[0.08em] text-console-text">
                {BRAND_NAME}
              </p>
              <p className="truncate text-xs text-console-muted">Instructor console</p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => setMenuOpen(false)}
            className="grid size-11 place-items-center rounded-md text-console-muted hover:bg-console-raised hover:text-console-text focus-visible:outline-2 focus-visible:outline-console-accent lg:hidden"
          >
            <X size={20} aria-hidden="true" />
            <span className="sr-only">Close navigation</span>
          </button>
        </div>

        <p className="px-4 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-console-muted">
          Sections
        </p>

        <nav aria-label="Instructor sections" className="mt-1.5 flex-1 overflow-y-auto px-2.5">
          <ul className="space-y-0.5">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold',
                      'transition-[background-color,color] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2',
                      'focus-visible:outline-console-accent',
                      isActive
                        ? 'bg-console-raised text-console-text'
                        : 'text-console-muted hover:bg-console-raised/60 hover:text-console-text',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        aria-hidden="true"
                        className={cn(
                          'absolute inset-y-2 left-0 w-0.5 origin-center rounded-full bg-console-accent',
                          'transition-transform duration-300 ease-out',
                          isActive ? 'scale-y-100' : 'scale-y-0',
                        )}
                      />
                      <Icon
                        size={18}
                        aria-hidden="true"
                        className={cn(
                          'shrink-0 transition-[transform,color] duration-200 motion-safe:group-hover:translate-x-0.5',
                          isActive && 'text-console-accent',
                        )}
                      />
                      {label}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <p className="m-2.5 flex items-center gap-2 rounded-md border border-console-line bg-console-raised/60 px-3 py-2 text-xs text-console-muted [@media(max-height:560px)]:hidden">
          <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-console-accent" />
          <span>
            <span className="font-semibold text-console-text">Assessment environment</span>
            <span className="block">Synthetic scenarios · data stays here</span>
          </span>
        </p>
      </aside>

      {menuOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          tabIndex={-1}
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-30 bg-overlay lg:hidden"
        />
      )}

      {/* --- header ---------------------------------------------------------- */}
      <header className="sticky top-0 z-20 border-b border-border bg-surface/90 backdrop-blur">
        <div className={CONTAINER}>
          <div className="flex min-h-14 items-center justify-between gap-3 py-1.5">
            <div className="flex min-w-0 items-center gap-2">
              <button
                ref={menuButtonRef}
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-expanded={menuOpen}
                aria-controls="admin-sidebar"
                className="grid size-11 shrink-0 place-items-center rounded-md border border-border-strong bg-surface text-text hover:bg-secondary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:hidden"
              >
                <Menu size={20} aria-hidden="true" />
                <span className="sr-only">Open navigation</span>
              </button>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-sm font-bold">Instructor area</p>
                <p className="truncate text-xs text-text-muted">Assessment administration and reporting</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <p className="hidden items-center gap-2 rounded-full border border-border bg-secondary-soft/70 py-0.5 pl-0.5 pr-3 text-sm sm:flex">
                <span className="grid size-7 place-items-center rounded-full bg-primary text-primary-contrast">
                  <UserRound size={15} aria-hidden="true" />
                </span>
                <span className="text-text-muted">Signed in as</span>
                <span className="font-semibold text-text">{admin.username}</span>
              </p>
              <span className="sr-only sm:hidden">Signed in as {admin.username}</span>
              <Button
                variant="outline"
                size="sm"
                className="min-h-11 shrink-0 whitespace-nowrap"
                onClick={handleSignOut}
                loading={signingOut}
                aria-label="Sign out"
              >
                {!signingOut && <LogOut size={17} aria-hidden="true" />}
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main id="admin-main" tabIndex={-1} className="py-6 focus:outline-none lg:py-8">
        <div className={CONTAINER}>
          {error && (
            <Alert variant="danger" className="mb-section">
              {error}
            </Alert>
          )}
          <Outlet context={{ admin }} />
        </div>
      </main>
    </div>
  )
}
