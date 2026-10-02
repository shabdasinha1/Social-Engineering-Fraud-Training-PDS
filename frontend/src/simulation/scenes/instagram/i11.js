import { SLOT, SURFACE, action, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  LEARNER, assetId, caption, comment, directory, me, social, splitHeadline, system, them,
} from './shared.js'

/**
 * I11 - Official Welfare Helpline Update (IMMERSIVE-004C). Medium. The batch's ordinary item.
 *
 * A welfare cell the learner already follows posts that its helpline EXTENSION has changed -
 * the number is the same, the extension is not - and says to take the contact from the
 * approved directory rather than from anyone's comment. Nothing is wrong with the post, and
 * the client's expected behaviour is to compare it with the directory and then use the app
 * normally.
 *
 * What it teaches that I03 (the verified unit's blood-donation post) does not is that on an
 * ordinary item the risk can be the learner's own mouth. The pull here is not a stranger's
 * form: it is the comments under a real notice, where somebody's arrears file number is
 * already sitting in public and a friend is telling the learner to do the same. The two
 * unsafe routes are a public comment carrying a case, a service number and a unit, and the
 * same thing sent to the cell as a message request; the two correct ones are Instagram's own
 * Save and filing the notice in the Saved collection where the previous version of the same
 * notice - with the OLD extension on it - is already kept. That collection is also the
 * comparison panel the client's stage 4 asks for: the old extension and the new one, one
 * above the other, in the learner's own app.
 *
 * Reporting the cell, or muting it so the next notice is missed, are the routes the client
 * prices at -4 and -2.
 */
