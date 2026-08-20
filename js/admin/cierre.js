import {S, esc, calcGlobal, toast} from './state.js';
import {openM, closeM} from './modal.js';
import {UG, UB, LOGO_URL, ICON_URL, slug, loadImg, invertImageData, fitFont} from './imprimir.js';
import {exportGruposWhatsApp} from './imprimir.js';
import {goToImprimir} from './jornada-schedule.js';
import {cerrarLiga, entrarLiga} from './ligas.js';

// ═══ TERMINAR LIGA — imágenes de cierre para WhatsApp ═══
// Reusa los helpers de imprimir.js (mismo estilo visual que "Exportar Grupos
// WhatsApp") para que las 3 imágenes de cierre se vean como el resto de la
// marca. No publica nada solo: cada botón sólo genera+descarga una imagen,
// Pablo decide después si la sube como Banner Hero o la manda por WhatsApp.
const WA_HELP='En el celular: mantén presionada la imagen y elige "Guardar imagen" o "Compartir" para mandarla directo por WhatsApp.';

function roundRect(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
}

function openPreviewWindow(){
  const win=window.open('','_blank');
  if(!win){toast('Permite ventanas emergentes',1);return null;}
  win.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Generando…</title></head><body style="background:#0a0a0a;color:#999;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><p>Generando imagen…</p></body></html>');
  win.document.close();
  return win;
}

