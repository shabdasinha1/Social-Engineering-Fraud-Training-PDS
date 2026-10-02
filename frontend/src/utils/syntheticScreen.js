import { ASSET_KIND, assetOfKind } from '@/constants/simulation'

/**
 * Adapts DATA-003 synthetic content to the `screen` shape the four platform renderers
 * already consume.
 *
 * DATA-003 deliberately emitted message threads in the renderers' own block vocabulary
 * (`message`, `note`, `emailHeader`, `emailBody`, `profileHeader`, `linkPreview`,
 * `attachment`), so this is a rename, not a translation - and the renderers did not have
 * to be rewritten to display client content.
 *
 * Nothing is invented here. A field the scenario does not supply is simply absent.
 */

/** The open thread for the current scenario, or null if it supplies none. */
export function threadScreen(scenario) {
  const thread = assetOfKind(scenario, ASSET_KIND.THREAD)
  if (!thread?.content) return null

  const { header = {}, blocks = [] } = thread.content
  return {
    id: thread.asset_id,
    kind: 'thread',
    header: { ...header, showBack: false },
    blocks,
    actions: [],
  }
}

/**
 * The app list the learner sees before opening anything (stage 1).
 *
 * One row, built from the scenario's own notification asset. Other apps are not
 * simulated as populated inboxes: showing invented traffic beside the real item would be
 * inventing scenario content.
 */
export function inboxScreen(scenario) {
  const notification = assetOfKind(scenario, ASSET_KIND.NOTIFICATION)
  const sender = scenario?.synthetic?.sender ?? null
  if (!notification?.content) return null

  const { sender: from, body, received_at: receivedAt } = notification.content

  return {
    id: `${notification.asset_id}-inbox`,
    kind: 'list',
    header: { title: appTitle(scenario?.platform), showBack: false },
    blocks: [
      {
        type: 'listItem',
        title: from || sender?.display_name || 'Unknown',
        preview: body,
        time: receivedAt,
        unread: true,
        target: null,
      },
    ],
    actions: [],
  }
}

function appTitle(platform) {
  switch (platform) {
    case 'whatsapp':
      return 'WhatsApp'
    case 'instagram':
      return 'Instagram'
    case 'email':
      return 'Mail'
    case 'sms':
      return 'Messages'
    default:
      return 'Messages'
  }
}

/** Display fields for the sender sheet. Only what the scenario actually supplies. */
export function senderFields(scenario) {
  const profile = assetOfKind(scenario, ASSET_KIND.SENDER)
  const content = profile?.content ?? scenario?.synthetic?.sender ?? null
  if (!content) return []

  const rows = [
    ['Display name', content.display_name],
    ['Username', content.username],
    ['Contact', content.identifier],
    ['First seen', content.first_seen],
    ['Followers', content.followers],
    ['Following', content.following],
    ['Posts', content.post_count],
    ['Bio', content.bio],
  ]

  return rows
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([label, value]) => ({ label, value: String(value) }))
}
