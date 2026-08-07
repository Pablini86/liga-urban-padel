import {S, esc, getActiveLiga, pFN, calcGlobal, calcPtsJornada, toast} from './state.js';
import {populateSels} from './selects.js';

const PCSS='*{margin:0;padding:0;box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}body{background:#fff;color:#000;font-family:\'Montserrat\',sans-serif;}@media print{body{margin:0;}@page{margin:0;size:A4;}}';
const UG='#b8d400',UB='#0a0a0a';
const LOGO_URL=new URL('img/logo.png',location.href).href;
const logoImg=h=>`<img src="${LOGO_URL}" alt="Urban Padel Life" style="height:${h};filter:invert(1);object-fit:contain">`;
const slug=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');

export function renderImpPrev(){populateSels();const lid=getActiveLiga();const imjSel=document.getElementById('imj');if(lid&&imjSel){const js=S.jornadas.filter(j=>j.liga===lid).sort((a,b)=>a.num-b.num);const cur=imjSel.value;imjSel.innerHTML='<option value="">— selecciona —</option>'+js.map(j=>`<option value="${j.id}"${j.id===cur?' selected':''}>J${j.num} · ${j.fecha}</option>`).join('');}const jId=document.getElementById('imj')?.value;const infoEl=document.getElementById('imp-jornada-info');if(!infoEl)return;if(!jId){infoEl.innerHTML='';return;}const j=S.jornadas.find(x=>x.id===jId);if(!j){infoEl.innerHTML='';return;}const ms=S.partidos.filter(p=>p.jornadaId===jId);const grupos=[...new Set(ms.map(m=>m.grupo))].length;const fin=ms.filter(m=>m.finalizado&&m.gA!==null).length;infoEl.innerHTML=`<div style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:.7rem 1rem;display:flex;gap:1.5rem;flex-wrap:wrap;font-size:.8rem"><span><b>${j.fecha||'Sin fecha'}</b></span><span><b>${grupos}</b> grupos</span><span><b style="color:var(--accent3)">${fin}</b>/${ms.length} sets</span><span>${(j.turnos||[]).join(' · ')}</span></div>`;}
function getImpData(){const lid=getActiveLiga();const jId=document.getElementById('imj')?.value;if(!lid||!jId){toast('Selecciona liga y jornada',1);return null;}return{liga:S.ligas.find(l=>l.id===lid),jornada:S.jornadas.find(j=>j.id===jId),grupos:[...new Set(S.partidos.filter(p=>p.jornadaId===jId).map(m=>m.grupo))].sort((a,b)=>a-b),lid,jId};}
function openPrint(html){const w=window.open('','_blank');if(!w){toast('Permite ventanas emergentes',1);return;}w.document.write(html);w.document.close();setTimeout(()=>w.print(),700);}