function showResult(win,canvas,fname){
  const dataUrl=canvas.toDataURL('image/png');
  win.document.open();
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${fname}</title><style>*{box-sizing:border-box}body{background:#0a0a0a;margin:0;min-height:100vh;display:flex;flex-direction:column;align-items:center;gap:14px;padding:16px;font-family:'Outfit',Arial,sans-serif}img{max-width:100%;height:auto;border-radius:8px;display:block}a.dl{background:${UG};color:${UB};font-weight:700;text-decoration:none;padding:10px 22px;border-radius:6px;font-size:14px}p{color:#888;font-size:12.5px;text-align:center;margin:0;max-width:480px}</style></head><body><img src="${dataUrl}" alt="${fname}"><a class="dl" href="${dataUrl}" download="${fname}">⬇ Descargar imagen</a><p>${WA_HELP}</p></body></html>`);
  win.document.close();
}

// Sin esto, si "Terminar Liga" es de las primeras cosas que se hacen tras
// entrar al admin, el canvas puede dibujarse antes de que el navegador haya
// bajado Bebas Neue/Outfit (nadie más las "usó" todavía en la página) y cae
// silenciosamente a la fuente del sistema. document.fonts.load() la baja a
// propósito antes de dibujar.
async function preloadFonts(){
  const specs=["400px 'Bebas Neue'","400 16px 'Outfit'","500 16px 'Outfit'","600 16px 'Outfit'","700 16px 'Outfit'"];
  try{await Promise.all(specs.map(s=>document.fonts.load(s)));}catch(e){/* si falla, se dibuja con la fuente de respaldo del sistema */}
}

async function loadBrandImgs(){
  const [logo,icon]=await Promise.all([loadImg(LOGO_URL),loadImg(ICON_URL),preloadFonts()]);
  return {logo:invertImageData(logo),icon:invertImageData(icon)};
}

function drawHeader(ctx,W,headH,logo,icon,kicker,jornadaLabel){
  const iconH=44,iconW=iconH*(icon.width/icon.height);
  const logoH=23,logoW=logoH*(logo.width/logo.height);
  const totalW=iconW+12+logoW;
  let x=(W-totalW)/2;
  ctx.drawImage(icon,x,headH/2-iconH/2-8,iconW,iconH);x+=iconW+12;
  ctx.drawImage(logo,x,headH/2-logoH/2+8,logoW,logoH);
  ctx.textAlign='center';ctx.textBaseline='alphabetic';
  ctx.fillStyle=UG;ctx.font="bold 13px 'Outfit', Arial, sans-serif";
  ctx.fillText(kicker,W/2,headH-16);
  if(jornadaLabel){
    ctx.fillStyle='#999';ctx.font="11px 'Outfit', Arial, sans-serif";
    ctx.fillText(jornadaLabel,W/2,headH-2);
  }
}

// ═══ TOP 5 FINAL — podio + lista ═══
export async function exportTop5Whatsapp(lid){
  const liga=S.ligas.find(l=>l.id===lid);if(!liga){toast('Liga no encontrada',1);return;}
  const st=calcGlobal(lid).slice(0,5);
  if(!st.length){toast('Sin jugadores en esta liga',1);return;}
  const win=openPreviewWindow();if(!win)return;
  let logo,icon;
  try{({logo,icon}=await loadBrandImgs());}catch(e){win.close();toast('No se pudieron cargar los logos',1);return;}

  const scale=2,W=1200;
  const headH=110,podiumH=340,rowH=84,footH=50;
  const rest=st.slice(3);
  const H=headH+podiumH+34+rest.length*rowH+footH;
  const canvas=document.createElement('canvas');
  canvas.width=W*scale;canvas.height=H*scale;
  const ctx=canvas.getContext('2d');
  ctx.scale(scale,scale);
  ctx.fillStyle=UB;ctx.fillRect(0,0,W,H);

  drawHeader(ctx,W,headH,logo,icon,'T O P   5   ·   T A B L A   F I N A L',null);
  ctx.textAlign='center';
  ctx.fillStyle='#fff';ctx.font="34px 'Bebas Neue', sans-serif";
  ctx.fillText(esc(liga.nombre).toUpperCase(),W/2,headH+30);

  // Podio: 2° izquierda, 1° centro (más alto), 3° derecha
  const podY=headH+52;
  const colW=300,gap=24;
  const order=[{s:st[1],h:210,accent:'#c9c9c9'},{s:st[0],h:250,accent:UG},{s:st[2],h:180,accent:'#c9825a'}];
  const totalW=colW*3+gap*2;
  let px=W/2-totalW/2;
  order.forEach(({s,h,accent})=>{
    if(!s){px+=colW+gap;return;}
    const rank=st.indexOf(s)+1;
    const y0=podY+(250-h);
    ctx.fillStyle=accent;
    roundRect(ctx,px,y0,colW,h,12);ctx.fill();
    ctx.fillStyle=UB;
    ctx.font="70px 'Bebas Neue', sans-serif";
    ctx.textAlign='center';
    ctx.fillText(String(rank),px+colW/2,y0+70);
    const nameSize=fitFont(ctx,s.player.nombre,colW-30,20,"'Outfit', Arial, sans-serif");
    ctx.font=`700 ${nameSize}px 'Outfit', Arial, sans-serif`;
    ctx.fillText(s.player.nombre,px+colW/2,y0+h-38);
    ctx.font="600 15px 'Outfit', Arial, sans-serif";
    ctx.fillText((s.total>0?'+':'')+s.total+' PTS',px+colW/2,y0+h-16);
    px+=colW+gap;
  });

  // Lista 4-5
  let y=podY+250+34;
  rest.forEach((s,i)=>{
    const rank=i+4;
    ctx.fillStyle=i%2===0?'#0d0d0d':'#111';ctx.fillRect(60,y,W-120,rowH-8);
    ctx.textAlign='left';ctx.textBaseline='middle';
    ctx.fillStyle=UG;ctx.font="34px 'Bebas Neue', sans-serif";
    ctx.fillText(String(rank),90,y+(rowH-8)/2);
    ctx.fillStyle='#f2f2f2';ctx.font="600 20px 'Outfit', Arial, sans-serif";
    ctx.fillText(s.player.nombre,140,y+(rowH-8)/2);
    ctx.textAlign='right';ctx.fillStyle=s.total>=0?UG:'#ff5a6e';ctx.font="600 18px 'Outfit', Arial, sans-serif";
    ctx.fillText((s.total>0?'+':'')+s.total+' PTS',W-90,y+(rowH-8)/2);
    y+=rowH;
  });

  ctx.textAlign='center';ctx.textBaseline='alphabetic';
  ctx.fillStyle='#666';ctx.font="11px 'Outfit', Arial, sans-serif";
  ctx.fillText('¡FELICIDADES A TODOS LOS JUGADORES!',W/2,H-footH/2+4);

  showResult(win,canvas,`Top5_${slug(liga.nombre)}.png`);
}

// ═══ BANNER DE CAMPEONES — ratio 3:1 para el Hero del sitio público ═══
export async function exportBannerCampeones(lid){
  const liga=S.ligas.find(l=>l.id===lid);if(!liga){toast('Liga no encontrada',1);return;}
  const st=calcGlobal(lid);
  if(!st.length){toast('Sin jugadores en esta liga',1);return;}
  const champ=st[0],second=st[1],third=st[2];
  const win=openPreviewWindow();if(!win)return;
  let logo,icon;
  try{({logo,icon}=await loadBrandImgs());}catch(e){win.close();toast('No se pudieron cargar los logos',1);return;}

  const scale=2,W=1200,H=400;
  const canvas=document.createElement('canvas');
  canvas.width=W*scale;canvas.height=H*scale;
  const ctx=canvas.getContext('2d');
  ctx.scale(scale,scale);
  const grad=ctx.createLinearGradient(0,0,W,H);
  grad.addColorStop(0,'#0a0a0a');grad.addColorStop(1,'#141a05');
  ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
  ctx.fillStyle=UG;ctx.fillRect(0,0,W,10);

  const iconH=64,iconW=iconH*(icon.width/icon.height);
  const logoH=32,logoW=logoH*(logo.width/logo.height);
  ctx.drawImage(icon,60,44,iconW,iconH);
  ctx.drawImage(logo,60+iconW+16,44+iconH/2-logoH/2,logoW,logoH);

  ctx.textAlign='left';ctx.textBaseline='alphabetic';
  ctx.fillStyle=UG;ctx.font="bold 20px 'Outfit', Arial, sans-serif";
  ctx.fillText('C A M P E Ó N',60,210);
  const nameSize=fitFont(ctx,champ.player.nombre,W-120,66,"'Bebas Neue', sans-serif");
  ctx.fillStyle='#fff';ctx.font=`${nameSize}px 'Bebas Neue', sans-serif`;
  ctx.fillText(champ.player.nombre,60,270);
  ctx.fillStyle='#aaa';ctx.font="16px 'Outfit', Arial, sans-serif";
  ctx.fillText(esc(liga.nombre)+(second?'  ·  2° '+second.player.nombre:'')+(third?'  ·  3° '+third.player.nombre:''),60,306);
  ctx.fillStyle='#666';ctx.font="12px 'Outfit', Arial, sans-serif";
  ctx.fillText('Av. de las Rosas 171 · Col. Chapalita · Guadalajara',60,336);

  showResult(win,canvas,`Banner_Campeon_${slug(liga.nombre)}.png`);
}

// ═══ TABLA FINAL COMPLETA — imagen vertical para WhatsApp ═══
export async function exportTablaFinalWhatsapp(lid){
  const liga=S.ligas.find(l=>l.id===lid);if(!liga){toast('Liga no encontrada',1);return;}
  const st=calcGlobal(lid);
  if(!st.length){toast('Sin jugadores en esta liga',1);return;}
  const win=openPreviewWindow();if(!win)return;
  let logo,icon;
  try{({logo,icon}=await loadBrandImgs());}catch(e){win.close();toast('No se pudieron cargar los logos',1);return;}

  const scale=2,W=1000;
  const headH=140,rowH=54,footH=50;
  const H=headH+st.length*rowH+footH;
  const canvas=document.createElement('canvas');
  canvas.width=W*scale;canvas.height=H*scale;
  const ctx=canvas.getContext('2d');
  ctx.scale(scale,scale);
  ctx.fillStyle=UB;ctx.fillRect(0,0,W,H);

  drawHeader(ctx,W,headH-30,logo,icon,'T A B L A   F I N A L',null);
  ctx.textAlign='center';
  ctx.fillStyle='#fff';ctx.font="30px 'Bebas Neue', sans-serif";
  ctx.fillText(esc(liga.nombre).toUpperCase(),W/2,headH-2);
  ctx.strokeStyle=UG;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(60,headH+10);ctx.lineTo(W-60,headH+10);ctx.stroke();

  let y=headH+10;
  st.forEach((s,i)=>{
    const rowY=y;
    if(i===0){ctx.fillStyle='rgba(184,212,0,.12)';ctx.fillRect(60,rowY,W-120,rowH);}
    else if(i%2===1){ctx.fillStyle='#0e0e0e';ctx.fillRect(60,rowY,W-120,rowH);}
    ctx.textAlign='left';ctx.textBaseline='middle';
    ctx.fillStyle=i===0?UG:'#888';ctx.font="26px 'Bebas Neue', sans-serif";
    ctx.fillText(String(i+1),80,rowY+rowH/2);
    ctx.fillStyle='#f2f2f2';ctx.font=(i===0?'700 ':'600 ')+"18px 'Outfit', Arial, sans-serif";
    ctx.fillText(s.player.nombre,130,rowY+rowH/2);
    ctx.textAlign='right';ctx.fillStyle=s.total>=0?UG:'#ff5a6e';ctx.font="600 17px 'Outfit', Arial, sans-serif";
    ctx.fillText((s.total>0?'+':'')+s.total+' PTS',W-80,rowY+rowH/2);
    y+=rowH;
  });

  ctx.textAlign='center';ctx.textBaseline='alphabetic';
  ctx.fillStyle='#666';ctx.font="11px 'Outfit', Arial, sans-serif";
  ctx.fillText('Urban Padel Life · '+new Date().toLocaleDateString('es-MX'),W/2,H-footH/2+4);

  showResult(win,canvas,`Tabla_Final_${slug(liga.nombre)}.png`);
}

// ═══ ÚLTIMAS CANCHAS — reusa el export de horarios de la última jornada ═══
export function irAUltimasCanchas(lid){
  const js=S.jornadas.filter(j=>j.liga===lid).sort((a,b)=>b.num-a.num);
  const last=js[0];
  if(!last){toast('Esta liga no tiene jornadas',1);return;}
  closeM('m-cierre');
  // entrarLiga primero: si se llega aquí desde la lista de Ligas (sin haber
  // "entrado" antes), goToImprimir por sí solo deja la barra de pestañas del
  // admin oculta porque sólo entrarLiga la muestra.
  entrarLiga(lid);
  goToImprimir(lid,last.id);
  setTimeout(()=>exportGruposWhatsApp(),300);
}

// ═══ MODAL "TERMINAR LIGA" ═══
export function openCierreLiga(lid){
  const liga=S.ligas.find(l=>l.id===lid);
  if(!liga){toast('Liga no encontrada',1);return;}
  const st=calcGlobal(lid).slice(0,5);
  const js=S.jornadas.filter(j=>j.liga===lid).sort((a,b)=>b.num-a.num);
  const lastJ=js[0];
  const archivada=liga.status==='archivada';

  const preview=st.length
    ? '<div style="font-size:.76rem;color:var(--muted2);margin-bottom:.5rem">'+
        st.map((s,i)=>(i+1)+'. '+esc(s.player.nombre)+' · '+(s.total>0?'+':'')+s.total).join(' &nbsp;·&nbsp; ')+
      '</div>'
    : '<div style="font-size:.76rem;color:var(--muted2);margin-bottom:.5rem">Sin jugadores todavía.</div>';

  const el=document.getElementById('m-cierre-content');
  el.innerHTML=
    '<button class="mc" onclick="closeM(\'m-cierre\')">&#x2715;</button>'+
    '<h2>TERMINAR <em>LIGA</em></h2>'+
    '<p style="font-size:.78rem;color:var(--muted2);margin-bottom:1rem">'+esc(liga.nombre)+' · Genera las imágenes de cierre para compartir por WhatsApp o subir como banner. No se publica nada solo — cada botón sólo descarga la imagen.</p>'+

    '<div class="cl">TOP 5 FINAL</div>'+preview+
    '<div class="brow"><button class="btn bp bsm" onclick="exportTop5Whatsapp(&quot;'+lid+'&quot;)">Descargar imagen Top 5</button></div>'+

    '<div class="cl" style="margin-top:1.1rem">BANNER DE CAMPEONES</div>'+
    '<div style="font-size:.74rem;color:var(--muted2);margin-bottom:.5rem">Imagen 1200×400, lista para subir en Banners Hero cuando quieras.</div>'+
    '<div class="brow"><button class="btn bp bsm" onclick="exportBannerCampeones(&quot;'+lid+'&quot;)">Descargar banner</button></div>'+

    '<div class="cl" style="margin-top:1.1rem">TABLA FINAL COMPLETA</div>'+
    '<div class="brow"><button class="btn bp bsm" onclick="exportTablaFinalWhatsapp(&quot;'+lid+'&quot;)">Descargar imagen tabla</button></div>'+

    '<div class="cl" style="margin-top:1.1rem">ÚLTIMAS CANCHAS Y HORARIOS</div>'+
    '<div style="font-size:.74rem;color:var(--muted2);margin-bottom:.5rem">'+(lastJ?'Jornada '+lastJ.num+(lastJ.fecha?' · '+lastJ.fecha:'')+' — te llevará a la pestaña Imprimir para generarla':'Esta liga no tiene jornadas.')+'</div>'+
    '<div class="brow"><button class="btn bp bsm" '+(lastJ?'':'disabled')+' onclick="irAUltimasCanchas(&quot;'+lid+'&quot;)">Descargar imagen de canchas</button></div>'+

    '<hr style="border:none;border-top:1px solid var(--border);margin:1.2rem 0">'+
    (archivada
      ? '<span class="bdg b-eq">LIGA YA ARCHIVADA</span>'
      : '<div class="brow"><button class="btn bd bsm" onclick="archivarDesdeCierre(&quot;'+lid+'&quot;)">Archivar liga</button></div>');

  openM('m-cierre');
}

export async function archivarDesdeCierre(lid){
  closeM('m-cierre');
  await cerrarLiga(lid);
}
