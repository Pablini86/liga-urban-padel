// ═══ CONFIG ═══
export const ADMIN_EMAILS = ['pablolc20111@gmail.com','contacto@urbanpadellife.com'];
const FB_CONFIG = {
  apiKey:"AIzaSyChTCdBwFtsf7rTI4sKvTAGhb83VxdmIDs",
  authDomain:"liga-urban-padel.firebaseapp.com",
  projectId:"liga-urban-padel",
  storageBucket:"liga-urban-padel.firebasestorage.app",
  messagingSenderId:"144742696459",
  appId:"1:144742696459:web:25779ca29faaea2561e90e"
};

// ═══ INIT FIREBASE ═══
firebase.initializeApp(FB_CONFIG);
export const db = firebase.firestore();
export const auth = firebase.auth();
export const storage = firebase.storage();

// ═══ STATE ═══
export const S={ligas:[],players:[],partidos:[],jornadas:[],promociones:[],restricciones:[],patrocinadores:[],activeLiga:null};
let _id=Date.now();
export const uid=()=>(++_id).toString(36);

// ═══ HELPERS ═══
const _escMap={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>_escMap[c]);
export const safeUrl=u=>(u&&/^https?:\/\//i.test(u))?esc(u):'#';
export function getActiveLiga(){return S.activeLiga||'';}
export function pShort(nombre){if(!nombre)return'?';const p=nombre.trim().split(/\s+/);return esc(p.length>=2?p[0]+' '+p[1]:p[0]);}
export const pById=id=>S.players.find(x=>x.id===id);
export const pFN=id=>{const p=pById(id);return p?esc(p.nombre):'?';};
export const pN=id=>{const p=pById(id);return p?pShort(p.nombre):'?'};
export function calcPtsJornada(pid,lid,jid){
  const ms=S.partidos.filter(m=>m.jornadaId===jid&&m.finalizado&&[m.a1,m.a2,m.b1,m.b2].includes(pid));
  if(!ms.length)return null;
  const p=pById(pid);
  if(p&&p['ausente_j_'+jid])return -6;
  if(p&&p['direct_j_'+jid]!==undefined)return p['direct_j_'+jid];
  if(ms.some(m=>m.ausente&&[m.a1,m.a2,m.b1,m.b2].includes(pid)))return -6;
  let gf=0,gc=0;ms.forEach(m=>{const enA=[m.a1,m.a2].includes(pid);gf+=enA?m.gA:m.gB;gc+=enA?m.gB:m.gA;});
  return gf-gc;
}
export function calcTotal(pid,lid){return S.jornadas.filter(j=>j.liga===lid).reduce((acc,j)=>{const p=calcPtsJornada(pid,lid,j.id);return p!==null?acc+p:acc;},0);}
export function calcGlobal(lid){return S.players.filter(p=>p.liga===lid).map(p=>({player:p,total:calcTotal(p.id,lid)})).sort((a,b)=>b.total-a.total);}
export function calcGroupPos(lid,g,jid){
  // Use grupo snapshot for the jornada if available, otherwise use current grupo
  const jornada=S.jornadas.find(j=>j.id===jid);
  const jnum=jornada?.num||1;
  const hasPartidos=S.partidos.some(p=>p.jornadaId===jid);
  const grupoKey=hasPartidos?('grupo_j'+jnum):null;
  const mapped=S.players.filter(p=>p.liga===lid&&((grupoKey?p[grupoKey]:null)||p.grupo)===g).map(p=>({
    player:p,
    pts:calcPtsJornada(p.id,lid,jid)||0,
    total:calcTotal(p.id,lid),
    ausente:!!(p['ausente_j_'+jid])
  }));
  // Suplentes always go to bottom, ordered among themselves by total
  const normales=mapped.filter(x=>!x.ausente).sort((a,b)=>b.pts-a.pts||b.total-a.total);
  const suplentes=mapped.filter(x=>x.ausente).sort((a,b)=>b.total-a.total);
  return [...normales,...suplentes];
}

// ═══ FIREBASE WRITE ═══
export async function fsSet(col,id,data){await db.collection(col).doc(id).set(data);}
export async function fsDel(col,id){await db.collection(col).doc(id).delete();}
export async function fsBatch(ops){const b=db.batch();ops.forEach(({op,col,id,data})=>{if(op==='set')b.set(db.collection(col).doc(id),data);if(op==='del')b.delete(db.collection(col).doc(id));});await b.commit();}

// ═══ TOAST ═══
let _tt;
export function toast(msg,err){const t=document.getElementById('toast');t.textContent=msg;t.className=err?'err show':'show';clearTimeout(_tt);_tt=setTimeout(()=>t.className='',2300);}