export function printAnotaciones(){const d=getImpData();if(!d)return;const{liga,jornada,grupos,lid,jId}=d;const fname=`Anotaciones_Jornada${jornada.num}_${slug(liga.nombre)}`;let html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${fname}</title><style>${PCSS}.page{width:210mm;min-height:297mm;padding:0;page-break-after:always;position:relative;}.page:last-child{page-break-after:avoid;}.hdr{background:${UB};padding:5mm 15mm 4mm;display:flex;align-items:flex-end;justify-content:space-between;}.hl{font-family:'Bebas Neue',sans-serif;font-size:22pt;letter-spacing:5px;color:${UG};}.hl span{color:#fff;}.hm{text-align:right;font-size:8pt;color:#aaa;line-height:1.5;}.hm b{color:#fff;}.str{height:3mm;background:${UG};}.gp{display:flex;align-items:center;gap:4mm;margin:5mm 15mm 4mm;}.gn{background:${UG};color:${UB};font-family:'Bebas Neue',sans-serif;font-size:30pt;letter-spacing:2px;padding:1mm 5mm;border-radius:3px;line-height:1;}.sets{padding:0 15mm;}.sc{border:1.5px solid #222;border-radius:4px;margin-bottom:4mm;overflow:hidden;}.sh{background:${UB};color:${UG};padding:1.5mm 5mm;font-family:'Bebas Neue',sans-serif;font-size:12pt;letter-spacing:3px;}.st{display:grid;grid-template-columns:1fr 40mm 1fr;}.sta{padding:3mm 5mm;}.star{padding:3mm 5mm;text-align:right;}.p1{font-weight:700;font-size:10pt;}.p2{font-size:8.5pt;color:#555;margin-top:.5mm;}.ss{display:flex;align-items:center;justify-content:center;gap:3mm;border-left:1px solid #eee;border-right:1px solid #eee;}.bl{width:14mm;height:11mm;border-bottom:2.5px solid #000;display:inline-block;}.da{font-family:'Bebas Neue',sans-serif;font-size:14pt;color:#999;}.tot{margin:0 15mm;}.th{background:${UG};color:${UB};padding:1.5mm 5mm;font-family:'Bebas Neue',sans-serif;font-size:11pt;letter-spacing:2px;}.tg{display:grid;grid-template-columns:repeat(4,1fr);border:1.5px solid #222;border-top:none;}.tc{padding:2.5mm 3.5mm;border-right:1px solid #ddd;}.tc:last-child{border-right:none;}.tn{font-weight:700;font-size:9pt;border-bottom:1px solid #eee;padding-bottom:1.5mm;margin-bottom:1.5mm;}.tl{font-size:7.5pt;color:#666;margin-bottom:1.5mm;}.tb{width:100%;height:12mm;border-bottom:2.5px solid #000;display:block;margin-top:1.5mm;}.ft{position:absolute;bottom:5mm;left:0;right:0;text-align:center;font-size:7pt;color:#bbb;}</style></head><body>`;grupos.forEach(g=>{const gms=S.partidos.filter(m=>m.jornadaId===jId&&m.grupo===g).sort((a,b)=>a.set-b.set);if(!gms.length)return;const pids=[gms[0].a1,gms[0].a2,gms[0].b1,gms[0].b2];html+=`<div class="page"><div class="str"></div><div class="hdr"><div>${logoImg('9mm')}</div><div style="display:flex;align-items:center;gap:4mm">${(()=>{const pats=S.patrocinadores.filter(p=>p.logoUrl&&p.liga===lid);return pats.slice(0,3).map(p=>'<img src="'+p.logoUrl+'" style="height:8mm;max-width:24mm;object-fit:contain;opacity:.85">').join('');})()}</div>
          <div style="display:flex;align-items:center;gap:6mm">
            ${(()=>{const pats=S.patrocinadores.filter(p=>p.logoUrl&&(p.liga===lid));return pats.slice(0,3).map(p=>'<img src="'+p.logoUrl+'" style="height:10mm;max-width:28mm;object-fit:contain;opacity:.85">').join('');})()}
          </div><div class="hm">LIGA: <b>${esc(liga.nombre.toUpperCase())}</b><br>JORNADA <b>${jornada.num}</b> · <b>${jornada.fecha||''}</b><br>CANCHA: <b>${gms[0].cancha}</b> · <b>${gms[0].turno}</b></div></div><div class="gp"><div class="gn">GRUPO ${g}</div></div><div class="sets">${gms.map(m=>`<div class="sc"><div class="sh">SET ${m.set}</div><div class="st"><div class="sta"><div class="p1">${pFN(m.a1)}</div><div class="p2">${pFN(m.a2)}</div></div><div class="ss"><span class="bl"></span><span class="da">—</span><span class="bl"></span></div><div class="star"><div class="p1">${pFN(m.b1)}</div><div class="p2">${pFN(m.b2)}</div></div></div></div>`).join('')}</div><div class="tot"><div class="th">TOTAL · DIFERENCIAL</div><div class="tg">${pids.map(pid=>`<div class="tc"><div class="tn">${pFN(pid)}</div><div class="tl">G.G − G.P =</div><span class="tb"></span></div>`).join('')}</div></div><div class="ft" style="font-size:6pt">Urban Padel Life · ${esc(liga.nombre)}</div></div>`;});html+='</body></html>';openPrint(html);}
function invertImageData(img){const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const cx=c.getContext('2d');cx.drawImage(img,0,0);const id=cx.getImageData(0,0,c.width,c.height);const d=id.data;for(let i=0;i<d.length;i+=4){d[i]=255-d[i];d[i+1]=255-d[i+1];d[i+2]=255-d[i+2];}cx.putImageData(id,0,0);return c;}
function loadImg(src){return new Promise((res,rej)=>{const img=new Image();img.crossOrigin='anonymous';img.onload=()=>res(img);img.onerror=rej;img.src=src;});}
function fitFont(ctx,text,maxWidth,baseSize,family){let size=baseSize;ctx.font=`500 ${size}px ${family}`;while(size>10&&ctx.measureText(text).width>maxWidth){size-=1;ctx.font=`500 ${size}px ${family}`;}return size;}

// Imagen PNG estilo "grid" (HORA x cancha, con grupo+jugadores por celda) para
// compartir por WhatsApp — formato que un coach compartió y a los jugadores
// les gustó, así que se adoptó como alternativa a la lista vertical de printHorarios.
export async function exportGruposWhatsApp(){
  const d=getImpData();if(!d)return;
  const{liga,jornada,lid,jId}=d;
  // Se abre la pestaña ya (síncrono, dentro del click) para que el navegador
  // no la trate como popup no solicitado — si se abriera después de los
  // await de abajo, el gesto del click ya habría "expirado" y algunos
  // navegadores (sobre todo Safari/iOS) la bloquean en silencio.
  const win=window.open('','_blank');
  if(!win){toast('Permite ventanas emergentes',1);return;}
  win.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Generando…</title></head><body style="background:#0a0a0a;color:#999;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><p>Generando imagen…</p></body></html>');
  win.document.close();
  const ms=S.partidos.filter(p=>p.jornadaId===jId);
  if(!ms.length){win.close();toast('Esta jornada no tiene partidos generados',1);return;}
  const turnos=(jornada.turnos&&jornada.turnos.length)?jornada.turnos:[...new Set(ms.map(m=>m.turno))].sort();
  const canchasN=jornada.canchas||Math.max(6,...ms.map(m=>parseInt((m.cancha||'C0').replace('C',''))||0));
  const cells={};ms.forEach(m=>{if(m.turno&&m.cancha)cells[m.turno+'_'+m.cancha]=m.grupo;});
  const ps=S.players.filter(p=>p.liga===lid);
  const grid=turnos.map(turno=>{
    const cols=[];
    for(let c=1;c<=canchasN;c++){
      const g=cells[turno+'_C'+c];
      if(g==null){cols.push(null);continue;}
      const names=ps.filter(p=>p.grupo===g).sort((a,b)=>(a.orden||0)-(b.orden||0)).slice(0,4).map(p=>p.nombre);
      cols.push({grupo:g,names});
    }
    return{turno,cols};
  });

  const ICON_URL=new URL('img/favicon.png',location.href).href;
  let logo,icon;
  try{[logo,icon]=await Promise.all([loadImg(LOGO_URL),loadImg(ICON_URL)]);}
  catch(e){win.close();toast('No se pudieron cargar los logos',1);return;}
  logo=invertImageData(logo);icon=invertImageData(icon);

  const scale=2,W=1600,horaW=140;
  const colW=(W-horaW)/canchasN;
  const headH=118,subH=54,rowH=162,footH=44;
  const H=headH+subH+grid.length*rowH+footH;
  const canvas=document.createElement('canvas');
  canvas.width=W*scale;canvas.height=H*scale;
  const ctx=canvas.getContext('2d');
  ctx.scale(scale,scale);
  ctx.fillStyle=UB;ctx.fillRect(0,0,W,H);

  const iconH=50,iconW=iconH*(icon.width/icon.height);
  ctx.drawImage(icon,36,(headH-iconH)/2,iconW,iconH);
  const logoH=26,logoW=logoH*(logo.width/logo.height);
  ctx.drawImage(logo,36+iconW+12,(headH-logoH)/2-2,logoW,logoH);

  ctx.textBaseline='alphabetic';
  const cx0=W/2;
  ctx.font="38px 'Bebas Neue', sans-serif";
  const t1='LIGA ',t2='URBAN',t3=' PÁDEL';
  const w1=ctx.measureText(t1).width,w2=ctx.measureText(t2).width,w3=ctx.measureText(t3).width;
  let tx=cx0-(w1+w2+w3)/2;
  ctx.textAlign='left';
  ctx.fillStyle='#fff';ctx.fillText(t1,tx,headH/2+4);tx+=w1;
  ctx.fillStyle=UG;ctx.fillText(t2,tx,headH/2+4);tx+=w2;
  ctx.fillStyle='#fff';ctx.fillText(t3,tx,headH/2+4);
  ctx.textAlign='center';
  ctx.fillStyle='#999';ctx.font="13px 'Outfit', Arial, sans-serif";
  ctx.fillText('H O R A R I O S   Y   C A N C H A S',cx0,headH/2+26);

  ctx.textAlign='right';
  ctx.fillStyle=UG;ctx.font="22px 'Bebas Neue', sans-serif";
  ctx.fillText('JORNADA '+jornada.num,W-36,headH/2-2);
  ctx.fillStyle='#999';ctx.font="12px 'Outfit', Arial, sans-serif";
  ctx.fillText(jornada.fecha||'',W-36,headH/2+16);

  ctx.fillStyle=UG;ctx.fillRect(0,headH,W,subH);
  ctx.fillStyle=UB;ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font="bold 17px 'Outfit', Arial, sans-serif";
  ctx.fillText('HORA',horaW/2,headH+subH/2+1);
  for(let c=1;c<=canchasN;c++)ctx.fillText('C'+c,horaW+colW*(c-1)+colW/2,headH+subH/2+1);

  let y=headH+subH;
  grid.forEach(({turno,cols},ri)=>{
    ctx.fillStyle=ri%2===0?'#0d0d0d':'#111';ctx.fillRect(0,y,W,rowH);
    ctx.fillStyle=UG;ctx.font="bold 28px 'Bebas Neue', sans-serif";
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(turno,horaW/2,y+rowH/2);
    cols.forEach((cell,ci)=>{
      const cxCenter=horaW+colW*ci+colW/2;
      if(cell){
        const numH=32,lineH=22;
        const blockH=numH+cell.names.length*lineH;
        const topY=y+(rowH-blockH)/2;
        ctx.fillStyle=UG;ctx.font="bold 24px 'Bebas Neue', sans-serif";
        ctx.fillText(String(cell.grupo),cxCenter,topY+numH/2);
        ctx.fillStyle='#f2f2f2';
        cell.names.forEach((name,ni)=>{
          const size=fitFont(ctx,name,colW-18,15,"'Outfit', Arial, sans-serif");
          ctx.font=`500 ${size}px 'Outfit', Arial, sans-serif`;
          ctx.fillText(name,cxCenter,topY+numH+lineH*ni+lineH/2);
        });
      }else{
        ctx.fillStyle='#444';ctx.font="italic 14px 'Outfit', Arial, sans-serif";
        ctx.fillText('Libre',cxCenter,y+rowH/2);
      }
      if(ci>0){ctx.strokeStyle='rgba(184,212,0,.15)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(horaW+colW*ci,y);ctx.lineTo(horaW+colW*ci,y+rowH);ctx.stroke();}
    });
    ctx.strokeStyle='rgba(184,212,0,.15)';ctx.beginPath();ctx.moveTo(horaW,y);ctx.lineTo(horaW,y+rowH);ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,.06)';ctx.beginPath();ctx.moveTo(0,y+rowH);ctx.lineTo(W,y+rowH);ctx.stroke();
    y+=rowH;
  });

  ctx.fillStyle='#666';ctx.font="11px 'Outfit', Arial, sans-serif";
  ctx.textAlign='center';
  ctx.fillText('LOS HORARIOS PUEDEN VARIAR HASTA 10 MINUTOS.',W/2,H-footH/2+2);

  const fname=`Grupos_Jornada${jornada.num}_${slug(liga.nombre)}.png`;
  const dataUrl=canvas.toDataURL('image/png');
  win.document.open();
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${fname}</title><style>*{box-sizing:border-box}body{background:#0a0a0a;margin:0;min-height:100vh;display:flex;flex-direction:column;align-items:center;gap:14px;padding:16px;font-family:'Outfit',Arial,sans-serif}img{max-width:100%;height:auto;border-radius:8px;display:block}a.dl{background:${UG};color:${UB};font-weight:700;text-decoration:none;padding:10px 22px;border-radius:6px;font-size:14px}p{color:#888;font-size:12.5px;text-align:center;margin:0;max-width:480px}</style></head><body><img src="${dataUrl}" alt="${fname}"><a class="dl" href="${dataUrl}" download="${fname}">⬇ Descargar imagen</a><p>En el celular: mantén presionada la imagen y elige "Guardar imagen" o "Compartir" para mandarla directo por WhatsApp.</p></body></html>`);
  win.document.close();
}

