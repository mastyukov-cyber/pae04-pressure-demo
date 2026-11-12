// Offline synthetic medication module contract. Node.js 20+. No network, database, or disk writes.
import assert from "node:assert/strict";
import { createMedicationSandbox } from "./meds-fixture.mjs";

const cases = [
  ["M01","Add synthetic catalog medicine",()=>{const s=createMedicationSandbox();assert.equal(s.addFromCatalog("QA-CAT-A","permanent").name,"Тестовый препарат А");}],
  ["M02","Add fictional medicine manually",()=>{const s=createMedicationSandbox();assert.equal(s.addManual({name:"Тестовый препарат В",type:"permanent"}).type,"permanent");}],
  ["M03","Permanent medicine appears on scheduled day",()=>{const s=createMedicationSandbox();s.addFromCatalog("QA-CAT-A","permanent");assert.equal(s.plannedFor("2026-11-12").length,1);}],
  ["M04","Course is planned only within dates",()=>{const s=createMedicationSandbox();s.addManual({name:"Тестовый препарат Г",type:"course",start:"2026-11-10",end:"2026-11-15"});assert.equal(s.plannedFor("2026-11-12").length,1);assert.equal(s.plannedFor("2026-11-16").length,0);}],
  ["M05","Reject course intake outside date range",()=>{const s=createMedicationSandbox();const m=s.addManual({name:"Тестовый препарат Д",type:"course",start:"2026-11-10",end:"2026-11-15"});assert.throws(()=>s.setTaken(m.id,"2026-11-16",true));}],
  ["M06","As-needed medicine has no scheduled reminders",()=>{const s=createMedicationSandbox();s.addManual({name:"Тестовый препарат Е",type:"as_needed"});assert.equal(s.plannedFor("2026-11-12").length,0);}],
  ["M07","As-needed dose can be checked manually",()=>{const s=createMedicationSandbox();const m=s.addManual({name:"Тестовый препарат Ж",type:"as_needed"});s.setTaken(m.id,"2026-11-12");assert.equal(s.wasTaken(m.id,"2026-11-12"),true);}],
  ["M08","Checkmark can be cleared",()=>{const s=createMedicationSandbox();const m=s.addFromCatalog("QA-CAT-B","permanent");s.setTaken(m.id,"2026-11-12");s.setTaken(m.id,"2026-11-12",false);assert.equal(s.wasTaken(m.id,"2026-11-12"),false);}],
  ["M09","Double checkmark does not create duplicate",()=>{const s=createMedicationSandbox();const m=s.addFromCatalog("QA-CAT-A","permanent");s.setTaken(m.id,"2026-11-12");s.setTaken(m.id,"2026-11-12");assert.equal(s.history().length,1);}],
  ["M10","Medicine export never includes pressure records",()=>{const s=createMedicationSandbox();s.addFromCatalog("QA-CAT-A","permanent");const v=JSON.parse(s.exportJson());assert.deepEqual(Object.keys(v).sort(),["checks","medications","owner","schema","synthetic_only"].sort());}],
  ["M11","Synthetic export and import restore medications and checkmarks",()=>{const a=createMedicationSandbox();const m=a.addFromCatalog("QA-CAT-A","permanent");a.setTaken(m.id,"2026-11-12");const b=createMedicationSandbox();b.importJson(a.exportJson());assert.equal(b.list().length,1);assert.equal(b.wasTaken(m.id,"2026-11-12"),true);}],
  ["M12","Reject cross-owner backup; no notification capability",()=>{const a=createMedicationSandbox("qa-a");a.addFromCatalog("QA-CAT-A","permanent");const b=createMedicationSandbox("qa-b");assert.throws(()=>b.importJson(a.exportJson()));assert.ok(!Object.keys(a).some(k=>/remind|notif|alarm/i.test(k)));}]
];
let failed=0;
const results=[];
for(const [id,title,fn] of cases){try{fn();results.push({id,title,status:"PASS"});}catch(e){failed++;results.push({id,title,status:"FAIL",error:e.message});}}
const report={project:"PAE-04",mode:"MEDICATIONS_SYNTHETIC_OFFLINE",tests:cases.length,passed:cases.length-failed,failed,status:failed?"FAIL":"PASS",db_writes:0,vault_writes:0,network_calls:0,results};
process.stdout.write(JSON.stringify(report,null,2)+"\n");
if(failed)process.exitCode=1;
