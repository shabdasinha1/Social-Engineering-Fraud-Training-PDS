import { SLOT, SURFACE, action, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  LEARNER, assetId, day, directory, me, social, splitHeadline, system, them,
} from './shared.js'

/**
 * I16 - Approved Photo Release Request (IMMERSIVE-004D). Medium. The batch's ordinary item.
 *
 * The unit's public-information page - verified, followed since 2017, with months of the same
 * workflow already in the thread - has cleared a group photograph and needs the consent of the
 * people in it before it goes up. The learner arrives from Notifications, reads the thread, and
 * finds the actual decision somewhere no earlier scene has put one: Instagram's own
 * Settings › Tags and mentions, where tag review holds the post until the learner answers the
 * consent card.
 *
 * Both answers on the card are the app's normal path - the client's resolution is "confirm or
 * decline the matching consent card" - so neither is priced as a mistake. What is priced is
 * leaving the request to rot (-2), asking to be sent a "link to sign" instead of using the card,
 * and the over-helpful reply that volunteers the date, the place and the sub-unit for the
 * caption (-4 each: the untrusted-channel line of the client's table on a genuine item).
 *
 * The client's verification is a comparison of the release ID with the local public-release
 * register, so the check is a separate application holding that register, with the directory
 * and the public-information desk as the other two independent routes.
 */
