import {previewFor,canDemoEnable,modeLabel} from '../preview-model.mjs';
const $=id=>document.getElementById(id);
const modes=[...document.querySelectorAll('input[name="mode"]')];
let active='off';
function selected(){return modes.find(x=>x.checked)?.value||'off';}
function state(text,css=''){
  $('result').textContent=text;
  $('result').className=css;
}
function update(){
  const mode=selected();
  $('consentPanel').hidden=mode==='off';
  $('syntheticRow').hidden=mode!=='verbose';
  $('preview').textContent=mode==='off'?'Ничего не отправляется':
    JSON.stringify(previewFor(mode),null,2);
  $('apply').disabled=!canDemoEnable({
    mode,consent:$('consent').checked,syntheticConfirm:$('synthetic').checked
  });
  if(mode!==active) state('Режим не активирован. Это демонстрация без отправки данных.');
}
for(const r of modes)r.addEventListener('change',()=>{
  $('consent').checked=false;
  $('synthetic').checked=false;
  update();
});
$('consent').addEventListener('change',update);
$('synthetic').addEventListener('change',update);
$('apply').addEventListener('click',()=>{
  const mode=selected();
  if(!canDemoEnable({mode,consent:$('consent').checked,
    syntheticConfirm:$('synthetic').checked})){
    state('Для выбранного режима требуется подтверждение.','error');return;
  }
  active=mode;
  state('В демонстрации выбран режим: '+modeLabel(mode)+
    '. Отправка в Cloudflare отсутствует.','success');
});
$('disable').addEventListener('click',()=>{
  $('off').checked=true;$('consent').checked=false;$('synthetic').checked=false;
  active='off';update();
  state('Диагностика выключена. Ничего не отправляется.','success');
});
update();
