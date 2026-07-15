import {S, esc, pShort, pFirst, calcGlobal} from './state.js';
import {renderPatrocinadoresLiga} from './patrocinadores.js';

export function renderLiga(lid){
  const liga=S.ligas.find(l=>l.id===lid);
  if(!liga)return;
  // Header
  const parts=liga.nombre.split(' ').map(esc);
  document.getElementById('liga-title').innerHTML=parts.slice(0,-1).join(' ')+' <em>'+parts.slice(-1)+'</em>';
  document.getElementById('liga-meta').textContent=(liga.dia||'')+(liga.cat?' · '+liga.cat:'')+(liga.inicio?' · '+liga.inicio:'');
  // Show liga patrocinadores in header
  const patEl=document.getElementById('liga-patrocinadores');
  if(patEl)patEl.innerHTML=renderPatrocinadoresLiga(lid);
  renderInicio(lid);
}

// INICIO - TOP 10
export function renderInicio(lid){
  const el=document.getElementById('top10-list');
  if(!el)return;
  const st=calcGlobal(lid);
  const liga=S.ligas.find(l=>l.id===lid);
  const js=S.jornadas.filter(j=>j.liga===lid).sort((a,b)=>a.num-b.num);

  // Last completed jornada
  const lastJ=[...js].reverse().find(j=>{
    const ms=S.partidos.filter(p=>p.jornadaId===j.id);
    return ms.length>0&&ms.some(m=>m.finalizado&&m.gA!==null);
  });

  // Next jornada (no results yet)
  const nextJ=js.find(j=>{
    const ms=S.partidos.filter(p=>p.jornadaId===j.id);
    return ms.length>0&&!ms.some(m=>m.finalizado&&m.gA!==null);
  });

  let html='';

  // PRÓXIMA JORNADA
  if(nextJ){
    const grupos=[...new Set(S.partidos.filter(p=>p.jornadaId===nextJ.id).map(m=>m.grupo))].sort((a,b)=>a-b);
    const byTurno={};
    S.partidos.filter(p=>p.jornadaId===nextJ.id).forEach(m=>{
      if(!byTurno[m.turno])byTurno[m.turno]=[];
      if(!byTurno[m.turno].find(x=>x.grupo===m.grupo))byTurno[m.turno].push({grupo:m.grupo,cancha:m.cancha});
    });
    const turnos=Object.keys(byTurno).sort();
    html+=`<div style="background:var(--card);border:1px solid rgba(212,240,0,.2);border-radius:12px;padding:1rem 1.1rem;margin-bottom:1rem">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.85rem">
        <div>
          <div class="cl">📅 Próxima Jornada</div>
          <div style="font-family:'Bebas Neue',sans-serif;font-size:1.4rem;letter-spacing:2px">JORNADA ${nextJ.num}</div>
          <div style="font-size:.75rem;color:var(--muted2)">${esc(nextJ.fecha||'Fecha por confirmar')}</div>
        </div>
        <button onclick="showHorarioJornada('${lid}','${nextJ.id}')" style="padding:.4rem .85rem;border-radius:7px;border:1px solid var(--accent);background:transparent;color:var(--accent);font-family:'Outfit',sans-serif;font-size:.75rem;font-weight:600;cursor:pointer">Ver horarios →</button>
      </div>
      ${turnos.map(t=>`<div style="margin-bottom:.55rem">
        <div style="font-size:.65rem;font-weight:700;letter-spacing:1.5px;color:var(--muted);text-transform:uppercase;margin-bottom:.3rem">${t}</div>
        <div style="display:flex;flex-wrap:wrap;gap:.3rem">
          ${byTurno[t].sort((a,b)=>a.grupo-b.grupo).map(({grupo,cancha})=>{
            const gps=S.players.filter(p=>p.liga===lid&&p.grupo===grupo).slice(0,4);
            return`<div style="background:var(--card2);border:1px solid var(--border);border-radius:7px;padding:.35rem .6rem;font-size:.72rem">
              <span style="font-family:'Bebas Neue',sans-serif;color:var(--accent);font-size:.9rem">G${grupo}</span>
              <span style="color:var(--muted2);margin:0 .3rem">·</span>
              <span style="color:var(--muted2)">${cancha}</span>
              <div style="font-size:.65rem;color:var(--muted2);margin-top:.1rem">${gps.map(p=>pShort(p.nombre)).join(' · ')}</div>
            </div>`;
          }).join('')}
        </div>
      </div>`).join('')}
    </div>`;
  }

  // ÚLTIMOS RESULTADOS
  if(lastJ){
    const ms=S.partidos.filter(p=>p.jornadaId===lastJ.id&&p.finalizado&&p.gA!==null);
    const grupos=[...new Set(ms.map(m=>m.grupo))].sort((a,b)=>a-b).slice(0,3);
    html+=`<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1rem 1.1rem;margin-bottom:1rem">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.75rem">
        <div>
          <div class="cl">⚡ Últimos Resultados</div>
          <div style="font-family:'Bebas Neue',sans-serif;font-size:1.4rem;letter-spacing:2px">JORNADA ${lastJ.num}</div>
          <div style="font-size:.75rem;color:var(--muted2)">${esc(lastJ.fecha||'')}</div>
        </div>
        <button onclick="showLT('jornadas',document.querySelectorAll('.lt')[2])" style="padding:.4rem .85rem;border-radius:7px;border:1px solid var(--border2);background:transparent;color:var(--muted2);font-family:'Outfit',sans-serif;font-size:.75rem;cursor:pointer">Ver todos →</button>
      </div>
      ${grupos.map(g=>{
        const gms=ms.filter(m=>m.grupo===g).slice(0,1);
        if(!gms.length)return'';
        const m=gms[0];const wA=m.gA>m.gB;const wB=m.gB>m.gA;
        return`<div style="background:var(--card2);border:1px solid var(--border);border-radius:8px;padding:.55rem .75rem;margin-bottom:.35rem;font-size:.78rem">
          <div style="font-size:.6rem;font-weight:700;letter-spacing:1.5px;color:var(--muted);text-transform:uppercase;margin-bottom:.3rem">G${g} · Set ${m.set}</div>
          <div style="display:flex;align-items:center;gap:.5rem">
            <span style="flex:1;text-align:right;font-weight:${wA?700:400}">${pFirst(m.a1)} / ${pFirst(m.a2)}</span>
            <span style="font-family:'Bebas Neue',sans-serif;font-size:1.1rem;background:${wA?'var(--accent)':'var(--card)'};color:${wA?'var(--black)':'var(--text)'};padding:0 5px;border-radius:3px">${m.gA}</span>
            <span style="color:var(--muted)">—</span>
            <span style="font-family:'Bebas Neue',sans-serif;font-size:1.1rem;background:${wB?'var(--accent)':'var(--card)'};color:${wB?'var(--black)':'var(--text)'};padding:0 5px;border-radius:3px">${m.gB}</span>
            <span style="flex:1;font-weight:${wB?700:400}">${pFirst(m.b1)} / ${pFirst(m.b2)}</span>
          </div>
        </div>`;
      }).join('')}
    </div>`;
  }

  // TOP 5
  html+=`<div class="cl" style="margin-bottom:.65rem">🏆 Top 5 Tabla General</div>`;
  html+=st.slice(0,5).map((s,i)=>{
    const rankColor=i===0?'var(--gold)':i===1?'var(--silver)':i===2?'var(--bronze)':'var(--muted)';
    const rowClass=i===0?'gold':i===1?'silver':i===2?'bronze':'';
    const pct=Math.max(8,Math.min(100,((s.total+30)/60)*100));
    return`<div class="top10-row ${rowClass}" onclick="openPlayer('${s.player.id}','${lid}')">
      <span class="top10-rank" style="color:${rankColor}">${i+1}</span>
      <div class="top10-av">${esc(s.player.nombre[0])}</div>
      <div class="top10-info">
        <div class="top10-name">${esc(s.player.nombre)}</div>
        <div style="display:flex;align-items:center;gap:.5rem;margin-top:.3rem">
          <div class="bar-container"><div class="bar-fill" style="width:${pct}%"></div></div>
          <span style="font-size:.65rem;color:var(--muted2)">G${s.player.grupo}</span>
        </div>
      </div>
      <span class="top10-pts" style="color:${s.total>=0?'var(--accent)':'var(--accent2)'}">${s.total>0?'+':''}${s.total}</span>
    </div>`;
  }).join('');

  html+=`<div style="text-align:center;margin-top:.85rem">
    <button onclick="showLT('tabla',document.querySelectorAll('.lt')[1])" style="padding:.45rem 1.2rem;border-radius:7px;border:1px solid var(--border2);background:transparent;color:var(--muted2);font-family:'Outfit',sans-serif;font-size:.78rem;cursor:pointer">
      Ver tabla completa (${st.length} jugadores) →
    </button>
  </div>`;

  el.innerHTML=html;
}
