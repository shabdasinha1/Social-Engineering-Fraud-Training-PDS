import { FIELD_KIND, SLOT, SURFACE, action, field, navigate } from '../../sceneModel.js'
import {
  asset, day, directory, e2e, headline, headlineTime, link, quote, sender, system, them, typing,
} from './shared.js'
import { ASSET_KIND } from '../../../constants/simulation.js'

/**
 * W18 - Hijacked Group Admin Roster Link.
 *
 * The account is real. The admin is the same Coy Office number the learner saved three years
 * ago, posting in the same group, with the same avatar. Every identity check the learner has
 * practised comes back clean - which is the point, and the thing W09 taught in a private chat
 * that this scene teaches in a group, where an admin has powers a colleague does not.
 *
 * ATT&CK has the shape in three pieces: T1586.001 (a compromised account whose existing
 * persona "may engender a level of trust"), T1534 Internal Spearphishing (a trusted internal
 * account used against the rest of the organisation, which the technique now says includes
 * "internal chat apps"), and T1598.003 (a link to a form where "information is gathered in
 * web forms and sent to the adversary"). The takeover itself is the OTP-reading trick that
 * police advisories in 2026 are still describing.
 *
 * **The distinct interaction is reading the group's own record of what changed.** Nothing
 * in any earlier scenario is evidence of this kind:
 *
 * - the app's system line that the admin's **security code changed** nine minutes before the
 *   post - what WhatsApp shows when an account is set up again on a phone;
 * - the **group description**, changed by the admin three minutes before the post;
 * - the **pinned message** - the same admin's own rule, from January: corrections through the
 *   Roster app or the orderly room, never service numbers on WhatsApp;
 * - a member's question, quoted, and the next member's message **deleted by admin**;
 * - the other members' **reactions**: thirty-one thumbs on the January rule, and "Done ✅"
 *   under the new link;
 * - the admin's own recent messages on his contact card, every one signed "- Coy Office",
 *   and today's, which are not.
 *
 * The verification is the Coy Office desk from the directory - a different channel from the
 * account that posted - and the Roster app, which says no correction window is open.
 */
