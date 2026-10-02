import { SLOT, SURFACE, action, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  LEARNER, assetId, attachment, body, directory, mail, sender, subjectLine,
} from './shared.js'

/**
 * E19 - Academic Interview on Readiness (IMMERSIVE-008) - a scholarly request for protected detail.
 *
 * "Dr. Mira Sen", a senior fellow at a university research centre, writes to say the learner's field
 * experience is exactly the practitioner voice her readiness study is missing. The message is
 * polished, courteous and flattering; it promises anonymity and a citation; it attaches a short
 * questionnaire and offers a follow-up call. It is also sent from a domain that is not the
 * university's, to thirty-eight people across the unit, with no ethics or approval reference - and
 * the questions, read one by one, ask for the systems in use, their gaps, where the sub-unit is and
 * its weekly routine.
 *
 * The Email-native decision is where the answers would leave from: the questionnaire's own
 * "fill in and send back" bar in the document preview (the release), a reply agreeing to an
 * interview call, or forwarding it to the section so others can take part - the "forward internally
 * without review" the client names. Leaving it unanswered is safe; routing it to the public-information
 * officer and checking the approved research-requests register are the checks. Fictional throughout:
 * "Unit Falcon", the university, the journal, the study and every question describe nothing real,
 * and no real system, location, schedule or capability appears anywhere.
 */
