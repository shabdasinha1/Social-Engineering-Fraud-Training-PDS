import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { AUTHORED_SCENARIO_IDS } from '@/simulation/sceneRegistry'

/**
 * The design record behind the authored scenes (IMMERSIVE-003A-R2, extended by 003B).
 *
 * The stories in these five scenes were rebuilt from threat research, and the research was
 * written down so a reviewer can check it against the same pages. This suite exists so the
 * document and the code cannot drift apart quietly, and - more importantly - so that no
 * ATT&CK claim can be made in it without a source anyone can open.
 *
 * It deliberately does NOT check that a scenario has a technique. Three of the requirements
 * this batch was given were: do not force a mapping, say so explicitly when there is none,
 * and keep the client's scenario authoritative over the research. W03 has no mapping, and
 * the test below asserts that it is stated rather than quietly omitted.
 */

/**
 * One document per batch, because each batch is its own design record and its own set of
 * decisions. `BATCHES` is the whole map from a scenario to the document that has to
 * account for it, so adding a batch is adding a row.
 */
const BATCHES = [
  { ids: ['W01', 'W02', 'W03', 'W04', 'W05'], file: 'WHATSAPP_W01_W05_REAL_WORLD_RESEARCH.md' },
  { ids: ['W06', 'W07', 'W08', 'W09', 'W10'], file: 'WHATSAPP_W06_W10_REAL_WORLD_RESEARCH.md' },
  { ids: ['W11', 'W12', 'W13', 'W14', 'W15'], file: 'WHATSAPP_W11_W15_REAL_WORLD_RESEARCH.md' },
  { ids: ['W16', 'W17', 'W18', 'W19', 'W20'], file: 'WHATSAPP_W16_W20_REAL_WORLD_RESEARCH.md' },
  { ids: ['W21', 'W22', 'W23', 'W24', 'W25'], file: 'WHATSAPP_W21_W25_REAL_WORLD_RESEARCH.md' },
  { ids: ['I01', 'I02', 'I03', 'I04', 'I05'], file: 'INSTAGRAM_W01_W05_REAL_WORLD_RESEARCH.md' },
  { ids: ['I06', 'I07', 'I08', 'I09', 'I10'], file: 'INSTAGRAM_I06_I10_REAL_WORLD_RESEARCH.md' },
  { ids: ['I11', 'I12', 'I13', 'I14', 'I15'], file: 'INSTAGRAM_I11_I15_REAL_WORLD_RESEARCH.md' },
  { ids: ['I16', 'I17', 'I18', 'I19', 'I20'], file: 'INSTAGRAM_I16_I20_REAL_WORLD_RESEARCH.md' },
  { ids: ['I21', 'I22', 'I23', 'I24', 'I25'], file: 'INSTAGRAM_I21_I25_REAL_WORLD_RESEARCH.md' },
  { ids: ['E01', 'E02', 'E03', 'E04', 'E05'], file: 'EMAIL_E01_E05_REAL_WORLD_RESEARCH.md' },
  { ids: ['E06', 'E07', 'E08', 'E09', 'E10'], file: 'EMAIL_E06_E10_REAL_WORLD_RESEARCH.md' },
  { ids: ['E11', 'E12', 'E13', 'E14', 'E15'], file: 'EMAIL_E11_E15_REAL_WORLD_RESEARCH.md' },
  { ids: ['E16', 'E17', 'E18', 'E19', 'E20'], file: 'EMAIL_E16_E20_REAL_WORLD_RESEARCH.md' },
  { ids: ['E21', 'E22', 'E23', 'E24', 'E25'], file: 'EMAIL_E21_E25_REAL_WORLD_RESEARCH.md' },
  { ids: ['S01', 'S02', 'S03', 'S04', 'S05'], file: 'SMS_S01_S05_REAL_WORLD_RESEARCH.md' },
  { ids: ['S06', 'S07', 'S08', 'S09', 'S10'], file: 'SMS_S06_S10_REAL_WORLD_RESEARCH.md' },
  { ids: ['S11', 'S12', 'S13', 'S14', 'S15'], file: 'SMS_S11_S15_REAL_WORLD_RESEARCH.md' },
  { ids: ['S16', 'S17', 'S18', 'S19', 'S20'], file: 'SMS_S16_S20_REAL_WORLD_RESEARCH.md' },
  { ids: ['S21', 'S22', 'S23', 'S24', 'S25'], file: 'SMS_S21_S25_REAL_WORLD_RESEARCH.md' },
]

const DOCS = Object.fromEntries(BATCHES.map(({ file }) => [
  file, readFileSync(resolve(process.cwd(), `../docs/${file}`), 'utf8'),
]))

/** The part of a document from a heading to the next heading of any level. */
const sectionOr = (doc, heading) => {
  const start = doc.indexOf(heading)
  const next = doc.indexOf('\n#', start + 1)
  return doc.slice(start, next < 0 ? undefined : next)
}

const batchOf = (id) => BATCHES.find((batch) => batch.ids.includes(id))

/** Everything between one scenario's heading and the next top-level one. */
function sectionFor(id) {
  const batch = batchOf(id)
  if (!batch) return ''
  const doc = DOCS[batch.file]
  const start = doc.indexOf(`## ${batch.ids.indexOf(id) + 1}. ${id}`)
  if (start < 0) return ''
  const next = doc.indexOf('\n## ', start + 1)
  return doc.slice(start, next < 0 ? undefined : next)
}

