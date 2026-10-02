import { FIELD_KIND, SLOT, SURFACE, action, field, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  LEARNER, assetId, browserPage, day, directory, requestCard, social, splitHeadline, them,
} from './shared.js'

/**
 * I02 - Copyright Appeal Countdown (IMMERSIVE-004A).
 *
 * A DM request - not an ordinary message, a REQUEST, from an account the learner does not
 * follow - claims their profile will be deleted for copyright infringement unless they
 * appeal within thirty minutes, on a link that asks for username, password and a backup
 * code.
 *
 * The Instagram-native idea the client's stage text names is that platform enforcement does
 * not happen in a stranger's DM: it happens on the account's own Account Status screen, in
 * Settings. So the verification route is a place inside the app the learner walks to, and
 * what it says - no violations, no restrictions - is the evidence that settles it, exactly
 * as W01's Account settings did for the login code but reached through Instagram's own
 * "Account Status" rather than through a message. The other tells are native too: the DM is
 * pending in Requests, the "support" handle is a look-alike with a two-day history and no
 * verified badge, and the appeal link is a training host, not instagram.com.
 *
 * The decision is taken on the appeal login the link opens - entering the password and the
 * backup code - or by refusing it and closing the request.
 */
export function buildI02(scenario) {
  const { handle, text } = splitHeadline(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const browserAsset = browserPage(scenario)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)
  const appealUrl = browserAsset?.display_target ?? 'https://i02.training.example/verify'
  const appealHost = browserAsset?.content?.host ?? 'i02.training.example'

  return {
    scenarioId: 'I02',
    platform: 'instagram',
    notify: { sender: handle },
    messageSender: { display_name: `@${handle}`, identifier: `@${handle}` },

    list: {
      kind: 'dm',
      title: 'Messages',
      username: LEARNER.handle,
      sections: [
        {
          heading: 'Requests',
          rows: [
            {
              id: 'i02-row',
              handle,
              name: 'Copyright Case Team',
              preview: text,
              time: '4m',
              request: true,
              unread: true,
            },
          ],
        },
        {
          heading: 'Messages',
          rows: [
            { id: 'i02-bg-1', handle: 'nisha.bakes', name: 'Nisha', preview: 'sent an attachment', time: '20m', inert: true },
            { id: 'i02-bg-2', handle: 'trek.club.pune', name: 'Pune Trek Club', preview: 'Dev: Sunday 6am then?', time: '2h', inert: true },
            { id: 'i02-bg-3', handle: 'dad', name: 'Appa', preview: 'You: on my way', time: '1d', outgoing: true, inert: true },
          ],
        },
      ],
    },

    conversation: {
      kind: 'dm',
      screenTitle: handle,
      handle,
      name: 'Copyright Case Team',
      subline: `@${handle}`,
      verified: false,
      request: true,
    },

    beats: [
      requestCard('i02-request', {
        name: 'Copyright Case Team',
        handle,
        verified: false,
        stats: { posts: '3', followers: '61', following: '844' },
        relation: 'Not following each other · joined 2 days ago',
      }),
      day('i02-day', 'MESSAGE REQUEST'),
      them('i02-b1', 'Official notice from Instagram Copyright Enforcement.', '07:44'),
      them('i02-b2', text, '07:45'),
      them('i02-b3', 'Your account is scheduled for permanent deletion. Appeal here to keep it: ' + `${appealHost}/appeal`, '07:45'),

      /** Stage 4: the composer wakes as a reply box under a pending request. */
      them('i02-b4', 'Do not ignore this. The 30-minute window has started.', '07:46', { since: 'branch' }),

      {
        kind: 'message', id: 'i02-echo-reply', from: 'me', text: 'Is this really from Instagram?',
        time: '07:47', since: 'verify', afterConsequence: 'simulated_reply_sent',
      },
      {
        kind: 'message', id: 'i02-after-reply', from: 'them',
        text: 'Yes. This is your final warning. Appeal now or lose everything.', time: '07:47',
        since: 'verify', afterConsequence: 'simulated_reply_sent',
      },
      {
        kind: 'system', id: 'i02-after-login', tone: 'banner',
        text: 'Your password was changed. If this wasn’t you, secure your account.',
        since: 'verify', afterConsequence: 'simulated_data_submission',
      },
    ],

    surfaces: {
      profile: social({
        title: handle,
        home: 'profile',
        pages: {
          profile: {
            view: 'profile',
            handle,
            name: 'Copyright Case Team',
            category: null,
            verified: false,
            avatarArt: 'text',
            stats: { posts: '3', followers: '61', following: '844' },
            bio: ['Instagram Copyright Enforcement', 'Appeals handled 24/7', 'DM to resolve'],
            bioLink: { label: appealHost, to: null },
            mutuals: 'Not followed by anyone you follow',
            buttons: ['Follow', 'Message'],
            aboutTo: 'about',
            grid: [
              { art: 'text', title: 'APPEAL NOW', note: 'Posted yesterday' },
              { art: 'text', title: 'Copyright policy', note: 'Posted yesterday' },
              { art: 'text', title: 'Act fast', note: 'Posted 2 days ago' },
            ],
          },
          about: {
            view: 'about',
            title: 'About this account',
            handle,
            rows: [
              { label: 'Date joined', value: 'September 2026 (2 days ago)' },
              { label: 'Account based in', value: 'Not available' },
              { label: 'Verified', value: 'No' },
            ],
            formerUsernames: [
              { handle: 'giveaway.help.desk', when: 'September 2026' },
            ],
          },
        },
      }),

      /** The app's own enforcement channel: Settings > Account Status. */
      status: social({
        title: 'Settings',
        home: 'settings',
        pages: {
          settings: {
            view: 'settings',
            title: 'Settings and activity',
            breadcrumb: 'Your account',
            username: LEARNER.handle,
            rows: [
              { label: 'Account Status', value: 'See if your account can be recommended', to: 'account-status' },
              { label: 'Security', value: 'Password, two-factor, login activity', to: 'security' },
              { label: 'Help', value: 'Report a problem, support requests' },
            ],
          },
          'account-status': {
            view: 'status',
            title: 'Account Status',
            heading: 'Everything looks good',
            statusRows: [
              { label: 'Account', value: 'This account can be recommended.', ok: true },
              { label: 'Content removed', value: 'None', ok: true },
              { label: 'Copyright and intellectual property', value: 'No reports against your account.', ok: true },
              { label: 'Warnings', value: 'None', ok: true },
            ],
            note: 'When something needs action, Instagram shows it here, not in a message from another account.',
          },
          security: {
            view: 'status',
            title: 'Security',
            heading: 'Login activity',
            statusRows: [
              { label: 'Two-factor authentication', value: 'On (authenticator app)', ok: true },
              { label: 'Recent logins', value: 'This device only', ok: true },
              { label: 'Backup codes', value: 'Never share these. Instagram will never ask for one.', ok: true },
            ],
          },
        },
      }),

      appeal: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'appeal',
        pages: {
          appeal: {
            url: appealUrl,
            host: appealHost,
            title: 'Copyright appeal',
            secure: true,
            blocks: [
              { type: 'brand', monogram: 'IG', name: 'Instagram Appeals Centre', tagline: 'Copyright enforcement' },
              { type: 'heading', text: 'Appeal your account deletion' },
              {
                type: 'summary',
                rows: [
                  { label: 'Case', value: 'CR-2026-88104' },
                  { label: 'Status', value: 'Pending appeal' },
                  { label: 'Time remaining', value: '28:52', strong: true },
                ],
              },
              { type: 'notice', text: 'Verify ownership to stop the deletion.' },
            ],
            primary: { label: 'Start appeal', to: 'login' },
          },
          login: {
            url: `${appealUrl}/login`,
            host: appealHost,
            title: 'Verify ownership',
            secure: true,
            blocks: [
              { type: 'brand', monogram: 'IG', name: 'Instagram', tagline: 'Confirm it’s you' },
              {
                type: 'form',
                heading: 'Log in to appeal',
                fields: [
                  field({ name: 'username', label: 'Username', length: 3, max: 30 }),
                  field({ name: 'password', label: 'Password', kind: FIELD_KIND.MASKED, length: 6, max: 32 }),
                  field({ name: 'backup', label: 'Backup code', kind: FIELD_KIND.DIGITS, length: 8, group: 4 }),
                ],
              },
              { type: 'fineprint', text: 'Your backup code confirms you are the real owner.' },
            ],
            primary: { label: 'Submit appeal', to: 'confirm' },
          },
          confirm: {
            url: `${appealUrl}/confirm`,
            host: appealHost,
            title: 'Confirm',
            secure: true,
            blocks: [
              { type: 'heading', text: 'Submit your appeal?' },
              { type: 'notice', text: 'Your login details and backup code will be sent to the appeals team to verify ownership.' },
            ],
          },
          done: {
            url: `${appealUrl}/login`,
            host: appealHost,
            title: 'Submitted',
            final: true,
            blocks: [
              { type: 'result', heading: 'Appeal submitted', text: 'We will review your account within 24 hours.' },
            ],
          },
        },
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({
            id: 'i02-c01', slot: SLOT.INLINE,
            label: 'Open the message request',
          }),
          action({
            id: 'i02-c02', slot: SLOT.INLINE,
            label: 'Reply “How do I appeal?” without opening it',
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'i02-c03', slot: SLOT.INLINE, anchor: 'header',
            label: handle, hint: 'Profile, followers and account history',
            targetId: senderAsset, opens: 'profile',
          }),
          action({
            id: 'i02-c04', slot: SLOT.MENU,
            label: 'Read the request from the start',
          }),
          action({
            id: 'i02-c05', slot: SLOT.MENU,
            label: 'Go straight to the appeal',
          }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 'i02-c06', slot: SLOT.SURFACE, on: 'appeal', page: 'confirm',
            label: 'Submit the appeal', targetId: browserAsset?.asset_id ?? null, thenPage: 'done',
          }),
          action({
            id: 'i02-c07', slot: SLOT.SURFACE, on: 'appeal',
            label: 'Close the appeal page', closes: true,
          }),
          action({
            id: 'i02-c08', slot: SLOT.COMPOSER,
            label: 'Ask if this is really from Instagram', echo: 'Is this really from Instagram?',
          }),
          action({
            id: 'i02-c09', slot: SLOT.MENU,
            label: 'Leave the request and don’t reply',
          }),
          navigate({ id: 'i02-nav-appeal', slot: SLOT.MENU, label: 'Open the appeal link', opens: 'appeal' }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'i02-c10', slot: SLOT.MENU,
            label: 'Open Settings › Account Status yourself',
            hint: 'Check your own account inside the app', opens: 'status',
          }),
          action({
            id: 'i02-c11',
            slot: SLOT.MENU, label: `Look up ${desk.name || 'the support desk'} in the trusted directory`,
            targetId: directoryAsset,
          }),
          action({
            id: 'i02-c12',
            slot: SLOT.MENU, label: `Ask ${handle} to prove they are Instagram`,
          }),
          action({ id: 'i02-c13', slot: SLOT.MENU, label: 'Report the request' }),
          action({ id: 'i02-c14', slot: SLOT.MENU, label: `Block ${handle}` }),
        ],
      },

      resolve: {
        affordances: [
          action({
            id: 'i02-c15', slot: SLOT.INLINE,
            label: 'Report and delete the request',
          }),
          action({
            id: 'i02-c16', slot: SLOT.INLINE,
            label: 'Leave it in Requests and carry on',
          }),
          action({
            id: 'i02-c17', slot: SLOT.MENU,
            label: `Block ${handle}`,
          }),
          action({
            id: 'i02-c18', slot: SLOT.MENU,
            label: 'Go back and finish the appeal',
          }),
          action({
            id: 'i02-c19', slot: SLOT.MENU,
            label: 'Close the request and forget it',
          }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'i02-nav-profile', slot: SLOT.MENU, label: `View ${handle}’s profile`, opens: 'profile', after: 'inspect' }),
      navigate({ id: 'i02-nav-status', slot: SLOT.MENU, label: 'Settings › Account Status', opens: 'status', after: 'resolve' }),
    ],

    directoryExtras: [
      {
        id: 'i02-dir-ig',
        name: 'Instagram (in-app support)',
        identifier: 'Settings › Help · Account Status',
        provenance: 'local approved directory',
        role: 'Instagram handles enforcement in Account Status, never by DM or an emailed link.',
      },
    ],
  }
}
