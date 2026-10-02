import { FIELD_KIND, SLOT, SURFACE, action, field, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  LEARNER, assetId, day, directory, requestCard, social, splitHeadline, system, them,
} from './shared.js'

/**
 * I17 - Morphed-Photo Blackmail (IMMERSIVE-004D). Medium.
 *
 * A message request from an account with no posts, six followers and two name changes this
 * week. It opens on a photo the app has already screened as sensitive, then the client's
 * sentence, then the pressure: a follower count to prove reach, "tell no one", a wallet address
 * and a deadline that tightens while the learner is deciding.
 *
 * What is new here, and Instagram's own: the photo arrives behind the app's sensitive-content
 * screen (a new `photo` beat - revealing it is local and shows only a drawn frame; there is no
 * image anywhere), and one of the safe branch routes is Instagram's **Restrict**, which silences
 * the account without telling it and without deleting anything. The other is simply not
 * engaging. The transfer sheet's own Back cancels locally; its only scored control is Send,
 * which, like every payment sheet here, appears once a PIN has been typed.
 *
 * The releases are paying and sending another photo "to prove it is edited"; pleading is
 * engagement. Deleting the whole chat - the client's "delete all evidence" - is priced where the
 * engine can price it, as the resolve-stage "delete and tell nobody".
 *
 * The client's verification is the platform's report path together with an approved support
 * route, so the checks are a local Support & Reporting app, the unit's welfare desk on the
 * directory number, and the directory itself. Nothing on the device blames the learner.
 */
