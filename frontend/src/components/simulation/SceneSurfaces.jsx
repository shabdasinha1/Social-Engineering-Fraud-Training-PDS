import { ShieldQuestion } from 'lucide-react'
import { SceneControl } from '@/components/simulation/SceneControl'
import { AppSurface } from '@/components/simulation/surfaces/AppSurface'
import { BrowserSurface } from '@/components/simulation/surfaces/BrowserSurface'
import { CallSurface } from '@/components/simulation/surfaces/CallSurface'
import { DetailSurface } from '@/components/simulation/surfaces/DetailSurface'
import { InstallerSurface } from '@/components/simulation/surfaces/InstallerSurface'
import { MailSurface } from '@/components/simulation/surfaces/MailSurface'
import { PaySheetSurface } from '@/components/simulation/surfaces/PaySheetSurface'
import { SmsSurface } from '@/components/simulation/surfaces/SmsSurface'
import { SocialSurface } from '@/components/simulation/surfaces/SocialSurface'
import { Screen } from '@/components/simulation/surfaces/SurfaceFrame'
import { ViewerSurface } from '@/components/simulation/surfaces/ViewerSurface'
import { SURFACE } from '@/simulation/sceneModel'

/**
 * The router for the screens a scene can push onto the device (IMMERSIVE-003A, split by
 * R2 into `components/simulation/surfaces/*`).
 *
 * Each surface kind is one file, because they grew: the browser now has forms and a page
 * history, the details sheet has tabs, there is a second application and a payment sheet.
 * What they still share is the frame in `SurfaceFrame.jsx` - a full-height local screen,
 * clipped to the device, with a Back affordance that submits nothing.
 *
 * The containment rules are unchanged and are asserted by `SceneContainment.test.jsx`
 * across every one of them: no `href`, `src`, `iframe`, `fetch`, `window.open`, `<form>`
 * action, media device or host handler anywhere. The single deliberate change R2 made is
 * that a page may now carry real inputs; everything that keeps those safe is in
 * `surfaces/SceneForm.jsx` and nowhere else.
 */
export function SceneSurface({
  surface, page, nested = false, interactive = true, onBack, onNavigate, controls = [],
  busy = false, pendingAction = null, onSelect,
}) {
  if (!surface) return null

  /**
   * The controls a surface carries are scene affordances like any other: they submit an
   * intent through the same controller, and they are drawn by the same component as the
   * ones in the conversation, so a page cannot acquire a control style of its own.
   */
  const renderControl = (affordance) => (
    <SceneControl
      key={affordance.id}
      affordance={affordance}
      busy={busy}
      pendingAction={pendingAction}
      onSelect={onSelect}
      variant="surface"
    />
  )

  switch (surface.kind) {
    case SURFACE.CONTACT:
    case SURFACE.GROUP:
    case SURFACE.SETTINGS:
      return (
        <DetailSurface
          key={surface.title + surface.name}
          surface={surface}
          onBack={onBack}
          onNavigate={onNavigate}
          controls={controls}
          renderControl={renderControl}
        />
      )
    case SURFACE.SMS:
      return (
        <SmsSurface
          surface={surface}
          page={page}
          nested={nested}
          onBack={onBack}
          onNavigate={onNavigate}
          controls={controls}
          renderControl={renderControl}
        />
      )
    case SURFACE.BROWSER:
      return (
        <BrowserSurface
          surface={surface}
          page={page}
          nested={nested}
          interactive={interactive}
          onBack={onBack}
          onNavigate={onNavigate}
          controls={controls}
          renderControl={renderControl}
        />
      )
    case SURFACE.APP:
      return (
        <AppSurface
          surface={surface}
          onBack={onBack}
          controls={controls}
          renderControl={renderControl}
        />
      )
    case SURFACE.PAYSHEET:
      return (
        <PaySheetSurface
          key={surface.title + surface.amount}
          surface={surface}
          interactive={interactive}
          onBack={onBack}
          controls={controls}
          renderControl={renderControl}
        />
      )
    case SURFACE.VIEWER:
      return (
        <ViewerSurface
          key={surface.title + (surface.label ?? '')}
          surface={surface}
          onBack={onBack}
          controls={controls}
          renderControl={renderControl}
        />
      )
    case SURFACE.CALL:
      return (
        <CallSurface
          key={`${surface.title}-${surface.number}`}
          surface={surface}
          onBack={onBack}
          onNavigate={onNavigate}
          controls={controls}
          renderControl={renderControl}
        />
      )
    case SURFACE.SOCIAL:
      return (
        <SocialSurface
          surface={surface}
          page={page}
          nested={nested}
          onBack={onBack}
          onNavigate={onNavigate}
          controls={controls}
          renderControl={renderControl}
        />
      )
    case SURFACE.MAIL:
      return (
        <MailSurface
          surface={surface}
          page={page}
          nested={nested}
          onBack={onBack}
          onNavigate={onNavigate}
          controls={controls}
          renderControl={renderControl}
        />
      )
    case SURFACE.INSTALLER:
      return (
        <InstallerSurface
          surface={surface}
          page={page}
          nested={nested}
          onBack={onBack}
          onNavigate={onNavigate}
          controls={controls}
          renderControl={renderControl}
        />
      )
    default:
      return (
        <Screen title="Preview" onBack={onBack}>
          <p className="p-4 text-sm text-text-muted">
            <ShieldQuestion size={16} aria-hidden="true" className="mr-1 inline" />
            This scenario supplies nothing to show here.
          </p>
        </Screen>
      )
  }
}
