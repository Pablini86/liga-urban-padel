export function openM(id){document.getElementById(id).classList.add('open');}
export function closeM(id){document.getElementById(id).classList.remove('open');}
document.querySelectorAll('.mo').forEach(o=>o.addEventListener('click',e=>{if(e.target===o)o.classList.remove('open');}));
