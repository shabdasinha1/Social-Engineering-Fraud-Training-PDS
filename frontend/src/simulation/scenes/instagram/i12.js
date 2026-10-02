import { FIELD_KIND, SLOT, SURFACE, action, field, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  LEARNER, assetId, browserPage, day, directory, me, requestCard, social, splitHeadline, them,
} from './shared.js'

/**
 * I12 - Account Recovery Backup Code (IMMERSIVE-004C). Medium.
 *
 * An account presenting itself as platform recovery says it has ALREADY saved the learner -
 * a login was blocked minutes ago, the session is frozen, the freeze expires in ten minutes -
 * and asks for one unused backup code to finish. The lever is rescue and gratitude rather
 * than punishment, which is what separates it from I02: I02 threatened deletion and was
 * settled by showing that nothing was wrong; here something appears to be genuinely
 * happening, and it is happening because the account messaging the learner is causing it.
 *
 * The decisive act is therefore not a login form - it is typing six digits into the message
 * box, while the learner's own phone is showing those six digits. The code really does
 * arrive, because a password reset really has been started on the account, and the thread
 * turns the moment it does. The look-alike security-check page the client's stage 4 names is
 * the second route to the same release: username, password and a backup code on one page.
 *
 * The evidence is split across three places the learner has to walk to: the account's history
 * (six days old, two former names, followed by nobody they know, and the same sentence left
 * in comments under strangers' posts), and - decisively - the learner's OWN Password and
 * security screens, where Login activity shows one blocked attempt at the minute the message
 * request arrived and Support requests shows no case open at all. That screen is the client's
 * verification route and is also where its end state lives: controlled sessions, and a code
 * that was never revealed.
 */
