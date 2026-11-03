/* /* Adri - barras de puntaje de piel (se carga despues del script principal de index.html) */
(function () {
  var METRICS = [
    ['hidratacion', 'Hidratación'],
    ['textura', 'Textura'],
    ['lineas', 'Líneas finas'],
    ['poros', 'Poros'],
    ['firmeza', 'Firmeza'],
    ['tono', 'Tono'],
    ['manchas', 'Manchas']
  ];

  // Estilos
  var css = document.createElement('style');
  css.textContent =
    '.scores-card{background:var(--white);border:1px solid var(--bord);border-radius:4px;padding:18px 18px 14px;margin-left:39px;margin-top:10px;}' +
    '.scores-lbl{display:flex;align-items:center;gap:8px;font-size:9.5px;letter-spacing:0.18em;color:var(--gold);text-transform:uppercase;margin-bottom:14px;}' +
    '.sc-row{margin-bottom:11px;}' +
    '.sc-top{display:flex;justify-content:space-between;font-size:12px;color:var(--black);margin-bottom:5px;}' +
    '.sc-top span:last-child{color:var(--mid);font-weight:500;}' +
    '.sc-track{height:6px;background:var(--bord2);border-radius:3px;overflow:hidden;}' +
    '.sc-fill{height:100%;width:0;border-radius:3px;background:linear-gradient(90deg,var(--malva),var(--gold));transition:width 0.9s ease;}' +
    '.sc-note{font-size:10px;color:var(--light);line-height:1.6;margin-top:10px;padding-top:10px;border-top:1px solid var(--bord2);}';
  document.head.appendChild(css);

  // 1) Instruccion extra para la IA
  var _sys = sys;
  sys = function () {
    return _sys() +
      '\nSi la clienta envio una foto, agrega al final de tu respuesta una linea exacta con este formato (enteros 0 a 100, mayor es mejor, estimacion visual orientativa):\n' +
      'SKIN_SCORES:{"hidratacion":0,"textura":0,"lineas":0,"poros":0,"firmeza":0,"tono":0,"manchas":0}\n' +
      'Reemplaza los ceros por tu estimacion. Si NO hay foto, no incluyas SKIN_SCORES.';
  };

  // 2) Extraer los puntajes de la respuesta
  var _parseAll = parseAll;
  parseAll = function (raw) {
    window.__adriScores = null;
    var m = raw.match(/SKIN_SCORES:\s*(\{[^}]*\})/);
    if (m) {
      try { window.__adriScores = JSON.parse(m[1]); } catch (e) {}
      raw = raw.replace(/SKIN_SCORES:\s*\{[^}]*\}/, '').trim();
    }
    return _parseAll(raw);
  };

  // 3) Mostrar la tarjeta justo debajo de la burbuja de Adri
  var _addAdriBubble = addAdriBubble;
  addAdriBubble = function (text, cards, rutina) {
    var c = document.getElementById('chat-msgs');
    var before = c.children.length;
    _addAdriBubble(text, cards, rutina);
    var scores = window.__adriScores;
    window.__adriScores = null;
    addSendButton(c, text, scores);
    if (!scores) return;
    var rows = '';
    var found = 0;
    METRICS.forEach(function (m) {
      var v = parseInt(scores[m[0]], 10);
      if (isNaN(v)) return;
      v = Math.max(0, Math.min(100, v));
      found++;
      rows += '<div class="sc-row"><div class="sc-top"><span>' + m[1] + '</span><span>' + v +
        '</span></div><div class="sc-track"><div class="sc-fill" data-w="' + v + '"></div></div></div>';
    });
    if (!found) return;
    var card = document.createElement('div');
    card.className = 'scores-card';
    card.innerHTML = '<div class="scores-lbl"><span class="gline"></span>Tu piel hoy</div>' + rows +
      '<div class="sc-note">Estimación visual orientativa a partir de tu foto. No es un diagnóstico médico. Para un análisis exacto, reserva tu consulta 1:1.</div>';
    var bubbleRow = c.children[before];
    if (bubbleRow && bubbleRow.nextSibling) c.insertBefore(card, bubbleRow.nextSibling);
    else c.appendChild(card);
    setTimeout(function () {
      card.querySelectorAll('.sc-fill').forEach(function (f) { f.style.width = f.dataset.w + '%'; });
    }, 60);
    if (typeof scrollBot === 'function') scrollBot();
  };

  // 5) Boton "Enviar mi analisis a Adriana" por WhatsApp (te llega nombre y numero)
  function getPhone() {
    try { return localStorage.getItem('adri_phone') || ''; } catch (e) { return ''; }
  }
  function addSendButton(c, text, scores) {
    if (!text || /^Error de conexion/i.test(text)) return;
    var wa = c.querySelector('.wa-wrap:last-of-type') || c.lastElementChild;
    var flex = wa && wa.querySelector ? wa.querySelector('div') : null;
    if (!flex) return;
    var summary = '';
    if (scores) {
      var parts = [];
      METRICS.forEach(function (m) {
        var v = parseInt(scores[m[0]], 10);
        if (!isNaN(v)) parts.push(m[1] + ' ' + v);
      });
      if (parts.length) summary = '\nMis puntajes: ' + parts.join(', ');
    }
    var phone = getPhone();
    var msg = 'Hola Adriana! Soy ' + (typeof uName !== 'undefined' ? uName : '') +
      (phone ? '\nMi WhatsApp: ' + phone : '') +
      '\nAcabo de hacer mi análisis en Adri y quiero mi rutina personalizada.' + summary;
    var a = document.createElement('a');
    a.href = 'https://wa.me/17862538501?text=' + encodeURIComponent(msg);
    a.target = '_blank';
    a.className = 'wa-cta';
    a.textContent = 'Enviar mi análisis a Adriana';
    a.style.marginTop = '8px';
    flex.appendChild(a);
  }

  // 6) Pedir WhatsApp en la pantalla de inicio (opcional)
  var nameIn = document.getElementById('name-in');
  if (nameIn && !document.getElementById('wa-in')) {
    var wi = document.createElement('input');
    wi.className = 'ob-input';
    wi.id = 'wa-in';
    wi.type = 'tel';
    wi.maxLength = 20;
    wi.placeholder = 'Tu WhatsApp (opcional)';
    wi.setAttribute('onkeydown', "if(event.key==='Enter')startApp()");
    nameIn.insertAdjacentElement('afterend', wi);
  }
  var _startApp = startApp;
  startApp = function () {
    var w = document.getElementById('wa-in');
    var n = document.getElementById('name-in');
    if (w && n && n.value.trim()) {
      try { localStorage.setItem('adri_phone', w.value.trim()); } catch (e) {}
    }
    return _startApp();
  };

  // 4) Aviso de privacidad exacto
  var pt = document.querySelector('#sc-selfie .privacy-text');
  if (pt) {
    pt.innerHTML = '<strong>Tu foto se usa solo para tu análisis.</strong> Se envía a la inteligencia artificial que genera tu análisis y no se comparte con nadie más. Tu historial y tus rutinas se guardan únicamente en este dispositivo.';
  }
})();
