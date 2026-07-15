import {S, storage, esc, safeUrl, uid, getActiveLiga, fsSet, fsDel, toast} from './state.js';
import {openM, closeM} from './modal.js';

export function renderPatrocinadores(){
  const bannerEl=document.getElementById('pat-banners-list');
  const logoEl=document.getElementById('pat-logos-list');
  if(!bannerEl&&!logoEl)return;

  function patCard(p){
    const ligaNombre=p.liga?((S.ligas.find(l=>l.id===p.liga)||{}).nombre||p.liga):'Todas las ligas';
    const imgUrl=p.bannerUrl||p.logoUrl||'';
    return '<div style="background:var(--card2);border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:.55rem">'+
      (p.bannerUrl?'<img src="'+esc(p.bannerUrl)+'" style="width:100%;max-height:100px;object-fit:cover;display:block">':'')+
      '<div style="padding:.75rem 1rem;display:flex;align-items:center;gap:.85rem">'+
        (p.logoUrl&&!p.bannerUrl?'<img src="'+esc(p.logoUrl)+'" style="height:40px;max-width:90px;object-fit:contain;background:var(--border2);border-radius:5px;padding:3px">':'')+
        '<div style="flex:1">'+
          '<div style="font-weight:700;font-size:.88rem">'+esc(p.nombre)+'</div>'+
          '<div style="font-size:.7rem;color:var(--muted2)">'+esc(ligaNombre)+'</div>'+
          (p.url?'<a href="'+safeUrl(p.url)+'" target="_blank" rel="noopener noreferrer" style="font-size:.68rem;color:var(--accent);text-decoration:none">'+esc(p.url)+'</a>':'')+
        '</div>'+
        '<button class="btn bd bxs" data-pid="'+p.id+'" data-banner="'+(p.bannerUrl||'')+'" data-logo="'+(p.logoUrl||'')+'" onclick="delPatrocinador(this.dataset.pid,this.dataset.banner,this.dataset.logo)">✕</button>'+
      '</div>'+
    '</div>';
  }

  const banners=S.patrocinadores.filter(p=>p.tipo==='banner'||p.bannerUrl);
  const logos=S.patrocinadores.filter(p=>p.tipo==='logo'||(!p.bannerUrl&&p.logoUrl));

  if(bannerEl) bannerEl.innerHTML=banners.length?banners.map(patCard).join(''):'<div style="font-size:.78rem;color:var(--muted2);padding:.5rem 0">Sin banners — agrega el primero</div>';
  if(logoEl) logoEl.innerHTML=logos.length?logos.map(patCard).join(''):'<div style="font-size:.78rem;color:var(--muted2);padding:.5rem 0">Sin logos — agrega el primero</div>';
}

export function openAddPatrocinador(mode){
  mode=mode||'banner';
  document.getElementById('pat-mode').value=mode;
  const isBanner=mode==='banner';
  document.getElementById('pat-modal-title').innerHTML=isBanner?'NUEVO <em>BANNER</em>':'NUEVO <em>LOGO DE LIGA</em>';
  document.getElementById('pat-file-label').textContent=isBanner?'Imagen banner (3:1 recomendado)':'Logo';
  document.getElementById('pat-hint').style.display=isBanner?'':'none';
  // For banner: liga = null (global). For logo: pick liga
  const ligaWrap=document.getElementById('pat-liga-wrap');
  ligaWrap.style.display=isBanner?'none':'';
  const ligaSel=document.getElementById('pat-liga');
  ligaSel.innerHTML='<option value="">— selecciona liga —</option>'+
    S.ligas.map(l=>'<option value="'+l.id+'"'+(l.id===getActiveLiga()?' selected':'')+'>'+esc(l.nombre)+'</option>').join('');
  document.getElementById('pat-nombre').value='';
  document.getElementById('pat-url').value='';
  document.getElementById('pat-logo-url').value='';
  document.getElementById('pat-preview').style.display='none';
  document.getElementById('pat-drop-label').textContent='📁 Click o arrastra la imagen aquí';
  document.getElementById('pat-upload-progress').style.display='none';
  openM('m-patrocinador');
}

export function handlePatDrop(e){
  e.preventDefault();
  document.getElementById('pat-drop-zone').style.borderColor='var(--border2)';
  const file=e.dataTransfer.files[0];
  if(file&&file.type.startsWith('image/')) uploadPatLogo(file);
}

export function previewPat(input){
  const file=input.files[0];
  if(!file)return;
  uploadPatLogo(file);
}

function uploadPatLogo(file){
  const prog=document.getElementById('pat-upload-progress');
  const bar=document.getElementById('pat-progress-bar');
  const label=document.getElementById('pat-progress-label');
  const preview=document.getElementById('pat-preview');
  const previewImg=document.getElementById('pat-preview-img');
  const dropLabel=document.getElementById('pat-drop-label');
  const saveBtn=document.getElementById('pat-save-btn');

  prog.style.display='block';
  bar.style.width='0%';
  label.textContent='Subiendo...';
  saveBtn.disabled=true;
  dropLabel.textContent=file.name;

  const ref=storage.ref('patrocinadores/'+Date.now()+'_'+file.name.replace(/[^a-zA-Z0-9._-]/g,'_'));
  const task=ref.put(file);

  task.on('state_changed',
    function(snap){
      const pct=Math.round(snap.bytesTransferred/snap.totalBytes*100);
      bar.style.width=pct+'%';
      label.textContent='Subiendo... '+pct+'%';
    },
    function(err){
      toast('Error al subir imagen: '+err.message,1);
      prog.style.display='none';
      saveBtn.disabled=false;
    },
    async function(){
      const url=await ref.getDownloadURL();
      document.getElementById('pat-logo-url').value=url;
      preview.style.display='block';
      previewImg.src=url;
      bar.style.width='100%';
      label.textContent='✓ Listo';
      saveBtn.disabled=false;
    }
  );
}

export async function savePatrocinador(){
  const nombre=document.getElementById('pat-nombre').value.trim();
  if(!nombre){toast('Escribe el nombre',1);return;}
  const imgUrl=document.getElementById('pat-logo-url').value;
  if(!imgUrl){toast('Sube una imagen primero',1);return;}
  const mode=document.getElementById('pat-mode').value;
  const isBanner=mode==='banner';
  const liga=isBanner?null:(document.getElementById('pat-liga').value||null);
  if(!isBanner&&!liga){toast('Selecciona una liga',1);return;}
  const p={
    id:uid(),
    nombre,
    tipo:mode,
    url:document.getElementById('pat-url').value.trim(),
    liga,
    [isBanner?'bannerUrl':'logoUrl']:imgUrl,
    fecha:new Date().toISOString().slice(0,10)
  };
  await fsSet('patrocinadores',p.id,p);
  closeM('m-patrocinador');
  toast(isBanner?'✓ Banner guardado':'✓ Logo guardado');
}

export async function delPatrocinador(id,bannerUrl,logoUrl){
  if(!confirm('Eliminar?'))return;
  await fsDel('patrocinadores',id);
  for(const url of [bannerUrl,logoUrl]){
    if(url&&url.startsWith('https://firebasestorage')){
      try{await storage.refFromURL(url).delete();}catch(e){}
    }
  }
  toast('Eliminado');
}
