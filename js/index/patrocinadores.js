import {S, esc, safeUrl} from './state.js';

let _carruselIdx=0, _carruselTimer=null;

export function renderPatrocinadoresHome(){
  const bannerEl=document.getElementById('patrocinadores-banners');
  const ctaEl=document.getElementById('cta-patrocinar');
  if(!bannerEl)return;
  const banners=(S.patrocinadores||[]).filter(p=>!p.liga&&p.bannerUrl);
  if(!banners.length){
    bannerEl.innerHTML='';
    if(ctaEl)ctaEl.style.display='';
    return;
  }
  if(ctaEl)ctaEl.style.display='none';
  if(_carruselTimer)clearInterval(_carruselTimer);
  _carruselIdx=0;

  bannerEl.innerHTML=
    '<div style="position:relative;border-radius:14px;overflow:hidden;background:var(--card);width:100%">'+
      '<div id="car-track" style="display:flex;transition:transform .5s cubic-bezier(.4,0,.2,1);will-change:transform">'+
        banners.map(p=>
          '<a href="'+safeUrl(p.url)+'" target="_blank" rel="noopener noreferrer" style="min-width:100%;width:100%;flex:0 0 100%;display:block">'+
            '<img src="'+esc(p.bannerUrl)+'" alt="'+esc(p.nombre)+'" style="width:100%;max-height:220px;object-fit:cover;display:block">'+
          '</a>'
        ).join('')+
      '</div>'+
      // Prev/next arrows (only if >1)
      (banners.length>1?
        '<button onclick="carMove(-1)" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);background:rgba(0,0,0,.55);border:none;color:#fff;width:36px;height:36px;border-radius:50%;font-size:1.1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)">&#8249;</button>'+
        '<button onclick="carMove(1)" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:rgba(0,0,0,.55);border:none;color:#fff;width:36px;height:36px;border-radius:50%;font-size:1.1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)">&#8250;</button>':'')+
      // Dots
      (banners.length>1?
        '<div id="car-dots" style="position:absolute;bottom:10px;left:50%;transform:translateX(-50%);display:flex;gap:6px">'+
          banners.map((_,i)=>'<div onclick="carGo('+i+')" style="width:7px;height:7px;border-radius:50%;background:'+(i===0?'var(--accent)':'rgba(255,255,255,.4)')+';cursor:pointer;transition:background .3s"></div>').join('')+
        '</div>':'')+
    '</div>';

  if(banners.length>1){
    _carruselTimer=setInterval(()=>carMove(1), 4500);
  }
}

export function carMove(dir){
  const banners=(S.patrocinadores||[]).filter(p=>!p.liga&&p.bannerUrl);
  _carruselIdx=(_carruselIdx+dir+banners.length)%banners.length;
  carGo(_carruselIdx);
}

export function carGo(idx){
  const banners=(S.patrocinadores||[]).filter(p=>!p.liga&&p.bannerUrl);
  _carruselIdx=idx;
  const track=document.getElementById('car-track');
  if(track)track.style.transform='translateX(-'+idx+'00%)';
  const dots=document.querySelectorAll('#car-dots div');
  dots.forEach((d,i)=>d.style.background=i===idx?'var(--accent)':'rgba(255,255,255,.4)');
  if(_carruselTimer)clearInterval(_carruselTimer);
  if(banners.length>1)_carruselTimer=setInterval(()=>carMove(1),4500);
}

export function renderPatrocinadoresLiga(lid){
  const pats=(S.patrocinadores||[]).filter(p=>p.liga===lid&&p.logoUrl);
  if(!pats.length)return'';
  return '<div style="margin-top:.85rem;padding-top:.85rem;border-top:1px solid var(--border)">'+
    '<div style="font-size:.6rem;font-weight:700;letter-spacing:2px;color:var(--muted);text-transform:uppercase;margin-bottom:.55rem">Patrocinadores</div>'+
    '<div style="display:flex;gap:.75rem;flex-wrap:wrap;align-items:center">'+
      pats.map(p=>
        '<a href="'+safeUrl(p.url)+'" target="_blank" rel="noopener noreferrer" style="display:flex;align-items:center;background:var(--card2);border:1px solid var(--border);border-radius:8px;padding:.45rem .85rem;text-decoration:none">'+
          '<img src="'+esc(p.logoUrl)+'" alt="'+esc(p.nombre)+'" style="height:26px;max-width:80px;object-fit:contain;filter:brightness(0) invert(1);opacity:.8">'+
        '</a>'
      ).join('')+
    '</div>'+
  '</div>';
}
