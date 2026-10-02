import { SLOT, SURFACE, action, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  LEARNER, assetId, day, directory, requestCard, social, splitHeadline, system, them,
} from './shared.js'

/**
 * I22 - Live Support Video Call (IMMERSIVE-004E). Hard.
 *
 * A message request from an account calling itself a live case team: the profile is "flagged",
 * removal is "scheduled today", nobody must be told and the password must not be changed. Then
 * Instagram's own video chat rings from the request.
 *
 * What is new to the product is where the pressure lives: **inside an Instagram video chat**, as
 * three requests the call makes of the learner's own phone, each behind a control the call screen
 * itself offers - turn the camera on and hold the ID card up (the phone's camera prompt), Share
 * screen (the phone's screen-sharing consent), and "open Settings › Backup codes and read me the
 * first one" (the learner's real codes page, one tap away). W12 was a video call that ended in a
 * payment; W24 was a voice call that asked for one screen share. I22 is the platform itself being
 * spoofed, and the ask is identity and account recovery, not money.
 *
 * The safe routes are hanging up (End call is the scene's control while the call is live), saying
 * no to the camera or the screen share, or never joining. Asking the agent for a written case
 * number is still engagement. The check is the learner's own Account Status and Support requests,
 * opened from Settings, and the unit support desk on the directory number.
 */
