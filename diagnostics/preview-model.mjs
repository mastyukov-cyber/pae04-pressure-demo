/**
 * Three-mode, NETWORK-FREE sample preview model for PAE-04.
 * Values below are synthetic, fixed fixtures, never read from iPhone or user records.
 * The preview demonstrates fields; consent in the preview is NOT a real production opt-in.
 */
import {validateBasicError} from './basic-contract.mjs';
import {validateSyntheticTelemetry} from './contract.mjs';

export const MODES=Object.freeze(['off','basic','verbose']);
export const RETENTION_NOTICE='Cloudflare Analytics Engine: до трёх месяцев хранения. Отказ отключает будущие события, но не удаляет уже принятые. Cloudflare как поставщик сети может обрабатывать IP и другие сетевые метаданные.';
const BASE=Object.freeze({
  project:'PAE-04',schema_version:1,mode:'basic_errors',
  app_version:'0.3.0-test',event_type:'client_error',
  component_code:'network',error_code:'timeout',
});
const VERBOSE=Object.freeze({
  project:'PAE-04',schema_version:1,qa_mode:'verbose_synthetic',
  synthetic_only:true,
  qa_install_id:'e8b0fae1-1b36-4b9b-9a0b-6f41d1afcb10',
  session_id:'4149439c-1385-49e0-bf45-2329c5962ff3',
  event_id:'67eaa404-76a5-4ce0-9952-7a1a62754eab',
  app_version:'0.3.0-test',
  event_type:'connectivity',action_code:'network_probe',
  result:'fail',component_code:'network',error_code:'timeout',
  device_class:'iphone',browser_engine:'safari',ios_major:26,
  pwa_mode:'standalone',viewport_bucket:'medium',
  connection_failure_code:'timeout',duration_ms:3000,
});
export function previewFor(mode){
  if(!MODES.includes(mode))throw new TypeError('invalid_mode');
  if(mode==='off')return null;
  return mode==='basic'?validateBasicError({...BASE}):
    validateSyntheticTelemetry({...VERBOSE});
}
export function canDemoEnable({mode,consent,syntheticConfirm}){
  if(!MODES.includes(mode))return false;
  if(mode==='off'||consent!==true)return false;
  return mode==='basic'||syntheticConfirm===true;
}
export function modeLabel(mode){
  if(mode==='off')return 'Выключена';
  if(mode==='basic')return 'Базовая — только коды ошибок';
  if(mode==='verbose')return 'Расширенная QA — только синтетические данные';
  throw new TypeError('invalid_mode');
}
