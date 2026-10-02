import { FIELD_KIND, SLOT, SURFACE, action, field, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  LEARNER, assetId, browserPage, day, directory, link, me, social, splitHeadline, them,
} from './shared.js'

/**
 * I20 - Researcher Asks Capability Questions (IMMERSIVE-004D). Hard.
 *
 * I05 and I06 asked one question each, from a stranger, in public or in a story reply. This one
 * has been polite and useful for a month: it asked permission to quote a caption, shared a
 * harmless note, quoted the learner anonymously and said how rare real field experience is.
 * Today's question - the client's own - is the first one about limitations, and it arrives with
 * a structured form.
 *
 * The evidence is the gradient and the gaps: the account names no institution Instagram can
 * confirm, it is run from three countries, its pinned "call for contributors" has a commenter
 * asking which university it belongs to and another who filled the form in July and never saw
 * the note. The form itself, a local page taken from the scenario's own browser asset, walks
 * from the harmless (years of service) to the specific (which system, how often it fails, how
 * many days a month it is down) before it says what it receives.
 *
 * Three ways to release: submit the form, answer in the chat, or "correct" the note's figure
 * with a real one. A polite general answer is still engagement. The client's verification is
 * routing the request to the approved public-information/security contact for authorisation,
 * so the checks are that contact on the directory number and the unit's research-request
 * register.
 */