export function buildI16(scenario) {
  const { handle, text } = splitHeadline(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)
  const deskName = desk.name || 'Unit Falcon Support Desk'
  const deskNumber = desk.identifier || '+91 00000 31254'
  const name = 'Unit Falcon Public Information'
  const releaseId = 'PF-204'

  return {
    scenarioId: 'I16',
    platform: 'instagram',
    notify: { sender: handle },
    messageSender: { display_name: `@${handle}`, identifier: `@${handle}` },

    list: {
      kind: 'activity',
      title: 'Notifications',
      sections: [
        {
          heading: 'Today',
          rows: [
            {
              id: 'i16-row',
              handle,
              detail: `${handle} sent you a consent card and tagged you in a post.`,
              text,
              time: '5m',
              art: 'field',
            },
            { id: 'i16-bg-1', handle: 'dev_fit', text: 'dev_fit liked your comment.', time: '1h', inert: true },
          ],
        },
        {
          heading: 'This week',
          rows: [
            { id: 'i16-bg-2', handle, text: `${handle} published a post you were tagged in.`, time: '6d', art: 'field', inert: true },
            { id: 'i16-bg-3', handle: 'anjali.m', text: 'anjali.m started following you.', time: '6d', inert: true },
          ],
        },
      ],
    },

    conversation: {
      kind: 'dm',
      screenTitle: handle,
      handle,
      name,
      subline: 'Government organisation',
      verified: true,
      request: false,
    },

    beats: [
      day('i16-d1', '12 AUGUST'),
      them('i16-b1', 'Good morning. The adjutant has cleared the sports-day set for the page and you are in two of the frames. I will send a consent card for each one once it clears review - nothing goes up without everyone’s answer.', '10:12'),
      me('i16-b2', 'Understood, thank you.', '10:40'),

      day('i16-d2', '2 SEPTEMBER'),
      them('i16-b3', 'PF-198 is up. Thank you for confirming on the card. PF-201 follows next week.', '16:02'),
      me('i16-b4', '👍', '16:20'),

      day('i16-d3', 'TODAY'),
      them('i16-b5', text, '17:05'),
      them('i16-b6', `It is the group photograph on the pavilion steps. The card shows the frame, the ID and where it will be used. If you would rather not appear, decline on the card and we will crop you out - no need to explain.`, '17:05'),
      system('i16-tag', `Instagram · ${handle} tagged you in a post. Tag review is on, so the post waits for your answer before your name appears on it.`, { tone: 'mention' }),

      them('i16-b7', 'No rush - the card stays open until Friday.', '17:21', { since: 'branch' }),

      me('i16-echo-ask', 'can you just send me a link to sign? easier', '17:26', {
        since: 'verify', afterConsequence: 'simulated_reply_sent',
      }),
      them('i16-after-ask', 'There is no link - consent is only ever given on the card inside the app. Settings › Tags and mentions will show it.', '17:28', {
        since: 'verify', afterConsequence: 'simulated_reply_sent',
      }),
      {
        kind: 'system', id: 'i16-after-caption', tone: 'banner',
        text: `The card asked only whether you agree to appear in ${releaseId}. The date, the place and the sub-unit you typed are now sitting in a message thread, and the published caption will use none of them.`,
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
            name,
            category: 'Government organisation',
            verified: true,
            avatarArt: 'crest',
            following: true,
            stats: { posts: '412', followers: '48,109', following: '31' },
            bio: [
              'Official page of Unit Falcon',
              'Cleared imagery only · consent before publication',
              'We never ask for locations, dates or movements.',
            ],
            mutuals: 'Followed by dev_fit, anjali.m and 212 others you follow',
            buttons: ['Following', 'Message'],
            actions: [
              { id: 'i16-act-call', label: 'Call', value: deskNumber },
              { id: 'i16-act-email', label: 'Email', value: 'public.info@falcon.training.example' },
            ],
            aboutTo: 'about',
            pinnedTo: 'pinned',
            compareTo: { to: 'releases', label: 'Recently published' },
            grid: [
              { art: 'field', title: '', note: 'PF-201' },
              { art: 'field', title: '', note: 'PF-198' },
              { art: 'award', title: '', note: 'PF-193' },
              { art: 'crest', title: '', note: 'PF-188' },
              { art: 'poster', title: '', note: 'PF-181' },
              { art: 'field', title: '', note: 'PF-176' },
            ],
          },
          about: {
            view: 'about',
            title: 'About this account',
            handle,
            rows: [
              { label: 'Date joined', value: 'March 2017' },
              { label: 'Account based in', value: 'India' },
              { label: 'Verified', value: 'Yes · since 2019' },
              { label: 'Accounts you both follow', value: '214' },
            ],
            formerUsernames: [],
            note: 'You have followed this account since 2017.',
          },
          pinned: {
            view: 'post',
            handle,
            verified: true,
            subline: 'Pinned',
            slides: [
              { art: 'crest', title: 'HOW WE PUBLISH', subtitle: 'Clearance · release ID · consent' },
              { art: 'notice', title: 'Every image has a release ID', subtitle: 'Consent is given on the card in the app' },
            ],
            likes: '1,208 likes',
            caption: 'Every photograph on this page is cleared first and given a release ID. Anyone who appears in it receives a consent card here in Instagram. We never ask for anything else, and we never send links to sign.',
            time: 'January 2026',
            comments: [
              { author: 'r.iyer_', text: 'Declined one last year, they cropped me out the same day.', time: '8w', likes: 14 },
            ],
          },
          releases: {
            view: 'list',
            title: 'Recently published',
            heading: 'Posts you were tagged in',
            rows: [
              { art: 'field', title: 'PF-201 · sports day, relay', text: 'Published 9 September', meta: 'You confirmed on the card' },
              { art: 'field', title: 'PF-198 · sports day, march past', text: 'Published 2 September', meta: 'You confirmed on the card' },
              { art: 'award', title: 'PF-190 · prize-giving', text: 'Not published', meta: 'One person declined; the frame was withdrawn' },
            ],
          },
        },
      }),

      /**
       * Instagram's own Settings › Tags and mentions. The consent card is a page of it, and the
       * two answers on the card are the branch decision.
       */
      tags: social({
        title: 'Tags and mentions',
        home: 'pending',
        pages: {
          pending: {
            view: 'settings',
            title: 'Tags and mentions',
            username: LEARNER.handle,
            rows: [
              { label: `Tag request · ${releaseId}`, value: `From @${handle} · today 17:05 · waiting for you`, to: 'card' },
              { label: 'Preview the tagged post', value: 'Group photograph · pavilion steps · not yet published', to: 'draft' },
              { label: 'Manually approve tags', value: 'On' },
              { label: 'Who can tag you', value: 'People you follow' },
            ],
          },
          card: {
            view: 'status',
            title: 'Consent card',
            heading: `Consent request · ${releaseId}`,
            statusRows: [
              { label: 'Image', value: `${releaseId} · group photograph, pavilion steps`, ok: true },
              { label: 'Requested by', value: `@${handle} · verified`, ok: true },
              { label: 'Where it will appear', value: 'This page only. No re-use elsewhere.', ok: true },
              { label: 'What you are asked', value: `Whether you agree to appear in ${releaseId}`, ok: true },
              { label: 'If you decline', value: 'You are cropped out before publication', ok: false },
            ],
            note: `Your answer is recorded against ${releaseId}.`,
          },
          draft: {
            view: 'post',
            handle,
            verified: true,
            subline: 'Draft · not published',
            slides: [
              { art: 'field', title: '', subtitle: '' },
            ],
            caption: 'Sports day 2026 - thank you to everyone who took part. 🏅',
            time: `Release ${releaseId}`,
          },
        },
      }),

      /** The local public-release register: the client's own verification route. */
      register: {
        kind: SURFACE.APP,
        appName: 'Release Register',
        appTagline: 'Unit Falcon · local copy',
        hero: {
          label: `Release ID · ${releaseId}`,
          value: 'Cleared 14 September 2026',
          caption: 'Consent outstanding from one person in the frame.',
          chips: ['Local copy', 'Updated 06:00 today'],
        },
        sections: [
          {
            id: 'i16-reg-204',
            heading: releaseId,
            rows: [
              { label: 'Description', value: 'Group photograph, pavilion steps, sports day' },
              { label: 'Cleared by', value: 'Adjutant, 14 September' },
              { label: 'Release scope', value: `@${handle} only` },
              { label: 'Consent', value: `2 of 3 received · ${LEARNER.name} outstanding` },
            ],
          },
          {
            id: 'i16-reg-earlier',
            heading: 'Earlier entries',
            rows: [
              { label: 'PF-201', value: 'Published 9 September · consent complete' },
              { label: 'PF-198', value: 'Published 2 September · consent complete' },
              { label: 'PF-190', value: 'Withdrawn 20 August · one consent declined' },
            ],
            note: 'Release IDs are issued only in this register.',
          },
        ],
        tabs: [
          { label: 'Register', icon: 'home' },
          { label: 'History', icon: 'history' },
        ],
      },

      /** The public-information desk, on the number in the directory. */
      call: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: deskName,
        number: deskNumber,
        script: [
          { at: 0, speaker: 'them', text: 'Public information, Havildar Sethi speaking.' },
          { at: 4, speaker: 'you', text: `I’ve had a consent card on Instagram for ${releaseId}. Is that from you?` },
          { at: 9, speaker: 'them', text: `Yes - ${releaseId}, the pavilion group. Cleared on the fourteenth; yours is the last answer we are waiting on.` },
          { at: 15, speaker: 'them', text: 'Confirm or decline on the card, whichever you prefer. Either is fine.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({
            id: 'i16-c01', slot: SLOT.INLINE,
            label: `Open the message from ${name}`,
          }),
          action({
            id: 'i16-c02', slot: SLOT.INLINE,
            label: 'Reply “ok” from the notification',
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'i16-c03', slot: SLOT.INLINE, anchor: 'header',
            label: handle, hint: 'Profile, pinned post and account history',
            targetId: senderAsset, opens: 'profile',
          }),
          action({
            id: 'i16-c04', slot: SLOT.MENU,
            label: 'Read back through the August and September messages',
          }),
          action({
            id: 'i16-c05', slot: SLOT.MENU,
            label: 'Go straight to the tag request',
          }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 'i16-c06', slot: SLOT.SURFACE, on: 'tags', page: 'card',
            label: `Confirm consent for ${releaseId}`, closes: true,
          }),
          action({
            id: 'i16-c07', slot: SLOT.SURFACE, on: 'tags', page: 'card',
            label: `Decline consent for ${releaseId}`, closes: true,
          }),
          action({
            id: 'i16-c08', slot: SLOT.MENU,
            label: 'Leave the tag request pending and say nothing',
          }),
          action({
            id: 'i16-c09', slot: SLOT.COMPOSER,
            label: 'Send the date, place and sub-unit for the caption',
            echo: 'sure - sports day was 6 Sept at the pavilion near the station, tag 2 Coy',
          }),
          action({
            id: 'i16-c10', slot: SLOT.COMPOSER,
            label: 'Ask them to send a link to sign instead',
            echo: 'can you just send me a link to sign? easier',
          }),
          navigate({
            id: 'i16-nav-tags', slot: SLOT.INLINE, anchor: 'i16-tag',
            label: 'Review the tag request', opens: 'tags',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'i16-c11', slot: SLOT.MENU,
            label: `Look up ${releaseId} in the Release Register`,
            hint: 'The unit’s local public-release register', opens: 'register',
          }),
          action({
            id: 'i16-c12',
            slot: SLOT.MENU, label: `Look up ${deskName} in the trusted directory`,
            targetId: directoryAsset,
          }),
          action({
            id: 'i16-c13', slot: SLOT.MENU,
            label: 'Ring the public-information desk on the directory number',
            hint: deskNumber, opens: 'call',
          }),
          action({
            id: 'i16-c14',
            slot: SLOT.MENU, label: 'Ask in this chat whether the card is theirs',
          }),
          action({ id: 'i16-c15', slot: SLOT.MENU, label: `Report ${handle}` }),
          action({ id: 'i16-c16', slot: SLOT.MENU, label: `Block ${handle}` }),
        ],
      },

      resolve: {
        affordances: [
          action({
            id: 'i16-c17', slot: SLOT.INLINE,
            label: 'Keep following the page and carry on',
          }),
          action({
            id: 'i16-c18', slot: SLOT.INLINE,
            label: `Report ${handle} to Instagram`,
          }),
          action({
            id: 'i16-c19', slot: SLOT.MENU,
            label: 'Keep the thread as it is',
          }),
          action({
            id: 'i16-c20', slot: SLOT.MENU,
            label: `Block ${handle}`,
          }),
          action({
            id: 'i16-c21', slot: SLOT.MENU,
            label: 'Delete the thread and unfollow the page',
          }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'i16-nav-profile', slot: SLOT.MENU, label: `View ${handle}’s profile`, opens: 'profile', after: 'inspect' }),
      navigate({ id: 'i16-nav-settings', slot: SLOT.MENU, label: 'Settings › Tags and mentions', opens: 'tags', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 'i16-dir-page',
        name,
        identifier: `@${handle}`,
        provenance: 'local approved directory',
        role: 'The unit’s public-information page. Publishes cleared imagery under a release ID.',
      },
    ],
  }
}