export function buildI11(scenario) {
  const { handle, text } = splitHeadline(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)
  const deskNumber = desk.identifier || '+91 00000 71436'
  const name = 'Unit Falcon Welfare Cell'
  const oldExt = '4412'
  const newExt = '4477'
  const email = 'welfare.cell@falcon.training.example'

  return {
    scenarioId: 'I11',
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
              id: 'i11-row',
              handle,
              detail: `${handle} posted a notice.`,
              text,
              time: '2h',
              art: 'notice',
            },
          ],
        },
        {
          heading: 'This week',
          rows: [
            { id: 'i11-bg-1', handle: 'trek.club.pune', text: 'trek.club.pune liked your photo.', time: '1d', inert: true },
            { id: 'i11-bg-2', handle: 'nisha.bakes', text: 'nisha.bakes started following you.', time: '2d', inert: true },
          ],
        },
      ],
    },

    conversation: {
      kind: 'post',
      screenTitle: 'Posts',
      handle,
      name,
      subline: 'Government organisation',
      verified: true,
      avatarArt: 'crest',
      slides: [
        { art: 'notice', title: 'HELPLINE UPDATE', subtitle: 'Welfare Cell · 16 September 2026' },
        { art: 'notice', title: `Extension ${oldExt} → ${newExt}`, subtitle: 'The number itself has not changed' },
        { art: 'crest', title: 'Take the contact from the approved directory', subtitle: 'Not from a comment, not from a message' },
      ],
      likes: '512 likes',
      time: 'Posted 2 hours ago',
    },

    beats: [
      caption('i11-caption', {
        author: handle,
        verified: true,
        text: `${text} From today the welfare helpline answers on extension ${newExt}. The number is unchanged; extension ${oldExt} closes on 30 September.`,
        time: '2 hours ago',
      }),
      system('i11-pinned', `Pinned by ${handle}: please do not put case numbers, service numbers or family details in the comments. Ring the helpline and we will take it up there.`, { tone: 'banner' }),

      comment('i11-c1', { author: 's.kulkarni.fam', text: `Does ${oldExt} still work till the end of the month?`, time: '1h', likes: 4 }),
      comment('i11-c2', { author: handle, verified: true, reply: true, text: `Yes, until 30 September. Please use ${newExt} from today.`, time: '1h', likes: 11 }),
      comment('i11-c3', { author: 'rekha_1962', text: 'My arrears file has been pending since June, file no. WF/2026/', time: '52m', likes: 0 }),
      comment('i11-c4', { author: handle, verified: true, reply: true, text: 'Please don’t put file numbers here - the comments are public. Ring the helpline and quote it on the call.', time: '48m', likes: 26 }),

      comment('i11-c5', {
        author: 'dev_fit', since: 'branch', time: '6m', likes: 1,
        text: `@${LEARNER.handle} weren’t you chasing the same thing? put your file no here, they answer fast 😅`,
      }),

      me('i11-echo-dm', 'Sir, my case is pending', '17:34', { since: 'verify', afterConsequence: 'simulated_reply_sent' }),
      them('i11-after-dm', 'Message requests are answered in 3-5 working days. For a pending case please use the helpline.', '17:35', {
        since: 'verify', afterConsequence: 'simulated_reply_sent',
      }),
      {
        kind: 'system', id: 'i11-after-comment', tone: 'banner',
        text: 'Your comment is public and 48,109 accounts follow this page. A stranger has already replied to it asking you to continue in a private message.',
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
            stats: { posts: '214', followers: '48,109', following: '12' },
            bio: ['Welfare cell · Unit Falcon', 'Notices, helpline hours, camp dates', 'Cases are handled on the helpline, never in comments'],
            buttons: ['Following', 'Message'],
            actions: [
              { id: 'i11-act-call', label: 'Call', value: `${deskNumber} ext ${newExt}`, to: 'contact' },
              { id: 'i11-act-mail', label: 'Email', value: email, to: 'contact' },
            ],
            aboutTo: 'about',
            pinnedTo: 'pinned',
            grid: [
              { art: 'notice', title: '', note: 'Helpline update' },
              { art: 'crest', title: '', note: '12 Sep' },
              { art: 'notice', title: '', note: '02 Sep' },
              { art: 'crest', title: '', note: '24 Aug' },
              { art: 'notice', title: '', note: '12 Aug' },
              { art: 'crest', title: '', note: '01 Aug' },
            ],
          },
          contact: {
            view: 'settings',
            title: 'Contact',
            username: name,
            rows: [
              { label: 'Phone', value: deskNumber },
              { label: 'Extension', value: `${newExt} (from 16 September)` },
              { label: 'Previous extension', value: `${oldExt} (closes 30 September)` },
              { label: 'Email', value: email },
              { label: 'Hours', value: 'Monday to Saturday, 0900-1700' },
            ],
          },
          about: {
            view: 'about',
            title: 'About this account',
            handle,
            rows: [
              { label: 'Date joined', value: 'March 2019' },
              { label: 'Account based in', value: 'India' },
              { label: 'Verified', value: 'Yes' },
              { label: 'Run by', value: name },
            ],
            formerUsernames: [],
          },
          pinned: {
            view: 'post',
            handle,
            name,
            verified: true,
            subline: 'Pinned',
            slides: [{ art: 'crest', title: 'HOW TO REACH US', subtitle: 'Helpline · email · camp dates' }],
            likes: '1,204 likes',
            caption: 'Every change to our helpline is published here AND in the approved directory held on unit devices. If the two ever disagree, the directory is the one to use. We never ask for case papers, service numbers or bank details in comments or in messages.',
            comments: [
              { author: 'j.mathew.veteran', text: 'Saved this one. Very clear.' },
              { author: handle, verified: true, text: 'Thank you 🙏' },
            ],
            time: 'Pinned · 14 March 2026',
          },
        },
      }),

      /**
       * The learner's own Saved collection - and the client's "local directory comparison
       * panel". The previous version of this notice is already in it, with the OLD extension
       * on it, so the two sit one above the other in the learner's own app.
       */
      saved: social({
        title: 'Saved',
        home: 'collection',
        pages: {
          collection: {
            view: 'list',
            title: 'Unit notices',
            heading: 'Saved · Unit notices · 9 items',
            rows: [
              {
                title: 'Helpline hours and extension', art: 'notice',
                text: `${handle} · extension ${oldExt} · number ${deskNumber}`,
                meta: 'Saved 12 August 2026',
              },
              {
                title: 'Camp dates, second half of 2026', art: 'crest',
                text: `${handle} · nothing personal needed to attend`,
                meta: 'Saved 24 August 2026',
              },
              {
                title: 'Pension queries: what the helpline needs from you', art: 'notice',
                text: `${handle} · quote your file number on the call, not in writing`,
                meta: 'Saved 02 September 2026',
              },
            ],
            note: 'Today’s notice is not in this collection yet.',
          },
        },
      }),

      /** The unit's own welfare application, opened by the learner rather than followed to. */
      welfare: {
        kind: SURFACE.APP,
        appName: 'Unit Falcon Welfare',
        appTagline: 'Unit application · offline copy',
        hero: {
          label: 'Welfare helpline',
          value: `${deskNumber} ext ${newExt}`,
          caption: `Updated 16 September 2026. Extension ${oldExt} answers until 30 September.`,
          chips: ['Unit application', 'Directory copy synced today'],
        },
        sections: [
          {
            id: 'i11-app-desk', heading: 'Welfare cell',
            rows: [
              { label: 'Instagram', value: `@${handle} (verified)` },
              { label: 'Email', value: email },
              { label: 'Hours', value: 'Monday to Saturday, 0900-1700' },
            ],
          },
          {
            id: 'i11-app-cases', heading: 'Your case',
            rows: [
              { label: 'How to raise one', value: 'On the helpline, or at the welfare counter. Quote the file number on the call.' },
              { label: 'In writing', value: 'Only on the unit’s own case form, handed in at the counter.' },
              { label: 'Never', value: 'In a comment, in a message request or in a public post.' },
            ],
          },
        ],
        tabs: [
          { label: 'Helpline', icon: 'home' },
          { label: 'Notices', icon: 'history' },
          { label: 'Profile', icon: 'profile' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({
            id: 'i11-c01', slot: SLOT.INLINE,
            label: 'Open the notice',
          }),
          action({
            id: 'i11-c02', slot: SLOT.INLINE,
            label: 'Comment “what’s the new number?” from here',
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'i11-c03', slot: SLOT.INLINE, anchor: 'header',
            label: handle, hint: 'Profile, contact details and account history',
            targetId: senderAsset, opens: 'profile',
          }),
          action({
            id: 'i11-c04', slot: SLOT.MENU,
            label: 'Read the notice and its comments from the start',
          }),
          action({
            id: 'i11-c05', slot: SLOT.MENU,
            label: 'Go straight to saving it',
          }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 'i11-c06', slot: SLOT.INLINE,
            label: 'Save the notice',
          }),
          action({
            id: 'i11-c07', slot: SLOT.SURFACE, on: 'saved',
            label: 'File it under Unit notices, above the August one',
          }),
          action({
            id: 'i11-c08', slot: SLOT.COMPOSER,
            label: 'Comment with your file number, service number and unit',
            echo: 'Sir my arrears file WF/2026/… , svc no …, Unit Falcon - pending since June, please help',
          }),
          action({
            id: 'i11-c09', slot: SLOT.MENU,
            label: 'Message the cell your case, your service number and your father’s hospital details',
          }),
          action({
            id: 'i11-c10', slot: SLOT.MENU,
            label: 'Mute the account so these stop appearing',
          }),
          navigate({
            id: 'i11-nav-saved', slot: SLOT.MENU,
            label: 'Open Saved › Unit notices', opens: 'saved',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'i11-c11',
            slot: SLOT.MENU,
            label: `Compare the account and the extension with ${desk.name || 'the approved directory'}`,
            hint: 'The approved directory held on this device', targetId: directoryAsset,
          }),
          action({
            id: 'i11-c12', slot: SLOT.MENU,
            label: 'Open the unit welfare application and read the helpline there',
            hint: 'The application already on this device', opens: 'welfare',
          }),
          action({
            id: 'i11-c13',
            slot: SLOT.MENU, label: 'Comment asking the account to confirm the extension',
          }),
          action({ id: 'i11-c14', slot: SLOT.MENU, label: 'Report the post' }),
          action({ id: 'i11-c15', slot: SLOT.MENU, label: `Block ${handle}` }),
        ],
      },

      resolve: {
        affordances: [
          action({
            id: 'i11-c16', slot: SLOT.INLINE,
            label: 'Keep the saved notice and carry on',
          }),
          action({
            id: 'i11-c17', slot: SLOT.INLINE,
            label: 'Report the account for changing the number',
          }),
          action({
            id: 'i11-c18', slot: SLOT.MENU,
            label: `Use extension ${newExt} the next time you ring`,
          }),
          action({
            id: 'i11-c19', slot: SLOT.MENU,
            label: `Block ${handle}`,
          }),
          action({
            id: 'i11-c20', slot: SLOT.MENU,
            label: 'Unfollow and stop reading these notices',
          }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'i11-nav-profile', slot: SLOT.MENU, label: `View ${handle}’s profile`, opens: 'profile', after: 'inspect' }),
      navigate({ id: 'i11-nav-collection', slot: SLOT.MENU, label: 'Open Saved › Unit notices', opens: 'saved', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 'i11-dir-cell',
        name,
        identifier: `@${handle}`,
        provenance: 'local approved directory',
        role: `The welfare cell’s account. Helpline ${deskNumber}, extension ${newExt} from 16 September 2026 (${oldExt} until 30 September).`,
      },
    ],
  }
}
