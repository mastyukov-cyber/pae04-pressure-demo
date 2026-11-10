/**
 * PAE-04 BASIC diagnostics: the least informative usable event.
 * Strict shape: project, version, mode, event category, fixed error and component.
 * NO install ID, session, email, URL, IP, medical content, action or timestamp.
 * Sending is opt-in; this pure validator never accesses the network.
 */
const VERSION=/^\d{1,3}\.\d{1,3}\.\d{1,3}(?:-test)?$/;
const FIELDS=Object.freeze([
  'project','schema_version','mode','app_version','event_type',
  'component_code','error_code',
]);
const FIELDS_SET=new Set(FIELDS);
const ERRORS=new Set([
  'unknown','timeout','offline','network_blocked','csp_blocked',
  'idb_unavailable','idb_blocked','idb_quota','storage_conflict',
  'sw_register_failed','sw_activate_failed','cache_miss',
  'version_mismatch','operation_failed',
]);
const COMPONENTS=new Set(['app','overview','pressure','medications','intakes',
  'backup','import','storage','sw','network','qa','telemetry']);
export const BASIC_EVENT_FIELDS=FIELDS;
export const BASIC_EVENT_MAX_BYTES=300;
export function validateBasicError(input){
  if(!input||typeof input!=='object'||Array.isArray(input)||
    Object.getPrototypeOf(input)!==Object.prototype)
    throw new TypeError('PAE04_BASIC_REJECTED:object');
  const keys=Object.keys(input);
  if(keys.length!==FIELDS.length||keys.some(k=>!FIELDS_SET.has(k)))
    throw new TypeError('PAE04_BASIC_REJECTED:fields');
  if(input.project!=='PAE-04'||input.schema_version!==1||
    input.mode!=='basic_errors'||input.event_type!=='client_error'||
    typeof input.app_version!=='string'||!VERSION.test(input.app_version)||
    !ERRORS.has(input.error_code)||!COMPONENTS.has(input.component_code))
    throw new TypeError('PAE04_BASIC_REJECTED:values');
  const result=Object.fromEntries(FIELDS.map(k=>[k,input[k]]));
  if(new TextEncoder().encode(JSON.stringify(result)).length>BASIC_EVENT_MAX_BYTES)
    throw new TypeError('PAE04_BASIC_REJECTED:size');
  return Object.freeze(result);
}
