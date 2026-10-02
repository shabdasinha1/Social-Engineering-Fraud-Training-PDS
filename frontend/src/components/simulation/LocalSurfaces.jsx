import {
  ArrowLeft,
  FileText,
  Globe,
  Image as ImageIcon,
  Lock,
  PhoneOff,
  QrCode,
  ShieldCheck,
  Smartphone,
  X,
} from 'lucide-react'
import { ASSET_KIND } from '@/constants/simulation'
import { cn } from '@/utils/cn'

/**
 * The local simulation primitives from client specification section 4: safe browser,
 * file viewer, QR inspector, call screen, payment screen and install prompt.
 *
 * They are one file because they are one idea - an inert local surface rendered from a
 * synthetic asset - and they share a frame, a close control and an inertness footer.
 *
 * None of them can act. There is no `href`, no `src`, no `fetch`, no `window.open`, no
 * media device and no host handler anywhere below: a URL is text, a file is a description,
 * a QR payload is a decoded string, a call is a caption list, a payment is a summary. The
 * engine has already recorded what the learner did; these only show what they would have
 * seen.
 */

function Chrome({ title, icon: Icon, onClose, children, footer }) {
  return (
    <section
      className="overflow-hidden rounded-lg border border-border-strong bg-surface shadow-sm"
      aria-label={title}
    >
      <header className="flex items-center gap-2 border-b border-border bg-secondary-soft px-3 py-2">
        <Icon size={15} aria-hidden="true" className="shrink-0 text-text-muted" />
        <h3 className="min-w-0 flex-1 truncate text-sm font-bold">{title}</h3>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${title}`}
            className="grid size-9 shrink-0 place-items-center rounded-md text-text-muted hover:bg-surface"
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </header>

      <div className="p-3.5">{children}</div>

      {footer && (
        <p className="flex items-center gap-1.5 border-t border-border bg-secondary-soft px-3.5 py-2 text-[0.7rem] font-medium text-text-muted">
          <Lock size={12} aria-hidden="true" className="shrink-0" />
          {footer}
        </p>
      )}
    </section>
  )
}

function Field({ label, value }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="flex flex-wrap gap-x-2 py-1 text-sm">
      <dt className="font-semibold text-text-muted">{label}</dt>
      <dd className="min-w-0 break-words">{String(value)}</dd>
    </div>
  )
}

/**
 * Safe browser. The address bar is a read-only display of the scenario's own reserved
 * host, with Back and Close - it is not an input, so nothing can be navigated to.
 */
function SafeBrowser({ asset, onClose }) {
  const { title, host, body, fields = [] } = asset.content ?? {}

  return (
    <Chrome title="Browser" icon={Globe} onClose={onClose}
      footer="Local training page. No network request was made.">
      <div className="flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5">
        <span aria-hidden="true" className="text-text-muted">
          <ArrowLeft size={14} />
        </span>
        <p className="min-w-0 flex-1 truncate text-xs text-text-muted" title={asset.display_target}>
          <span className="sr-only">Address </span>
          {asset.display_target || host}
        </p>
      </div>

      <h4 className="mt-3 font-semibold">{title}</h4>
      {body && <p className="mt-1 text-sm text-balance-pretty text-text-muted">{body}</p>}

      {fields.length > 0 && (
        <ul className="mt-3 space-y-2">
          {fields.map((field) => (
            <li
              key={String(field.name ?? field)}
              className="rounded-md border border-dashed border-border-strong px-3 py-2 text-sm text-text-muted"
            >
              {String(field.label ?? field.name ?? field)}
              <span className="ml-1 text-xs">(disabled in training)</span>
            </li>
          ))}
        </ul>
      )}
    </Chrome>
  )
}

/** File viewer. A description of an inert file - it is never opened by the host. */
function FileViewer({ asset, onClose }) {
  const { file_name: fileName, file_kind: kind, file_size: size, preview } = asset.content ?? {}
  const Icon = kind === 'image' ? ImageIcon : FileText

  return (
    <Chrome title="File viewer" icon={Icon} onClose={onClose}
      footer="Preview only. Nothing was executed, extracted or mounted.">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="grid size-11 shrink-0 place-items-center rounded-md bg-secondary-soft text-text-muted"
        >
          <Icon size={20} />
        </span>
        <div className="min-w-0">
          <p className="font-semibold break-words">{fileName}</p>
          <p className="text-xs text-text-muted">
            {[kind, size].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>
      {preview && <p className="mt-3 text-sm text-balance-pretty text-text-muted">{preview}</p>}
    </Chrome>
  )
}

/**
 * QR inspector. The payload was decoded from scenario data when the content was
 * generated; the camera and the host clipboard are never touched.
 */
function QrInspector({ asset, onClose }) {
  const { decoded_target: target } = asset.content ?? {}

  return (
    <Chrome title="QR inspector" icon={QrCode} onClose={onClose}
      footer="Decoded on this device. Camera and clipboard are not used.">
      <p className="text-sm font-semibold">Full decoded target</p>
      <p className="mt-1 rounded-md border border-border bg-background px-2.5 py-2 text-sm break-all">
        {target || asset.display_target}
      </p>
    </Chrome>
  )
}

/** Call screen. Captions instead of audio; no microphone, camera or dialer. */
function CallScreen({ asset, onClose }) {
  const { caller, number, captions = [], timer_seconds: timer } = asset.content ?? {}

  return (
    <Chrome title="Call screen" icon={PhoneOff} onClose={onClose}
      footer="Simulated call. No microphone, camera or dialer was used.">
      <p className="font-semibold">{caller}</p>
      {number && <p className="text-sm text-text-muted tabular-nums">{number}</p>}
      <p className="mt-1 text-xs text-text-muted tabular-nums">
        <span className="sr-only">Call duration </span>
        {String(Math.floor((timer ?? 0) / 60)).padStart(2, '0')}:
        {String((timer ?? 0) % 60).padStart(2, '0')}
      </p>

      {captions.length > 0 && (
        <ul className="mt-3 space-y-2">
          {captions.map((caption, index) => (
            <li
              key={index}
              className="rounded-md bg-secondary-soft px-3 py-2 text-sm text-balance-pretty"
            >
              <span className="sr-only">Caption: </span>
              {caption}
            </li>
          ))}
        </ul>
      )}
    </Chrome>
  )
}

/** Payment screen. A summary of a request; no instrument, no amount is ever charged. */
function PaymentScreen({ asset, onClose }) {
  const { payee, amount_label: amount, reference } = asset.content ?? {}

  return (
    <Chrome title="Payment request" icon={ShieldCheck} onClose={onClose}
      footer="Simulated request. No payment was made and no card data is stored.">
      <dl>
        <Field label="Payee" value={payee} />
        <Field label="Amount" value={amount} />
        <Field label="Reference" value={reference} />
      </dl>
    </Chrome>
  )
}

/** Install prompt. Lists what would have been requested; nothing is installed or granted. */
function InstallScreen({ asset, onClose }) {
  const { app_name: appName, permissions = [] } = asset.content ?? {}

  return (
    <Chrome title="Install request" icon={Smartphone} onClose={onClose}
      footer="Simulated prompt. Nothing was installed and no permission was granted.">
      <p className="font-semibold">{appName}</p>
      {permissions.length > 0 && (
        <>
          <p className="mt-2 text-sm font-semibold text-text-muted">Permissions requested</p>
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {permissions.map((permission) => (
              <li
                key={permission}
                className="rounded-full border border-border-strong px-2.5 py-1 text-xs font-medium"
              >
                {permission}
              </li>
            ))}
          </ul>
        </>
      )}
    </Chrome>
  )
}

const SURFACES = {
  [ASSET_KIND.BROWSER]: SafeBrowser,
  [ASSET_KIND.FILE]: FileViewer,
  [ASSET_KIND.QR]: QrInspector,
  [ASSET_KIND.CALL]: CallScreen,
  [ASSET_KIND.PAYMENT]: PaymentScreen,
  [ASSET_KIND.INSTALL]: InstallScreen,
}

/** Renders whichever local surface an asset kind calls for. Unknown kinds render nothing. */
export function LocalSurface({ asset, onClose, className }) {
  if (!asset) return null
  const Surface = SURFACES[asset.kind]
  if (!Surface) return null

  return (
    <div className={cn('min-w-0', className)}>
      <Surface asset={asset} onClose={onClose} />
    </div>
  )
}
