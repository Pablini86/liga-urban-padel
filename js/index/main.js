import {db, S} from './state.js';
import {goHome, openLiga, showLT, getActiveLigaId} from './navigation.js';
import {renderPatrocinadoresHome, carMove, carGo} from './patrocinadores.js';
import {renderHome} from './home.js';
import {renderLiga} from './liga.js';
import {toggleJornada} from './jornadas.js';
import {showHorarioJornada, renderHorariosSingle} from './horarios.js';
import {openPlayer, closeModal} from './player-modal.js';
import {installPWA, dismissInstall} from './pwa.js';
import './effects.js';

// FIRESTORE
db.collection('ligas').onSnapshot(s=>{S.ligas=s.docs.map(d=>({id:d.id,...d.data()}));renderHome();if(getActiveLigaId())renderLiga(getActiveLigaId());});
db.collection('players').onSnapshot(s=>{S.players=s.docs.map(d=>({id:d.id,...d.data()}));renderHome();if(getActiveLigaId())renderLiga(getActiveLigaId());});
db.collection('partidos').onSnapshot(s=>{S.partidos=s.docs.map(d=>({id:d.id,...d.data()}));renderHome();if(getActiveLigaId())renderLiga(getActiveLigaId());});
db.collection('jornadas').onSnapshot(s=>{S.jornadas=s.docs.map(d=>({id:d.id,...d.data()}));renderHome();if(getActiveLigaId())renderLiga(getActiveLigaId());});
db.collection('patrocinadores').onSnapshot(s=>{
  S.patrocinadores=s.docs.map(d=>({id:d.id,...d.data()}));
  renderPatrocinadoresHome();
  if(getActiveLigaId())renderLiga(getActiveLigaId());
}, err=>{console.warn('patrocinadores:',err);});

// Funciones referenciadas por atributos inline (onclick="...") en el HTML
// generado dinámicamente. Tienen que vivir en window porque los manejadores
// inline se resuelven contra el scope global, no contra el de este módulo.
Object.assign(window, {
  goHome, openLiga, showLT,
  carMove, carGo,
  toggleJornada,
  showHorarioJornada, renderHorariosSingle,
  openPlayer, closeModal,
  installPWA, dismissInstall,
});
