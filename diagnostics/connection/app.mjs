import {probeCloudflare,HEALTH_URL} from './check.mjs';
const $=id=>document.getElementById(id);
let busy=false;
const button=$('probe');
const state=$('probe-state');
const description=$('probe-description');
const caption=$('probe-caption');
const manual=$('direct-health');
manual.href=HEALTH_URL;
async function test(){
  if(busy)return;
  busy=true;
  button.disabled=true;
  button.textContent='Проверяем связь…';
  state.className='status checking';
  state.textContent='Проверка выполняется';
  description.textContent='Safari отправляет только пустой технический запрос {}. Данные здоровья не используются.';
  caption.textContent='';
  try {
    const result=await probeCloudflare();
    state.className='status '+result.kind;
    state.textContent=result.title;
    description.textContent=result.detail;
    caption.textContent=result.kind==='ok'?
      'PASS — соединение подтверждено именно с этого устройства. Приём логов остаётся выключенным.':
      'Это не отменяет успешные серверные тесты GitHub Actions. Проверяется именно доступность с текущего iPhone.';
  }catch{
    state.className='status warning';
    state.textContent='Проверка не завершена';
    description.textContent='Техническая ошибка локальной страницы. Никакие медицинские данные не отправлялись.';
    caption.textContent='';
  }finally{
    busy=false;
    button.disabled=false;
    button.textContent='Проверить ещё раз';
  }
}
button.addEventListener('click',test);
