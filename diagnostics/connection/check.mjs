/**
 * PAE-04 browser connectivity probe. No consent or telemetry capture.
 * Only explicit user action sends exactly '{}' (INVALID synthetic event) to
 * an already deployed, disabled BASIC endpoint. No health data or identifiers.
 */
export const WORKER='https://pae04-qa-technical-receiver.mastyukov.workers.dev';
export const PROBE_URL=WORKER+'/v1/basic-error';
export const HEALTH_URL=WORKER+'/health';
export const PROBE_BODY='{}';
export const PROBE_TIMEOUT_MS=8000;

export function classifyStatus(status){
  if(status===503)return Object.freeze({
    kind:'ok',title:'Cloudflare доступен',
    detail:'Получен HTTP 503. Это правильный ответ: Worker работает, но приём диагностических событий выключен.'
  });
  if(status===400)return Object.freeze({
    kind:'warning',title:'Cloudflare отвечает, проверьте настройки',
    detail:'Получен HTTP 400. Некорректное событие отклонено, но режим приёма мог быть включён. Проверьте настройки.'
  });
  if(status===204)return Object.freeze({
    kind:'danger',title:'Неожиданное принятие запроса',
    detail:'Получен HTTP 204 вместо отказа. Остановите дальнейшие тесты и проверьте настройки Worker.'
  });
  if(status===403)return Object.freeze({
    kind:'warning',title:'Доступ ограничен',
    detail:'Получен HTTP 403. Возможно, не совпадает разрешённый адрес сайта.'
  });
  if(status===429)return Object.freeze({
    kind:'warning',title:'Сработало ограничение запросов',
    detail:'Получен HTTP 429. Повторять проверку многократно не нужно.'
  });
  return Object.freeze({
    kind:'warning',title:'Сервер ответил необычно',
    detail:'Получен HTTP '+String(status)+'. Нужно сверить доступность и конфигурацию Worker.'
  });
}
export async function probeCloudflare({
  transport=globalThis.fetch,
  endpoint=PROBE_URL,
  timeoutMs=PROBE_TIMEOUT_MS,
}={}){
  if(endpoint!==PROBE_URL)throw Error('PAE04_PROBE_ENDPOINT_FORBIDDEN');
  if(typeof transport!=='function')throw Error('PAE04_TRANSPORT_UNAVAILABLE');
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    const response=await transport(endpoint,{
      method:'POST',
      mode:'cors',
      credentials:'omit',
      headers:{'Content-Type':'application/json'},
      cache:'no-store',
      referrerPolicy:'no-referrer',
      redirect:'error',
      body:PROBE_BODY,
      signal:controller.signal,
    });
    if(!Number.isSafeInteger(response?.status))return Object.freeze({
      kind:'warning',title:'Некорректный ответ сети',
      detail:'Проверка не получила корректный HTTP-код.'
    });
    return classifyStatus(response.status);
  }catch(error){
    if(controller.signal.aborted)return Object.freeze({
      kind:'warning',title:'Превышено время ожидания',
      detail:'Ответ не получен. Возможна блокировка Cloudflare, сбой DNS или соединения.'
    });
    // Do not transmit or display raw exception: it can contain the URL or
    // device-specific networking information.
    return Object.freeze({
      kind:'warning',title:'Нет ответа Cloudflare из браузера',
      detail:'GitHub Pages работает, но Safari не получил разрешённый сетевой ответ от Worker. Возможны блокировка, DNS, TLS или CORS; причину уточним отдельно.'
    });
  }finally{
    clearTimeout(timeout);
  }
}
