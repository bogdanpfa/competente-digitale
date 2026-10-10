/* =====================================================================
   comun.js — ce au în comun paginile noi: meniul de sus, subsolul, datele calendarului,
   „ce e azi” și butonul „Copiază”. Datele vin din exercitii.js (generat din ex_data.py).
   ===================================================================== */
(function () {
  "use strict";
  var C = window.CURS || {};
  var LUNI = ["ianuarie","februarie","martie","aprilie","mai","iunie","iulie","august","septembrie","octombrie","noiembrie","decembrie"];
  var ZILE = ["duminică","luni","marți","miercuri","joi","vineri","sâmbătă"];
  var pad = function (n) { return String(n).padStart(2, "0"); };
  var iso = function (d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
  var d2 = function (s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2], 12); };

  var U = window.U = {
    esc: function (t) { var e = document.createElement("div"); e.textContent = t == null ? "" : String(t); return e.innerHTML; },
    azi: function () { return iso(new Date()); },
    /* data lungă: „luni, 12 octombrie” */
    lung: function (s) { var d = d2(s); return ZILE[d.getDay()] + ", " + d.getDate() + " " + LUNI[d.getMonth()]; },
    scurt: function (s) { var d = d2(s); return d.getDate() + " " + LUNI[d.getMonth()].slice(0, 3); },
    ziua_urm: function (s) { var d = d2(s); d.setDate(d.getDate() + 1); return iso(d); },
    /* Unde suntem azi? {tip:"teorie"|"practica"|"inainte"|"pauza"|"final", sg, zi} */
    stare: function (a) {
      a = a || U.azi();
      var t = C.teorie || [], i = t.indexOf(a);
      if (i >= 0) return { tip: "teorie", zi: i + 1 };
      for (var g = 1; g <= 2; g++) { var k = (C.cal[g] || []).indexOf(a); if (k >= 0) return { tip: "practica", sg: g, zi: k + 1 }; }
      if (t.length && a < t[0]) return { tip: "inainte" };
      var ultim = C.cal[2][C.cal[2].length - 1];
      if (a > ultim) return { tip: "final" };
      /* zi fără curs (weekend): următoarea zi de curs */
      var toate = [];
      t.forEach(function (x, j) { toate.push({ d: x, tip: "teorie", zi: j + 1 }); });
      [1, 2].forEach(function (g) { C.cal[g].forEach(function (x, j) { toate.push({ d: x, tip: "practica", sg: g, zi: j + 1 }); }); });
      toate.sort(function (p, q) { return p.d < q.d ? -1 : 1; });
      for (var n = 0; n < toate.length; n++) if (toate[n].d > a) return { tip: "pauza", urm: toate[n] };
      return { tip: "final" };
    },
    exZi: function (zi) { return (window.EX || []).filter(function (e) { return e.zi === zi; }); },
    copiaza: function (text, btn) {
      var ok = function () { if (!btn) return; var v = btn.textContent; btn.textContent = "✓ Copiat"; setTimeout(function () { btn.textContent = v; }, 1600); };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(ok, function () { prompt("Copiază de aici:", text); });
      else { var t = document.createElement("textarea"); t.value = text; document.body.appendChild(t); t.select(); try { document.execCommand("copy"); ok(); } catch (e) {} t.remove(); }
    },
    baza: function () { return location.href.replace(/[#?].*$/, "").replace(/[^/]*$/, ""); }
  };

  /* ---------- meniul de sus ---------- */
  var PAG = [["index.html", "Acasă"], ["teorie.html", "Teorie"], ["practica.html", "Practică"], ["despre.html", "Despre curs"],
             ["examen.html", "Examen"], ["ghiduri.html", "Ghiduri"], ["harta.html", "Harta"]];
  var aici = location.pathname.split("/").pop() || "index.html";
  var nav = document.querySelector("[data-nav]");
  if (nav) {
    nav.innerHTML = '<div class="topbar-inner"><a class="brand" href="index.html">Competențe digitale · CFR</a><div class="tnav">' +
      PAG.map(function (p) { return '<a href="' + p[0] + '"' + (p[0] === aici ? ' aria-current="page"' : "") + ">" + p[1] + "</a>"; }).join("") + "</div></div>";
  }
  /* ---------- subsolul ---------- */
  var f = document.querySelector("[data-foot]");
  if (f) {
    f.innerHTML =
      "<span><b>Formator:</b> " + U.esc(C.formator) + " · curs de competențe cheie „" + U.esc(C.titlu) + "”. Site informativ, făcut de formator pentru cursanți.</span>" +
      "<span>Materialele și interfața au fost create cu ajutorul inteligenței artificiale și verificate de formator.</span>" +
      "<span>Site-ul nu folosește cookie-uri și nu colectează date. Ține minte doar, în browserul tău, ultima zi și subgrupa deschise. Contact: <a href=\"mailto:" + C.email + "\">" + C.email + "</a>.</span>" +
      "<span><b>Accesibilitate:</b> site-ul se poate folosi doar cu tastatura, are contrast bun și text care se mărește cu Ctrl și +. Ai găsit o problemă? Scrie-ne și o reparăm.</span>" +
      "<span>Actualizat: " + U.esc(document.lastModified ? new Date(document.lastModified).toLocaleDateString("ro-RO") : "") + "</span>";
  }
})();