/** Every scenario with a mapping, and every scenario deliberately without one. */
const MAPPED = [
  'W01', 'W02', 'W04', 'W05', 'W06', 'W08', 'W09', 'W10', 'W12', 'W13', 'W14', 'W15',
  'W17', 'W18', 'W19', 'W20', 'W22', 'W23', 'W24', 'W25',
  'I01', 'I02', 'I04', 'I05', 'I06', 'I08', 'I09', 'I10',
  'I12', 'I13', 'I14', 'I15',
  'I17', 'I18', 'I19', 'I20',
  'I22', 'I23', 'I24', 'I25',
  'E01', 'E02', 'E04', 'E05',
  'E06', 'E08', 'E09', 'E10',
  'E12', 'E13', 'E14', 'E15',
  'E17', 'E18', 'E19', 'E20',
  'E22', 'E23', 'E24', 'E25',
  'S01', 'S02', 'S04', 'S05',
  'S06', 'S08', 'S09', 'S10',
  'S12', 'S13', 'S14', 'S15',
  'S17', 'S18', 'S19', 'S20',
  'S22', 'S23', 'S24', 'S25',
]
const UNMAPPED = [
  'W03', 'W07', 'W11', 'W16', 'W21', 'I03', 'I07', 'I11', 'I16', 'I21', 'E03', 'E07', 'E11',
  'E16', 'E21', 'S03', 'S07', 'S11', 'S16', 'S21',
]

/** Technique ids as ATT&CK writes them: T1234 or T1234.005. */
const TECHNIQUE = /\bT\d{4}(?:\.\d{3})?\b/g

describe('the research document covers every authored scenario', () => {
  it('has a section for every authored scenario, and covers no others', () => {
    expect(AUTHORED_SCENARIO_IDS).toEqual(BATCHES.flatMap((batch) => batch.ids))
    for (const id of AUTHORED_SCENARIO_IDS) {
      expect(sectionFor(id).length, `${id} has no research section`).toBeGreaterThan(1000)
    }
  })

  it.each(AUTHORED_SCENARIO_IDS)(
    '%s records the decisions the batch was required to record',
    (id) => {
      const section = sectionFor(id)
      for (const heading of [
        'Client scenario',
        'MITRE ATT&CK alignment',
        'Client requirements preserved',
        'Enhanced synthetic storyline',
        'Conversation progression',
        'Evidence the learner can discover',
        'Learner interaction journey',
        'Simulation surfaces',
        'Verification mechanism',
        'Safe resolution',
        'Unsafe paths',
        'Scoring / event mapping',
        'Why the final simulation stays faithful',
      ]) {
        expect(section).toContain(heading)
      }
    },
  )

  it('says what must not be copied wherever it claims a technique', () => {
    for (const id of MAPPED) {
      expect(sectionFor(id)).toContain('What must NOT be copied')
      expect(sectionFor(id)).toContain('Why this maps')
    }
  })
})

describe('no ATT&CK claim is made without a source', () => {
  it.each(MAPPED)('%s cites a source page for every technique it names', (id) => {
    const section = sectionFor(id)
    const cited = [...new Set(section.match(TECHNIQUE) ?? [])]
    expect(cited.length).toBeGreaterThan(0)

    for (const technique of cited) {
      // T1598.001 -> attack.mitre.org/techniques/T1598/001/
      const [parent, sub] = technique.split('.')
      const url = sub
        ? `https://attack.mitre.org/techniques/${parent}/${sub}/`
        : `https://attack.mitre.org/techniques/${parent}/`
      expect(section, `${id} names ${technique} without linking its page`).toContain(url)
    }
  })

  it('names the ATT&CK version it was read against', () => {
    for (const doc of Object.values(DOCS)) {
      expect(doc).toMatch(/v19\.2/)
      expect(doc).toContain('https://attack.mitre.org/versions/')
    }
  })

  it('records that T1656 now resolves to T1684.001, so older notes are not trusted', () => {
    for (const doc of Object.values(DOCS)) {
      expect(doc).toContain('T1656')
      expect(doc).toContain('T1684.001')
    }
  })
})

describe('the scenarios with no mapping say so', () => {
  /**
   * Both legitimate controls. ATT&CK catalogues adversary behaviour, and there is no
   * adversary in either, so the requirement is that the absence is STATED rather than
   * quietly omitted - and that no technique is smuggled in regardless.
   */
  it.each(UNMAPPED)('%s states explicitly that it has none', (id) => {
    const section = sectionFor(id)
    expect(section).toContain('There is none, and none has been invented.')
    expect(section).toContain('Closest defensible behavioural reference')
    expect(section.match(TECHNIQUE)).toBeNull()
  })

  it('accounts for every authored scenario as either mapped or deliberately unmapped', () => {
    expect([...MAPPED, ...UNMAPPED].sort()).toEqual([...AUTHORED_SCENARIO_IDS].sort())
  })
})