export function buildI12(scenario) {
  const { handle, text } = splitHeadline(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const browserAsset = browserPage(scenario)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)
  const checkUrl = browserAsset?.display_target ?? 'https://i12.training.example/verify'
  const checkHost = browserAsset?.content?.host ?? 'i12.training.example'
  const name = 'Meta Account Recovery'
  const caseRef = 'IG-44902'
  const code = '419 302'

  return {
    scenarioId: 'I12',
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
            { id: 'i12-row', handle, name, preview: text, time: '2m', request: true, unread: true },
          ],
        },
        {
          heading: 'Messages',
          rows: [
            { id: 'i12-bg-1', handle: 'nisha.bakes', name: 'Nisha', preview: 'You: sending the photos tonight', time: '4h', outgoing: true, inert: true },
            { id: 'i12-bg-2', handle: 'trek.club.pune', name: 'Pune Trek Club', preview: 'Dev: Sunday is confirmed 🙌', time: '1d', inert: true },
          ],
        },
      ],
    },

    conversation: {
      kind: 'dm',
      screenTitle: handle,
      handle,
      name,
      subline: `@${handle}`,
      verified: false,
      request: true,
    },

    beats: [
      requestCard('i12-request', {
        name,
        handle,
        verified: false,
        stats: { posts: '61', followers: '6,898', following: '420' },
        relation: 'Not following each other · joined 6 days ago',
      }),
      day('i12-day', 'MESSAGE REQUEST'),
      them('i12-b1', `Hello ${LEARNER.name}. Case ${caseRef} has been opened on your account.`, '16:29'),
      them('i12-b2', text, '16:29'),
      them('i12-b3', 'A login from another country was blocked 4 minutes ago. We have frozen that session for you, but the freeze lifts automatically in 10 minutes.', '16:30'),
      them('i12-b4', 'Your recovery email r••••@•••••.com is still attached, so the account can be saved. To finish, send ONE unused backup code from Settings › Password and security › Two-factor authentication.', '16:31'),

      {
        kind: 'system', id: 'i12-code', tone: 'mention',
        text: `SMS · Instagram: ${code} is your Instagram code. Don’t share it with anyone.`,
        since: 'branch',
      },
      them('i12-b5', `The confirmation code has just gone to your phone. Send it here and case ${caseRef} closes.`, '16:33', { since: 'branch' }),

      /**
       * The code sent in the composer and the page that takes username, password and a code
       * produce the same consequence, so the thread shows what follows from either rather
       * than echoing one of them back.
       */
      {
        kind: 'system', id: 'i12-after-code', tone: 'banner',
        text: 'Your password was changed from a device in another country. The email on the account was changed 40 seconds later.',
        since: 'verify', afterConsequence: 'simulated_data_submission',
      },
      me('i12-echo-ask', 'What exactly was blocked?', '16:34', { since: 'verify', afterConsequence: 'simulated_reply_sent' }),
      them('i12-after-ask', 'A session from a device you have never used. I can hold the freeze a little longer if you send the code now 🙏', '16:34', {
        since: 'verify', afterConsequence: 'simulated_reply_sent',
      }),
    ],

    surfaces: {
      profile: social({
        title: handle,
        home: 'profile',
        pages: {
          profile: {
            view: 'profile',
            handle,
            name,
            category: 'Product/service',
            verified: false,
            stats: { posts: '61', followers: '6,898', following: '420', followersTo: 'followers' },
            bio: ['Account recovery case desk', 'Response time: under 5 minutes', 'We contact you first when a login is blocked'],
            mutuals: 'Not followed by anyone you follow',
            buttons: ['Follow', 'Message'],
            aboutTo: 'about',
            commentsTo: 'comments',
            grid: [
              { art: 'text', title: '', note: 'RECOVERED ✅' },
              { art: 'text', title: '', note: 'RECOVERED ✅' },
              { art: 'text', title: '', note: 'RECOVERED ✅' },
              { art: 'text', title: '', note: '4 days ago' },
              { art: 'text', title: '', note: '5 days ago' },
              { art: 'text', title: '', note: '6 days ago' },
            ],
          },
          about: {
            view: 'about',
            title: 'About this account',
            handle,
            rows: [
              { label: 'Date joined', value: 'September 2026 (6 days ago)' },
              { label: 'Account based in', value: 'Not available' },
              { label: 'Verified', value: 'No' },
            ],
            formerUsernames: [
              { handle: 'ig.helpdesk.team', when: 'September 2026' },
              { handle: 'recovery.support.24x7', when: 'September 2026' },
            ],
          },
          followers: {
            view: 'people',
            title: 'Followers',
            heading: 'Followers you know: none',
            people: [
              { handle: 'user_88213094', name: '', note: 'Joined this month' },
              { handle: 'aa.kumar.9931', name: '', note: 'Joined this month' },
              { handle: 'recover_me_fast', name: '', note: 'Joined this month' },
              { handle: 'p.shetty.0071', name: '', note: 'Joined this month' },
            ],
            note: 'None of your followers follow this account.',
          },
          comments: {
            view: 'people',
            title: 'Comments',
            heading: 'Where this account comments',
            people: [
              { handle: '@anjali.writes', name: 'Under a post about a lost account', note: '“DM us, we can recover it in 10 minutes ✅”' },
              { handle: '@sanjay_photos', name: 'Under a post about a lost account', note: '“DM us, we can recover it in 10 minutes ✅”' },
              { handle: '@fitwithkiran', name: 'Under a post about a lost account', note: '“DM us, we can recover it in 10 minutes ✅”' },
            ],
            note: 'The same sentence, under three strangers’ posts, in the last two days.',
          },
        },
      }),

      /** The page the message request links to. Its address comes from the pinned asset. */
      check: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'gate',
        pages: {
          gate: {
            url: checkUrl,
            host: checkHost,
            title: 'Account security check',
            secure: true,
            blocks: [
              { type: 'brand', monogram: 'M', name: 'Meta Security', tagline: 'Account protection centre' },
              { type: 'heading', text: `Case ${caseRef}` },
              {
                type: 'summary',
                rows: [
                  { label: 'Account', value: `@${LEARNER.handle}` },
                  { label: 'Blocked login', value: 'Today, 16:25' },
                  { label: 'Session', value: 'Frozen - lifts automatically', strong: true },
                  { label: 'Action needed', value: 'Confirm you are the owner' },
                ],
              },
              { type: 'notice', text: 'The freeze on this session lifts in 09:12.' },
            ],
            primary: { label: 'Confirm ownership', to: 'confirm' },
          },
          confirm: {
            url: `${checkUrl}/confirm`,
            host: checkHost,
            title: 'Confirm ownership',
            secure: true,
            blocks: [
              { type: 'heading', text: 'Confirm you are the owner' },
              {
                type: 'form',
                heading: 'Your account',
                fields: [
                  field({ name: 'user', label: 'Instagram username', length: 3, max: 30 }),
                  field({ name: 'pass', label: 'Password', kind: FIELD_KIND.MASKED, length: 6, max: 32 }),
                ],
              },
              {
                type: 'form',
                heading: 'One unused backup code',
                fields: [
                  field({ name: 'backup', label: 'Backup code', kind: FIELD_KIND.DIGITS, length: 8, group: 4 }),
                ],
                note: 'Eight digits, from Settings › Password and security › Two-factor authentication.',
              },
            ],
            primary: { label: 'Continue', to: 'review' },
          },
          review: {
            url: `${checkUrl}/review`,
            host: checkHost,
            title: 'Unlock',
            secure: true,
            blocks: [
              { type: 'heading', text: `Unlock @${LEARNER.handle} and close case ${caseRef}?` },
              {
                type: 'summary',
                rows: [
                  { label: 'We will receive', value: 'Your username, your password and one backup code' },
                  { label: 'Then', value: 'The frozen session is released and the case is closed' },
                ],
              },
            ],
          },
          done: {
            url: `${checkUrl}/review`,
            host: checkHost,
            title: 'Case closed',
            final: true,
            blocks: [
              { type: 'result', heading: 'Case closed', text: 'Your account has been handed back to its owner.' },
            ],
          },
        },
      },

      /**
       * The learner's OWN security screens, opened from Settings rather than followed to.
       * Login activity is where the client's end state - controlled sessions - is read.
       */
      security: social({
        title: 'Password and security',
        home: 'home',
        pages: {
          home: {
            view: 'settings',
            title: 'Password and security',
            username: `@${LEARNER.handle}`,
            rows: [
              { label: 'Security Checkup', value: 'Review the basics on this account', to: 'checkup' },
              { label: 'Where you’re logged in', value: 'Devices and sessions', to: 'sessions' },
              { label: 'Login activity', value: 'Recent attempts on this account', to: 'activity' },
              { label: 'Support requests', value: 'Cases you have opened, and cases about you', to: 'requests' },
            ],
          },
          checkup: {
            view: 'status',
            title: 'Security Checkup',
            heading: 'Security Checkup',
            statusRows: [
              { label: 'Two-factor authentication', value: 'On, using an authentication app', ok: true },
              { label: 'Backup codes', value: '5 unused. A backup code lets anyone who has it into this account. Instagram never asks you for one.', ok: true },
              { label: 'Password', value: 'Last changed 4 months ago', ok: false },
              { label: 'Recovery email', value: 'r••••@•••••.com, unchanged since 2021', ok: true },
            ],
            note: 'Nothing on this account has been restricted, removed or frozen.',
          },
          sessions: {
            view: 'status',
            title: 'Where you’re logged in',
            heading: 'Active sessions',
            statusRows: [
              { label: 'This device · Pune, IN', value: 'Active now', ok: true },
              { label: 'iPhone · Pune, IN', value: 'Last active 2 days ago', ok: true },
            ],
            note: 'These are the only two devices logged in to this account.',
          },
          activity: {
            view: 'status',
            title: 'Login activity',
            heading: 'Recent attempts',
            statusRows: [
              { label: 'Password reset requested', value: 'Today, 16:26 · from a device that is not signed in. A code was sent to your phone.', ok: false },
              { label: 'Login · Pune, IN · this device', value: 'Today, 07:41', ok: true },
              { label: 'Login · Pune, IN · iPhone', value: '14 September', ok: true },
            ],
            note: 'No login from outside Pune has been made or blocked on this account.',
          },
          requests: {
            view: 'settings',
            title: 'Support requests',
            username: `@${LEARNER.handle}`,
            rows: [
              { label: 'Your open requests', value: '0' },
              { label: 'Cases opened about your account', value: '0' },
              { label: 'How Instagram reaches you', value: 'In Account Status and in Support requests, inside the app. Never by message request.' },
            ],
          },
        },
      }),
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({
            id: 'i12-c01', slot: SLOT.INLINE,
            label: 'Open the message request',
          }),
          action({
            id: 'i12-c02', slot: SLOT.INLINE,
            label: 'Reply “which code?” without opening it',
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'i12-c03', slot: SLOT.INLINE, anchor: 'header',
            label: handle, hint: 'Profile, followers, history and where it comments',
            targetId: senderAsset, opens: 'profile',
          }),
          action({
            id: 'i12-c04', slot: SLOT.MENU,
            label: 'Read the request from the start',
          }),
          action({
            id: 'i12-c05', slot: SLOT.MENU,
            label: 'Go straight to closing the case',
          }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 'i12-c06', slot: SLOT.COMPOSER,
            label: `Send the code that just arrived`, echo: code,
          }),
          action({
            id: 'i12-c07', slot: SLOT.COMPOSER,
            label: 'Ask what exactly was blocked', echo: 'What exactly was blocked?',
          }),
          action({
            id: 'i12-c08', slot: SLOT.SURFACE, on: 'check', page: 'review',
            label: 'Unlock the account', targetId: browserAsset?.asset_id ?? null, thenPage: 'done',
          }),
          action({
            id: 'i12-c09', slot: SLOT.SURFACE, on: 'check',
            label: 'Close the page', closes: true,
          }),
          action({
            id: 'i12-c10', slot: SLOT.MENU,
            label: 'Send nothing and leave the request where it is',
          }),
          navigate({
            id: 'i12-nav-check', slot: SLOT.MENU,
            label: 'Open the security check they linked', opens: 'check',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'i12-c11', slot: SLOT.MENU,
            label: 'Open Settings › Password and security yourself',
            hint: 'Security Checkup, your sessions and your login activity', opens: 'security',
          }),
          action({
            id: 'i12-c12',
            slot: SLOT.MENU, label: `Look up ${desk.name || 'the support desk'} in the trusted directory`,
            targetId: directoryAsset,
          }),
          action({
            id: 'i12-c13',
            slot: SLOT.MENU, label: `Ask ${handle} for the case reference and proof`,
          }),
          action({ id: 'i12-c14', slot: SLOT.MENU, label: 'Report the request' }),
          action({ id: 'i12-c15', slot: SLOT.MENU, label: `Block ${handle}` }),
        ],
      },

      resolve: {
        affordances: [
          action({
            id: 'i12-c16', slot: SLOT.INLINE,
            label: 'Report the request and delete it',
          }),
          action({
            id: 'i12-c17', slot: SLOT.INLINE,
            label: 'Keep the request open until the case is settled',
          }),
          action({
            id: 'i12-c18', slot: SLOT.MENU,
            label: `Block ${handle}`,
          }),
          action({
            id: 'i12-c19', slot: SLOT.MENU,
            label: 'Go back and finish the case before the freeze lifts',
          }),
          action({
            id: 'i12-c20', slot: SLOT.MENU,
            label: 'Swipe the request away and forget it',
          }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'i12-nav-profile', slot: SLOT.MENU, label: `View ${handle}’s profile`, opens: 'profile', after: 'inspect' }),
      navigate({ id: 'i12-nav-security', slot: SLOT.MENU, label: 'Settings › Password and security', opens: 'security', after: 'resolve' }),
    ],

    directoryExtras: [
      {
        id: 'i12-dir-ig',
        name: 'Instagram (in-app support)',
        identifier: 'Settings › Password and security · Support requests',
        provenance: 'local approved directory',
        role: 'Recovery is started by you, inside the app. Instagram opens no case by message request and asks for no backup code.',
      },
    ],
  }
}
