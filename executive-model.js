/* Pure read model. No demo values; missing inputs stay null. */
var ExecutiveModel=(function(){
const sources=['Google Ads','Meta Ads','TikTok Ads','Website','Referral','Offline','Lainnya'];
const stages=['Lead','Prospek','Penawaran','Pemesanan','Dikerjakan','Selesai','Tidak lanjut'];
function build(s,month,today){
 const active=rows=>(rows||[]).filter(x=>x.active!==false),period=d=>String(d||'').slice(0,7)===month;
 const tx=new Map(s.transactions.map(t=>[t.id,t]));const kind=t=>t.reversal_of?tx.get(t.reversal_of)?.kind:t.kind;
 const ledger=s.ledger.map(l=>({...l,t:tx.get(l.tx)})).filter(l=>l.t),ls=ledger.filter(l=>period(l.t.date));
 const sum=k=>ls.filter(l=>kind(l.t)===k).reduce((n,l)=>n+l.delta,0);
 const validOrders=s.orders.filter(o=>o.status!=='Dibatalkan'),orders=validOrders.filter(o=>period(o.date));
 const leads=active(s.leads).filter(l=>period(l.date)),campaigns=active(s.campaigns).filter(c=>c.start.slice(0,7)<=month&&c.end.slice(0,7)>=month);
 const target=active(s.targets).find(t=>t.month===month);const hasFinance=ls.length>0,hasIncome=ls.some(l=>kind(l.t)==='income'),hasExpense=ls.some(l=>kind(l.t)==='expense');
 const cashLines=ls.filter(l=>['income','receipt'].includes(kind(l.t)));
 const debt=s.bills.filter(b=>!b.cancelled&&b.type==='hutang'),receivable=s.bills.filter(b=>!b.cancelled&&b.type==='piutang');
 const lastDay=new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5)),0)).toISOString().slice(0,10);
 const balanceLines=ledger.filter(l=>l.t.date<=lastDay),flow=ls.filter(l=>!['opening','transfer'].includes(kind(l.t)));
 const kpis={target:target?target.amount:null,omzet:orders.length?orders.reduce((n,o)=>n+o.amount,0):null,cashIn:cashLines.length?cashLines.reduce((n,l)=>n+l.delta,0):null,balance:balanceLines.length?balanceLines.reduce((n,l)=>n+l.delta,0):null,income:hasIncome?sum('income'):null,expense:hasExpense?-sum('expense'):null,cashflow:hasFinance?flow.reduce((n,l)=>n+l.delta,0):null,debt:debt.length?debt.reduce((n,b)=>n+b.remaining,0):null,receivable:receivable.length?receivable.reduce((n,b)=>n+b.remaining,0):null};
 const days=new Date(Number(month.slice(0,4)),Number(month.slice(5)),0).getDate();
 const timeline=Array.from({length:days},(_,i)=>({date:month+'-'+String(i+1).padStart(2,'0'),omzet:0,cashIn:0,income:0,expense:0}));
 for(const o of orders)timeline[Number(o.date.slice(8))-1].omzet+=o.amount;
 for(const l of ls){const row=timeline[Number(l.t.date.slice(8))-1],k=kind(l.t);if(k==='income')row.income+=l.delta;if(k==='expense')row.expense-=l.delta;if(['income','receipt'].includes(k))row.cashIn+=l.delta;}
 const sourceCounts=sources.map(source=>({name:source,count:leads.filter(l=>l.source===source).length}));
 const stageCounts=stages.map(stage=>({name:stage,count:leads.filter(l=>l.stage===stage).length}));
 const alerts=[];const alert=(title,detail,division,priority,date,refType,ref)=>alerts.push({title,detail,division,priority,date,refType,ref});
 for(const b of s.bills.filter(b=>!b.cancelled&&b.remaining>0&&b.due<=today))alert('Tagihan jatuh tempo',b.number+' · sisa Rp '+b.remaining.toLocaleString('id-ID'),'Keuangan','Tinggi',b.due,'bill',b.id);
 for(const l of active(s.leads).filter(l=>l.next_followup&&l.next_followup<=today&&!['Selesai','Tidak lanjut'].includes(l.stage)))alert('Follow-up klien',l.name+' · '+l.stage,'CRM','Sedang',l.next_followup,'lead',l.id);
 for(const c of campaigns.filter(c=>c.budget!==null&&c.spend!==null&&c.spend>c.budget))alert('Belanja kampanye melebihi anggaran',c.name,'Marketing','Tinggi',c.end,'campaign',c.id);
 for(const r of s.legacy.stock.filter(r=>Number(r.qty)<=Number(r.min)))alert('Stock menipis',r.item+' · '+r.qty+' '+r.unit,'Operasional','Sedang',today,'stock',r.id);
 for(const r of s.legacy.inventory.filter(r=>['Rusak','Perawatan'].includes(r.condition)))alert('Inventaris perlu perhatian',r.item+' · '+r.condition,'Operasional','Sedang',today,'inventory',r.id);
 for(const l of active(s.leads).filter(l=>l.order_id&&s.orders.some(o=>o.id===l.order_id&&o.status==='Dibatalkan')))alert('Pesanan terkait dibatalkan',l.name,'CRM','Tinggi',today,'lead',l.id);
 const priority={Tinggi:0,Sedang:1,Rendah:2};alerts.sort((a,b)=>priority[a.priority]-priority[b.priority]||a.date.localeCompare(b.date));
 const spend=campaigns.some(c=>c.spend!==null)?campaigns.reduce((n,c)=>n+(c.spend||0),0):null;
 const campaignOrders=new Set(active(s.leads).filter(l=>campaigns.some(c=>c.id===l.campaign)&&l.order_id).map(l=>l.order_id));const attributed=orders.filter(o=>campaignOrders.has(o.id));
 const reconciliation=campaigns.map(c=>{const crm=active(s.leads).filter(l=>l.campaign===c.id).length;return {name:c.name,reported:c.reported_leads,crm,gap:c.reported_leads===null?null:c.reported_leads-crm};});
 return {month,kpis,orders,leads,campaigns,target,sourceCounts,stageCounts,timeline,hasTimeline:orders.length+ls.length>0,alerts,spend,reconciliation,achievement:kpis.target>0&&kpis.omzet!==null?kpis.omzet/kpis.target*100:null,decisions:active(s.decisions).filter(d=>d.status!=='Selesai'),period,kind,ledger:ls};
}
return {build,sources,stages};
})();
