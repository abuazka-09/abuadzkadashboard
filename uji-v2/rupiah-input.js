/* Format only currency fields. Payloads remain plain integer Rupiah. */
var RupiahInput=(function(){
const names=new Set(['amount','value','hpp','sellPrice','budget','spend','potential']);
const raw=v=>String(v??'').replace(/\./g,'');
const format=v=>{const s=raw(v);return /^\d+$/.test(s)?s.replace(/^0+(?=\d)/,'').replace(/\B(?=(\d{3})+(?!\d))/g,'.'):s;};
function decorate(){document.querySelectorAll('input[type=number]').forEach(el=>{if(!names.has(el.name)&&!el.hasAttribute('data-allocation'))return;el.dataset.rupiah='1';el.dataset.maxRupiah=el.getAttribute('max')||'';el.type='text';el.inputMode='numeric';el.pattern='[0-9]+(\\.[0-9]{3})*';el.removeAttribute('step');el.value=format(el.value);});}
function validate(el){const n=raw(el.value);el.setCustomValidity(n&&!/^\d+$/.test(n)?'Masukkan Rupiah bulat, contoh 1.000.000.':el.dataset.maxRupiah&&Number(n)>Number(el.dataset.maxRupiah)?'Nominal melebihi sisa tagihan.':'');}
document.addEventListener('input',e=>{const el=e.target;if(!el.matches('[data-rupiah]'))return;const before=el.value.slice(0,el.selectionStart).replace(/\D/g,'').length;el.value=format(el.value);validate(el);let pos=0,count=0;while(pos<el.value.length&&count<before){if(/\d/.test(el.value[pos]))count++;pos++;}el.setSelectionRange(pos,pos);},true);
document.addEventListener('submit',e=>{const form=e.target;if(!(form instanceof HTMLFormElement))return;const inputs=[...form.querySelectorAll('[data-rupiah]')];for(const el of inputs){validate(el);if(!el.checkValidity()){e.preventDefault();e.stopImmediatePropagation();el.reportValidity();return;}}inputs.forEach(el=>el.value=raw(el.value));queueMicrotask(()=>inputs.forEach(el=>el.value=format(el.value)));},true);
document.addEventListener('formdata',e=>{e.target.querySelectorAll('[data-rupiah][name]').forEach(el=>e.formData.set(el.name,raw(el.value)));},true);
let pending=false;new MutationObserver(()=>{if(pending)return;pending=true;queueMicrotask(()=>{pending=false;decorate();});}).observe(document.body,{childList:true,subtree:true});decorate();
return {raw,format,decorate};
})();