describe('the research never overrides the client', () => {
  it('states the precedence rule and pins both content fingerprints', () => {
    for (const doc of Object.values(DOCS)) {
      expect(doc).toContain('The client scenario remains authoritative')
      expect(doc).toContain('8e7a6c98bf938dc863df507f5d778e30eca0c9d59d966f47d7e57551038a7687')
      expect(doc).toContain('2779b03939e13cf11e0bee44493609f0c91e228f201f22f8c025a080509afde1')
    }
  })

  it('records the places the generated content and the client stage text disagree', () => {
    expect(sectionFor('W03')).toContain('Content note carried forward')
    expect(sectionFor('W04')).toContain('Content note carried forward')
    // 003B's disagreement is bank-wide rather than per-scenario, so it is recorded once.
    expect(DOCS['WHATSAPP_W06_W10_REAL_WORLD_RESEARCH.md'])
      .toContain('Content note carried forward')
    // 003C carries the truncation forward (W15), records why the narrator line is not
    // printed, and names each placeholder its scenes override.
    const batchC = DOCS['WHATSAPP_W11_W15_REAL_WORLD_RESEARCH.md']
    expect(batchC).toContain('Content note carried forward')
    expect(batchC).toContain('the narrator line is not printed')
    expect(sectionFor('W12')).toContain('Content note')
  })

  it('states which ATT&CK fits are only partial rather than presenting them as exact', () => {
    expect(sectionFor('W13')).toContain('Partial fit, stated')
    expect(sectionFor('W15')).toContain('Partial fit, stated')
    // IMMERSIVE-003D: the task mechanics and the messaging-account takeover are sourced
    // outside ATT&CK, and the sections say so.
    expect(sectionFor('W17')).toContain('Partial fit, stated')
    expect(sectionFor('W18')).toContain('Partial fit, stated')
  })

  it('records a technique that was considered and rejected rather than forced', () => {
    // T1430 Location Tracking is malware and OS-API collection; W19 is a person pressing
    // Share. The section names it only to say why it does not apply.
    const w19 = sectionFor('W19')
    expect(w19).toContain('Considered and rejected')
    expect(w19).toContain('https://attack.mitre.org/techniques/T1430/')
  })

  it('records the batch-D content notes', () => {
    const batchD = DOCS['WHATSAPP_W16_W20_REAL_WORLD_RESEARCH.md']
    expect(batchD).toContain('Content note carried forward')
    expect(batchD).toContain('the narrator line is not printed')
    expect(batchD).toContain('Differentiation from W01–W15')
  })

  it('records the batch-E content notes, partial fits and rejected techniques', () => {
    const batchE = DOCS['WHATSAPP_W21_W25_REAL_WORLD_RESEARCH.md']
    expect(batchE).toContain('Content note carried forward')
    expect(batchE).toContain('the narrator line is not printed')
    expect(batchE).toContain('Differentiation from W01–W20')
    for (const id of ['W22', 'W23', 'W24', 'W25']) expect(sectionFor(id)).toContain('Partial fit, stated')
    // T1219 is the enterprise-network form of remote access; T1111 is technical MFA interception.
    expect(sectionFor('W24')).toContain('Considered and rejected')
    expect(sectionFor('W24')).toContain('https://attack.mitre.org/techniques/T1219/')
    expect(sectionFor('W25')).toContain('Considered and rejected')
    expect(sectionFor('W25')).toContain('https://attack.mitre.org/techniques/T1111/')
  })

  it('records the Instagram I06-I10 content notes, differentiation, partial fits and rejections', () => {
    const batch = DOCS['INSTAGRAM_I06_I10_REAL_WORLD_RESEARCH.md']
    expect(batch).toContain('Content notes carried forward')
    expect(batch).toContain('The narrator line is not printed')
    expect(batch).toContain('Differentiation from I01–I05 and WhatsApp W01–W25')
    for (const id of ['I06', 'I08', 'I09', 'I10']) {
      expect(sectionFor(id)).toContain('Partial fit, stated')
      expect(sectionFor(id)).toContain('Considered and rejected')
    }
    // T1204 is code execution on enterprise hosts; I09 installs nothing that executes.
    expect(sectionFor('I09')).toContain('https://attack.mitre.org/techniques/T1204/')
  })

  it('records the Instagram I11-I15 content notes, differentiation, partial fits and rejections', () => {
    const batch = DOCS['INSTAGRAM_I11_I15_REAL_WORLD_RESEARCH.md']
    expect(batch).toContain('Content notes carried forward')
    expect(batch).toContain('The narrator line is not printed')
    expect(batch).toContain('Differentiation from I01–I10 and WhatsApp W01–W25')
    // The bank stores I15's notification truncated, and the batch says so rather than paraphrasing.
    expect(batch).toContain('truncated in the bank')
    expect(batch).toContain('@knownfriend')
    for (const id of ['I12', 'I13', 'I14', 'I15']) {
      expect(sectionFor(id)).toContain('Considered and rejected')
    }
    for (const id of ['I12', 'I13', 'I14']) {
      expect(sectionFor(id)).toContain('Partial fit, stated')
    }
    // T1111 is technical interception; both code scenarios relay a factor the learner types.
    expect(sectionFor('I12')).toContain('https://attack.mitre.org/techniques/T1111/')
    expect(sectionFor('I15')).toContain('https://attack.mitre.org/techniques/T1111/')
    // I15's account is the friend's own, so impersonation is named only to reject it.
    expect(sectionFor('I15')).toContain('https://attack.mitre.org/techniques/T1684/001/')
    // T1593.001 is adversary reconnaissance; the only searching in I13 is the learner's.
    expect(sectionFor('I13')).toContain('https://attack.mitre.org/techniques/T1593/001/')
    // T1566.001 sends an attachment TO the victim; I14's flow is the reverse.
    expect(sectionFor('I14')).toContain('https://attack.mitre.org/techniques/T1566/001/')
  })

  it('records the Instagram I16-I20 content notes, differentiation, partial fits and rejections', () => {
    const batch = DOCS['INSTAGRAM_I16_I20_REAL_WORLD_RESEARCH.md']
    expect(batch).toContain('Content notes carried forward')
    expect(batch).toContain('The narrator line is not printed')
    expect(batch).toContain('Differentiation from I01–I15 and WhatsApp W01–W25')
    // I18's notification is stored truncated, and the record says so.
    expect(batch).toContain('truncated in the bank')
    expect(batch).toContain('Send tomorrow')
    for (const id of ['I17', 'I18', 'I19', 'I20']) {
      expect(sectionFor(id)).toContain('Considered and rejected')
      expect(sectionFor(id)).toContain('Partial fit, stated')
    }
    // Extortion of an individual and influence operations are named as outside the matrix.
    expect(sectionFor('I17')).toContain('https://attack.mitre.org/techniques/T1657/')
    expect(sectionFor('I17')).toContain('https://attack.mitre.org/techniques/T1565/')
    expect(sectionFor('I19')).toContain('ATT&CK does not model influence operations')
    expect(sectionFor('I19')).toContain('https://attack.mitre.org/techniques/T1566/003/')
    // I18 is a new account, not the teammate's compromised one.
    expect(sectionFor('I18')).toContain('https://attack.mitre.org/techniques/T1586/001/')
    // T1592 is about computers, not field equipment.
    expect(sectionFor('I20')).toContain('https://attack.mitre.org/techniques/T1592/')
    // The overlap the differentiation test records is written down here too.
    expect(batch).toContain('I02 and I12')
  })

  it('records the Instagram I21-I25 content notes, differentiation, overlaps, partial fits and rejections', () => {
    const batch = DOCS['INSTAGRAM_I21_I25_REAL_WORLD_RESEARCH.md']
    expect(batch).toContain('Content notes carried forward')
    expect(batch).toContain('The narrator line is not printed')
    expect(batch).toContain('Differentiation from I01–I20 and WhatsApp W01–W25')
    // I24 is a sponsored placement, like I09, and its placeholder identifier is named as such.
    expect(batch).toContain('I24 is a sponsored placement')
    expect(batch).toContain('@sponsored126')
    // The overlaps the client's own stage text forces are stated, not hidden.
    expect(sectionOr(batch, 'Nearest existing scene')).toContain('Intentional overlap, stated')
    expect(batch).toContain('I16')
    expect(batch).toContain('W24')
    for (const id of ['I22', 'I23', 'I24', 'I25']) {
      expect(sectionFor(id)).toContain('Considered and rejected')
      expect(sectionFor(id)).toContain('Partial fit, stated')
    }
    // Technical interception, remote-access software and malware screen capture are not a person reading a code.
    for (const technique of ['T1111/', 'T1219/', 'T1113/']) {
      expect(sectionFor('I22')).toContain(`https://attack.mitre.org/techniques/${technique}`)
    }
    // I23's account is the creator's own, so establishing one is named only to reject it.
    expect(sectionFor('I23')).toContain('https://attack.mitre.org/techniques/T1586/001/')
    expect(sectionFor('I23')).toContain('https://attack.mitre.org/techniques/T1585/001/')
    // I24 is paid placement; I25 is not, and says so.
    expect(sectionFor('I24')).toContain('https://attack.mitre.org/techniques/T1583/008/')
    expect(sectionFor('I24')).toContain('https://attack.mitre.org/techniques/T1204/')
    expect(sectionFor('I25')).toContain('https://attack.mitre.org/techniques/T1583/008/')
    expect(sectionFor('I25')).toContain('https://attack.mitre.org/techniques/T1566/002/')
  })

  it('records the Email E01-E05 content notes, differentiation, partial fits and rejections', () => {
    const batch = DOCS['EMAIL_E01_E05_REAL_WORLD_RESEARCH.md']
    expect(batch).toContain('Content notes carried forward')
    expect(batch).toContain('The narrator line is not printed')
    expect(batch).toContain('Differentiation from WhatsApp W01–W25 and Instagram I01–I25')
    for (const id of ['E01', 'E02', 'E04', 'E05']) {
      expect(sectionFor(id)).toContain('Considered and rejected')
      expect(sectionFor(id)).toContain('Partial fit, stated')
    }
    // The two credential-phishing scenes reject the technique that does not fit their mechanism.
    expect(sectionFor('E01')).toContain('https://attack.mitre.org/techniques/T1111/')
    expect(sectionFor('E05')).toContain('https://attack.mitre.org/techniques/T1534/')
    // The malware scene maps user execution; the delivery scene maps financial theft.
    expect(sectionFor('E02')).toContain('https://attack.mitre.org/techniques/T1204/002/')
    expect(sectionFor('E04')).toContain('https://attack.mitre.org/techniques/T1657/')
    // E03 is the legitimate control and is named among the deliberately unmapped scenes.
    expect(sectionFor('E03')).toContain('There is none, and none has been invented.')
  })

  it('records the Email E06-E10 content notes, differentiation, partial fits and rejections', () => {
    const batch = DOCS['EMAIL_E06_E10_REAL_WORLD_RESEARCH.md']
    expect(batch).toContain('Content notes carried forward')
    expect(batch).toContain('The narrator line is not printed')
    expect(batch).toContain('Differentiation from Email E01–E05, WhatsApp W01–W25 and Instagram I01–I25')
    // E09's parsed "From" display-name artefact is recorded like the earlier placeholder handling.
    expect(batch).toContain('parsed display name')
    for (const id of ['E06', 'E08', 'E09', 'E10']) {
      expect(sectionFor(id)).toContain('Considered and rejected')
      expect(sectionFor(id)).toContain('Partial fit, stated')
    }
    // Email collection, MFA interception and internal spearphishing are named only to be rejected.
    expect(sectionFor('E06')).toContain('https://attack.mitre.org/techniques/T1114/')
    expect(sectionFor('E08')).toContain('https://attack.mitre.org/techniques/T1111/')
    expect(sectionFor('E09')).toContain('https://attack.mitre.org/techniques/T1534/')
    expect(sectionFor('E10')).toContain('https://attack.mitre.org/techniques/T1534/')
    // The two BEC/diversion scenes map financial theft and account/domain infrastructure.
    expect(sectionFor('E09')).toContain('https://attack.mitre.org/techniques/T1585/002/')
    expect(sectionFor('E10')).toContain('https://attack.mitre.org/techniques/T1583/001/')
    // E07 is the legitimate control and is named among the deliberately unmapped scenes.
    expect(sectionFor('E07')).toContain('There is none, and none has been invented.')
  })

  it('records the Email E11-E15 content notes, differentiation, partial fits and rejections', () => {
    const batch = DOCS['EMAIL_E11_E15_REAL_WORLD_RESEARCH.md']
    expect(batch).toContain('Content notes carried forward')
    expect(batch).toContain('The narrator line is not printed')
    expect(batch).toContain('Differentiation from Email E01–E10, WhatsApp W01–W25 and Instagram I01–I25')
    // E12's fragmentary notification body is recorded like the earlier placeholder handling.
    expect(batch).toContain('fragmentary notification body')
    for (const id of ['E12', 'E13', 'E14', 'E15']) {
      expect(sectionFor(id)).toContain('Considered and rejected')
      expect(sectionFor(id)).toContain('Partial fit, stated')
    }
    // MFA interception, runtime deobfuscation, in-body links and token use are named to be rejected.
    expect(sectionFor('E12')).toContain('https://attack.mitre.org/techniques/T1111/')
    expect(sectionFor('E13')).toContain('https://attack.mitre.org/techniques/T1140/')
    expect(sectionFor('E14')).toContain('https://attack.mitre.org/techniques/T1566/002/')
    expect(sectionFor('E15')).toContain('https://attack.mitre.org/techniques/T1550/001/')
    // The consent scene maps token theft and cloud-app integration.
    expect(sectionFor('E15')).toContain('https://attack.mitre.org/techniques/T1528/')
    expect(sectionFor('E15')).toContain('https://attack.mitre.org/techniques/T1671/')
    // The archive scene maps attachment delivery, user execution and encrypted-file obfuscation.
    expect(sectionFor('E13')).toContain('https://attack.mitre.org/techniques/T1566/001/')
    expect(sectionFor('E13')).toContain('https://attack.mitre.org/techniques/T1027/013/')
    // E11 is the legitimate control and is named among the deliberately unmapped scenes.
    expect(sectionFor('E11')).toContain('There is none, and none has been invented.')
  })

  it('records the Email E16-E20 identity, differentiation, gaps, partial fits and rejections', () => {
    const batch = DOCS['EMAIL_E16_E20_REAL_WORLD_RESEARCH.md']
    expect(batch).toContain('v19.2')
    expect(batch).toContain('Differentiation from Email E01–E15, WhatsApp W01–W25 and Instagram I01–I25')
    expect(batch).toContain('The narrator line is not printed')
    // Canonical identity comes from the existing taxonomy, never an invented id.
    for (const family of [
      'legit_routine_broadcast', 'tech_support_and_callback_fraud', 'payment_diversion',
      'operational_elicitation', 'coercion_and_extortion',
    ]) expect(batch).toContain(family)
    // E18's parsed display name and fragmentary body are recorded like E09's and E12's.
    expect(batch).toContain('parsed display name and fragmentary notification body')
    // Every mapping is graded, and the gaps ATT&CK does not cover are stated.
    for (const id of ['E17', 'E18', 'E19', 'E20']) {
      expect(sectionFor(id)).toContain('Considered and rejected')
      expect(sectionFor(id)).toMatch(/Direct/)
    }
    expect(batch).toContain('no dedicated ATT&CK technique')
    // Callback phishing maps to voice spearphishing and remote-access tools.
    expect(sectionFor('E17')).toContain('https://attack.mitre.org/techniques/T1566/004/')
    expect(sectionFor('E17')).toContain('https://attack.mitre.org/techniques/T1219/')
    // The hijacked thread maps compromised email accounts and financial theft, and rejects T1534.
    expect(sectionFor('E18')).toContain('https://attack.mitre.org/techniques/T1586/002/')
    expect(sectionFor('E18')).toContain('https://attack.mitre.org/techniques/T1657/')
    expect(sectionFor('E18')).toContain('https://attack.mitre.org/techniques/T1534/')
    // The questionnaire maps phishing for information by attachment and org-information gathering.
    expect(sectionFor('E19')).toContain('https://attack.mitre.org/techniques/T1598/002/')
    expect(sectionFor('E19')).toContain('https://attack.mitre.org/techniques/T1591/')
    // The summons maps impersonation (the current T1684.001, not the retired T1656).
    expect(sectionFor('E20')).toContain('https://attack.mitre.org/techniques/T1684/001/')
    expect(sectionFor('E20')).not.toContain('https://attack.mitre.org/techniques/T1656/')
    // E16 is the legitimate control and is named among the deliberately unmapped scenes.
    expect(sectionFor('E16')).toContain('There is none, and none has been invented.')
  })

  it('records the Email E21-E25 identity, differentiation, gaps, partial fits and rejections', () => {
    const batch = DOCS['EMAIL_E21_E25_REAL_WORLD_RESEARCH.md']
    expect(batch).toContain('v19.2')
    expect(batch).toContain('Differentiation from Email E01–E20, WhatsApp W01–W25 and Instagram I01–I25')
    expect(batch).toContain('The narrator line is not printed')
    // Canonical identity comes from the existing taxonomy, never an invented id.
    for (const family of [
      'legit_verified_high_risk_change', 'payment_diversion', 'malware_delivery', 'qr_code_phishing',
    ]) expect(batch).toContain(family)
    // E25's parsed display name is recorded like E09's, E12's and E18's.
    expect(batch).toContain('parsed display name')
    // Every mapping is graded, and the three gaps ATT&CK does not cover are stated.
    for (const id of ['E22', 'E23', 'E24', 'E25']) {
      expect(sectionFor(id)).toContain('Considered and rejected')
      expect(sectionFor(id)).toMatch(/Direct/)
    }
    expect(batch).toContain('no dedicated ATT&CK technique')
    expect(sectionFor('E24')).toContain('has no technique for a QR code')
    expect(sectionFor('E25')).toContain('The gap, stated')
    // The recorded voice maps impersonation and financial theft, and rejects the attachment and
    // internal-spearphishing readings; spearphishing voice is a partial fit because nobody calls.
    expect(sectionFor('E22')).toContain('https://attack.mitre.org/techniques/T1684/001/')
    expect(sectionFor('E22')).toContain('https://attack.mitre.org/techniques/T1657/')
    expect(sectionFor('E22')).toContain('https://attack.mitre.org/techniques/T1566/004/')
    expect(sectionFor('E22')).toContain('Partial fit, stated')
    expect(sectionFor('E22')).toContain('https://attack.mitre.org/techniques/T1534/')
    // The HTML attachment maps attachment delivery and HTML smuggling, and rejects portal capture.
    expect(sectionFor('E23')).toContain('https://attack.mitre.org/techniques/T1566/001/')
    expect(sectionFor('E23')).toContain('https://attack.mitre.org/techniques/T1027/006/')
    expect(sectionFor('E23')).toContain('https://attack.mitre.org/techniques/T1056/003/')
    // The code scene maps attachment delivery and masquerading; the link sub-technique is partial.
    expect(sectionFor('E24')).toContain('https://attack.mitre.org/techniques/T1036/')
    expect(sectionFor('E24')).toContain('https://attack.mitre.org/techniques/T1566/002/')
    expect(sectionFor('E24')).toContain('Partial fit, stated')
    // The payroll scene rejects the compromised-mailbox reading that belongs to E18.
    expect(sectionFor('E25')).toContain('https://attack.mitre.org/techniques/T1586/002/')
    expect(sectionFor('E25')).toContain('https://attack.mitre.org/techniques/T1657/')
    // E21 is the legitimate control and is named among the deliberately unmapped scenes.
    expect(sectionFor('E21')).toContain('There is none, and none has been invented.')
  })

  it('records the SMS S01-S05 identity, differentiation, gaps, partial fits and rejections', () => {
    const batch = DOCS['SMS_S01_S05_REAL_WORLD_RESEARCH.md']
    expect(batch).toContain('v19.2')
    expect(batch).toContain('Differentiation from Email E01–E25, WhatsApp W01–W25 and Instagram I01–I25')
    expect(batch).toContain('The narrator line is not printed')
    // Canonical identity comes from the existing taxonomy, never an invented id.
    for (const family of [
      'financial_credential_phishing', 'tech_support_and_callback_fraud', 'legit_system_confirmation',
    ]) expect(batch).toContain(family)
    // S05's display name is recorded like the earlier placeholder handling.
    expect(batch).toContain('display name')
    // Every mapping is graded, and the gaps ATT&CK does not cover are stated.
    for (const id of ['S01', 'S02', 'S04', 'S05']) {
      expect(sectionFor(id)).toContain('Considered and rejected')
      expect(sectionFor(id)).toMatch(/Direct/)
    }
    expect(batch).toContain('The gap, stated')
    expect(sectionFor('S01')).toContain('no technique for the carrier-level')
    expect(sectionFor('S05')).toContain('no technique for a recurring payment mandate')
    // This is the first batch whose primary mapping is in the Mobile matrix.
    for (const id of ['S01', 'S02', 'S04', 'S05']) {
      expect(sectionFor(id)).toContain('https://attack.mitre.org/techniques/T1660/')
    }
    // The three harvest scenes map mobile GUI input capture; the callback scene does not.
    for (const id of ['S01', 'S04', 'S05']) {
      expect(sectionFor(id)).toContain('https://attack.mitre.org/techniques/T1417/002/')
    }
    expect(sectionFor('S02')).toContain('https://attack.mitre.org/techniques/T1219/')
    expect(sectionFor('S02')).toContain('https://attack.mitre.org/techniques/T1566/004/')
    expect(sectionFor('S02')).toContain('Partial fit, stated')
    // Malware-dependent mobile techniques are named only to be rejected.
    expect(sectionFor('S01')).toContain('https://attack.mitre.org/techniques/T1636/004/')
    expect(sectionFor('S05')).toContain('https://attack.mitre.org/techniques/T1582/')
    // S03 is the legitimate control and is named among the deliberately unmapped scenes.
    expect(sectionFor('S03')).toContain('There is none, and none has been invented.')
  })

  it('records the SMS S06-S10 identity, differentiation, gaps, partial fits and rejections', () => {
    const batch = DOCS['SMS_S06_S10_REAL_WORLD_RESEARCH.md']
    expect(batch).toContain('v19.2')
    expect(batch).toContain('Differentiation from SMS S01–S05, Email E01–E25, WhatsApp W01–W25 and Instagram I01–I25')
    expect(batch).toContain('The narrator line is not printed')
    // Canonical identity comes from the existing taxonomy, never an invented id.
    for (const family of [
      'identity_data_harvesting', 'legit_system_confirmation', 'unsolicited_payment_lure',
      'relationship_grooming_fraud', 'account_takeover_authorisation_abuse',
    ]) expect(batch).toContain(family)
    // S06 is the batch's military scene, and the safety rule is written down, not assumed.
    expect(batch).toContain('Military safety (S06)')
    expect(sectionFor('S06')).toContain('No real unit, formation, establishment, appointment, rank')
    // S07's placeholder header and S09's elided body are recorded like the earlier ones.
    expect(batch).toContain('placeholder sender identifier')
    expect(batch).toContain('elided notification body')
    // Every mapping is graded, and the gaps ATT&CK does not cover are stated.
    for (const id of ['S06', 'S08', 'S09', 'S10']) {
      expect(sectionFor(id)).toContain('Considered and rejected')
      expect(sectionFor(id)).toContain('The gap, stated')
      expect(sectionFor(id)).toMatch(/Direct/)
      expect(sectionFor(id)).toContain('Partial fit, stated')
    }
    expect(batch).toContain('no technique for the bulk delivery pattern')
    expect(batch).toContain('no technique for long-game relationship grooming')
    // The identity-elicitation scene maps direct elicitation, not device compromise.
    expect(sectionFor('S06')).toContain('https://attack.mitre.org/techniques/T1598/')
    expect(sectionFor('S06')).toContain('https://attack.mitre.org/techniques/T1589/')
    expect(sectionFor('S06')).toContain('https://attack.mitre.org/techniques/T1636/004/')
    // The prize lure and the grooming pitch both map financial theft; the prize lure adds the host.
    expect(sectionFor('S08')).toContain('https://attack.mitre.org/techniques/T1657/')
    expect(sectionFor('S08')).toContain('https://attack.mitre.org/techniques/T1583/001/')
    expect(sectionFor('S09')).toContain('https://attack.mitre.org/techniques/T1657/')
    // S09's persona is invented, so impersonation is named only to reject it.
    expect(sectionFor('S09')).toContain('https://attack.mitre.org/techniques/T1684/001/')
    expect(sectionFor('S09')).toContain('https://attack.mitre.org/techniques/T1585/')
    // The SIM-swap scene maps the Mobile technique for it, and rejects technical MFA interception.
    expect(sectionFor('S10')).toContain('https://attack.mitre.org/techniques/T1451/')
    expect(sectionFor('S10')).toContain('https://attack.mitre.org/techniques/T1111/')
    expect(sectionFor('S10')).toContain('https://attack.mitre.org/techniques/T1598/004/')
    // Every scene in the batch is delivered to a handset.
    for (const id of ['S06', 'S08', 'S09', 'S10']) {
      expect(sectionFor(id)).toContain('https://attack.mitre.org/techniques/T1660/')
    }
    // S07 is the legitimate control and is named among the deliberately unmapped scenes.
    expect(sectionFor('S07')).toContain('There is none, and none has been invented.')
  })

  it('records the SMS S11-S15 identity, differentiation, gaps, partial fits and rejections', () => {
    const batch = DOCS['SMS_S11_S15_REAL_WORLD_RESEARCH.md']
    expect(batch).toContain('v19.2')
    expect(batch).toContain('Differentiation from SMS S01–S10, Email E01–E25, WhatsApp W01–W25 and Instagram I01–I25')
    expect(batch).toContain('The narrator line is not printed')
    for (const family of [
      'legit_system_confirmation', 'financial_credential_phishing', 'investment_and_task_fraud',
      'operational_elicitation', 'qr_code_phishing',
    ]) expect(batch).toContain(family)
    // Both military scenes, and the safety rule, are written down.
    expect(batch).toContain('Military safety (S14, S15)')
    for (const id of ['S14', 'S15']) {
      expect(sectionFor(id)).toContain('No real unit, formation, establishment, appointment, rank')
    }
    // Each overlap with an earlier scene is named, not hidden.
    for (const pair of ['S12 and E08', 'S13 and W17', 'S14, W19 and S06', 'S15 and I25']) {
      expect(batch).toContain(pair)
    }
    for (const id of ['S12', 'S13', 'S14', 'S15']) {
      expect(sectionFor(id)).toContain('Considered and rejected')
      expect(sectionFor(id)).toContain('The gap, stated')
      expect(sectionFor(id)).toMatch(/Direct/)
      expect(sectionFor(id)).toContain('Partial fit, stated')
      expect(sectionFor(id)).toContain('https://attack.mitre.org/techniques/T1660/')
    }
    // App-dependent Mobile techniques are named only to be rejected.
    expect(sectionFor('S12')).toContain('https://attack.mitre.org/techniques/T1417/002/')
    expect(sectionFor('S14')).toContain('https://attack.mitre.org/techniques/T1430/')
    expect(sectionFor('S14')).toContain('https://attack.mitre.org/techniques/T1598/')
    expect(sectionFor('S14')).toContain('https://attack.mitre.org/techniques/T1591/001/')
    expect(sectionFor('S13')).toContain('https://attack.mitre.org/techniques/T1657/')
    expect(batch).toContain('quishing')
    expect(sectionFor('S11')).toContain('There is none, and none has been invented.')
  })

  it('records the SMS S16-S20 identity, differentiation, gaps, partial fits and rejections', () => {
    const batch = DOCS['SMS_S16_S20_REAL_WORLD_RESEARCH.md']
    expect(batch).toContain('v19.2')
    expect(batch).toContain('Differentiation from SMS S01–S15, Email E01–E25, WhatsApp W01–W25 and Instagram I01–I25')
    expect(batch).toContain('The narrator line is not printed')
    for (const family of [
      'legit_system_confirmation', 'impersonation_emergency_payment', 'tech_support_and_callback_fraud',
      'operational_elicitation',
    ]) expect(batch).toContain(family)
    // The one military scene, and the safety rule, are written down.
    expect(batch).toContain('Military safety (S19)')
    expect(sectionFor('S19')).toContain('No real unit, formation, establishment, appointment, rank')
    // The bank's own difficulty is kept and the reason is stated.
    expect(batch).toContain('Difficulty is the bank')
    // Each overlap with an earlier scene is named, not hidden.
    for (const pair of ['S16, S03 and S07', 'S17, W04 and I04', 'S18, S01 and S12', 'S19, S14 and I20', 'S20, S02, E17 and W24']) {
      expect(batch).toContain(pair)
    }
    // The placeholder handling is recorded like the earlier batches.
    expect(batch).toContain('Placeholder sender identifiers')
    expect(batch).toContain('Parsed display name, reassembled')
    for (const id of ['S17', 'S18', 'S19', 'S20']) {
      expect(sectionFor(id)).toContain('Considered and rejected')
      expect(sectionFor(id)).toContain('The gap, stated')
      expect(sectionFor(id)).toMatch(/Direct/)
      expect(sectionFor(id)).toContain('Partial fit, stated')
      expect(sectionFor(id)).toContain('https://attack.mitre.org/techniques/T1660/')
    }
    // Impersonation and theft for the new-number scene; the child's account is not compromised.
    expect(sectionFor('S17')).toContain('https://attack.mitre.org/techniques/T1684/001/')
    expect(sectionFor('S17')).toContain('https://attack.mitre.org/techniques/T1657/')
    expect(sectionFor('S17')).toContain('https://attack.mitre.org/techniques/T1586/')
    // Callback phishing for information; email spoofing (now T1684.002) and MFA interception rejected.
    expect(sectionFor('S18')).toContain('https://attack.mitre.org/techniques/T1598/004/')
    expect(sectionFor('S18')).toContain('https://attack.mitre.org/techniques/T1684/002/')
    expect(sectionFor('S18')).toContain('https://attack.mitre.org/techniques/T1111/')
    // Host hardware gathered by phishing; on-device IMEI discovery and location tracking rejected.
    expect(sectionFor('S19')).toContain('https://attack.mitre.org/techniques/T1592/001/')
    expect(sectionFor('S19')).toContain('https://attack.mitre.org/techniques/T1422/')
    expect(sectionFor('S19')).toContain('https://attack.mitre.org/techniques/T1430/')
    // Callback to remote-management tools; mobile remote access is partial; malware screen capture rejected.
    expect(sectionFor('S20')).toContain('https://attack.mitre.org/techniques/T1566/004/')
    expect(sectionFor('S20')).toContain('https://attack.mitre.org/techniques/T1663/')
    expect(sectionFor('S20')).toContain('https://attack.mitre.org/techniques/T1513/')
    expect(sectionFor('S16')).toContain('There is none, and none has been invented.')
  })

  it('records the SMS S21-S25 identity, differentiation, gaps, partial fits and rejections', () => {
    const batch = DOCS['SMS_S21_S25_REAL_WORLD_RESEARCH.md']
    expect(batch).toContain('v19.2')
    expect(batch).toContain('Differentiation from SMS S01–S20, Email E01–E25, WhatsApp W01–W25 and Instagram I01–I25')
    expect(batch).toContain('The narrator line is not printed')
    for (const family of [
      'legit_system_confirmation', 'credential_phishing', 'financial_credential_phishing',
      'coercion_and_extortion', 'malware_delivery',
    ]) expect(batch).toContain(family)
    // The one military scene, and the safety rule, are written down.
    expect(batch).toContain('Military safety (S22)')
    expect(sectionFor('S22')).toContain('No real unit, formation, establishment, appointment, rank')
    expect(batch).toContain('Difficulty is the bank')
    // Each overlap with an earlier scene is named, not hidden.
    for (const pair of ['S21, S16 and S03', 'S22, W15 and E22', 'S23, W04 and S17', 'S24, W12, E20 and S12', 'S25, W14 and S20']) {
      expect(batch).toContain(pair)
    }
    // The placeholder handling is recorded like the earlier batches.
    expect(batch).toContain('Placeholder sender identifiers')
    expect(batch).toContain('Placeholder received time')
    expect(batch).toContain('Parsed display names, reassembled')
    expect(batch).toContain('Placeholder file asset')
    // The user-required research items are present for every scene.
    for (const id of ['S21', 'S22', 'S23', 'S24', 'S25']) {
      const section = sectionFor(id)
      expect(section).toContain('Real-world analogue and mechanism')
      for (const item of ['Observable cues', 'Psychological trigger', 'Why the cues matter', 'Synthetic-data safety']) {
        expect(section, `${id} ${item}`).toContain(item)
      }
      expect(section.toLowerCase(), id).toContain('considered and rejected')
    }
    for (const id of ['S22', 'S23', 'S24', 'S25']) {
      expect(sectionFor(id)).toContain('Considered and rejected')
      expect(sectionFor(id)).toContain('The gap, stated')
      expect(sectionFor(id)).toMatch(/Direct/)
      expect(sectionFor(id)).toContain('Partial fit, stated')
      expect(sectionFor(id)).toContain('https://attack.mitre.org/techniques/T1660/')
    }
    // Credential link and callback for the voice-mail lure; AI audio is partial; interception rejected.
    expect(sectionFor('S22')).toContain('https://attack.mitre.org/techniques/T1598/003/')
    expect(sectionFor('S22')).toContain('https://attack.mitre.org/techniques/T1598/004/')
    expect(sectionFor('S22')).toContain('https://attack.mitre.org/techniques/T1588/007/')
    expect(sectionFor('S22')).toContain('https://attack.mitre.org/techniques/T1111/')
    // Financial theft for the collect request; overlay capture rejected.
    expect(sectionFor('S23')).toContain('https://attack.mitre.org/techniques/T1657/')
    expect(sectionFor('S23')).toContain('https://attack.mitre.org/techniques/T1417/002/')
    // Impersonation (the current T1684.001) and theft for the case fee.
    expect(sectionFor('S24')).toContain('https://attack.mitre.org/techniques/T1684/001/')
    expect(sectionFor('S24')).toContain('https://attack.mitre.org/techniques/T1657/')
    expect(sectionFor('S24')).not.toContain('https://attack.mitre.org/techniques/T1656/')
    // Mobile post-install behaviours are partial; the deprecated delivery technique is rejected.
    for (const technique of ['T1655/001/', 'T1636/004/', 'T1453/', 'T1513/', 'T1476/', 'T1204/']) {
      expect(sectionFor('S25')).toContain(`https://attack.mitre.org/techniques/${technique}`)
    }
    expect(sectionFor('S21')).toContain('There is none, and none has been invented.')
  })

  it.each(Object.keys(DOCS))('%s documents how form data is handled', (file) => {
    const doc = DOCS[file]
    const forms = doc.slice(doc.indexOf('## 6. Forms, inputs and data handling'))
    for (const rule of [
      'Local', 'Ephemeral', 'Never transmitted', 'Never persisted', 'Never logged',
      'No autofill surface', 'No form submission', 'Deterministic', 'Not decorative',
    ]) {
      expect(forms).toContain(rule)
    }
    expect(forms).toContain('METADATA_ALLOWLIST')
  })
})
