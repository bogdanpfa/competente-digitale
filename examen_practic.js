/* =====================================================================
   examen_practic.js — subiectele probei practice (S01–S30) și rezolvările lor,
   CRIPTATE (AES-GCM, cheie PBKDF2-SHA256), ca la pagina Grilă.
   Folosit de: examen.html (subiectele, parola grupei) și examen-rezolvari.html (rezolvările, parola formatorului).
   Fiecare pagină declară: <div data-ex-lacat="subiecte|rezolvari"> + fișierul .enc.js corespunzător.
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

  /* ---------- afișarea ---------- */
  function barem(s) {
    return '<div class="tw"><table class="t"><thead><tr><th scope="col">Criteriu</th><th scope="col">Puncte</th></tr></thead><tbody>' +
      s.barem.map(function (b) { return "<tr><td>" + esc(b[0]) + "</td><td>" + b[1] + "</td></tr>"; }).join("") +
      "<tr><td>Din oficiu</td><td>10</td></tr><tr><th scope=\"row\">Total</th><th>100</th></tr></tbody></table></div>";
  }
  function dateTabel(s) {
    if (!s.date) return "";
    return '<div class="tw"><table class="t"><thead><tr>' + s.date[0].map(function (h) { return '<th scope="col">' + esc(h) + "</th>"; }).join("") +
      "</tr></thead><tbody>" + s.date.slice(1).map(function (r) { return "<tr>" + r.map(function (c) { return "<td>" + esc(c) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></div>";
  }
  function cap(s) { return '<p class="muted ex-meta">' + esc(s.modul) + " · timp maxim: <b>" + s.timp + " min</b></p>"; }
  function pasi(s) { return "<p>" + esc(s.intro) + "</p>" + dateTabel(s) + "<ol>" + s.pasi.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ol>"; }

  function subiect(s) {
    return '<article class="card ex-s" id="' + s.id + '" tabindex="-1"><h3>' + s.id + " · " + esc(s.titlu) + "</h3>" + cap(s) + pasi(s) +
      (s.pornire ? '<p class="ex-box"><b>Fișier de pornire:</b> <a href="examen/' + esc(s.pornire) + '" download>' + esc(s.pornire) + "</a></p>" : "") +
      (s.personal ? '<p class="ex-box verde"><b>Element personal:</b> ' + esc(s.personal) + "</p>" : "") +
      "<p><b>Trimiți:</b> " + esc(s.trimiti) + "</p><details><summary>Baremul (100 de puncte)</summary>" + barem(s) + "</details></article>";
  }
  function rezolvare(s) {
    return '<article class="card ex-s" id="' + s.id + '" tabindex="-1"><h3>' + s.id + " · " + esc(s.titlu) + "</h3>" + cap(s) +
      '<p><a class="btn" href="examen.html#' + s.id + '">Vezi subiectul ' + s.id + " →</a></p>" +
      "<details><summary>Cerința, pe scurt</summary>" + pasi(s) + (s.personal ? '<p class="ex-box verde"><b>Element personal:</b> ' + esc(s.personal) + "</p>" : "") + "</details>" +
      "<h4>Rezolvare model</h4><ul>" + s.rez.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul><h4>Barem</h4>" + barem(s) + "</article>";
  }
  function cuprins(S) {
    return '<nav class="ex-cuprins" aria-label="Subiectele">' + S.map(function (s) { return '<a href="#' + s.id + '" title="' + esc(s.titlu) + '">' + s.id + "</a>"; }).join("") + "</nav>";
  }

  /* ---------- lacătul ---------- */
  document.querySelectorAll("[data-ex-lacat]").forEach(function (box) {
    var tip = box.getAttribute("data-ex-lacat"), E = tip === "rezolvari" ? window.EXR_ENC : window.EXS_ENC;
    var cheie = "ex_" + tip, form = box.querySelector("form"), inp = form.querySelector("input"), btn = form.querySelector("button"),
        msg = box.querySelector("[role=alert]"), tinta = document.getElementById(box.getAttribute("data-tinta"));
    function deschide(parola, salveaza) {
      btn.disabled = true; msg.textContent = "Se deschide…";
      return decripteaza(E, parola).then(function (S) {
        if (salveaza) { try { sessionStorage.setItem(cheie, parola); } catch (e) {} }
        box.hidden = true; msg.textContent = "";
        tinta.innerHTML = cuprins(S) + S.map(tip === "rezolvari" ? rezolvare : subiect).join("");
        tinta.hidden = false;
        /* venit printr-un link de tip examen.html#S05: ducem cititorul la subiect */
        var h = location.hash.slice(1), el = h && document.getElementById(h);
        if (el && /^S\d\d$/.test(h)) { el.scrollIntoView(); el.focus({ preventScroll: true }); }
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
