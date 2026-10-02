import { FIELD_KIND, SLOT, SURFACE, action, field, navigate } from '../../sceneModel.js'
import {
  assetId, day, directory, e2e, headline, headlineTime, link, media, sender, them, typing,
} from './shared.js'
import { ASSET_KIND } from '../../../constants/simulation.js'

/**
 * W23 - Family Welfare Pretext.
 *
 * Military intelligence warnings on both sides of the world say the same thing about
 * families: adversaries approach servicemembers and the people around them, and ask
 * questions that grow in sensitivity. ATT&CK has the parts - elicitation through a third-party
 * messaging service (T1598.001), an organisation impersonated (T1684.001), and what is being
 * gathered: the unit, where it is and when it moves (T1591).
 *
 * W06 asked a soldier for an ID photo; W11 was the genuine welfare office with a case
 * reference. This scene is different in the two ways that matter:
 *
 * 1. **The pressure is on the learner's family, and so is the check.** The account says the
 *    learner's mother is in hospital - by her real name. The correct verification is not only
 *    the welfare office on its directory number; it is ringing Ma on the number the learner
 *    has had for years. She is at home, and she was called on Monday by someone asking where
 *    her child is posted. That is the whole pattern in one call.
 * 2. **The ask escalates page by page.** The grant form is a four-step application whose
 *    first page is harmless (relationship, home address) and whose later pages are the point:
 *    service number, unit and present post, deployment dates and next move, then a bank
 *    account. Nothing is submitted until the last page; every page can be closed.
 *
 * Identity, request and channel are three separate failures here. The account is a
 * business profile with a crest anyone can copy; no genuine welfare process collects posting
 * or movement dates at all; and the "case officer" number it offers is its own.
 */
