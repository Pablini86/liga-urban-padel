import {S, getActiveLiga} from './state.js';

export function populateSels(){
  const lid=getActiveLiga();
  const ligaNameEl=document.getElementById('nav-liga-active');
  if(ligaNameEl){const liga=S.ligas.find(l=>l.id===lid);ligaNameEl.textContent=liga?.nombre||'';}
  const rjEl=document.getElementById('rj');
  if(rjEl){const js=S.jornadas.filter(j=>j.liga===lid&&S.partidos.some(p=>p.jornadaId===j.id)).sort((a,b)=>b.num-a.num);const cur=rjEl.value;rjEl.innerHTML='<option value="">— selecciona —</option>'+js.map(j=>'<option value="'+j.id+'"'+(j.id===cur?' selected':'')+'>J'+j.num+' · '+(j.fecha||'')+'</option>').join('');if(!rjEl.value&&js.length)rjEl.value=js[js.length-1].id;}
  const imjEl=document.getElementById('imj');
  if(imjEl){const js=S.jornadas.filter(j=>j.liga===lid).sort((a,b)=>a.num-b.num);const cur=imjEl.value;imjEl.innerHTML='<option value="">— selecciona —</option>'+js.map(j=>'<option value="'+j.id+'"'+(j.id===cur?' selected':'')+'>J'+j.num+' · '+j.fecha+'</option>').join('');if(!imjEl.value&&js.length)imjEl.value=js[0].id;}
  const prjEl=document.getElementById('prj');
  if(prjEl){const js=S.jornadas.filter(j=>j.liga===lid).sort((a,b)=>b.num-a.num);const cur=prjEl.value;prjEl.innerHTML='<option value="">— selecciona —</option>'+js.map(j=>'<option value="'+j.id+'"'+(j.id===cur?' selected':'')+'>J'+j.num+' · '+(j.fecha||'')+'</option>').join('');if(!prjEl.value&&js.length)prjEl.value=js[0].id;}
}

export function updateJN(){
  const lid=getActiveLiga();if(!lid)return;
  const jnEl=document.getElementById('jn');if(!jnEl)return;
  const js=S.jornadas.filter(j=>j.liga===lid).sort((a,b)=>a.num-b.num);
  const nextNum=(js.length?Math.max(...js.map(j=>j.num)):0)+1;
  const cur=jnEl.tagName==='SELECT'?jnEl.value:parseInt(jnEl.value);
  if(jnEl.tagName==='SELECT'){
    // Ofrece siempre la siguiente jornada aunque todavía no exista en Firestore —
    // se crea sola al guardar horarios (ver saveHorarios en jornada-schedule.js).
    const nums=js.map(j=>j.num);
    if(!nums.includes(nextNum))nums.push(nextNum);
    jnEl.innerHTML='<option value="">— selecciona —</option>'+
      nums.map(n=>{
        const j=js.find(x=>x.num===n);
        return '<option value="'+n+'"'+(n==cur?' selected':'')+'>J'+n+(j?.fecha?' · '+j.fecha:(j?'':' (nueva)'))+'</option>';
      }).join('');
  } else {jnEl.value=nextNum;}
}