export function buildW18(scenario) {
  const who = sender(scenario)
  const senderAsset = asset(scenario, ASSET_KIND.SENDER)?.asset_id ?? null
  const browser = asset(scenario, ASSET_KIND.BROWSER)
  const browserAsset = browser?.asset_id ?? null
  const directoryAsset = asset(scenario, ASSET_KIND.DIRECTORY)?.asset_id ?? null
  const desk = directory(scenario)

  const groupName = 'Unit Falcon - Alpha Coy'
  const admin = who.display_name
  const formUrl = browser?.display_target ?? 'https://w18.training.example/verify'
  const formHost = browser?.content?.host ?? 'w18.training.example'
  const formRoot = `https://${formHost}`
  const officeDesk = '+91 00000 59700'

  const rule = 'Roster corrections: through the Roster app or at the orderly room, nowhere '
    + 'else. Never post service numbers, appointments or locations on WhatsApp. - Coy Office'
  const question = 'Sir, corrections were only on the Roster app till now. Is this new?'
  const brand = {
    type: 'brand', monogram: 'AC', name: 'Alpha Coy Roster Confirmation', tagline: 'Online form',
  }

  return {
    scenarioId: 'W18',
    platform: 'whatsapp',

    conversation: {
      kind: 'group',
      title: groupName,
      subtitle: `${admin}, Coy 2IC, Hav. Joshi, you, +44 others`,
      saved: true,
      presence: `${admin}, Coy 2IC, Hav. Joshi, you, +44 others`,
      avatarSeed: 'AC',
      pinned: { beatId: 'w18-rule', author: admin, text: rule },
    },

    list: {
      title: 'WhatsApp',
      archived: 3,
      rows: [
        {
          id: 'w18-row',
          title: groupName,
          group: true,
          preview: `${admin}: ${headline(scenario)}`,
          time: headlineTime(scenario),
          unread: 9,
        },
        {
          id: 'w18-bg-1',
          title: 'Coy 2IC',
          preview: 'Range card for Thursday attached',
          time: '17:48',
          inert: true,
        },
        {
          id: 'w18-bg-2',
          title: 'Unit Falcon Notices',
          group: true,
          preview: 'Adjt Office: sports meet results',
          time: '16:10',
          muted: true,
          inert: true,
        },
        {
          id: 'w18-bg-3',
          title: 'Ma',
          preview: 'You: reached, will call',
          time: 'Yesterday',
          outgoing: true,
          inert: true,
        },
      ],
    },

    beats: [
      e2e('w18-e2e'),

      /** January: the rule, pinned by the same admin, with the group's thumbs under it. */
      day('w18-day-jan', '14 JANUARY'),
      them('w18-rule', rule, '10:02', {
        author: admin, reactions: [{ emoji: '👍', count: 31 }],
      }),

      day('w18-day-fri', 'LAST FRIDAY'),
      them('w18-fri',
        'Roster for next week is on the Roster app. Corrections through the app or at the '
        + 'orderly room by 1700 Friday. - Coy Office', '16:05', {
          author: admin, reactions: [{ emoji: '👍', count: 14 }],
        }),
      them('w18-fri-2', 'Noted 👍', '16:09', { author: 'Hav. Joshi' }),

      day('w18-day-today', 'TODAY'),
      system('w18-seccode', `${admin}’s security code changed.`),
      system('w18-desc', `${admin} changed the group description`),
      them('w18-head', headline(scenario), headlineTime(scenario) ?? '19:30', { author: admin }),
      link('w18-link', {
        title: 'Roster Confirmation - Alpha Coy',
        description: 'Final correction window. Confirm your entry.',
        displayUrl: formUrl,
        time: '19:30',
        author: admin,
      }),
      them('w18-b2', 'ALL RANKS MUST CONFIRM. Service no, appointment and current location. '
        + 'Late entries = leave cancelled!!', '19:31', { author: admin }),
      them('w18-b3', 'Done ✅', '19:33', {
        author: 'Nk Pillai', reactions: [{ emoji: '👍', count: 2 }],
      }),
      them('w18-b4', question, '19:34', {
        author: 'L/Nk Bhatt', quote: quote(admin, rule),
      }),
      them('w18-deleted', '', '19:35', { author: 'Hav. Joshi', deleted: true, deletedBy: admin }),
      them('w18-b5', 'Yes new system from Bn HQ. Faster. 12 min left.', '19:36', {
        author: admin, quote: quote('L/Nk Bhatt', question),
      }),

      them('w18-b6', 'Filled 👍', '19:38', { author: 'Sep Kiran', since: 'branch' }),
      them('w18-b7', '23 of 48 done. Remaining confirm NOW.', '19:39',
        { author: admin, since: 'branch' }),

      typing('w18-typing', { author: admin, since: 'verify', until: 'resolve' }),

      {
        kind: 'system', id: 'w18-after-submit', tone: 'alert',
        text: `Your service number, appointment and current location were sent to ${formHost}.`,
        since: 'verify', afterConsequence: 'simulated_data_submission',
      },
      {
        kind: 'message', id: 'w18-after-submit-msg', from: 'them', author: admin,
        text: 'Received. You will get a 6-digit code by SMS for verification - send it here.',
        time: '19:41', since: 'verify', afterConsequence: 'simulated_data_submission',
      },
      {
        kind: 'message', id: 'w18-after-reply', from: 'them', author: admin,
        text: 'Yes it is correct. Fill it fast, do not waste time.',
        time: '19:40', since: 'verify', afterConsequence: 'simulated_reply_sent',
      },
    ],

    surfaces: {
      /** Group info: what changed today, and who can do what in here. */
      contact: {
        kind: SURFACE.GROUP,
        title: 'Group info',
        name: groupName,
        identifier: 'Group - 48 participants',
        avatarSeed: 'AC',
        saved: true,
        statusLine: `Created by ${admin}, 3 years ago`,
        tabs: [
          {
            id: 'about',
            label: 'About',
            sections: [
              {
                id: 'about-rows', heading: 'Description',
                rows: [
                  { label: 'Description', value: 'Roster corrections via the link in chat. Deadline as announced.' },
                  { label: 'Description changed', value: `Today at 19:24, by ${admin}` },
                  { label: 'Created', value: `3 years ago, by ${admin}` },
                  { label: 'You joined', value: '2 years ago' },
                  { label: 'Group permissions', value: 'All participants can send messages' },
                ],
                note: 'Admins can change the description, delete anyone’s messages and add or '
                  + 'remove participants.',
              },
            ],
          },
          {
            id: 'participants',
            label: 'Participants',
            count: 48,
            sections: [
              {
                id: 'admins', heading: '2 admins',
                items: [
                  {
                    label: admin, value: `${who.identifier} - Coy Office`, badge: 'Group admin',
                    to: 'contact-admin',
                  },
                  { label: 'Coy 2IC', value: '+91 00000 59640', badge: 'Group admin' },
                ],
              },
              {
                id: 'members', heading: '46 members',
                items: [
                  { label: 'Hav. Joshi', value: '+91 00000 59655' },
                  { label: 'L/Nk Bhatt', value: '+91 00000 59671' },
                  { label: 'Nk Pillai', value: '+91 00000 59683' },
                  { label: 'Sep Kiran', value: '+91 00000 59690' },
                  { label: 'You', value: 'Member' },
                ],
                note: '41 more members.',
              },
            ],
          },
          {
            id: 'media',
            label: 'Media',
            count: 3,
            sections: [
              {
                id: 'media-list', heading: 'Media, links and docs',
                items: [
                  { label: 'Roster_Wk36.pdf', value: 'Last Friday - exported from the Roster app' },
                  { label: 'Range card, Thursday', value: 'Photo, Monday' },
                  { label: formHost, value: 'Today 19:30 - the first link to this site in this group' },
                ],
              },
            ],
          },
        ],
      },

      /** The admin's own card: the same number, a changed security code, how he writes. */
      'contact-admin': {
        kind: SURFACE.CONTACT,
        title: 'Contact info',
        name: admin,
        identifier: who.identifier,
        avatarSeed: who.avatar_initials,
        saved: true,
        statusLine: 'Saved in your contacts.',
        tabs: [
          {
            id: 'about',
            label: 'About',
            sections: [
              {
                id: 'about-rows', heading: 'About',
                rows: [
                  { label: 'Phone', value: who.identifier },
                  { label: 'Saved as', value: `${admin} (Coy Office)` },
                  { label: 'Saved', value: '3 years ago' },
                  { label: 'Security code', value: 'Changed today at 19:21' },
                  { label: 'Last seen', value: 'Online' },
                ],
                note: 'A security code changes when an account is set up again on a phone - a '
                  + 'new phone, a reinstall, or somebody else’s phone.',
              },
            ],
          },
          {
            id: 'recent',
            label: 'Recent messages',
            sections: [
              {
                id: 'recent-messages', heading: `Before today, in ${groupName}`,
                messages: [
                  { from: 'them', text: 'Leave applications for October through the Roster app. - Coy Office', time: '2 Sep' },
                  { from: 'them', text: 'Sports kit return by Wednesday to the QM store. - Coy Office', time: 'Wed' },
                  { from: 'them', text: 'Roster for next week is on the Roster app. Corrections through the app or at the orderly room by 1700 Friday. - Coy Office', time: 'Fri' },
                ],
              },
            ],
          },
          {
            id: 'groups',
            label: 'Groups in common',
            count: 6,
            sections: [
              {
                id: 'groups-list', heading: 'Groups in common',
                items: [
                  { label: groupName, value: '48 participants', group: true },
                  { label: 'Unit Falcon Notices', value: '212 participants', group: true },
                  { label: 'Alpha Coy JCOs', value: '9 participants', group: true },
                ],
                note: 'Three more groups in common.',
              },
            ],
          },
        ],
      },

      /** The form behind the link: prefilled from what the group already knows. */
      'roster-form': {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'form',
        pages: {
          form: {
            url: formUrl,
            host: formHost,
            title: 'Roster Confirmation - Alpha Coy',
            blocks: [
              brand,
              { type: 'heading', text: 'Confirm your roster entry' },
              {
                type: 'summary',
                rows: [
                  { label: 'Unit', value: groupName },
                  { label: 'Name', value: 'Taken from your WhatsApp profile' },
                  { label: 'Window', value: 'Closes 19:45' },
                ],
              },
              {
                type: 'form',
                heading: 'Your details',
                fields: [
                  field({
                    name: 'svc', label: 'Service number', kind: FIELD_KIND.DIGITS,
                    length: 7, max: 10,
                  }),
                  field({ name: 'role', label: 'Appointment / role', length: 3, max: 30 }),
                  field({ name: 'loc', label: 'Current location', length: 3, max: 40 }),
                ],
              },
              {
                type: 'fineprint',
                text: 'Made with a free online form service. Responses are visible to the '
                  + 'form owner.',
              },
            ],
            primary: { label: 'Continue', to: 'review' },
          },
          review: {
            url: `${formRoot}/review`,
            host: formHost,
            title: 'Roster Confirmation - review',
            blocks: [
              brand,
              { type: 'heading', text: 'Check and submit' },
              {
                type: 'summary',
                rows: [
                  { label: 'Service number', value: 'As entered' },
                  { label: 'Appointment', value: 'As entered' },
                  { label: 'Current location', value: 'As entered' },
                  { label: 'Sent to', value: 'The form owner' },
                ],
              },
            ],
            links: [{ id: 'w18-r-edit', label: 'Edit my answers', to: 'form' }],
          },
          done: {
            final: true,
            url: `${formRoot}/received`,
            host: formHost,
            title: 'Roster Confirmation - received',
            blocks: [
              brand,
              {
                type: 'result',
                heading: 'Response',
                text: 'Entry received.',
                rows: [
                  { label: 'Next step', value: 'A verification code will be sent to your phone. Send it to the admin to finish.' },
                ],
              },
            ],
          },
        },
      },

      /** The approved roster system, on the learner's own phone. */
      'roster-app': {
        kind: SURFACE.APP,
        appName: 'Roster',
        appTagline: 'Unit Falcon - Alpha Coy',
        hero: {
          label: 'Correction window',
          value: 'Closed',
          caption: 'The next roster opens on Friday at 16:00. No correction window is open today.',
          chips: ['Signed in on this phone', 'Unit Falcon'],
        },
        sections: [
          {
            id: 'entry', heading: 'Your entry',
            rows: [
              { label: 'Status', value: 'Confirmed on Friday - no action needed' },
              { label: 'Corrections', value: 'In this app, or at the orderly room' },
            ],
          },
          {
            id: 'how', heading: 'How roster data is collected',
            rows: [
              { label: 'Forms outside this app', value: 'None' },
              { label: 'Collected on WhatsApp', value: 'Never' },
              { label: 'Current location', value: 'Never part of the roster' },
            ],
          },
        ],
        tabs: [
          { label: 'Roster', icon: 'home' },
          { label: 'Leave', icon: 'history' },
          { label: 'Duties', icon: 'wallet' },
          { label: 'Profile', icon: 'profile' },
        ],
      },

      /** The Coy Office desk, from the directory - not the account that posted. */
      'call-office': {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'Alpha Coy Office (desk)',
        number: officeDesk,
        script: [
          { at: 0, speaker: 'them', text: 'Coy Office, Hav. Suresh.' },
          { at: 3, speaker: 'you', text: 'The Admin account has just posted a roster form link in the Alpha Coy group.' },
          { at: 9, speaker: 'them', text: 'That is my WhatsApp. I lost it just after seven - someone rang saying he was from Bn signals and I read out a code. I cannot get back in.' },
          { at: 18, speaker: 'them', text: 'There is no roster form. Nothing is collected outside the Roster app. Do not fill it, and do not forward the link.' },
          { at: 25, speaker: 'them', text: 'Please report the post to Coy 2IC - he is the other admin - and to unit security. I am reporting the account to WhatsApp.' },
        ],
      },
    },

    directoryExtras: [
      {
        id: 'w18-dir-office',
        name: 'Alpha Coy Office (desk)',
        identifier: officeDesk,
        provenance: 'local approved directory',
        role: 'Roster, leave and group administration for Alpha Coy.',
      },
      {
        id: 'w18-dir-security',
        name: 'Unit Falcon Security Cell',
        identifier: '+91 00000 59788',
        provenance: 'local approved directory',
        role: 'Report unexpected requests for personnel data.',
      },
    ],

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({
            id: 'w18-c01', slot: SLOT.INLINE,
            label: `Open ${groupName}`,
          }),
          action({
            id: 'w18-c02', slot: SLOT.INLINE,
            label: 'Open the form link from the preview', opens: 'roster-form',
            targetId: browserAsset,
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'w18-c03', slot: SLOT.INLINE,
            anchor: 'header', label: 'Group info',
            hint: 'Description, admins and participants',
            opens: 'contact',
          }),
          action({
            id: 'w18-c04', slot: SLOT.INLINE,
            anchor: 'w18-link', label: 'Check where this link goes', targetId: browserAsset,
          }),
          action({
            id: 'w18-c05', slot: SLOT.MENU,
            label: `${admin}’s contact info`, targetId: senderAsset, opens: 'contact-admin',
          }),
          action({
            id: 'w18-c06', slot: SLOT.MENU,
            label: 'Read the group from the start',
          }),
          action({
            id: 'w18-c07', slot: SLOT.MENU,
            label: 'Skip the checks and act on this message',
          }),
        ],
      },

      branch: {
        affordances: [
          /** Opening and filling in the form is navigation; submitting it is the decision. */
          navigate({
            id: 'w18-branch-open', slot: SLOT.INLINE, anchor: 'w18-link',
            label: 'Open', opens: 'roster-form',
          }),
          action({
            id: 'w18-c08', slot: SLOT.SURFACE,
            on: 'roster-form', page: 'review', thenPage: 'done',
            label: 'Submit entry', targetId: browserAsset,
          }),
          action({
            id: 'w18-c09', slot: SLOT.MENU,
            label: 'Leave the form and check the roster myself',
          }),
          action({
            id: 'w18-c10', slot: SLOT.COMPOSER,
            label: `${admin} sir, is this link correct?`,
            echo: `${admin} sir, is this link correct?`,
          }),
          action({
            id: 'w18-c11', slot: SLOT.MENU,
            label: 'Forward the link to my section’s group',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'w18-c12',
            slot: SLOT.MENU, label: 'Call the Coy Office desk from the directory',
            hint: 'A different line from the account that posted', opens: 'call-office',
          }),
          action({
            id: 'w18-c13',
            slot: SLOT.MENU, label: 'Open the Roster app', opens: 'roster-app',
          }),
          action({
            id: 'w18-c14',
            slot: SLOT.MENU,
            label: 'Check the trusted directory', targetId: directoryAsset,
          }),
          action({
            id: 'w18-c15',
            slot: SLOT.MENU,
            label: `Ask ${admin} in the group to confirm the link`,
          }),
          action({
            id: 'w18-c16', slot: SLOT.MENU,
            label: 'Report the message',
          }),
          action({
            id: 'w18-c17', slot: SLOT.MENU,
            label: `Block ${admin}`,
          }),
        ],
      },

      resolve: {
        affordances: [
          action({
            id: 'w18-c18', slot: SLOT.INLINE,
            label: 'Report to Coy 2IC and security; warn the group without the link',
          }),
          action({
            id: 'w18-c19', slot: SLOT.INLINE,
            label: 'Stay quiet and wait for the admin to explain',
          }),
          action({
            id: 'w18-c20', slot: SLOT.MENU,
            label: `Report ${admin}’s account and block it until it is recovered`,
          }),
          action({
            id: 'w18-c21', slot: SLOT.MENU,
            label: 'Fill the form before the window closes',
          }),
          action({
            id: 'w18-c22', slot: SLOT.MENU,
            label: 'Exit the group',
          }),
        ],
      },
    },

    ambient: [
      navigate({
        id: 'w18-nav-group', slot: SLOT.MENU, label: 'Group info',
        opens: 'contact', after: 'inspect',
      }),
      navigate({
        id: 'w18-nav-admin', slot: SLOT.MENU, label: `${admin} (contact info)`,
        opens: 'contact-admin', after: 'branch',
      }),
      navigate({
        id: 'w18-nav-roster', slot: SLOT.MENU, label: 'Roster app',
        opens: 'roster-app', after: 'resolve',
      }),
    ],

    supportDesk: desk,
  }
}