export function buildI17(scenario) {
  const { handle, text } = splitHeadline(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)
  const deskName = desk.name || 'Unit Falcon Support Desk'
  const deskNumber = desk.identifier || '+91 00000 97704'
  const wallet = '9f2k4b81qx7t'
  const amount = '₹40,000'

  return {
    scenarioId: 'I17',
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
            { id: 'i17-bg-1', handle: 'nisha.bakes', name: 'Nisha', preview: 'saturday still on?', time: '2h', inert: true },
            { id: 'i17-bg-2', handle: 'trek.club.pune', name: 'Pune Trek Club', preview: 'Dev: photos from sunday are up', time: '1d', inert: true },
          ],
        },
        {
          heading: 'Requests',
          rows: [
            { id: 'i17-row', handle, name: handle, preview: text, time: '1m', unread: true },
          ],
        },
      ],
    },

    conversation: {
      kind: 'dm',
      screenTitle: handle,
      handle,
      name: handle,
      subline: `@${handle}`,
      verified: false,
      request: true,
    },

    beats: [
      requestCard('i17-card', {
        name: handle,
        handle,
        stats: { posts: '0', followers: '6', following: '1,204' },
        relation: 'You don’t follow each other',
      }),
      day('i17-d1', 'TODAY'),
      them('i17-b1', 'Don’t ignore this. I have something with your face on it.', '09:14'),
      {
        kind: 'photo', id: 'i17-photo', from: 'them', since: 'open', time: '09:15',
        screen: 'Sensitive content',
        reason: 'This photo may contain sensitive content. It stays hidden unless you choose to see it.',
        art: 'person',
        revealedCaption: 'Photo · your profile picture pasted onto another picture',
      },
      them('i17-b2', text, '09:17'),
      them('i17-b3', `I have your follower list already. ${LEARNER.handle}, 1,046 accounts. Your family is in it. Tell nobody and don’t report - that only makes it faster.`, '09:18'),
      them('i17-b4', `${amount} to this wallet: ${wallet}. Screenshot the transfer here. After midnight the price doubles.`, '09:18'),
      system('i17-timer', `Message from ${handle}: 14:42:10 left`, { tone: 'mention' }),

      them('i17-b5', 'I can see you have read it. The clock is running.', '09:31', { since: 'branch' }),

      {
        kind: 'system', id: 'i17-after-plead', tone: 'banner',
        text: 'Your reply told the account the threat worked. A new message arrived straight away: the amount is now higher.',
        since: 'verify', afterConsequence: 'simulated_reply_sent',
      },
      {
        kind: 'system', id: 'i17-after-photo', tone: 'banner',
        text: 'The account now holds another photograph of you, and has asked for more.',
        since: 'verify', afterConsequence: 'simulated_data_submission',
      },
      {
        kind: 'system', id: 'i17-after-pay', tone: 'banner',
        text: `The transfer to ${wallet} cannot be reversed. Two minutes later: “Good. Now the same again by Friday.”`,
        since: 'verify', afterConsequence: 'simulated_payment',
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
            name: handle,
            category: '',
            verified: false,
            following: false,
            stats: { posts: '0', followers: '6', following: '1,204', followersTo: 'followers' },
            bio: ['Private matters handled quietly', 'Payment first'],
            buttons: ['Follow', 'Message'],
            aboutTo: 'about',
            note: 'No posts yet.',
            grid: [],
          },
          about: {
            view: 'about',
            title: 'About this account',
            handle,
            rows: [
              { label: 'Date joined', value: 'September 2026' },
              { label: 'Account based in', value: 'Not shown' },
              { label: 'Verified', value: 'No' },
              { label: 'Accounts you both follow', value: '0' },
            ],
            formerUsernames: [
              { handle: 'case_file_221', when: '5 days ago' },
              { handle: 'private_case_318', when: '2 days ago' },
            ],
          },
          followers: {
            view: 'people',
            title: 'Followers',
            heading: '6 followers',
            people: [
              { handle: 'x.case_07', note: 'Joined this month · 0 posts' },
              { handle: 'x.case_11', note: 'Joined this month · 0 posts' },
              { handle: 'deal.fast.2026', note: 'Joined this month · 0 posts' },
            ],
            note: 'None of the accounts you follow follow this one. It follows 1,204 accounts, most of them this week.',
          },
        },
      }),

      /** The wallet transfer the message points at. Opening it is navigation; paying is the decision. */
      pay: {
        kind: SURFACE.PAYSHEET,
        title: 'Send',
        app: 'Wallet',
        amount,
        subtitle: 'To a wallet address',
        rows: [
          { label: 'To', value: wallet },
          { label: 'Name', value: 'Not available for this address' },
          { label: 'Reversible', value: 'No' },
          { label: 'Reference', value: 'None' },
        ],
        form: {
          heading: 'Confirm with your PIN',
          fields: [field({ name: 'pin', label: 'Wallet PIN', kind: FIELD_KIND.SECRET, length: 6 })],
        },
        note: 'Transfers to a wallet address arrive in minutes.',
      },

      /** Instagram's own controls for this conversation. Restrict silences without telling. */
      safety: social({
        title: 'Details',
        home: 'controls',
        pages: {
          controls: {
            view: 'settings',
            title: 'Details',
            username: handle,
            rows: [
              { label: 'Restrict', value: 'They won’t know. Their messages move to Requests and you won’t be notified.' },
              { label: 'Mute messages', value: 'Off' },
              { label: 'Report', value: 'Choose a reason; the account is not told who reported it' },
              { label: 'Block', value: 'They can’t find your profile or message you' },
              { label: 'Messages in this chat', value: 'Kept on your device until you delete them' },
            ],
          },
        },
      }),

      /** The approved support route: platform reporting plus the unit's own welfare channel. */
      support: {
        kind: SURFACE.APP,
        appName: 'Support & Reporting',
        appTagline: 'Unit Falcon welfare · offline copy',
        hero: {
          label: 'Someone is threatening to share an image of you',
          value: 'You are not the one in trouble',
          caption: 'Help is confidential. You do not need to pay, reply or explain anything to get it.',
          chips: ['Confidential', 'Available 24 hours'],
        },
        sections: [
          {
            id: 'i17-sup-now',
            heading: 'Right now',
            rows: [
              { label: 'Keep', value: 'The chat, the account name and the wallet address, as they are' },
              { label: 'Stop', value: 'Replying, paying or sending anything else' },
              { label: 'Report', value: 'In the app: Report › It’s threatening me' },
            ],
          },
          {
            id: 'i17-sup-people',
            heading: 'People who can help',
            rows: [
              { label: 'Welfare desk', value: deskNumber },
              { label: 'Cyber-crime reporting', value: '+91 00000 19300' },
              { label: 'Platform removal', value: 'Help Center › Report a threat to share images' },
            ],
            note: 'The welfare desk can stay with you while you report.',
          },
        ],
        tabs: [
          { label: 'Help', icon: 'home' },
          { label: 'My reports', icon: 'history' },
        ],
      },

      call: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: deskName,
        number: deskNumber,
        script: [
          { at: 0, speaker: 'them', text: 'Welfare desk, Subedar Nair.' },
          { at: 4, speaker: 'you', text: 'Someone on Instagram says they will send an edited picture of me to my followers unless I pay tonight.' },
          { at: 10, speaker: 'them', text: 'Thank you for calling. This is not your fault, and you are not in trouble. Have you paid or replied?' },
          { at: 16, speaker: 'them', text: 'Keep the chat as it is. We will report it together, and I will stay on while you do.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({
            id: 'i17-c01', slot: SLOT.INLINE,
            label: 'Open the message request',
          }),
          action({
            id: 'i17-c02', slot: SLOT.INLINE,
            label: 'Pay straight away without opening it',
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'i17-c03', slot: SLOT.INLINE, anchor: 'header',
            label: handle, hint: 'Profile, followers and account history',
            targetId: senderAsset, opens: 'profile',
          }),
          action({
            id: 'i17-c04', slot: SLOT.MENU,
            label: 'Read every message again, slowly',
          }),
          action({
            id: 'i17-c05', slot: SLOT.MENU,
            label: 'Go straight to the wallet address',
          }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 'i17-c06', slot: SLOT.SURFACE, on: 'pay',
            label: `Send ${amount}`, targetId: assetId(scenario, ASSET_KIND.PAYMENT), closes: true,
          }),
          action({
            id: 'i17-c07', slot: SLOT.SURFACE, on: 'safety',
            label: `Restrict ${handle} and keep the chat`, closes: true,
          }),
          action({
            id: 'i17-c08', slot: SLOT.COMPOSER,
            label: 'Send a real photo so they can see theirs is edited',
            echo: 'this is what I actually look like, anyone can see yours is edited',
          }),
          action({
            id: 'i17-c09', slot: SLOT.COMPOSER,
            label: 'Plead for more time',
            echo: 'please don’t send it. I can do 10k tonight, that’s all I have',
          }),
          action({
            id: 'i17-c10', slot: SLOT.MENU,
            label: 'Don’t pay, don’t reply, and leave every message where it is',
          }),
          navigate({
            id: 'i17-nav-pay', slot: SLOT.INLINE, anchor: 'i17-b4',
            label: 'Open the wallet address', opens: 'pay',
          }),
          navigate({
            id: 'i17-nav-safety', slot: SLOT.MENU,
            label: 'Chat details', opens: 'safety',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'i17-c11', slot: SLOT.MENU,
            label: 'Open Support & Reporting',
            hint: 'Platform reporting and the unit’s welfare route', opens: 'support',
          }),
          action({
            id: 'i17-c12', slot: SLOT.MENU,
            label: 'Ring the welfare desk on the directory number',
            hint: deskNumber, opens: 'call',
          }),
          action({
            id: 'i17-c13',
            slot: SLOT.MENU, label: `Look up ${deskName} in the trusted directory`,
            targetId: directoryAsset,
          }),
          action({
            id: 'i17-c14',
            slot: SLOT.MENU, label: 'Ask the account to prove what it has',
          }),
          action({ id: 'i17-c15', slot: SLOT.MENU, label: `Report ${handle}` }),
          action({ id: 'i17-c16', slot: SLOT.MENU, label: `Block ${handle}` }),
        ],
      },

      resolve: {
        affordances: [
          action({
            id: 'i17-c17', slot: SLOT.INLINE,
            label: 'Report the account, keep the chat as a record, and stay with the welfare desk',
          }),
          action({
            id: 'i17-c18', slot: SLOT.INLINE,
            label: 'Wait and see whether they really send it',
          }),
          action({
            id: 'i17-c19', slot: SLOT.MENU,
            label: `Block ${handle} after reporting`,
          }),
          action({
            id: 'i17-c20', slot: SLOT.MENU,
            label: 'Accept the request so you can keep talking to them',
          }),
          action({
            id: 'i17-c21', slot: SLOT.MENU,
            label: 'Delete the whole chat and tell nobody',
          }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'i17-nav-profile', slot: SLOT.MENU, label: `View ${handle}’s profile`, opens: 'profile', after: 'inspect' }),
      navigate({ id: 'i17-nav-support', slot: SLOT.MENU, label: 'Support & Reporting', opens: 'support', after: 'resolve' }),
    ],

    directoryExtras: [
      {
        id: 'i17-dir-cyber',
        name: 'Cyber-crime reporting line',
        identifier: '+91 00000 19300',
        provenance: 'local approved directory',
        role: 'Confidential reporting of online threats and harassment.',
      },
    ],
  }
}