export function printHorarios(){const d=getImpData();if(!d)return;const{liga,jornada,grupos,lid,jId}=d;const ps=S.players.filter(p=>p.liga===lid);const gData=grupos.map(g=>{const gms=S.partidos.filter(m=>m.jornadaId===jId&&m.grupo===g);if(!gms.length)return null;return{g,cancha:g,turno:gms[0].turno,players:ps.filter(p=>p.grupo===g).sort((a,b)=>a.orden-b.orden)};}).filter(Boolean);let rows='';gData.forEach(({g,cancha,turno,players})=>{players.slice(0,4).forEach((p,i)=>{rows+=`<tr class="${i===0?'first':''}"><td class="pn">${esc(p.nombre)}</td><td class="ca">${i===0?cancha:''}</td><td class="ho">${i===0?turno:''}</td></tr>`;});rows+=`<tr class="sp"><td colspan="3"></td></tr>`;});const fname=`Horarios_Jornada${jornada.num}_${slug(liga.nombre)}`;let html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${fname}</title><style>${PCSS}.page{width:210mm;min-height:297mm;padding:0;position:relative;}.hdr{background:${UB};padding:5mm 15mm 4.5mm;display:flex;align-items:flex-end;justify-content:space-between;}.hl{font-family:'Bebas Neue',sans-serif;font-size:22pt;letter-spacing:5px;color:${UG};}.hl span{color:#fff;}.hs{font-size:7pt;color:#555;margin-top:1.5mm;}.hr{text-align:right;}.hrl{font-size:8pt;color:#777;text-transform:uppercase;}.hrj{font-family:'Bebas Neue',sans-serif;font-size:28pt;letter-spacing:3px;color:#fff;line-height:1;}.hrf{font-size:8.5pt;color:${UG};}.str{height:3mm;background:${UG};}.ct{padding:4mm 15mm;}.ch{display:flex;border-bottom:2px solid #000;padding-bottom:1.5mm;margin-bottom:1mm;}.cn{flex:1;font-size:7pt;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#666;}.cc{width:22mm;text-align:center;font-size:7pt;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#666;}.chor{width:28mm;text-align:right;font-size:7pt;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#666;}table{width:100%;border-collapse:collapse;}td{font-size:9.5pt;vertical-align:middle;padding:.5mm 0;}td.pn{padding-right:4mm;}td.ca{width:22mm;text-align:center;font-family:'Bebas Neue',sans-serif;font-size:13pt;}td.ho{width:28mm;text-align:right;font-size:9pt;font-weight:600;}tr.first td.pn{font-weight:700;}tr.sp td{height:3mm;border-bottom:1px solid #ebebeb;}.ft{position:absolute;bottom:5mm;left:0;right:0;text-align:center;font-size:7pt;color:#bbb;}</style></head><body><div class="page"><div class="hdr"><div>${logoImg('9mm')}<div class="hs">Av. de las Rosas 171 · Col. Chapalita · Guadalajara</div></div><div class="hr"><div class="hrl">${esc(liga.nombre)}</div><div class="hrj">JORNADA ${jornada.num}</div><div class="hrf">${esc(jornada.fecha||'')} · ${esc((jornada.turnos||[]).join(' · '))}</div></div></div><div class="str"></div><div class="ct"><div class="ch"><span class="cn">NOMBRE</span><span class="cc">CANCHA</span><span class="chor">HORARIO</span></div><table><tbody>${rows}</tbody></table></div><div class="ft">Urban Padel Life · ${esc(liga.nombre)} · Jornada ${jornada.num}</div></div></body></html>`;openPrint(html);}
export function printTabla(){const lid=getActiveLiga();if(!lid){toast('Selecciona liga',1);return;}const liga=S.ligas.find(l=>l.id===lid);const st=calcGlobal(lid);const js=S.jornadas.filter(j=>j.liga===lid).sort((a,b)=>a.num-b.num);const fname=`Tabla_${slug(liga?.nombre)}`;let html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${fname}</title><style>${PCSS}.page{padding:0;min-height:297mm;}.hdr{background:${UB};padding:5mm 15mm 4mm;display:flex;align-items:flex-end;justify-content:space-between;}.hl{font-family:'Bebas Neue',sans-serif;font-size:20pt;letter-spacing:4px;color:${UG};}.hl span{color:#fff;}.hr{text-align:right;font-size:9pt;color:#aaa;}.hr b{color:#fff;}.str{height:3mm;background:${UG};}.ct{padding:5mm 12mm;}.st{font-family:'Bebas Neue',sans-serif;font-size:14pt;letter-spacing:3px;border-bottom:2px solid ${UG};padding-bottom:1.5mm;margin-bottom:4mm;}table{width:100%;border-collapse:collapse;font-size:8pt;}thead tr{background:${UB};}th{color:#fff;padding:2mm;text-align:left;font-size:7pt;letter-spacing:1.5px;text-transform:uppercase;white-space:nowrap;}th.acc{color:${UG};}tbody tr{border-bottom:.5px solid #e8e8e8;}tbody tr:nth-child(even){background:#f7f7f7;}tbody tr:first-child td{background:#fffce6;}td{padding:1.8mm 2mm;white-space:nowrap;}.rk{font-family:'Bebas Neue',sans-serif;font-size:12pt;color:#bbb;}.pv{font-weight:700;color:#1a7a1a;}.nv{font-weight:700;color:#cc2200;}.tot{font-family:'Bebas Neue',sans-serif;font-size:13pt;}.gr{display:inline-block;background:${UB};color:${UG};font-family:'Bebas Neue',sans-serif;font-size:9pt;padding:0 3px;border-radius:2px;}.ft{margin-top:4mm;text-align:center;font-size:7pt;color:#bbb;}</style></head><body><div class="page"><div class="hdr"><div>${logoImg('8mm')}</div><div class="hr">TABLA GENERAL<br><b>${esc(liga?.nombre||'')}</b></div></div><div class="str"></div><div class="ct"><div class="st">TABLA GENERAL — ${esc(liga?.nombre?.toUpperCase()||'')}</div><table><thead><tr><th>#</th><th>NOMBRE</th><th>GR</th>${js.map(j=>`<th>J${j.num}</th>`).join('')}<th class="acc">TOTAL</th></tr></thead><tbody>${st.map((s,i)=>{const jPts=js.map(j=>{const pts=calcPtsJornada(s.player.id,lid,j.id);if(pts===null)return'<td style="color:#ccc">—</td>';return`<td class="${pts>0?'pv':pts<0?'nv':''}">${pts>0?'+':''}${pts}</td>`;});while(jPts.length<(liga?.nj||6))jPts.push('<td style="color:#ddd">—</td>');return`<tr><td><span class="rk">${i+1}</span></td><td style="font-weight:600">${esc(s.player.nombre)}</td><td><span class="gr">G${s.player.grupo}</span></td>${jPts.join('')}<td><span class="tot ${s.total>=0?'pv':'nv'}">${s.total>0?'+':''}${s.total}</span></td></tr>`;}).join('')}</tbody></table><div class="ft">Urban Padel Life · ${esc(liga?.nombre||'')} · ${new Date().toLocaleDateString('es-MX')}</div></div></div></body></html>`;openPrint(html);}
