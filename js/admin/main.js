import {db, auth, ADMIN_EMAILS, S} from './state.js';
import {openM, closeM} from './modal.js';
import {showAT, renderAdmin} from './dispatch.js';
import {checkMigrate, renderLigasAdmin, entrarLiga, volverALigas, cerrarLiga, createLiga, delLiga} from './ligas.js';
import {addP, delP, editPNombre, renderPlist, renderDrag, saveOrder, importExcel} from './jugadores.js';
import {renderRestricciones, openAddRestriccion, toggleRstJornada, toggleRstChip, filterRestricciones, saveRestriccion, delRestriccion} from './restricciones.js';
import {loadJornada, renderScheduleGrid, autoAssign, saveHorarios, goToJornada, goToImprimir} from './jornada-schedule.js';
import {renderCaptura, capturaGoTo, toggleModo, updateDirect, updateScore, toggleAusente, saveGrupoCaptura} from './captura.js';
import {renderPromoP, applyAndCreateJornada, editGroupPos, onGrupoSelectChange, saveGroupEdit} from './promociones.js';
import {renderImpPrev, printAnotaciones, printHorarios, printTabla} from './imprimir.js';
import {renderPatrocinadores, openAddPatrocinador, handlePatDrop, previewPat, savePatrocinador, delPatrocinador} from './patrocinadores.js';

// ═══ LOGIN ═══
function doLogin(){
  const email = document.getElementById('inp-email').value.trim();
  const pass = document.getElementById('inp-pass').value;
  const btn = document.getElementById('login-btn');
  const err = document.getElementById('login-err');
  err.style.display='none';
  btn.disabled=true;
  btn.textContent='Entrando...';
  auth.signInWithEmailAndPassword(email, pass)
    .then(r=>{
      if(!ADMIN_EMAILS.includes(r.user.email)){
        auth.signOut();
        err.style.display='block';
        err.textContent='No tienes acceso de administrador.';
        btn.textContent='Entrar';
        btn.disabled=false;
        return;
      }
      showApp(r.user.email);
    })
    .catch(()=>{
      err.style.display='block';
      document.getElementById('inp-pass').value='';
      document.getElementById('inp-pass').focus();
      btn.textContent='Entrar';
      btn.disabled=false;
    });
}

function showApp(email){
  document.getElementById('login-screen').style.display='none';
  document.getElementById('app-screen').style.display='block';
  const ue=document.getElementById('user-email');if(ue)ue.textContent=email;
  if(window.innerWidth<=760){
    const mn=document.getElementById('mob-nav');
    if(mn){mn.style.display='block';document.querySelector('main').style.paddingBottom='80px';}
  }
  initListeners();
}

// Auto-login if session active
auth.onAuthStateChanged(u=>{
  if(u && ADMIN_EMAILS.includes(u.email)) showApp(u.email);
});

document.getElementById('logout-btn').onclick=()=>{
  auth.signOut().then(()=>{
    document.getElementById('app-screen').style.display='none';
    document.getElementById('login-screen').style.display='flex';
    document.getElementById('inp-pass').value='';
  });
};

// ═══ FIRESTORE LISTENERS ═══
function initListeners(){
  db.collection('ligas').onSnapshot(s=>{S.ligas=s.docs.map(d=>({id:d.id,...d.data()}));checkMigrate();renderAdmin();});
  db.collection('players').onSnapshot(s=>{S.players=s.docs.map(d=>({id:d.id,...d.data()}));renderAdmin();});
  db.collection('partidos').onSnapshot(s=>{S.partidos=s.docs.map(d=>({id:d.id,...d.data()}));renderAdmin();});
  db.collection('jornadas').onSnapshot(s=>{S.jornadas=s.docs.map(d=>({id:d.id,...d.data()}));renderAdmin();});
  db.collection('promociones').onSnapshot(s=>{S.promociones=s.docs.map(d=>({id:d.id,...d.data()}));});
  db.collection('restricciones').onSnapshot(s=>{S.restricciones=s.docs.map(d=>({id:d.id,...d.data()}));renderRestricciones();});
  db.collection('patrocinadores').onSnapshot(s=>{S.patrocinadores=s.docs.map(d=>({id:d.id,...d.data()}));renderPatrocinadores();});
}

// Funciones referenciadas por atributos inline (onclick=/onchange=/oninput=...) en
// el HTML estático y en el HTML generado dinámicamente. Tienen que vivir en window
// porque los manejadores inline se resuelven contra el scope global, no contra el
// de estos módulos.
Object.assign(window, {
  doLogin,
  openM, closeM,
  showAT,
  entrarLiga, volverALigas, cerrarLiga, createLiga, delLiga,
  addP, delP, editPNombre, saveOrder, importExcel,
  openAddRestriccion, toggleRstJornada, toggleRstChip, filterRestricciones, saveRestriccion, delRestriccion,
  loadJornada, renderScheduleGrid, autoAssign, saveHorarios, goToJornada, goToImprimir,
  renderCaptura, capturaGoTo, toggleModo, updateDirect, updateScore, toggleAusente, saveGrupoCaptura,
  renderPromoP, applyAndCreateJornada, editGroupPos, onGrupoSelectChange, saveGroupEdit,
  renderImpPrev, printAnotaciones, printHorarios, printTabla,
  openAddPatrocinador, handlePatDrop, previewPat, savePatrocinador, delPatrocinador,
});
