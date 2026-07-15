firebase.initializeApp({
  apiKey:"AIzaSyChTCdBwFtsf7rTI4sKvTAGhb83VxdmIDs",
  authDomain:"liga-urban-padel.firebaseapp.com",
  projectId:"liga-urban-padel",
  storageBucket:"liga-urban-padel.firebasestorage.app",
  messagingSenderId:"144742696459",
  appId:"1:144742696459:web:25779ca29faaea2561e90e"
});
export const db = firebase.firestore();

// STATE
export const S = {ligas:[],players:[],partidos:[],jornadas:[],patrocinadores:[]};

// HELPERS
const _escMap={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>_escMap[c]);
export const safeUrl=u=>(u&&/^https?:\/\//i.test(u))?esc(u):'#';
export const pById=id=>S.players.find(x=>x.id===id);
export const pName=id=>{const p=pById(id);return p?esc(p.nombre):'?';};
export function pShort(n){if(!n)return'?';const w=n.trim().split(/ +/);return esc(w.length>=2?w[0]+' '+w[1]:w[0]);}
export const pFirst=id=>{const p=pById(id);return p?pShort(p.nombre):'?';};

export function calcPts(pid,lid,jid){
  const ms=S.partidos.filter(m=>m.jornadaId===jid&&m.finalizado&&[m.a1,m.a2,m.b1,m.b2].includes(pid));
  if(!ms.length)return null;
  const p=pById(pid);
  if(p&&p['ausente_j_'+jid])return -6;
  if(p&&p['direct_j_'+jid]!==undefined)return p['direct_j_'+jid];
  let gf=0,gc=0;
  ms.forEach(m=>{const enA=[m.a1,m.a2].includes(pid);gf+=enA?m.gA:m.gB;gc+=enA?m.gB:m.gA;});
  return gf-gc;
}
export function calcTotal(pid,lid){
  return S.jornadas.filter(j=>j.liga===lid).reduce((acc,j)=>{const p=calcPts(pid,lid,j.id);return p!==null?acc+p:acc;},0);
}
export function calcGlobal(lid){
  return S.players.filter(p=>p.liga===lid)
    .map(p=>({player:p,total:calcTotal(p.id,lid)}))
    .sort((a,b)=>b.total-a.total);
}