export function buildW23(scenario) {
  const who = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const browserAsset = assetId(scenario, ASSET_KIND.BROWSER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)

  const mother = 'Smt. Sunita Rao'
  const maNumber = '+91 00000 64117'
  const welfareOffice = '+91 00000 64011'
  const caseOfficer = '+91 00000 51577'
  const host = 'forces-family-aid.training.example'
  const root = `https://${host}`
  const brand = {
    type: 'brand', monogram: 'FW', name: 'Forces Family Welfare', tagline: 'Emergency Relief Grant',
  }

  const step = (n, title) => `Step ${n} of 4 - ${title}`

  return {
    scenarioId: 'W23',
    platform: 'whatsapp',

    conversation: {
      kind: 'direct',
      title: who.display_name,
      subtitle: who.identifier,
      saved: false,
      business: true,
      presence: 'online',
      avatarSeed: who.avatar_initials,
      unknownSenderBanner: 'This business account is not in your contacts.',
    },

    list: {
      title: 'WhatsApp',
      archived: 3,
      rows: [
        {
          id: 'w23-row',
          title: who.display_name,
          subtitle: who.identifier,
          preview: headline(scenario),
          time: headlineTime(scenario),
          unread: 5,
        },
        {
          id: 'w23-bg-ma',
          title: 'Ma',
          preview: 'You: will call tonight, love you',
          time: 'Yesterday',
          outgoing: true,
          inert: true,
        },
        {
          id: 'w23-bg-1',
          title: 'Coy Notices',
          group: true,
          preview: 'Adjt: family welfare meet on 21 Sep - details from the welfare office',
          time: '09:40',
          muted: true,
          inert: true,
        },
        {
          id: 'w23-bg-2',
          title: 'Hav. Negi',
          preview: 'range card sent',
          time: 'Yesterday',
          inert: true,
        },
      ],
    },

    beats: [
      e2e('w23-e2e'),

      day('w23-day', 'TODAY'),
      them('w23-b1', 'Jai Hind 🙏 Rekha here, volunteer with Forces Family Welfare. We support the '
        + 'families of serving soldiers.', '11:52'),
      media('w23-poster', {
        art: 'crest', label: 'Forces Family Welfare - emergency relief',
        caption: 'Emergency relief for soldiers’ families. We are with you.', time: '11:52',
      }),
      them('w23-b2', `Your mother ${mother} was brought to the district hospital this morning with `
        + 'chest pain. Our volunteer is with her. Please don’t panic.', '12:04'),
      them('w23-b3', 'The committee has sanctioned INR 50,000 for her treatment.', '12:06'),
      them('w23-head', headline(scenario), headlineTime(scenario) ?? '12:10'),
      link('w23-link', {
        title: 'Emergency Relief Grant - application',
        description: 'Forces Family Welfare',
        displayUrl: `${root}/grant/apply`,
        text: 'Fill this within 1 hour or the grant lapses for this month',
        time: '12:11',
      }),

      /** The branch stage: the hospital "is waiting", and a number to call instead. */
      them('w23-b4', 'The hospital is asking for the grant papers. Please hurry.', '12:24',
        { since: 'branch' }),
      them('w23-b5', `If the form is difficult, our case officer Mr. Menon can take your details on a `
        + `call: ${caseOfficer}`, '12:25', { since: 'branch' }),

      {
        kind: 'message', id: 'w23-after-submit', from: 'them',
        text: 'Received 🙏 For the grant file, also confirm your next leave dates and when your '
          + 'unit moves.',
        time: '12:33', since: 'verify', afterConsequence: 'simulated_data_submission',
      },
      {
        kind: 'message', id: 'w23-after-reply', from: 'them',
        text: 'She is stable but tests are pending and money is needed. Please just fill the form, '
          + 'don’t delay 🙏',
        time: '12:29', since: 'verify', afterConsequence: 'simulated_reply_sent',
      },

      /** The other side composing, drawn after whatever the last action produced. */
      typing('w23-typing', { since: 'verify', until: 'resolve' }),
    ],

    surfaces: {
      contact: {
        kind: SURFACE.CONTACT,
        title: 'Business info',
        name: who.display_name,
        identifier: who.identifier,
        avatarSeed: who.avatar_initials,
        saved: false,
        statusLine: 'This business is not in your contacts.',
        tabs: [
          {
            id: 'business',
            label: 'Business',
            sections: [
              {
                id: 'business-rows', heading: 'Business details',
                rows: [
                  { label: 'Business account', value: 'Yes' },
                  { label: 'Verified business', value: 'No' },
                  { label: 'Profile photo', value: 'A crest reading “Forces Family Welfare”' },
                  { label: 'Category', value: 'Charity organisation' },
                  { label: 'Description', value: 'Serving soldiers’ families since 1998 🇮🇳' },
                  { label: 'Website', value: host },
                  { label: 'On WhatsApp since', value: '9 days ago' },
                  { label: 'First message', value: 'Today at 11:52' },
                ],
                note: 'Anyone can open a business account and upload a crest or a logo.',
              },
            ],
          },
          {
            id: 'groups',
            label: 'Groups in common',
            count: 0,
            sections: [
              {
                id: 'groups-list', heading: 'Groups in common',
                empty: 'You are not in any group with this number.',
                items: [],
              },
            ],
          },
          {
            id: 'media',
            label: 'Media',
            count: 2,
            sections: [
              {
                id: 'media-list', heading: 'Media, links and docs',
                items: [
                  { label: 'Forces Family Welfare - emergency relief', value: 'Today, 11:52' },
                  { label: `${host}/grant/apply`, value: 'Today, 12:11' },
                ],
              },
            ],
          },
        ],
      },

      'poster-viewer': {
        kind: SURFACE.VIEWER,
        title: 'Image',
        subtitle: 'Received today, 11:52',
        art: 'crest',
        label: 'Forces Family Welfare poster',
        heading: 'Forces Family Welfare - emergency relief',
        rowsHeading: 'What the picture shows',
        rows: [
          { label: 'Shows', value: 'A crest, a saluting soldier and “We are with you”' },
          { label: 'Registration or case number', value: 'None shown' },
          { label: 'Contact on the picture', value: 'This WhatsApp number only' },
          { label: 'Type', value: 'Image' },
        ],
        inertNote: 'Local preview. Nothing is opened or sent from here.',
      },

      /**
       * The grant application. Four steps whose ask grows page by page, then a review page
       * with the one control that sends. Closing it is the decision on any page.
       */
      grant: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'apply',
        pages: {
          apply: {
            url: `${root}/grant/apply`,
            host,
            title: 'Emergency Relief Grant',
            blocks: [
              brand,
              { type: 'heading', text: 'Emergency Relief Grant' },
              {
                type: 'summary',
                rows: [
                  { label: 'Beneficiary', value: `${mother} (mother)` },
                  { label: 'Amount', value: 'INR 50,000', strong: true },
                  { label: 'Release', value: 'Today, if completed within 1 hour' },
                  { label: 'Case reference', value: 'Issued after verification' },
                ],
              },
              {
                type: 'notice',
                text: 'Four short steps. Your details are kept confidential by the grant committee.',
              },
            ],
            primary: { label: 'Start application', to: 'step1' },
          },
          step1: {
            url: `${root}/grant/apply/family`,
            host,
            title: 'Grant - family member',
            blocks: [
              brand,
              { type: 'heading', text: step(1, 'Family member') },
              { type: 'summary', rows: [{ label: 'Patient', value: mother }] },
              {
                type: 'form',
                heading: 'About the family',
                fields: [
                  field({ name: 'relation', label: 'Your relationship to the patient', length: 3, max: 20 }),
                  field({ name: 'address', label: 'Home address with PIN code', length: 6, max: 60 }),
                ],
              },
            ],
            primary: { label: 'Save and continue', to: 'step2' },
          },
          step2: {
            url: `${root}/grant/apply/service`,
            host,
            title: 'Grant - service details',
            blocks: [
              brand,
              { type: 'heading', text: step(2, 'Service details') },
              { type: 'text', text: 'Needed to confirm eligibility with the committee.' },
              {
                type: 'form',
                heading: 'Service details',
                fields: [
                  field({ name: 'svc', label: 'Service number', length: 5, max: 12 }),
                  field({ name: 'unit', label: 'Unit', length: 2, max: 30 }),
                  field({ name: 'post', label: 'Present post or location', length: 3, max: 40 }),
                ],
              },
            ],
            primary: { label: 'Save and continue', to: 'step3' },
            links: [{ id: 'w23-g-back2', label: 'Previous step', to: 'step1' }],
          },
          step3: {
            url: `${root}/grant/apply/availability`,
            host,
            title: 'Grant - availability',
            blocks: [
              brand,
              { type: 'heading', text: step(3, 'Availability') },
              { type: 'text', text: 'So the committee can reach you while you are away.' },
              {
                type: 'form',
                heading: 'Dates',
                fields: [
                  field({ name: 'deploy', label: 'Deployment dates (from - to)', length: 5, max: 30 }),
                  field({ name: 'move', label: 'Next leave or move date', length: 4, max: 20 }),
                ],
              },
            ],
            primary: { label: 'Save and continue', to: 'step4' },
            links: [{ id: 'w23-g-back3', label: 'Previous step', to: 'step2' }],
          },
          step4: {
            url: `${root}/grant/apply/transfer`,
            host,
            title: 'Grant - transfer',
            blocks: [
              brand,
              { type: 'heading', text: step(4, 'Grant transfer') },
              {
                type: 'form',
                heading: 'Your bank account',
                fields: [
                  field({ name: 'holder', label: 'Account holder name', length: 3, max: 40 }),
                  field({
                    name: 'account', label: 'Account number', kind: FIELD_KIND.DIGITS,
                    length: 9, max: 18,
                  }),
                  field({ name: 'ifsc', label: 'IFSC', length: 11, placeholder: 'ABCD0123456' }),
                ],
              },
            ],
            primary: { label: 'Continue to review', to: 'review' },
            links: [{ id: 'w23-g-back4', label: 'Previous step', to: 'step3' }],
          },
          review: {
            url: `${root}/grant/apply/review`,
            host,
            title: 'Grant - review',
            blocks: [
              brand,
              { type: 'heading', text: 'Review and submit' },
              {
                type: 'summary',
                rows: [
                  { label: 'Family', value: 'Relationship and home address' },
                  { label: 'Service', value: 'Service number, unit and present post' },
                  { label: 'Availability', value: 'Deployment dates, next leave or move' },
                  { label: 'Bank', value: 'Account for the grant' },
                  { label: 'Sent to', value: `Grant committee, ${host}` },
                ],
              },
            ],
            links: [{ id: 'w23-g-edit', label: 'Change the details', to: 'step1' }],
          },
          submitted: {
            final: true,
            url: `${root}/grant/apply/submitted`,
            host,
            title: 'Grant - received',
            blocks: [
              brand,
              {
                type: 'result',
                heading: 'Application',
                text: 'Received.',
                rows: [
                  { label: 'Case reference', value: 'Will be sent on WhatsApp' },
                  { label: 'Next', value: 'Refundable processing fee of INR 1,250 to release today' },
                ],
              },
            ],
          },
        },
      },

      /** Ma, on the number the learner has always had. */
      'call-ma': {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'Ma',
        number: maNumber,
        script: [
          { at: 0, speaker: 'them', text: 'Hello? Is everything all right?' },
          { at: 3, speaker: 'you', text: 'Ma, are you in hospital? Someone says you were admitted this morning.' },
          { at: 9, speaker: 'them', text: 'Hospital? No, I am at home, I am perfectly fine.' },
          { at: 14, speaker: 'them', text: 'But on Monday a man called saying he was from the army office. He asked where you are posted and when you are coming home. I said I don’t know.' },
          { at: 22, speaker: 'you', text: 'Don’t tell anyone anything about my posting, Ma. I am reporting it.' },
        ],
      },

      /** The unit's welfare office, on its directory number. */
      'call-welfare': {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'Unit Welfare Office',
        number: welfareOffice,
        script: [
          { at: 0, speaker: 'them', text: 'Welfare office, Nb Sub Rawat.' },
          { at: 3, speaker: 'you', text: 'A welfare volunteer on WhatsApp says my mother is in hospital and wants my post and deployment dates for a grant.' },
          { at: 10, speaker: 'them', text: 'There is no case for your family. Grants are opened by this office with a case reference, and paid to the account already on your record.' },
          { at: 18, speaker: 'them', text: 'Nobody in the welfare chain asks for posting, deployment or leave dates. Fill nothing. Report it to unit security - other families have had the same message this week.' },
        ],
      },

      /** The "case officer" the account offers. It vouches for itself. */
      'call-menon': {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'Mr. Menon (number from the chat)',
        number: caseOfficer,
        script: [
          { at: 0, speaker: 'them', text: 'Case officer Menon speaking.' },
          { at: 3, speaker: 'them', text: 'Yes, yes, your mother is admitted, it is serious. Just tell me your unit and present location, I will fill the form for you.' },
          { at: 10, speaker: 'them', text: 'Bank details also, otherwise the grant lapses at one o’clock.' },
        ],
      },
    },

    directoryExtras: [
      {
        id: 'w23-dir-welfare',
        name: 'Unit Welfare Office',
        identifier: welfareOffice,
        provenance: 'local approved directory',
        role: 'Family welfare cases and grants. Every case has a reference issued by this office.',
      },
      {
        id: 'w23-dir-security',
        name: 'Unit Security Cell',
        identifier: '+91 00000 64020',
        provenance: 'local approved directory',
        role: 'Report any approach to you or your family asking about postings or movement.',
      },
    ],

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({
            id: 'w23-c01', slot: SLOT.INLINE,
            label: `Open the chat with ${who.display_name}`,
          }),
          action({
            id: 'w23-c02', slot: SLOT.INLINE,
            label: 'Reply "Is my mother okay?" from the notification',
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'w23-c03', slot: SLOT.INLINE,
            anchor: 'header', label: 'Business info',
            hint: 'The account, the number, how long it has existed',
            targetId: senderAsset, opens: 'contact',
          }),
          action({
            id: 'w23-c04', slot: SLOT.INLINE,
            anchor: 'w23-poster', label: 'View', opens: 'poster-viewer',
          }),
          action({
            id: 'w23-c05', slot: SLOT.MENU,
            label: 'Read the conversation from the start',
          }),
          action({
            id: 'w23-c06', slot: SLOT.MENU,
            label: 'Skip the checks and act on this message',
          }),
        ],
      },

      branch: {
        affordances: [
          navigate({
            id: 'w23-branch-link', slot: SLOT.INLINE, anchor: 'w23-link',
            label: 'Open', opens: 'grant',
          }),
          /** Closing the application is the decision, on whichever page the learner stops. */
          action({
            id: 'w23-c07', slot: SLOT.SURFACE,
            on: 'grant', label: 'Close the form without sending', closes: true,
          }),
          action({
            id: 'w23-c08', slot: SLOT.SURFACE,
            on: 'grant', page: 'review', thenPage: 'submitted', label: 'Submit application',
            targetId: browserAsset,
          }),
          action({
            id: 'w23-c09', slot: SLOT.COMPOSER,
            label: 'I am with 14 Falcon at the northern post, deployed till 30 Sep',
            echo: 'I am with 14 Falcon at the northern post, deployed till 30 Sep.',
          }),
          action({
            id: 'w23-c10', slot: SLOT.COMPOSER,
            label: 'Is my mother okay? Which hospital is she in?',
            echo: 'Is my mother okay? Which hospital is she in?',
          }),
          action({
            id: 'w23-c11', slot: SLOT.COMPOSER,
            label: 'I will speak to my mother and the unit welfare office myself.',
            echo: 'I will speak to my mother and the unit welfare office myself.',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'w23-c12',
            slot: SLOT.MENU, label: 'Call Ma on her saved number', opens: 'call-ma',
          }),
          action({
            id: 'w23-c13',
            slot: SLOT.MENU, label: 'Call the Unit Welfare Office on the directory number',
            opens: 'call-welfare',
          }),
          action({
            id: 'w23-c14',
            slot: SLOT.MENU,
            label: 'Look up the welfare office in the trusted directory',
            targetId: directoryAsset,
          }),
          action({
            id: 'w23-c15',
            slot: SLOT.MENU,
            label: 'Call Mr. Menon on the number from the chat', opens: 'call-menon',
          }),
          action({
            id: 'w23-c16', slot: SLOT.MENU,
            label: 'Report the business account',
          }),
          action({
            id: 'w23-c17', slot: SLOT.MENU,
            label: 'Block the business account',
          }),
        ],
      },

      resolve: {
        affordances: [
          action({
            id: 'w23-c18', slot: SLOT.INLINE,
            label: 'Send nothing; report to unit security and block',
          }),
          action({
            id: 'w23-c19', slot: SLOT.INLINE,
            label: 'Finish the grant form so it is not lost',
          }),
          action({
            id: 'w23-c20', slot: SLOT.MENU,
            label: 'Block the business account',
          }),
          action({
            id: 'w23-c21', slot: SLOT.MENU,
            label: 'Keep the chat in case the grant is needed',
          }),
          action({
            id: 'w23-c22', slot: SLOT.MENU,
            label: 'Delete the chat',
          }),
        ],
      },
    },

    ambient: [
      navigate({
        id: 'w23-nav-contact', slot: SLOT.MENU, label: 'Business info',
        opens: 'contact', after: 'inspect',
      }),
      navigate({
        id: 'w23-nav-poster', slot: SLOT.MENU, label: 'View the poster again',
        opens: 'poster-viewer', after: 'inspect',
      }),
    ],

    supportDesk: desk,
  }
}
