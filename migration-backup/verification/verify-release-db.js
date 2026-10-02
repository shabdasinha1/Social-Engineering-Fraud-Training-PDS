// PC-MIGRATION-001 - READ-ONLY post-restore check for the PC.
// Compares cyber_awareness_training_release against the counts captured at backup time
// (2026-09-23). It only reads; it never writes, drops or modifies anything.
//
//   mongosh "mongodb://127.0.0.1:27017/?replicaSet=rs0" --quiet --file migration-backup/verification/verify-release-db.js

const EXPECTED = {
  adminusers:          { docs: 1,   indexes: 2 },
  assessments:         { docs: 0,   indexes: 4 },
  attempts:            { docs: 3,   indexes: 6 },
  auditevents:         { docs: 0,   indexes: 8 },
  candidates:          { docs: 2,   indexes: 3 },
  configurations:      { docs: 1,   indexes: 2 },
  progresssnapshots:   { docs: 2,   indexes: 2 },
  scenariodefinitions: { docs: 100, indexes: 7 },
  scenarioevents:      { docs: 129, indexes: 3 },
  scenarioruns:        { docs: 30,  indexes: 5 },
  scenarios:           { docs: 0,   indexes: 3 },
};

const d = db.getSiblingDB('cyber_awareness_training_release');
const st = rs.status();
print(`MongoDB ${db.version()} | replica set ${st.set} | ${st.members.map(m => m.name + ' ' + m.stateStr).join(', ')}`);

const actual = d.getCollectionNames().sort();
let ok = true;
for (const name of Object.keys(EXPECTED)) {
  if (!actual.includes(name)) { print(`MISSING  ${name}`); ok = false; continue; }
  const c = d.getCollection(name);
  const docs = c.countDocuments({});
  const indexes = c.getIndexes().length;
  const pass = docs === EXPECTED[name].docs && indexes === EXPECTED[name].indexes;
  if (!pass) ok = false;
  print(`${pass ? 'OK      ' : 'MISMATCH'} ${name.padEnd(20)} docs ${docs}/${EXPECTED[name].docs}  indexes ${indexes}/${EXPECTED[name].indexes}`);
}
for (const name of actual) {
  if (!(name in EXPECTED)) { print(`EXTRA    ${name}`); ok = false; }
}
print(ok ? 'RESULT: PASS - restored release DB matches the laptop backup (11 collections, 268 documents, 45 indexes).'
         : 'RESULT: FAIL - do not start the application; report the lines above.');