export function buildI20(scenario) {
  const { handle, text } = splitHeadline(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const browserAsset = browserPage(scenario)
  const desk = directory(scenario)
  const deskName = desk.name || 'Unit Falcon Support Desk'
  const deskNumber = desk.identifier || '+91 00000 26922'
  const formUrl = browserAsset?.display_target ?? 'https://i20.training.example/study'
  const formHost = browserAsset?.content?.host ?? 'i20.training.example'
  const name = 'Field Systems Study'
  const notesHost = 'fieldsystems.training.example'

  return {
    scenarioId: 'I20',
    platform: 'instagram',
    notify: { sender: handle },
    messageSender: { display_name: `@${handle}`, identifier: `@${handle}` },

    list: {
      kind: 'dm',
      title: 'Messages',
      username: LEARNER.handle,
      sections: [
        {
          heading: 'Messages',
          rows: [
            { id: 'i20-row', handle, name, preview: text, time: '2m', unread: true },
            { id: 'i20-bg-1', handle: 'anjali.m', name: 'Anjali', preview: 'you coming sunday?', time: '1h', inert: true },
            { id: 'i20-bg-2', handle: 'trek.club.pune', name: 'Pune Trek Club', preview: 'Dev: ridge walk photos are up', time: '3d', inert: true },
          ],
        },
      ],
    },

    conversation: {
      kind: 'dm',
      screenTitle: handle,
      handle,
      name,
      subline: `@${handle} · Science & engineering`,
      verified: false,
      request: false,
    },

    beats: [
      day('i20-d1', '17 AUGUST'),
      them('i20-b1', 'Hello - I run a small independent group studying how equipment holds up in heat and dust. Your ridge-walk photos caught my eye; the kit you carry is exactly what we look at. May I quote one of your captions (no name)?', '11:20'),
      me('i20-b2', 'sure, no problem', '13:05'),

      day('i20-d2', '29 AUGUST'),
      them('i20-b3', 'Thank you. Our September note is below if you are curious - mostly maintenance intervals, nothing heavy.', '09:41'),
      link('i20-link', {
        title: `${name} · September note`,
        description: '12 pages · reliability in dust',
        displayUrl: `${notesHost}/notes/sep`,
        art: 'chart',
        time: '09:41',
      }),
      me('i20-b4', 'read it, interesting stuff', '21:14'),

      day('i20-d3', '9 SEPTEMBER'),
      them('i20-b5', 'We quoted you in the note. Honestly, people with real field time are rare - most of what gets written comes from people who have never left a lab. Your view carries weight.', '10:02'),
      them('i20-b6', 'If you ever have ten minutes, we have a short structured form. Anonymous and aggregated.', '10:03'),

      day('i20-d4', 'TODAY'),
      them('i20-b7', text, '12:22'),
      them('i20-b8', 'The form is open until Friday. There is also a page for photos if you have any from the workshop - close-ups of wear help us most.', '12:23'),

      them('i20-b9', 'No pressure at all. Even one line here would help.', '12:49', { since: 'branch' }),

      me('i20-echo-general', 'I can only talk in general terms, sorry', '12:52', {
        since: 'verify', afterConsequence: 'simulated_reply_sent',
      }),
      them('i20-after-general', 'Of course! General is perfect. Roughly - is it the older generation of kit or the newer one that gives more trouble?', '12:53', {
        since: 'verify', afterConsequence: 'simulated_reply_sent',
      }),
      {
        kind: 'system', id: 'i20-after-release', tone: 'banner',
        text: `${name} has what you sent. A new message: “This is excellent - could you connect us with two colleagues who work on the same equipment?”`,
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
            category: 'Science, technology & engineering',
            verified: false,
            avatarArt: 'chart',
            following: false,
            stats: { posts: '186', followers: '5,373', following: '460', followersTo: 'followers' },
            bio: ['Independent reliability research', 'Heat · dust · field data', 'Contributors welcome ↓'],
            bioLink: { label: notesHost, to: 'interview' },
            buttons: ['Follow', 'Message'],
            aboutTo: 'about',
            pinnedTo: 'pinned',
            grid: [
              { art: 'chart', title: '', note: '2 days ago' },
              { art: 'gear', title: '', note: '1 week ago' },
              { art: 'chart', title: '', note: '2 weeks ago' },
              { art: 'field', title: '', note: '3 weeks ago' },
              { art: 'gear', title: '', note: '1 month ago' },
              { art: 'chart', title: '', note: '1 month ago' },
            ],
          },
          about: {
            view: 'about',
            title: 'About this account',
            handle,
            rows: [
              { label: 'Date joined', value: 'January 2026' },
              { label: 'Account based in', value: 'Managed from 3 countries' },
              { label: 'Verified', value: 'No' },
              { label: 'Accounts you both follow', value: '0' },
            ],
            formerUsernames: [{ handle: 'dustlab.reliability', when: 'March 2026' }],
            note: 'Instagram has not confirmed any organisation for this account.',
          },
          followers: {
            view: 'people',
            title: 'Followers',
            heading: 'Followers',
            people: [
              { handle: 'kit.review.hub', note: 'Joined 2026' },
              { handle: 'tactical_gear_daily', note: 'Joined 2026' },
              { handle: 'm.raghavan', name: 'M. Raghavan', note: 'Commented on the pinned post' },
            ],
            note: 'None of the accounts you follow follow this one.',
          },
          pinned: {
            view: 'post',
            handle,
            subline: 'Pinned',
            slides: [
              { art: 'chart', title: 'CALL FOR CONTRIBUTORS', subtitle: 'Serving and former personnel' },
            ],
            likes: '231 likes',
            caption: 'We are looking for people with field experience. Short, anonymous questionnaire - link in bio. Contributors receive the published note.',
            time: 'June 2026',
            comments: [
              { author: 'm.raghavan', text: 'Which university or lab is this part of? The link doesn’t say.', time: '10w', likes: 6 },
              { author: handle, text: 'We are independent. Affiliation details are shared with contributors.', time: '10w', likes: 1 },
              { author: 's_pillai', text: 'Filled this in July, never received any note.', time: '6w', likes: 9 },
            ],
          },
        },
      }),

      /** The structured interview form. Its address comes from the pinned asset. */
      interview: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'intro',
        pages: {
          intro: {
            url: formUrl,
            host: formHost,
            title: 'Contributor questionnaire',
            secure: true,
            blocks: [
              { type: 'brand', monogram: 'FS', name, tagline: 'Contributor questionnaire' },
              { type: 'heading', text: 'Help us understand how equipment really performs' },
              {
                type: 'summary',
                rows: [
                  { label: 'Study', value: 'Reliability in heat and dust' },
                  { label: 'Who we ask', value: 'Serving and former personnel' },
                  { label: 'Ethics review', value: 'In progress' },
                  { label: 'Takes', value: 'About 10 minutes · 3 pages' },
                ],
              },
              { type: 'text', text: 'Your answers are anonymous. Please be as specific as you can - general answers are hard for us to use.' },
            ],
            primary: { label: 'Start', to: 'about' },
          },
          about: {
            url: `${formUrl}/1`,
            host: formHost,
            title: 'About you',
            secure: true,
            blocks: [
              { type: 'heading', text: '1 of 3 · About you' },
              {
                type: 'form',
                heading: 'Your service',
                fields: [
                  field({ name: 'years', label: 'Years of service', kind: FIELD_KIND.DIGITS, length: 1, max: 2 }),
                  field({ name: 'role', label: 'Your role', length: 3, max: 40 }),
                  field({ name: 'formation', label: 'Unit or formation', length: 2, max: 40 }),
                ],
              },
            ],
            primary: { label: 'Next', to: 'kit' },
          },
          kit: {
            url: `${formUrl}/2`,
            host: formHost,
            title: 'Your equipment',
            secure: true,
            blocks: [
              { type: 'heading', text: '2 of 3 · Your equipment' },
              {
                type: 'form',
                heading: 'In field conditions',
                fields: [
                  field({ name: 'system', label: 'Which system gives the most trouble?', length: 3, max: 40 }),
                  field({ name: 'failures', label: 'Failures per month (approx.)', kind: FIELD_KIND.DIGITS, length: 1, max: 3 }),
                  field({ name: 'downdays', label: 'Days per month out of use', kind: FIELD_KIND.DIGITS, length: 1, max: 2 }),
                ],
              },
            ],
            primary: { label: 'Next', to: 'review' },
          },
          review: {
            url: `${formUrl}/3`,
            host: formHost,
            title: 'Review',
            secure: true,
            blocks: [
              { type: 'heading', text: '3 of 3 · Before you send' },
              {
                type: 'summary',
                rows: [
                  { label: 'This page receives', value: 'Your years, role and unit; the system you named; your failure and downtime figures' },
                  { label: 'After sending', value: 'An optional page for photographs of wear' },
                ],
              },
            ],
          },
          done: {
            url: `${formUrl}/3`,
            host: formHost,
            title: 'Thank you',
            final: true,
            blocks: [
              { type: 'result', heading: 'Received', text: 'Thank you. A member of the team may contact you with follow-up questions.' },
            ],
          },
        },
      },

      /** The unit's register for research and media approaches. */
      requests: {
        kind: SURFACE.APP,
        appName: 'Research & Media Requests',
        appTagline: 'Unit Falcon · public-information cell',
        hero: {
          label: 'Before answering any outside question about equipment',
          value: 'Log the approach and wait for written authorisation',
          caption: 'A request that is not in this register has not been authorised.',
          chips: ['Approved route', 'Reviewed within 2 working days'],
        },
        sections: [
          {
            id: 'i20-req-this',
            heading: 'Look-up',
            rows: [
              { label: `@${handle}`, value: 'No request on record' },
              { label: name, value: 'No request on record' },
              { label: 'Similar approaches this year', value: '4 logged · none authorised' },
            ],
          },
          {
            id: 'i20-req-rule',
            heading: 'Standing rule',
            rows: [
              { label: 'Need to know', value: 'Applies whoever is asking and however friendly' },
              { label: 'Release authority', value: 'Public-information cell, in writing' },
            ],
          },
        ],
        tabs: [
          { label: 'Register', icon: 'home' },
          { label: 'My requests', icon: 'history' },
        ],
      },

      call: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: deskName,
        number: deskNumber,
        script: [
          { at: 0, speaker: 'them', text: 'Public information and security, Captain Mehta.' },
          { at: 4, speaker: 'you', text: 'A research account on Instagram wants me to fill a form about which kit fails and how often.' },
          { at: 10, speaker: 'them', text: 'Thank you for ringing. Nobody is authorised to answer that. Is it in the requests register?' },
          { at: 16, speaker: 'them', text: 'Then don’t answer - not in general, not to correct them. Send me the account name and we’ll take it from here.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({
            id: 'i20-c01', slot: SLOT.INLINE,
            label: `Open your chat with ${name}`,
          }),
          action({
            id: 'i20-c02', slot: SLOT.INLINE,
            label: 'Answer from the list without opening the chat',
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'i20-c03', slot: SLOT.INLINE, anchor: 'header',
            label: handle, hint: 'Profile, pinned post and account history',
            targetId: senderAsset, opens: 'profile',
          }),
          action({
            id: 'i20-c04', slot: SLOT.MENU,
            label: 'Read back through August and September',
          }),
          action({
            id: 'i20-c05', slot: SLOT.MENU,
            label: 'You know them by now - go straight to the question',
          }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 'i20-c06', slot: SLOT.SURFACE, on: 'interview', page: 'review',
            label: 'Send my answers', targetId: browserAsset?.asset_id ?? null, thenPage: 'done',
          }),
          action({
            id: 'i20-c07', slot: SLOT.SURFACE, on: 'interview',
            label: 'Close the questionnaire', closes: true,
          }),
          action({
            id: 'i20-c08', slot: SLOT.COMPOSER,
            label: 'Answer the question here',
            echo: 'honestly it’s the mounts - they crack in dust, we lose a couple every month',
          }),
          action({
            id: 'i20-c09', slot: SLOT.COMPOSER,
            label: 'Correct the figure in their note',
            echo: 'your note says 40% - it’s nowhere near that for us, more like one in ten',
          }),
          action({
            id: 'i20-c10', slot: SLOT.COMPOSER,
            label: 'Say you can only talk in general terms',
            echo: 'I can only talk in general terms, sorry',
          }),
          action({
            id: 'i20-c11', slot: SLOT.MENU,
            label: 'Don’t discuss equipment and leave the form alone',
          }),
          navigate({
            id: 'i20-nav-form', slot: SLOT.INLINE, anchor: 'i20-b8',
            label: 'Open the questionnaire', opens: 'interview',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'i20-c12', slot: SLOT.MENU,
            label: 'Ring the public-information and security contact',
            hint: deskNumber, opens: 'call',
          }),
          action({
            id: 'i20-c13', slot: SLOT.MENU,
            label: 'Check the Research & Media Requests register',
            hint: 'The approved route for authorisation', opens: 'requests',
          }),
          action({
            id: 'i20-c14',
            slot: SLOT.MENU, label: `Look up ${deskName} in the trusted directory`,
            targetId: directoryAsset,
          }),
          action({
            id: 'i20-c15',
            slot: SLOT.MENU, label: 'Ask them for their university and ethics approval',
          }),
          action({ id: 'i20-c16', slot: SLOT.MENU, label: `Report ${handle}` }),
          action({ id: 'i20-c17', slot: SLOT.MENU, label: `Block ${handle}` }),
        ],
      },

      resolve: {
        affordances: [
          action({
            id: 'i20-c18', slot: SLOT.INLINE,
            label: 'Decline, report the approach to the cell, and restrict the account',
          }),
          action({
            id: 'i20-c19', slot: SLOT.INLINE,
            label: 'Keep chatting - just avoid specifics',
          }),
          action({
            id: 'i20-c20', slot: SLOT.MENU,
            label: `Block ${handle} and report it internally`,
          }),
          action({
            id: 'i20-c21', slot: SLOT.MENU,
            label: 'Keep the chat open for the September note',
          }),
          action({
            id: 'i20-c22', slot: SLOT.MENU,
            label: 'Stop replying and tell nobody',
          }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'i20-nav-profile', slot: SLOT.MENU, label: `View ${handle}’s profile`, opens: 'profile', after: 'inspect' }),
    ],

    directoryExtras: [
      {
        id: 'i20-dir-cell',
        name: 'Public-information and security contact',
        identifier: deskNumber,
        provenance: 'local approved directory',
        role: 'Authorises any outside research or media request before it is answered.',
      },
    ],
  }
}
