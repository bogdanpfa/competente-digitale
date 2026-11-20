/* =====================================================================
   examen_practic.js — biletele probei practice (1–30) și răspunsurile lor,
   CRIPTATE (AES-GCM, cheie PBKDF2-SHA256), ca la pagina Grilă.
   examen.html → biletele (parola de examen) · examen-rezolvari.html → răspunsurile (parola formatorului).
   Fiecare pagină are <div data-ex-lacat="subiecte|rezolvari" data-tinta="…"> + fișierul .enc.js corespunzător.
   ===================================================================== */
(function () {
  "use strict";
  var esc = function (t) { var e = document.createElement("div"); e.textContent = t == null ? "" : String(t); return e.innerHTML; };
  /* parola: litere mici, fără diacritice, spații simple (la fel ca la criptare) */
  function norm(p) { return p.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " "); }
  function b64(s) { var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  function decripteaza(E, parola) {
    var enc = new TextEncoder();
    return crypto.subtle.importKey("raw", enc.encode(norm(parola)), "PBKDF2", false, ["deriveKey"])
      .then(function (k) { return crypto.subtle.deriveKey({ name: "PBKDF2", salt: b64(E.salt), iterations: E.iter, hash: "SHA-256" }, k, { name: "AES-GCM", length: 256 }, false, ["decrypt"]); })
      .then(function (key) { return crypto.subtle.decrypt({ name: "AES-GCM", iv: b64(E.iv) }, key, b64(E.ct)); })
      .then(function (buf) { return JSON.parse(new TextDecoder().decode(buf)); });
  }

  /* ---------- afișarea unui bilet ---------- */
  function tabel(rows, c, evid) {
    return '<div class="tw"><table class="t ex-t" style="--c:#' + c + '"><thead><tr>' + rows[0].map(function (h) { return '<th scope="col">' + esc(h) + "</th>"; }).join("") +
      "</tr></thead><tbody>" + rows.slice(1).map(function (r) {
        return "<tr>" + r.map(function (x, j) { return "<td" + (j >= 2 ? ' class="nr"' : "") + (evid && j === 4 && x ? ' style="background:#FFF2B3;font-weight:700"' : "") + ">" + esc(x) + "</td>"; }).join("") + "</tr>";
      }).join("") + "</tbody></table></div>";
  }
  function barem(b) {
    return '<div class="tw"><table class="t ex-t" style="--c:#' + b.culoare + '"><thead><tr><th scope="col">Criteriu</th><th scope="col">Puncte</th></tr></thead><tbody>' +
      b.barem.map(function (x) { return "<tr><td>" + esc(x[0]) + '</td><td class="nr">' + x[1] + "</td></tr>"; }).join("") +
      '<tr><td>Din oficiu</td><td class="nr">10</td></tr><tr><th scope="row">Total</th><th class="nr">100</th></tr></tbody></table></div>';
  }
  function cap(b) {
    return '<p class="ex-fam" style="color:#' + b.culoare + '">' + esc(b.familie.toUpperCase()) + " · " + esc(b.aplicatii) + "</p>" +
      "<h3>Bilet nr. " + b.nr + " · " + esc(b.titlu) + "</h3>" +
      '<p class="muted ex-meta">Timp: <b>' + b.timp + " min</b> · Fișiere: <b>" + esc(b.fisiere) + "</b> · Trimiți la: <b>" + esc(b.eval) + "</b></p>";
  }
  function corp(b) {
    return "<p><b>Sarcina:</b> <i>" + esc(b.sarcina) + "</i></p>" + (b.date ? tabel(b.date, b.culoare) : "") +
      (b.text_dat ? '<p class="ex-box" style="border-left-color:#' + b.culoare + '"><b>Textul de scris:</b> ' + esc(b.text_dat) + "</p>" : "") +
      '<ol class="ex-pasi" style="--c:#' + b.culoare + '">' + b.pasi.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ol>";
  }
  var art = function (b, inner) { return '<article class="card ex-s" id="bilet-' + b.nr + '" tabindex="-1" style="border-top:6px solid #' + b.culoare + '">' + inner + "</article>"; };
  function bilet(b) { return art(b, cap(b) + corp(b) + "<details><summary>Baremul (100 de puncte)</summary>" + barem(b) + "</details>"); }
  function raspuns(b) {
    return art(b, cap(b) + '<p><a class="btn" href="examen.html#bilet-' + b.nr + '">Vezi biletul ' + b.nr + " →</a></p>" +
      "<details><summary>Cerințele biletului</summary>" + corp(b) + "</details>" +
      (b.rez_tabel ? "<h4>Tabelul corect</h4>" + tabel(b.rez_tabel, b.culoare, true) : "") +
      "<h4>Ce trebuie să vadă evaluatorul</h4><ul>" + b.rasp.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul><h4>Barem</h4>" + barem(b));
  }
  function cuprins(L) {
    return '<nav class="ex-cuprins" aria-label="Biletele">' + L.map(function (b) {
      return '<a href="#bilet-' + b.nr + '" title="' + esc(b.familie + ": " + b.titlu) + '" style="background:#' + b.culoare + '">' + b.nr + "</a>"; }).join("") + "</nav>";
  }

  /* ---------- lacătul ---------- */
  document.querySelectorAll("[data-ex-lacat]").forEach(function (box) {
    var tip = box.getAttribute("data-ex-lacat"), E = tip === "rezolvari" ? window.EXR_ENC : window.EXS_ENC;
    var cheie = "ex_" + tip, form = box.querySelector("form"), inp = form.querySelector("input"), btn = form.querySelector("button"),
        msg = box.querySelector("[role=alert]"), tinta = document.getElementById(box.getAttribute("data-tinta"));
    function deschide(parola, salveaza) {
      btn.disabled = true; msg.textContent = "Se deschide…";
      return decripteaza(E, parola).then(function (L) {
        if (salveaza) { try { sessionStorage.setItem(cheie, parola); } catch (e) {} }
        box.hidden = true; msg.textContent = "";
        tinta.innerHTML = cuprins(L) + L.map(tip === "rezolvari" ? raspuns : bilet).join("");
        tinta.hidden = false;
        /* venit printr-un link de tip examen.html#bilet-5: ducem cititorul la bilet */
        var h = location.hash.slice(1), el = h && document.getElementById(h);
        if (el && /^bilet-\d+$/.test(h)) { el.scrollIntoView(); el.focus({ preventScroll: true }); }
      }, function () {
        try { sessionStorage.removeItem(cheie); } catch (e) {}
        btn.disabled = false; msg.textContent = "Parola nu e corectă. Încearcă din nou."; inp.select();
      });
    }
    if (!E || !window.crypto || !crypto.subtle) { msg.textContent = "Browserul tău nu poate deschide această parte. Încearcă în Chrome, Edge sau Firefox, actualizate."; return; }
    form.addEventListener("submit", function (e) { e.preventDefault(); deschide(inp.value, true); });
    var p = null; try { p = sessionStorage.getItem(cheie); } catch (e) {}
    if (p) deschide(p, false);
  });
})();
