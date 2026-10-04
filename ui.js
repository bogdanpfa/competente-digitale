/* =====================================================================
   ui.js — funcții comune pentru Teorie și Practică
   1) tooltip-uri accesibile (hover, tastatură, atingere, Esc) — fără biblioteci;
   2) glosar: termenii tehnici din text primesc explicații la prima apariție;
   3) bara de progres la derulare și butonul „sus”.
   De ce JS propriu și nu API-ul nou „interestfor”: acela nu merge încă în Safari;
   aici tooltip-ul funcționează identic în toate browserele, inclusiv pe telefon.
   ===================================================================== */
(function () {
  "use strict";

  /* ---------- 1. Tooltip ---------- */
  var tip = document.createElement("div");
  tip.id = "tip"; tip.setAttribute("role", "tooltip"); tip.setAttribute("popover", "manual");
  document.body.appendChild(tip);
  var cur = null, hideT = 0, showT = 0, shownAt = 0;

  /* Reguli pentru elementele fără data-tip (și pentru cele desenate dinamic):
     selector → text (sau funcție care primește elementul). */
  var REGULI = [
    ["a.pdfbtn[href*='brosuri/']", "Broșura zilei, PDF în format A5: rezumatul pe scurt. O citești pe telefon sau o poți printa."],
    ["a.pdfbtn[href*='slide-uri/']", "Slide-urile prezentate la curs în ziua aceasta, într-un singur PDF."],
    ["a.pdfbtn.nlm", "Rezumat audio al zilei, generat cu NotebookLM (aplicația Google). Se deschide într-o filă nouă și poate cere conectarea cu un cont Google."],
    ["a.pdfbtn.audiolink[href*='montaje/']", "Montaj interactiv, pe ecran: se deschide într-o pagină separată, în aceeași fereastră, și îl poți rula și singur."],
    [".pdfbtn.soon", "Rezumatul audio al acestei zile încă se pregătește. Linkul apare aici imediat ce e gata."],
    ["a.pdfbtn.formlink", "Testul se completează în Google Forms și se deschide într-o filă nouă."],
    ["details.rez > summary", "Răspunsurile corecte, cu explicații. Încearcă mai întâi singur testul, apoi verifică aici."],
    [".retinut h5", "Ideile esențiale ale orei, pe scurt: dacă ții minte doar atât, ai prins miezul."],
    [".kicker", "Fiecare bloc este o oră a cursului: «Recap» = rezumat al predării, «Test grilă» = exercițiul de după."],
    [".pill[data-day]", function (el) { var p = document.querySelector('.day-panel[data-panel="' + el.getAttribute("data-day") + '"] .day-sub'); return p ? p.textContent : ""; }],
    [".bn .bt", "Recapitulare pe zile: broșuri, slide-uri, teste grilă cu răspunsuri."],
    [".bn .bp", "Temele de practică: calendar pe subgrupă, fișe cu pași, exemple și bareme."],
    [".bdg.nota", "Această temă primește o notă din Fișa de evaluare. Din cele 100 de puncte ale lucrării, 10 sunt din oficiu (prezență)."],
    [".bdg.ob", "Tema este cerută de organizatorul cursului și nu poate fi omisă."],
    [".bdg:not(.nota):not(.ob)", "Temă de exersare: nu se notează. O faci ca să înveți, iar formatorul te ajută."],
    ["button[data-ec]", "Ecran pentru formator: cronometru, pașii temei și timpul rămas. Îl partajează formatorul pe Zoom; tu nu trebuie să-l deschizi."],
    ["button[data-fisa]", "Fișa temei: «Ce ai de făcut» (pașii), «Exemplu» (cum arată rezultatul) și «Barem» (cum se punctează). Mai conține butonul de descărcare .docx."],
    [".pb", function (el) { return el.getAttribute("aria-label") || ""; }],
    ["#tDo", "Pașii temei, unul câte unul, plus cum predai."],
    ["#tEx", "Un exemplu orientativ al rezultatului. Cifrele și textele tale vor fi diferite."],
    ["#tBa", "Cum se punctează lucrarea: 8 criterii din Fișa de evaluare + 10 puncte din oficiu = 100."],
    ["code.cp, button[data-cp]", "Copiază textul ca să-l lipești exact în e-mail, fără greșeli de scriere."],
    [".totop", "Înapoi sus"]
  ];

  function text(el) {
    var t = el.getAttribute("data-tip");
    if (t) return t;
    for (var i = 0; i < REGULI.length; i++) {
      if (el.matches(REGULI[i][0])) { var v = REGULI[i][1]; return typeof v === "function" ? v(el) : v; }
    }
    return "";
  }
  var SEL = "[data-tip]," + REGULI.map(function (r) { return r[0]; }).join(",");
  function find(node) { return node && node.closest ? node.closest(SEL) : null; }

  function place(el) {
    var r = el.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight, vw = document.documentElement.clientWidth, gap = 12;
    var left = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), vw - w - 8);
    var sus = r.top - h - gap >= 8;
    var top = sus ? r.top - h - gap : Math.min(r.bottom + gap, window.innerHeight - h - 8);
    tip.style.left = left + "px"; tip.style.top = top + "px";
    tip.setAttribute("data-pos", sus ? "sus" : "jos");
    tip.style.setProperty("--ax", Math.min(Math.max(16, r.left + r.width / 2 - left), w - 16) + "px");
  }
  function show(el) {
    var t = text(el); if (!t) return;
    clearTimeout(hideT); cur = el;
    var titlu = el.getAttribute("data-tip-t");
    tip.innerHTML = ""; if (titlu) { var b = document.createElement("b"); b.textContent = titlu; tip.appendChild(b); }
    tip.appendChild(document.createTextNode(t));
    tip.id = "tip"; el.setAttribute("aria-describedby", "tip");
    /* Fișa e un <dialog> modal: ea stă în „top layer”, deasupra oricărui z-index. Ca tooltip-ul să se vadă PE fișă, îl mutăm în dialog
       și îl afișăm ca popover (tot top layer, dar ultimul deschis = cel mai de sus). În afara dialogului rămâne în <body>. */
    var gazda = el.closest("dialog[open]") || document.body;
    try { if (tip.matches(":popover-open")) tip.hidePopover(); } catch (e) {}
    if (tip.parentNode !== gazda) gazda.appendChild(tip);
    try { if (tip.showPopover) tip.showPopover(); } catch (e) {}
    place(el); tip.classList.add("on"); shownAt = Date.now();
  }
  function hide(now) {
    clearTimeout(showT);
    var go = function () { tip.classList.remove("on"); if (cur) { cur.removeAttribute("aria-describedby"); cur = null; } };
    if (now) { clearTimeout(hideT); go(); } else { clearTimeout(hideT); hideT = setTimeout(go, 140); }   // mică întârziere: tooltip-ul rămâne „hoverable” (WCAG 1.4.13)
  }

  document.addEventListener("pointerover", function (e) {
    if (e.pointerType === "touch") return;
    var el = find(e.target); if (!el || el === cur) return;
    clearTimeout(showT); showT = setTimeout(function () { show(el); }, 260);
  });
  document.addEventListener("pointerout", function (e) {
    if (e.pointerType === "touch") return;
    var el = find(e.target); if (!el) return;
    if (e.relatedTarget && (el.contains(e.relatedTarget) || tip.contains(e.relatedTarget))) return;
    hide();
  });
  tip.addEventListener("pointerenter", function () { clearTimeout(hideT); });
  tip.addEventListener("pointerleave", function () { hide(); });
  document.addEventListener("focusin", function (e) { var el = find(e.target); if (el) show(el); });
  document.addEventListener("focusout", function (e) { if (find(e.target)) hide(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && tip.classList.contains("on")) hide(true); });
  /* pe telefon: atingere pe termen explicat sau pe „?” deschide/închide tooltip-ul (linkurile și butoanele își fac treaba normal) */
  document.addEventListener("click", function (e) {
    var el = e.target.closest ? e.target.closest(".gl,.i,[data-tip]") : null;
    if (el) { e.preventDefault(); if (cur === el && tip.classList.contains("on") && Date.now() - shownAt > 400) hide(true); else if (!(cur === el && tip.classList.contains("on"))) show(el); return; }   /* atingerea focalizează întâi elementul (focusin deschide), apoi vine clicul: nu-l închidem imediat */
    if (!tip.contains(e.target)) hide(true);
  });
  window.addEventListener("scroll", function () { if (cur) hide(true); }, { passive: true, capture: true });   /* capture: prinde și derularea din interiorul fișei */
  window.addEventListener("resize", function () { if (cur) hide(true); });

  /* ---------- 2. Glosar ---------- */
  var L = "(?<![\\p{L}\\p{N}_-])", R = "(?![\\p{L}\\p{N}_])";
  var TERMENI = [
    ["HTTPS", "HTTPS(?!:)", "Varianta criptată a conexiunii web: datele dintre tine și site circulă «într-un plic sigilat». Lacătul arată doar că legătura e criptată, nu că site-ul e de încredere."],
    ["DNS", "DNS", "«Agenda telefonică» a internetului: transformă numele unui site (ex. exemplu.ro) în adresa lui numerică, adresa IP."],
    ["Adresa IP", "(?:adresa(?:\\s+IP)|adresele\\s+IP|IP)", "Numărul care identifică un dispozitiv în rețea, ca o adresă poștală pentru calculatoare."],
    ["URL", "URL", "Adresa completă a unei pagini web, de exemplu https://site.ro/pagina: are protocol, domeniu și cale."],
    ["VPN", "VPN", "«Tunel» criptat între dispozitivul tău și internet. Protejează traficul când folosești Wi-Fi public."],
    ["Firewall", "firewall", "«Paznicul» rețelei: filtrează ce are voie să intre în calculator și să iasă din el."],
    ["Antivirus", "antivirus(?:ul)?", "Program care caută și blochează programele rău-intenționate de pe calculator."],
    ["2FA", "(?:2FA|autentificar(?:ea|e)\\s+în\\s+doi\\s+pași)", "A doua verificare, în plus față de parolă: de exemplu un cod primit prin SMS sau dintr-o aplicație. Chiar dacă parola e furată, contul rămâne protejat."],
    ["Phishing", "phishing", "Mesaj fals care se dă drept bancă, firmă sau instituție ca să te păcălească să dai parole, date de card sau să deschizi un link periculos."],
    ["Smishing", "smishing", "Phishing prin SMS."],
    ["Vishing", "vishing", "Phishing prin apel telefonic: cineva se dă drept «banca» și îți cere date."],
    ["Ransomware", "ransomware", "Program rău-intenționat care blochează fișierele și cere bani ca să le deblocheze."],
    ["Deepfake", "deepfake", "Imagine, video sau voce falsificată cu ajutorul inteligenței artificiale, care pare reală."],
    ["LLM", "(?:LLM|modele?\\s+de\\s+limbaj)", "Model de limbaj mare: inteligență artificială antrenată pe foarte multe texte, care scrie răspunsuri (ex. ChatGPT, Claude, Gemini)."],
    ["Prompt", "prompt(?:ul|uri|urile)?", "Instrucțiunea pe care i-o scrii unei inteligențe artificiale. Cu cât e mai clară (rol, context, sarcină, format), cu atât răspunsul e mai bun."],
    ["No-code / low-code", "(?:no-code|low-code)", "Instrumente cu care construiești aplicații prin click-uri și blocuri, fără cod (no-code) sau cu foarte puțin cod (low-code)."],
    ["Browser", "browser(?:e|ul|ele|elor)?", "Programul cu care deschizi paginile web: Chrome, Edge, Firefox, Safari."],
    ["Motor de căutare", "motor(?:ul|ului|oare|oarele)?\\s+de\\s+căutare", "Serviciu care caută în internet după cuvintele tale (ex. Google, Bing) și îți arată o listă de pagini."],
    ["OneDrive", "OneDrive", "Spațiul tău de stocare online de la Microsoft: fișierele stau pe internet și le deschizi de pe orice dispozitiv, după conectare."],
    ["Cloud", "cloud", "Calculatoare din internet pe care sunt păstrate fișiere și programe, în loc să fie doar pe calculatorul tău."],
    ["Fake news", "(?:fake\\s+news|știri(?:le)?\\s+false|știre\\s+falsă)", "Informație falsă prezentată ca știre adevărată, de obicei ca să stârnească emoții sau să se răspândească repede."],
    ["Clickbait", "clickbait", "Titlu făcut să stârnească curiozitatea ca să dai click, deși conținutul nu ține de promisiune."],
    ["Algoritm", "algoritm(?:i|ii|ul|ilor)?", "Set de reguli după care un program alege ce îți arată: de exemplu ce postări apar primele pe rețelele sociale."],
    ["Netiquette", "netiquette", "Regulile de politețe pe internet: ton, claritate, respect, când și unde scrii."],
    ["Plagiat", "plagiat(?:ul)?", "Preluarea textului sau ideilor altcuiva fără să spui de unde provin."],
    ["Drepturi de autor", "drepturi(?:le)?\\s+de\\s+autor", "Drepturile autorului asupra operei lui: nu o copiezi și nu o folosești fără permisiune sau fără să menționezi sursa."]
  ];
  var compilat = null;
  try {
    compilat = TERMENI.map(function (t) { return { nume: t[0], re: new RegExp(L + "(" + t[1] + ")" + R, t[0] === "Adresa IP" ? "u" : "iu"), tip: t[2] }; });
  } catch (err) { compilat = null; }                         // browser vechi (fără lookbehind): glosarul se oprește, restul site-ului merge
  var SARI = /^(A|BUTTON|CODE|PRE|SCRIPT|STYLE|SUMMARY|INPUT|TEXTAREA|SELECT|H1|H2|H3|H4|H5|LABEL|TH|SMALL)$/;

  function glosar(scope) {
    if (!compilat || !scope) return;
    var folosit = {};
    var w = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        for (var p = n.parentNode; p && p !== scope; p = p.parentNode) {
          if (p.nodeType === 1 && (p.tagName === "DETAILS" || SARI.test(p.tagName) || p.classList.contains("gl") || p.hasAttribute("data-tip") || p.classList.contains("pdfbtn") || p.classList.contains("hartac"))) return NodeFilter.FILTER_REJECT;
        }
        return n.nodeValue.trim().length > 2 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var noduri = []; while (w.nextNode()) noduri.push(w.currentNode);
    noduri.forEach(function (nod) { proceseaza(nod); });
    /* răspunsurile pliate (details) sunt un scop separat: își explică și ele termenii, fără să „consume” explicațiile din textul vizibil */
    if (!scope.matches || scope.tagName !== "DETAILS") scope.querySelectorAll("details").forEach(function (d) { glosar(d); });
    function proceseaza(nod) {
      var best = null;
      compilat.forEach(function (t) {
        if (folosit[t.nume]) return;
        var m = t.re.exec(nod.nodeValue);
        if (m && (!best || m.index < best.m.index)) best = { t: t, m: m };
      });
      if (!best) return;
      folosit[best.t.nume] = 1;
      var m = best.m, cuv = m[1], start = m.index + m[0].indexOf(cuv);
      var dupa = nod.splitText(start), rest = dupa.splitText(cuv.length);
      var s = document.createElement("span");
      s.className = "gl"; s.tabIndex = 0; s.setAttribute("data-tip", best.t.tip); s.setAttribute("data-tip-t", best.t.nume);
      s.textContent = cuv; dupa.parentNode.replaceChild(s, dupa);
      proceseaza(rest);
    }
  }
  /* formule Excel în fișe: =SUM(...) și =AVERAGE(...) primesc explicație */
  function formule(scope) {
    (scope || document).querySelectorAll("code").forEach(function (c) {
      if (c.hasAttribute("data-tip")) return;
      var t = c.textContent;
      if (/^=?SUM\(/.test(t)) { c.setAttribute("data-tip", "SUM adună toate numerele din intervalul dat. Începe cu «=» ca Excel să știe că e o formulă; dacă schimbi un număr, totalul se schimbă singur."); c.setAttribute("data-tip-t", "Funcția SUM"); c.tabIndex = 0; }
      else if (/^=?AVERAGE\(/.test(t)) { c.setAttribute("data-tip", "AVERAGE calculează media: adună numerele din interval și împarte la câte sunt. Se actualizează singură."); c.setAttribute("data-tip-t", "Funcția AVERAGE"); c.tabIndex = 0; }
      else if (/^=?(MAX|MIN)\(/.test(t)) { c.setAttribute("data-tip", "MAX dă cea mai mare valoare din interval, MIN pe cea mai mică."); c.setAttribute("data-tip-t", "MAX / MIN"); c.tabIndex = 0; }
    });
  }
  function aplica(scope) { glosar(scope); formule(scope); }
  window.UI = { glosar: aplica };

  /* containere cu conținut desenat dinamic: re-aplicăm glosarul după fiecare redesenare */
  var vii = document.querySelectorAll("[data-gloss-live]");
  vii.forEach(function (c) {
    var ocupat = false;
    var mo = new MutationObserver(function () {
      if (ocupat) return; ocupat = true;
      mo.disconnect(); aplica(c); mo.observe(c, { childList: true, subtree: true }); ocupat = false;
    });
    mo.observe(c, { childList: true, subtree: true });
    aplica(c);
  });
  /* containere statice: un scop separat pe fiecare panou de zi (fiecare zi își explică termenii) */
  document.querySelectorAll("[data-gloss]").forEach(function (c) {
    var panouri = c.querySelectorAll(".day-panel");
    if (panouri.length) panouri.forEach(aplica); else aplica(c);
  });

  /* ---------- 3. Progres la derulare + „sus” ---------- */
  var bar = document.querySelector(".scrollbar"), sus = document.querySelector(".totop"), cadru = 0;
  function pe() {
    cadru = 0;
    var d = document.documentElement, max = d.scrollHeight - d.clientHeight, y = window.scrollY || d.scrollTop;
    if (bar) bar.style.setProperty("--p", max > 0 ? Math.min(1, y / max).toFixed(4) : 0);
    if (sus) sus.classList.toggle("on", y > 700);
  }
  window.addEventListener("scroll", function () { if (!cadru) cadru = requestAnimationFrame(pe); }, { passive: true });
  if (sus) sus.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion:reduce)").matches ? "auto" : "smooth" }); });
  pe();
})();
