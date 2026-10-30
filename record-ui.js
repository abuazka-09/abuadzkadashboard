/* Edit/delete controls use stable source IDs, never a client name as identity. */
var ClientDirectory=(function(){
 function build(s){
  const entries=new Map(),masters=new Map(s.masters.map(m=>[m.id,m])),orders=new Map(s.orders.map(o=>[o.id,o]));
  const add=(key,r,ref)=>{if(!r.name)return;const prior=entries.get(key)||{key,name:r.name,phone:'',email:'',address:'',category:'Leads',sources:[],numbers:[],party:'',lead:''};for(const k of ['phone','email','address'])if(!prior[k]&&r[k])prior[k]=r[k];if(r.category==='Klien')prior.category='Klien';if(!prior.sources.includes(r.source))prior.sources.push(r.source);if(r.number&&!prior.numbers.includes(r.number))prior.numbers.push(r.number);Object.assign(prior,ref);entries.set(key,prior);};
  for(const m of s.masters){if(m.kind!=='party'||m.active===false||m.data?.directoryHidden===true||!['Klien','Pelanggan','Leads','Lead'].includes(m.data?.type))continue;add('party:'+m.id,{name:m.name,...m.data,category:['Lead','Leads'].includes(m.data.type)?'Leads':'Klien',source:'Master Dokumen'},{party:m.id});}
  for(const l of s.leads||[]){const order=orders.get(l.order_id),partyId=l.party||order?.party,m=masters.get(partyId);if(l.active===false||l.directoryHidden===true||m?.active===false||m?.data?.directoryHidden===true)continue;add(m?'party:'+m.id:'lead:'+l.id,{name:m?.name||l.name,phone:l.phone||m?.data?.phone,email:l.email||m?.data?.email,address:l.address||m?.data?.address,category:['Pemesanan','Dikerjakan','Selesai'].includes(l.stage)?'Klien':'Leads',source:'CRM & Leads',number:order?.number},m?{party:m.id}:{lead:l.id});}
  for(const o of s.orders||[]){const m=masters.get(o.party);if(o.archived||o.directoryHidden===true||m?.active===false||m?.data?.directoryHidden===true)continue;add('party:'+o.party,{name:m?.name||o.clientName||o.name,phone:o.phone||m?.data?.phone,email:o.email||m?.data?.email,address:o.address||m?.data?.address,category:'Klien',source:'Transaksi & Pemesanan',number:o.number},{party:o.party});}
  return [...entries.values()].sort((a,b)=>a.name.localeCompare(b.name,'id-ID'));
 }
 return {build};
})();
if(typeof module!=='undefined')module.exports=ClientDirectory;
if(typeof document!=='undefined')(function(){
 const button=(attr,value,label,del=false,enabled=true)=>`<button type="button" class="table-btn ${del?'delete':''}" ${attr}="${safe(value)}" ${enabled?'':'disabled'}>${label}</button>`;
 const pair=(type,id,enabled=admin())=>`<div class="table-actions">${button('data-record-edit',type+':'+id,'Edit',false,enabled)}${button('data-record-delete',type+':'+id,'Hapus',true,enabled)}</div>`;
 const growthAllowed=(kind,r)=>{if(['target','decision'].includes(kind))return currentUser.role==='Owner';if(currentUser.role==='Marketing')return kind==='campaign';return currentUser.role!=='Staf'||r.actor===currentUser.id;};
 const sourceTable={campaign:'campaigns',lead:'leads',target:'targets',decision:'decisions'};
 growthEditButton=function(kind,r){return `<div class="table-actions">${button('data-growth',kind,'Edit',false,growthAllowed(kind,r)).replace('>Edit',' data-record="'+safe(r.id)+'">Edit')}${button('data-record-delete',kind+':'+r.id,'Hapus',true,growthAllowed(kind,r)&&currentUser.role!=='Staf')}</div>`;};
 const originalMarketing=marketingPage,originalCrm=crmPage,originalOrders=orderPage;
 function filteredPage(fn,keys){const saved=serverState;try{serverState={...saved};for(const k of keys)serverState[k]=saved[k].filter(r=>r.active!==false&&!r.archived);return fn();}finally{serverState=saved;}}
 marketingPage=function(){let html=filteredPage(originalMarketing,['masters','campaigns','targets']);return html.replace(/<button class="table-btn" data-edit-master="([^"]+)">Ubah<\/button>/g,(_,rid)=>masterPair(rid));};
 crmPage=function(){return filteredPage(originalCrm,['leads']);};
 orderPage=function(){return filteredPage(originalOrders,['orders']).replace(/<button class="table-btn" data-order="([^"]+)">Ubah<\/button>/g,(_,rid)=>`<div class="table-actions">${button('data-order',rid,'Edit')}${button('data-record-delete','order:'+rid,'Hapus',true,admin())}</div>`);};
 function masterPair(rid){return `<div class="table-actions">${button('data-edit-master',rid,'Edit',false,admin())}${button('data-delete-master',rid,'Hapus',true,admin())}</div>`;}
 clients=function(){
  const rows=ClientDirectory.build(serverState).map(x=>[safe(x.category),safe(x.name),safe(x.phone||'—'),safe(x.email||'—'),safe(x.address||'—'),safe(x.sources.join(', ')),safe(x.numbers.join(', ')||'—'),pair('client',x.key)]);
  const investor=form('party','Mitra & Investor',field('name','Nama orang / perusahaan')+field('type','Kategori hubungan','','Mitra',['Mitra','Investor'])+field('phone','Telepon / WhatsApp','tel','',null,false)+field('email','Email','email','',null,false)+field('address','Alamat','text','',null,false)+field('note','Catatan','text','',null,false),'Simpan Mitra / Investor');
  return investor+panel('Database Klien & Leads · data dari Transaksi dan CRM',table(['Kategori','Nama klien / lead','Telepon / WhatsApp','Email','Alamat','Sumber data','No. Transaksi','Aksi'],rows))+panel('Mitra & Investor tersimpan',table(['Nama','Kategori','Telepon / WhatsApp','Email','Alamat','Aksi'],activeList('party').filter(m=>['Mitra','Investor'].includes(m.data?.type)).map(m=>[safe(m.name),safe(m.data.type),safe(m.data.phone||'—'),safe(m.data.email||'—'),safe(m.data.address||'—'),masterPair(m.id)])));
 };
 const originalLedger=ledgerTable;
 ledgerTable=function(rows=filteredLedger()){return originalLedger(rows).replace(/<button class="table-btn delete" data-reverse="([^"]+)">Hapus<\/button>/g,(_,rid)=>`<div class="table-actions">${button('data-record-edit','transaction:'+rid,'Edit',false,admin())}${button('data-reverse',rid,'Hapus',true,admin())}</div>`);};
 const originalBills=billsTable;
 billsTable=function(type){return originalBills(type).replace(/<button class="table-btn" data-bill-detail="([^"]+)">Riwayat \/ Invoice<\/button>/g,(html,rid)=>html+(admin()&&!serverState.bills.find(b=>b.id===rid)?.cancelled?button('data-record-edit','bill:'+rid,'Edit'):''));};
 const originalDocs=masterDocs;
 masterDocs=function(){return originalDocs().replace('<th>Unduh</th>','<th>Unduh / Aksi</th>').replace(/(<a class="table-btn" href="#" data-attachment="([^"]+)">Unduh bukti<\/a>)/g,(_,html,rid)=>html+pair('attachment',rid));};
 const originalSettings=settingsPage;
 settingsPage=function(){return originalSettings().replace(/<button class="table-btn" data-user="([^"]+)">Kelola<\/button>/g,(_,rid)=>button('data-user',rid,'Edit')+button('data-record-delete','user:'+rid,'Hapus',true,currentUser.role==='Owner'&&rid!==currentUser.id))+(serverState.profile.logo&&currentUser.role==='Owner'?panel('Logo usaha',button('data-record-delete','logo:profile','Hapus logo',true)):'');};
 const originalProfilePhoto=profilePhotoForm;
 profilePhotoForm=function(){originalProfilePhoto();if(currentUser.photo)$('#detailBody').insertAdjacentHTML('beforeend',button('data-record-delete','photo:self','Hapus foto',true));};
 function openRecordForm(action,title,body,entity,extra={}){
  dialog(form(action,title,body,'Simpan perubahan',admin()).replace('data-new=','data-record-form='));
  const f=$('#detailBody form');f.dataset.entityId=entity;f.dataset.revision=serverState.revision;f._recordExtra=extra;
 }
 function editRecord(type,rid){
  if(!admin())return;
  if(type==='client'){
   const c=ClientDirectory.build(serverState).find(x=>x.key===rid);if(!c)throw new Error('Data klien telah berubah. Segarkan daftar.');
   openRecordForm('client_edit','Edit klien / lead',field('name','Nama','text',c.name)+field('phone','Telepon / WhatsApp','tel',c.phone,null,false)+field('email','Email','email',c.email,null,false)+field('address','Alamat','text',c.address,null,false)+'<p class="full muted">Kontak diperbarui pada sumber terkait: '+safe(c.sources.join(', '))+'.</p>',rid,{party:c.party,lead:c.lead});return;
  }
  if(type==='bill'){
   const b=serverState.bills.find(x=>x.id===rid);openRecordForm('bill_edit','Edit tagihan '+safe(b.number),field('number','No. Invoice / Faktur','text',b.number)+field('party','Pihak','',b.party,[...selects('party'),...(!byId(b.party)?.active?[[b.party,nameOf(b.party)]]:[])])+field('date','Tanggal','date',b.date)+field('due','Jatuh tempo','date',b.due)+field('amount','Nilai tagihan (Rp)','number',b.amount)+field('note','Catatan','text',b.note,null,false),rid);return;
  }
  if(type==='attachment'){
   const a=serverState.attachments.find(x=>x.id===rid);openRecordForm('attachment_edit','Edit lampiran',field('name','Nama file','text',a.name)+field('entity','Nomor / ID dokumen','text',a.entity),rid);return;
  }
  if(type==='transaction'){
   const t=serverState.transactions.find(x=>x.id===rid),p=serverState.payments.find(x=>x.tx===rid),ls=serverState.ledger.filter(l=>l.tx===rid),primary=ls.find(l=>l.delta<0)||ls[0];
   let body=field('date','Tanggal','date',t.date)+field('account','Akun kas / bank','',primary?.account||'',list('account').map(x=>[x.id,nameOf(x.id)]));
   if(p){body+=field('method','Metode pembayaran','',p.method,['DP','Cash','Transfer Bank','Qris','E-Wallet','Cicilan','Pelunasan']);for(const a of serverState.allocations.filter(x=>x.payment===p.id)){const b=serverState.bills.find(x=>x.id===a.bill);body+=field('allocation_'+a.bill,'Alokasi '+(b?.number||a.bill)+' (Rp)','number',a.amount).replace('name="allocation_', 'data-record-allocation="'+safe(a.bill)+'" name="allocation_');}}
   else body+=field('kind','Jenis transaksi','',t.kind,Object.entries(labels).filter(([k])=>!['receipt','debt_payment','reversal'].includes(k)))+field('party','Pihak','',t.party||'',selects('party','Tanpa pihak'),false)+field('category','Kategori','',t.category||'',selects('category','Tanpa kategori'),false)+field('amount','Nominal (Rp)','number',t.amount)+field('target','Akun tujuan (transfer)','',ls.find(l=>l.delta>0&&l.account!==primary?.account)?.account||'',selects('account','Tidak berlaku'),false);
   body+=field('note','Catatan','text',t.note,null,false)+'<p class="full muted">Simpan memperbarui transaksi, alokasi dan saldo terkait dalam satu proses. Riwayat koreksi tetap dicatat.</p>';
   openRecordForm('transaction_edit','Edit '+safe(t.number),body,rid);return;
  }
 }
 async function deleteRecord(type,rid){
  if(sourceTable[type]){const r=serverState[sourceTable[type]].find(x=>x.id===rid);if(!r||!growthAllowed(type,r)||currentUser.role==='Staf')return;if(confirm('Hapus '+(r.name||r.title||r.month)+' dari daftar aktif? Riwayat tetap disimpan.')){const result=await submitCommand(type,{...r,active:false});if(result)$('#detailDialog').close();}return;}
  if(type==='photo'){if(confirm('Hapus foto profil saya?')){await request('/api/command',{key:id(),action:'profile_photo',data:{photo:''}});await refresh(true);$('#detailDialog').close();}return;}
  if(!admin())return;
  if(type==='logo'){if(currentUser.role==='Owner'&&confirm('Hapus logo usaha?'))await submitCommand('settings',{logo:''});return;}
  if(type==='user'){const u=serverState.users.find(x=>x.id===rid);if(currentUser.role==='Owner'&&u.id!==currentUser.id&&confirm('Nonaktifkan akun '+u.name+'? Akun tidak dapat login, riwayat tetap disimpan.'))await submitCommand('user',{...u,active:false});return;}
  const revision=serverState.revision;
  if(type==='client'){
   const c=ClientDirectory.build(serverState).find(x=>x.key===rid);if(c&&confirm('Hapus '+c.name+' dari Data Base Klien? Riwayat pesanan, CRM, tagihan, dan saldo tetap dipertahankan.'))await submitCommand('client_hide',{revision,party:c.party,lead:c.lead});return;
  }
  if(type==='order'){const o=serverState.orders.find(x=>x.id===rid);if(confirm('Hapus pesanan '+o.number+' dari daftar aktif? Pesanan dibatalkan, nilai omzet diperbarui, tautan CRM dilepas. Kas dan tagihan tidak berubah.'))await submitCommand('order_archive',{id:rid,revision});return;}
  if(type==='attachment'&&confirm('Hapus lampiran ini dari server? Riwayat unggahan tetap dicatat.'))await submitCommand('attachment_delete',{id:rid,revision});
 }
 document.addEventListener('click',async e=>{const b=e.target.closest('[data-record-edit],[data-record-delete]');if(!b||b.disabled)return;e.preventDefault();if(b.dataset.busy)return;b.dataset.busy='1';b.disabled=true;try{const raw=b.dataset.recordEdit||b.dataset.recordDelete,pos=raw.indexOf(':'),type=raw.slice(0,pos),rid=raw.slice(pos+1);if(b.hasAttribute('data-record-edit'))editRecord(type,rid);else await deleteRecord(type,rid);}catch(err){showToast(err.message);}finally{delete b.dataset.busy;b.disabled=false;}});
 document.addEventListener('submit',async e=>{const f=e.target;if(!f.matches('[data-record-form]'))return;e.preventDefault();if(f.dataset.busy)return;f.dataset.busy='1';try{const values=Object.fromEntries(new FormData(f)),inputs=[...f.querySelectorAll('[data-record-allocation]')];if(inputs.length){values.allocations=inputs.filter(el=>Number(el.value)>0).map(el=>({bill:el.dataset.recordAllocation,amount:el.value}));for(const key of Object.keys(values))if(key.startsWith('allocation_'))delete values[key];}
  const result=await submitCommand(f.dataset.recordForm,{id:f.dataset.entityId,revision:Number(f.dataset.revision),...f._recordExtra,values},f);if(result)$('#detailDialog').close();
 }catch(err){showToast(err.message);}finally{delete f.dataset.busy;}});
})();