export function buildE19(scenario) {
  const senderInfo = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)
  const name = senderInfo.display_name ?? 'Dr. Mira Sen'
  const fromAddress = senderInfo.identifier ?? 'drmirasen@e19.training.example'
  const university = 'northfield-univ.training.example'
  const docName = 'Readiness_Study_Questionnaire.docx'
  const section = 'section-2@unit.training.example'

  return {
    scenarioId: 'E19',
    platform: 'email',
    notify: { sender: name },
    messageSender: { display_name: name, identifier: fromAddress },

    list: {
      title: 'Inbox',
      account: LEARNER.account,
      accountName: 'You',
      folders: [
        { id: 'inbox', label: 'Inbox', heading: 'Inbox', count: 3 },
        {
          id: 'pio', label: 'Unit notices', heading: 'Unit notices',
          rows: [
            {
              id: 'e19-n-1', from: 'Public Information Office', subject: 'Reminder: media and research requests',
              preview: 'Forward any interview, survey or research request to PIO before replying.', time: '02 Sep', inert: true,
            },
          ],
        },
        { id: 'spam', label: 'Spam', heading: 'Spam', rows: [], empty: 'Spam is empty.' },
      ],
      rows: [
        {
          id: 'e19-row', from: name, subject: 'Invitation: practitioner interview for a readiness study',
          preview: subjectLine(scenario), time: '07:34', unread: true, attachment: true, tag: 'External',
        },
        {
          id: 'e19-bg-1', from: 'Sports Officer', subject: 'Inter-company volleyball',
          preview: 'Team lists by Thursday.', time: 'Yesterday', inert: true,
        },
        {
          id: 'e19-bg-2', from: 'Farhan', subject: 'Re: course nominations',
          preview: 'You: sent my name in', time: 'Mon', outgoing: true, inert: true,
        },
      ],
    },

    conversation: {
      subject: 'Invitation: practitioner interview for a readiness study',
      fromName: name,
      time: '07:34',
      toLine: 'to you and 37 others',
      detailsTo: 'details',
      labels: ['Inbox', 'External'],
    },

    beats: [
      body('e19-body', {
        greeting: 'Dear colleague,',
        paragraphs: [
          subjectLine(scenario),
          'I lead a study at the Centre for Readiness Studies on how units prepare in practice, as opposed '
          + 'to how doctrine says they should. People with your field experience are exactly the voice our '
          + 'research is missing, and your insight would genuinely shape the findings.',
          'The attached questionnaire takes about fifteen minutes. Responses are anonymised and the study '
          + 'will appear in the Journal of Applied Readiness next year, where contributors are acknowledged.',
          'If you would rather talk, I am happy to arrange a short call this week. It would help to have '
          + 'replies by Friday.',
        ],
        signature: [name, 'Senior Fellow, Centre for Readiness Studies', 'Northfield University'],
        footer: 'This invitation has been sent to selected practitioners.',
      }),
      attachment('e19-file', { fileName: docName, fileKind: 'docx', size: '64 KB' }),
    ],

    surfaces: {
      details: mail({
        title: 'Message details',
        home: 'details',
        pages: {
          details: {
            title: 'Message details',
            blocks: [
              { type: 'identity', name, address: fromAddress, note: 'No earlier mail from this sender' },
              {
                type: 'rows',
                heading: 'Headers',
                rows: [
                  { label: 'From', value: `${name} <${fromAddress}>` },
                  { label: 'Reply-To', value: fromAddress },
                  { label: 'To', value: '38 recipients across Unit Falcon (list visible)' },
                  { label: 'Signs as', value: `Northfield University (${university})` },
                ],
              },
              {
                type: 'checks',
                heading: 'Sender and request',
                rows: [
                  { label: 'Domain', value: `e19.training.example, not ${university}`, result: 'mismatch' },
                  { label: 'Recipients', value: '38 people in four sub-units', result: 'wide' },
                  { label: 'Approval ref', value: 'No ethics or PIO reference given', result: 'missing' },
                ],
              },
              { type: 'note', text: 'The journal named in the message lists no issue or article that can be found from here.' },
            ],
            links: [{ id: 'e19-link-list', label: 'Show the recipient list', to: 'recipients' }],
          },
          recipients: {
            title: 'Recipients (38)',
            blocks: [
              {
                type: 'items',
                heading: 'To',
                items: [
                  { label: 'You', value: LEARNER.account },
                  { label: 'Sub-unit A', meta: '11 people', value: 'Platoon and section staff' },
                  { label: 'Sub-unit B', meta: '9 people', value: 'Platoon and section staff' },
                  { label: 'Sub-unit C', meta: '10 people', value: 'Platoon and section staff' },
                  { label: 'Workshop', meta: '7 people', value: 'Technicians' },
                ],
              },
              { type: 'note', text: 'Every recipient is named in the To line, where each can see the others.' },
            ],
          },
        },
      }),

      /** The questionnaire, read in the document preview. The bar is where it would be sent back. */
      questionnaire: mail({
        title: docName,
        home: 'preview',
        inertNote: 'Local preview. Nothing is filled in, saved or sent from this screen.',
        pages: {
          preview: {
            title: docName,
            subtitle: 'Word document · 64 KB',
            blocks: [
              { type: 'file', kind: 'docx', name: docName, meta: 'Fillable form · 7 questions' },
              { type: 'bar', title: 'Fillable form.', text: 'Answers are returned to the sender by email.' },
              { type: 'heading', text: 'Practitioner questionnaire — readiness in practice' },
              {
                type: 'items',
                heading: 'Questions',
                items: [
                  { label: 'Q1', value: 'Your role and years of service.' },
                  { label: 'Q2', value: 'Which communications and vehicle systems your sub-unit uses day to day.' },
                  { label: 'Q3', value: 'The three biggest equipment gaps or failures you have seen this year.' },
                  { label: 'Q4', value: 'Where your sub-unit is currently based, and for how long.' },
                  { label: 'Q5', value: 'A typical week: timings for training, duties and movement.' },
                  { label: 'Q6', value: 'How long your sub-unit would need to be ready to move.' },
                  { label: 'Q7', value: 'Anything else about readiness the study should know.' },
                ],
              },
              { type: 'note', text: 'Your name is not required. Answers are anonymised before analysis.' },
            ],
          },
        },
      }),

      /** The register of approved research and media engagements, in the unit's own portal. */
      register: {
        kind: SURFACE.APP,
        appName: 'Unit portal',
        appTagline: 'Approved research & media requests',
        hero: { label: 'Northfield University', value: 'No approved request', caption: 'Nothing is registered for a readiness study or for Dr. Mira Sen.' },
        sections: [
          {
            id: 'e19-reg-rows',
            heading: 'Register',
            rows: [
              { label: 'RR-031', value: 'Campus careers fair · approved · no questionnaire' },
              { label: 'RR-029', value: 'Local history society · approved · public archive only' },
              { label: 'How to request', value: 'Researchers apply to the Public Information Office first' },
            ],
            note: 'Staff take part in research only once PIO and security have approved the request and its questions.',
          },
        ],
        tabs: [
          { label: 'Home', icon: 'home' },
          { label: 'Requests', icon: 'history' },
          { label: 'Profile', icon: 'profile' },
        ],
      },

      pio: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'Public Information Office (directory)',
        number: '+91 00000 82840',
        script: [
          { at: 0, speaker: 'them', text: 'Public Information Office.' },
          { at: 3, speaker: 'them', text: 'We have no request from Northfield or from a Dr. Sen, so nothing about that study is approved.' },
          { at: 8, speaker: 'them', text: 'Please don’t answer or pass it round. Report it with the report button and keep the email; security will want the recipient list.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 'e19-c01', slot: SLOT.INLINE, label: 'Open Dr. Sen’s invitation' }),
          action({ id: 'e19-c02', slot: SLOT.INLINE, label: 'Reply from the list to say yes' }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'e19-c03', slot: SLOT.INLINE, anchor: 'header',
            label: name, hint: 'Domain, recipients and affiliation',
            targetId: senderAsset, opens: 'details',
          }),
          action({
            id: 'e19-c04', slot: SLOT.INLINE, anchor: 'e19-file',
            label: 'Preview the questionnaire', hint: 'Read every question first', opens: 'questionnaire',
          }),
          action({ id: 'e19-c05', slot: SLOT.MENU, label: 'Read the whole message' }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 'e19-c06', slot: SLOT.SURFACE, on: 'questionnaire',
            label: 'Fill it in and send it back', closes: true,
          }),
          action({ id: 'e19-c07', slot: SLOT.SURFACE, on: 'questionnaire', label: 'Close the questionnaire', closes: true }),
          action({
            id: 'e19-c08', slot: SLOT.COMPOSER, compose: { mode: 'reply', to: fromAddress },
            label: 'Reply agreeing to a short interview call',
            echo: 'Happy to help with the study. I am free for a call on Thursday afternoon.',
          }),
          action({
            id: 'e19-c09', slot: SLOT.COMPOSER, compose: { mode: 'forward', to: section },
            label: 'Forward it to the section so others can take part',
            echo: 'Worth doing if you have fifteen minutes. Replies go to Dr. Sen by Friday.',
          }),
          action({ id: 'e19-c10', slot: SLOT.MENU, label: 'Leave it unanswered' }),
          navigate({ id: 'e19-nav-doc', slot: SLOT.MENU, label: 'Open the questionnaire', opens: 'questionnaire' }),
        ],
      },

      verify: {
        affordances: [
          action({ id: 'e19-c11', slot: SLOT.MENU, label: 'Call the Public Information Office on the directory number', opens: 'pio' }),
          action({
            id: 'e19-c12', slot: SLOT.MENU, label: 'Check the approved research-requests register',
            hint: 'Look for the study yourself', opens: 'register',
          }),
          action({
            id: 'e19-c13', slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the support desk'} in the trusted directory`, targetId: directoryAsset,
          }),
          action({ id: 'e19-c14', slot: SLOT.MENU, label: 'Reply to Dr. Sen asking for her credentials' }),
          action({ id: 'e19-c15', slot: SLOT.MENU, label: 'Report the message' }),
          action({ id: 'e19-c16', slot: SLOT.MENU, label: 'Block the sender' }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 'e19-c17', slot: SLOT.INLINE, label: 'Report it to security and keep the email' }),
          action({ id: 'e19-c18', slot: SLOT.INLINE, label: 'Answer only the general questions' }),
          action({ id: 'e19-c19', slot: SLOT.MENU, label: 'Block the sender and report' }),
          action({ id: 'e19-c20', slot: SLOT.MENU, label: 'Ignore it and move on' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'e19-nav-details', slot: SLOT.MENU, label: 'Show message details', opens: 'details', after: 'inspect' }),
      navigate({ id: 'e19-nav-register', slot: SLOT.MENU, label: 'Open the research-requests register', opens: 'register', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 'e19-dir-pio',
        name: 'Public Information Office',
        identifier: '+91 00000 82840',
        provenance: 'local approved directory',
        role: 'Approves every media, survey and research request, and its questions, before staff take part.',
      },
    ],
  }
}
