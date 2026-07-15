import {S} from './state.js';
import {renderLigasAdmin} from './ligas.js';
import {renderPlist, renderDrag} from './jugadores.js';
import {populateSels, updateJN} from './selects.js';
import {renderCaptura} from './captura.js';
import {renderPromoP} from './promociones.js';
import {renderImpPrev} from './imprimir.js';
import {renderScheduleGrid} from './jornada-schedule.js';
import {renderRestricciones} from './restricciones.js';
import {renderPatrocinadores} from './patrocinadores.js';

export function renderAdmin(){renderLigasAdmin();if(S.activeLiga){renderPlist();renderDrag();populateSels();updateJN();renderCaptura();renderPromoP();renderImpPrev();renderScheduleGrid();}}

export function showAT(id,btn){document.querySelectorAll('[id^="at-"]').forEach(e=>e.style.display='none');document.querySelectorAll('.it').forEach(t=>t.classList.remove('active'));document.getElementById('at-'+id).style.display='';btn.classList.add('active');if(id==='jornada')renderScheduleGrid();if(id==='imprimir'){populateSels();renderImpPrev();}if(id==='resultados'){populateSels();renderCaptura();}if(id==='promociones'){populateSels();renderPromoP();}if(id==='restricciones')renderRestricciones();if(id==='patrocinadores')renderPatrocinadores();if(id==='promociones'){populateSels();renderPromoP();}}
