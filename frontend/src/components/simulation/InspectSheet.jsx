import { Modal } from '@/components/ui/Modal'
import { ASSET_KIND, assetOfKind } from '@/constants/simulation'
import { senderFields } from '@/utils/syntheticScreen'

/**
 * What an inspection actually shows (stage 3).
 *
 * Each panel presents the synthetic detail the learner asked to look at - sender fields,
 * the link's full target, the file's description, the QR payload - and nothing else. None
 * of them says whether what is shown is a good or bad sign: reading the signal is the
 * skill being assessed, so the interpretation is the learner's to make.
 *
 * These are details, not actions. Examining a link here does not open it; that is a
 * separate branch-stage action with its own event and its own consequence.
 *
 * `view` is the neutral panel name the server returns once an inspection is accepted
 * (SECURITY-001) - `sender`, `profile`, `link`, `file` or `qr`.
 */

function Rows({ rows }) {
  if (!rows.length) {
    return <p className="text-sm text-text-muted">This scenario supplies no further detail.</p>
  }

  return (
    <dl className="divide-y divide-border">
      {rows.map(({ label, value }) => (
        <div key={label} className="flex flex-wrap gap-x-3 py-2">
          <dt className="w-28 shrink-0 text-sm font-semibold text-text-muted">{label}</dt>
          <dd className="min-w-0 flex-1 text-sm break-words">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

const TITLES = {
  sender: 'Sender details',
  profile: 'Profile',
  link: 'Link details',
  file: 'Attachment details',
  qr: 'QR code details',
}

function rowsFor(view, scenario) {
  if (view === 'sender' || view === 'profile') {
    return senderFields(scenario)
  }

  if (view === 'link') {
    const asset = assetOfKind(scenario, ASSET_KIND.BROWSER)
    const { host, title } = asset?.content ?? {}
    return [
      { label: 'Full address', value: asset?.display_target },
      { label: 'Host', value: host },
      { label: 'Page title', value: title },
    ].filter((row) => row.value)
  }

  if (view === 'file') {
    const asset = assetOfKind(scenario, ASSET_KIND.FILE)
    const { file_name: name, file_kind: kind, file_size: size, preview } = asset?.content ?? {}
    return [
      { label: 'File name', value: name },
      { label: 'Type', value: kind },
      { label: 'Size', value: size },
      { label: 'Preview', value: preview },
    ].filter((row) => row.value)
  }

  if (view === 'qr') {
    const asset = assetOfKind(scenario, ASSET_KIND.QR)
    return [
      { label: 'Decoded target', value: asset?.content?.decoded_target ?? asset?.display_target },
    ].filter((row) => row.value)
  }

  return []
}

export function InspectSheet({ view, scenario, onClose }) {
  if (!view) return null

  return (
    <Modal
      open
      contained
      title={TITLES[view] ?? 'Details'}
      description="Synthetic details supplied by this scenario."
      onClose={onClose}
    >
      <Rows rows={rowsFor(view, scenario)} />
    </Modal>
  )
}
