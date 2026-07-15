// Film grain canvas texture
(function(){
  const canvas = document.createElement('canvas');
  canvas.id = 'tex';
  canvas.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none;opacity:.10;mix-blend-mode:screen;width:100%;height:100%';
  document.body.insertAdjacentElement('afterbegin', canvas);

  const W = 600, H = 600;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  function drawGrain(){
    const img = ctx.createImageData(W, H);
    const d = img.data;
    for(let i = 0; i < d.length; i += 4){
      // Base grain
      const v = Math.random() * 255 | 0;
      // Occasional bright scratch pixels
      const scratch = Math.random() < 0.0003 ? 255 : 0;
      const val = Math.max(v * 0.4, scratch);
      d[i] = d[i+1] = d[i+2] = val;
      d[i+3] = 255;
    }
    // Add a few diagonal scratches
    for(let s = 0; s < 3; s++){
      if(Math.random() < 0.4){
        const x0 = Math.random() * W | 0;
        const len = (50 + Math.random() * 200) | 0;
        const angle = (Math.random() * 0.3 - 0.15);
        for(let t = 0; t < len; t++){
          const x = (x0 + Math.sin(angle) * t) | 0;
          const y = t;
          if(x >= 0 && x < W && y < H){
            const idx = (y * W + x) * 4;
            const bright = (180 + Math.random() * 75) | 0;
            d[idx] = d[idx+1] = d[idx+2] = bright;
          }
        }
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  // Draw initial grain
  drawGrain();

  // Static - no animation

  // Parallax on scroll
  window.addEventListener('scroll', function(){
    const y = window.scrollY * 0.06;
    canvas.style.transform = 'translateY(' + y + 'px)';
  }, {passive:true});
})();
window.addEventListener('scroll', function(){
  const y = window.scrollY;
  const tex = document.getElementById('tex');
  if(tex) tex.style.transform = 'translateY(' + (y * 0.08) + 'px)';
}, {passive:true});

if(window.innerWidth<=600){
  document.getElementById('mobile-bar').style.display='flex';
  document.querySelector('main').style.paddingBottom='70px';
}