export function buildI22(scenario) {
  const { handle, text } = splitHeadline(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const installAsset = assetId(scenario, ASSET_KIND.INSTALL)
  const callAsset = assetId(scenario, ASSET_KIND.CALL)
  const desk = directory(scenario)
  const deskName = desk.name || 'Unit Falcon Support Desk'
  const deskNumber = desk.identifier || '+91 00000 95469'
  const name = 'Security Live Case'
  const caseId = '88-2041'

  return {
    scenarioId: 'I22',
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
            { id: 'i22-bg-1', handle: 'dev_fit', name: 'Dev', preview: 'sunday trek still on?', time: '3h', inert: true },
            { id: 'i22-bg-2', handle: 'anjali.m', name: 'Anjali', preview: 'You: haha yes', time: '1d', inert: true },
          ],
        },
        {
          heading: 'Requests',
          rows: [
            { id: 'i22-row', handle, name: handle, preview: `📹 Video chat · ${text}`, time: 'now', unread: true },
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
      requestCard('i22-card', {
        name,
        handle,
        stats: { posts: '2', followers: '311', following: '9' },
        relation: 'You don’t follow each other',
      }),
      day('i22-d1', 'TODAY'),
      them('i22-b1', 'ACCOUNT NOTICE ⚠️ Your profile failed identity review. Removal is scheduled for today.', '10:58'),
      them('i22-b2', text, '11:03'),
      them('i22-b3', `Case ${caseId}. A live agent must see your face and your ID on camera. Do not discuss this case with anyone and do not change your password - it resets the review.`, '11:03'),
      system('i22-missed', `📹 ${handle} started a video chat · 11:04 · Missed`),

      system('i22-ring', `📹 ${handle} is calling you · Video chat`, { since: 'branch', until: 'verify', tone: 'mention' }),
      them('i22-b4', 'Agent is waiting. 25 minutes left before removal.', '11:09', { since: 'branch' }),

      system('i22-ended', `📹 Video chat ended`, { since: 'verify' }),
      {
        kind: 'system', id: 'i22-after-release', tone: 'banner',
        text: 'What you showed or read out on the call is now with the caller, and the agent is still talking: “One more step and the case is closed.”',
        since: 'verify', afterConsequence: 'simulated_data_submission',
      },
      {
        kind: 'system', id: 'i22-after-ask', tone: 'banner',
        text: 'The agent read out a case number, held a badge up to the camera, and asked again for your ID.',
        since: 'verify', afterConsequence: 'simulated_reply_sent',
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
            category: 'Community',
            verified: false,
            following: false,
            stats: { posts: '2', followers: '311', following: '9' },
            bio: ['Live Case Team 🔒', 'Appeals · Verification · Removal'],
            buttons: ['Follow', 'Message'],
            aboutTo: 'about',
            grid: [
              { art: 'crest', title: '', note: '4d' },
              { art: 'notice', title: '', note: '4d' },
            ],
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
              { handle: 'help.center.case', when: '6 days ago' },
              { handle: 'appeal_review_desk', when: '3 days ago' },
            ],
          },
        },
      }),

      /** The Instagram video chat. End call is the scene's control while the call is live. */
      call: {
        kind: SURFACE.CALL,
        video: true,
        endCallScored: true,
        title: 'Video chat',
        caller: handle,
        number: 'Instagram video chat · from a message request',
        backLabel: 'Back to the chat',
        remote: {
          figure: 'agent',
          name: 'Agent R. Mehta',
          label: 'A person with a headset in front of a plain wall with a shield sticker',
        },
        overlay: `Live identity verification · case ${caseId}`,
        countdown: { from: 1500, label: 'Removal in' },
        script: [
          { at: 0, speaker: 'them', text: 'Security team, live verification. Please stay on the line.' },
          { at: 4, speaker: 'them', text: 'Your profile will be removed in twenty-five minutes unless we verify you now.' },
          { at: 9, speaker: 'them', text: 'First, turn your camera on and hold your ID card next to your face.' },
          { at: 15, speaker: 'them', text: 'Then tap Share screen so I can see the violation on your account.' },
          { at: 21, speaker: 'them', text: 'Last step: open Settings, Backup codes, and read me the first code. It proves you are the owner.' },
          { at: 27, speaker: 'them', text: 'Do not hang up. If the call drops, the removal cannot be stopped.' },
        ],
        links: [
          { id: 'i22-call-camera', label: 'Turn on camera', to: 'camera' },
          { id: 'i22-call-share', label: 'Share screen', to: 'cast' },
          { id: 'i22-call-codes', label: 'Settings › Backup codes', to: 'codes' },
        ],
      },

      /** The phone's own camera prompt, and the frame guide the caller asks for. */
      camera: {
        kind: SURFACE.INSTALLER,
        title: 'Camera',
        home: 'ask',
        closeLabel: 'Back to the video chat',
        inertNote: 'Simulated permission prompt. No camera was used.',
        pages: {
          ask: {
            style: 'dialog',
            app: { name: 'Instagram', detail: `Video chat with ${handle}`, monogram: 'IG' },
            title: 'Turn on your camera in this video chat?',
            text: 'The other person will see whatever your camera shows, and can record or screenshot it.',
          },
          frame: {
            style: 'sheet',
            final: true,
            art: 'card',
            artLabel: 'Identity card held up to the camera',
            title: 'Camera on',
            text: 'The agent: “Closer. Now turn the card over, and keep your face in the frame.”',
          },
        },
      },

      /** The phone's own screen-sharing consent. */
      cast: {
        kind: SURFACE.INSTALLER,
        title: 'Share screen',
        home: 'prompt',
        closeLabel: 'Back to the video chat',
        inertNote: 'Simulated system prompt. Nothing on this phone was shared.',
        pages: {
          prompt: {
            style: 'dialog',
            alert: true,
            app: { name: 'Instagram', detail: `Video chat with ${handle}`, monogram: 'IG' },
            title: `Start sharing your screen with ${handle}?`,
            text: 'While you share, the other person can see everything on your screen, including messages, codes and notifications that arrive.',
          },
        },
      },

      /** The learner's own backup codes, which the caller wants read aloud. */
      codes: social({
        title: 'Backup codes',
        home: 'codes',
        pages: {
          codes: {
            view: 'settings',
            title: 'Backup codes',
            username: LEARNER.handle,
            rows: [
              { label: 'Two-factor authentication', value: 'On' },
              { label: 'Code 1', value: '4821 7730' },
              { label: 'Code 2', value: '0936 5512' },
              { label: 'Code 3', value: '7704 2869' },
              { label: 'What they do', value: 'Each code logs in to your account once, without your phone' },
            ],
          },
        },
      }),

      /** Settings › Account Status and Support requests, opened by the learner. */
      status: social({
        title: 'Settings',
        home: 'settings',
        pages: {
          settings: {
            view: 'settings',
            title: 'Settings and activity',
            username: LEARNER.handle,
            rows: [
              { label: 'Account Status', value: 'See what affects your account', to: 'status' },
              { label: 'Support requests', value: 'Reports and violations', to: 'support' },
              { label: 'Password and security', value: 'Security Checkup, backup codes, logins', to: 'security' },
            ],
          },
          status: {
            view: 'status',
            title: 'Account Status',
            heading: `${LEARNER.handle} · no issues`,
            statusRows: [
              { label: 'Removed content', value: 'Nothing has been removed', ok: true },
              { label: 'Features you can’t use', value: 'None', ok: true },
              { label: 'Account at risk of being disabled', value: 'No', ok: true },
              { label: 'Identity confirmation', value: 'Not requested', ok: true },
            ],
            note: 'Anything that affects your account is listed here and in Support requests.',
          },
          support: {
            view: 'settings',
            title: 'Support requests',
            username: LEARNER.handle,
            rows: [
              { label: 'Reports', value: 'None open' },
              { label: 'Violations', value: 'None' },
              { label: 'Messages from Instagram', value: 'None in the last 90 days' },
            ],
          },
          security: {
            view: 'settings',
            title: 'Password and security',
            username: LEARNER.handle,
            rows: [
              { label: 'Security Checkup', value: 'Review your logins and recovery details' },
              { label: 'Backup codes', value: '3 unused' },
              { label: 'Where you’re logged in', value: '1 device · this phone' },
            ],
          },
        },
      }),

      call2: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: deskName,
        number: deskNumber,
        script: [
          { at: 0, speaker: 'them', text: 'Support desk, Naik Pillai.' },
          { at: 4, speaker: 'you', text: 'An Instagram account video-called me as “security” and wants my ID and a backup code.' },
          { at: 10, speaker: 'them', text: 'Don’t rejoin. Check Account Status yourself in Settings, report the account in the app, and if you shared anything, change your password and your backup codes.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({
            id: 'i22-c01', slot: SLOT.INLINE,
            label: 'Open the message request',
          }),
          action({
            id: 'i22-c02', slot: SLOT.INLINE,
            label: 'Join the video chat from the request list', targetId: callAsset,
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'i22-c03', slot: SLOT.INLINE, anchor: 'header',
            label: handle, hint: 'Profile and account history',
            targetId: senderAsset, opens: 'profile',
          }),
          action({
            id: 'i22-c04', slot: SLOT.MENU,
            label: 'Read every message in the request again',
          }),
          action({
            id: 'i22-c05', slot: SLOT.MENU,
            label: 'Go straight to the video chat',
          }),
        ],
      },

      branch: {
        affordances: [
          navigate({
            id: 'i22-nav-join', slot: SLOT.INLINE, anchor: 'i22-ring',
            label: 'Join video chat', opens: 'call',
          }),
          action({
            id: 'i22-c06', slot: SLOT.SURFACE, on: 'call',
            label: 'End call', closes: true,
          }),
          action({
            id: 'i22-c07', slot: SLOT.SURFACE, on: 'call',
            label: 'Stay on and ask for the case number in writing', targetId: callAsset,
          }),
          action({
            id: 'i22-c08', slot: SLOT.SURFACE, on: 'camera', page: 'ask',
            label: 'Turn on camera and hold up my ID', thenPage: 'frame',
          }),
          action({
            id: 'i22-c09', slot: SLOT.SURFACE, on: 'camera', page: 'ask',
            label: 'Keep camera off', closes: true,
          }),
          action({
            id: 'i22-c10', slot: SLOT.SURFACE, on: 'cast', page: 'prompt',
            label: 'Start sharing', targetId: installAsset, closes: true,
          }),
          action({
            id: 'i22-c11', slot: SLOT.SURFACE, on: 'cast', page: 'prompt',
            label: 'Don’t share', closes: true,
          }),
          action({
            id: 'i22-c12', slot: SLOT.SURFACE, on: 'codes',
            label: 'Read code 1 aloud to the agent', closes: true,
          }),
          action({
            id: 'i22-c13', slot: SLOT.MENU,
            label: 'Decline the video chat and don’t reply',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'i22-c14', slot: SLOT.MENU,
            label: 'Open Settings › Account Status yourself',
            hint: 'Account Status, Support requests and Password and security', opens: 'status',
          }),
          action({
            id: 'i22-c15', slot: SLOT.MENU,
            label: 'Ring the support desk on the directory number',
            hint: deskNumber, opens: 'call2',
          }),
          action({
            id: 'i22-c16',
            slot: SLOT.MENU, label: `Look up ${deskName} in the trusted directory`,
            targetId: directoryAsset,
          }),
          action({
            id: 'i22-c17',
            slot: SLOT.MENU, label: 'Ask in this chat for the agent’s employee ID',
          }),
          action({ id: 'i22-c18', slot: SLOT.MENU, label: `Report ${handle}` }),
          action({ id: 'i22-c19', slot: SLOT.MENU, label: `Block ${handle}` }),
        ],
      },

      resolve: {
        affordances: [
          action({
            id: 'i22-c20', slot: SLOT.INLINE,
            label: 'Wait for the agent to call back and finish the check',
          }),
          action({
            id: 'i22-c21', slot: SLOT.INLINE,
            label: 'Report the account for pretending to be Instagram, and run Security Checkup',
          }),
          action({
            id: 'i22-c22', slot: SLOT.MENU,
            label: `Block ${handle} and delete the request`,
          }),
          action({
            id: 'i22-c23', slot: SLOT.MENU,
            label: 'Accept the request so the agent can reach you',
          }),
          action({
            id: 'i22-c24', slot: SLOT.MENU,
            label: 'Delete the request and tell nobody',
          }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'i22-nav-profile', slot: SLOT.MENU, label: `View ${handle}’s profile`, opens: 'profile', after: 'inspect' }),
      navigate({ id: 'i22-nav-status', slot: SLOT.MENU, label: 'Settings › Account Status', opens: 'status', after: 'resolve' }),
    ],

    directoryExtras: [],
  }
}
