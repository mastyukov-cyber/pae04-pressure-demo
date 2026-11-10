/* PAE-04: pure, network-free allowlist for opt-in synthetic QA telemetry.
 * No background sending, no reads of patient records, no use of timers.
 * Client and future isolated Worker must BOTH validate this contract.
 */
export const SCHEMA_VERSION = 1;
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA = /^[0-9a-f]{7,40}$/i;
const VERSION = /^[0-9]{1,3}(?:\.[0-9]{1,3}){1,3}(?:-test)?$/;
const LIST = {
  event_type: ['lifecycle','navigation','pressure','medication','intake','storage','backup',
               'service_worker','connectivity','qa_check','client_error','performance'],
  result: ['start','pass','fail','blocked','skipped','completed','unknown'],
  component_code: ['app','overview','pressure','medications','intakes','backup','import',
                   'storage','sw','network','qa','telemetry'],
  screen_code: ['overview','pressure','meds','backup','qa','none'],
  action_code: ['app_boot','resume','background','open_screen','pressure_save',
                'pressure_validate','medicine_create','intake_mark','intake_correct',
                'intake_cancel','db_open','db_write','db_read','backup_export','backup_verify',
                'backup_import','backup_preview','sw_register','sw_activate','sw_update',
                'offline_open','online_resume','qa_scenario','error_report','render','network_probe'],
  error_code: ['none','unknown','timeout','offline','network_blocked','csp_blocked',
               'idb_unavailable','idb_blocked','idb_quota','storage_conflict','invalid_input',
               'backup_hash_mismatch','backup_schema','backup_conflict','sw_register_failed',
               'sw_activate_failed','cache_miss','version_mismatch','operation_failed'],
  device_class: ['iphone','ipad','mac','unknown'],
  browser_engine: ['safari','webkit','other','unknown'],
  pwa_mode: ['standalone','browser','unknown'],
  viewport_bucket: ['narrow','medium','wide','unknown'],
  locale_bucket: ['ru','en','other','unknown'],
  navigator_online: [true,false],
  endpoint_reachable: [true,false],
  vpn_state: ['tester_declared_off','tester_declared_on','unknown'],
  offline_scenario: ['airplane','manual_offline','none','unknown'],
  connection_failure_code: ['none','dns','timeout','tls','network_unavailable','blocked','unknown'],
  db_state: ['ok','opening','blocked','quota','error','unknown'],
  sw_state: ['unregistered','installing','waiting','active','error','unknown'],
  cache_state: ['hit','miss','stale','updated','error','unknown'],
  screen_transition: ['foreground','background','reload','reopen','unknown'],
  store_code: ['pressures','medications','intakes','intakeEvents','none'],
  transaction_code: ['readonly','readwrite','none'],
  feature_type: ['regular','course','asNeeded','none'],
  file_size_bucket: ['0','1-100KB','100KB-1MB','1-5MB','gt5MB','unknown'],
  record_count_bucket: ['0','1','2-10','11-100','gt100','unknown'],
  import_new_count_bucket: ['0','1','2-10','11-100','gt100','unknown'],
  duplicate_bucket: ['0','1','2-10','11-100','gt100','unknown'],
  conflict_bucket: ['0','1','2-10','11-100','gt100','unknown'],
  audit_event_count_bucket: ['0','1','2-10','11-100','gt100','unknown'],
  storage_estimate_bucket: ['0','lt1MB','1-10MB','10-100MB','gt100MB','unknown'],
  quota_bucket: ['lt10MB','10-100MB','100MB-1GB','gt1GB','unknown'],
  validation_error_code: ['none','missing_required','out_of_range','invalid_order',
                           'invalid_date','invalid_type','duplicate','unknown'],
  severity: ['debug','info','warn','error','fatal'],
  test_region_declared: ['russia','other','unknown'],
  release_channel: ['test'],
};
const ENUMS = Object.fromEntries(Object.entries(LIST).map(([k,v])=>[k,new Set(v)]));
const NUMERIC = Object.freeze({
  step_no: [0,100],
  duration_ms: [0,600000],
  navigation_duration_ms: [0,600000],
  render_duration_ms: [0,600000],
  ios_major: [15,40],
  db_schema_version: [0,99],
  backup_schema_version: [1,99],
});
const BOOLS = new Set(['hash_validation_pass','db_open_success','import_idempotent',
                        'update_preserved_data','offline_open_success']);
const STRING_FIELDS = new Set(['qa_install_id','session_id','event_id','app_version','build_sha','sw_cache_version','scenario_id']);
const ALL = new Set([...Object.keys(ENUMS),...Object.keys(NUMERIC),...BOOLS,...STRING_FIELDS,
                     'project','schema_version','qa_mode','synthetic_only']);
const REQUIRED = ['project','schema_version','qa_mode','synthetic_only',
                  'qa_install_id','session_id','event_id','app_version','event_type','result'];
const fail = (reason) => { throw new TypeError('PAE04_TELEMETRY_REJECTED:'+reason); };
export function validateSyntheticTelemetry(event) {
  if(event===null||typeof event!=='object'||Array.isArray(event)||
     Object.getPrototypeOf(event)!==Object.prototype) fail('not_plain_object');
  for(const key of Object.keys(event)) {
    if(!ALL.has(key)) fail('unexpected_field');
    const value=event[key];
    if(value===null||typeof value==='object'||Array.isArray(value)) fail('nested_or_null');
    if(ENUMS[key]) {
      if(!ENUMS[key].has(value)) fail('invalid_enum');
    } else if(NUMERIC[key]) {
      const [min,max]=NUMERIC[key];
      if(!Number.isInteger(value)||value<min||value>max) fail('numeric_range');
    } else if(BOOLS.has(key)) {
      if(typeof value!=='boolean') fail('invalid_boolean');
    } else if(key==='project') {
      if(value!=='PAE-04') fail('wrong_project');
    } else if(key==='schema_version') {
      if(value!==SCHEMA_VERSION) fail('schema_version');
    } else if(key==='qa_mode') {
      if(value!=='verbose_synthetic') fail('qa_mode');
    } else if(key==='synthetic_only') {
      if(value!==true) fail('not_synthetic');
    } else if(['qa_install_id','session_id','event_id'].includes(key)) {
      if(typeof value!=='string'||!UUID_V4.test(value)) fail('invalid_uuid');
    } else if(key==='app_version') {
      if(typeof value!=='string'||!VERSION.test(value)) fail('app_version');
    } else if(key==='build_sha') {
      if(typeof value!=='string'||!SHA.test(value)) fail('build_sha');
    } else if(key==='sw_cache_version') {
      if(typeof value!=='string'||!/^pae04-[a-z0-9.-]{1,28}$/.test(value)) fail('sw_cache_version');
    } else if(key==='scenario_id') {
      if(typeof value!=='string'||!/^IOS-(?:0[1-9]|1[0-4])$/.test(value)) fail('scenario_id');
    } else fail('unexpected_field');
  }
  for(const k of REQUIRED) if(!Object.hasOwn(event,k)) fail('missing_field');
  const wire=JSON.stringify(event);
  if(new TextEncoder().encode(wire).length>4096) fail('too_large');
  return Object.freeze({...event});
}
/** Only call after the tester gave consent. This method NEVER transmits anything. */
export function serializeSyntheticTelemetry(event) {
  return JSON.stringify(validateSyntheticTelemetry(event));
}
