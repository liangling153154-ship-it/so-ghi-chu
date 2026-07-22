(function () {
  "use strict";

  var cfg = window.KHO_CONFIG || {};
  var sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);

  function randomToken() {
    var bytes = new Uint8Array(12);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, function (b) {
      return "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36];
    }).join("");
  }

  var toastTimer = null;
  function toast(msg) {
    var el = document.getElementById("toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 2200);
  }

  document.getElementById("create-form").onsubmit = async function (ev) {
    ev.preventDefault();
    var btn = document.getElementById("create-btn");
    var name = document.getElementById("space-name-input").value.trim();
    if (!name) return;

    btn.disabled = true;
    btn.textContent = "Đang tạo…";
    try {
      var token = randomToken();
      var res = await sb.from("spaces").insert({ token: token, name: name });
      if (res.error) throw res.error;

      var link = location.origin + "/k/" + token;
      var result = document.getElementById("result");
      result.hidden = false;
      result.innerHTML =
        "<strong>" + name.replace(/</g, "&lt;") + "</strong><br>" +
        '<a href="' + link + '">' + link + "</a><br>" +
        '<button type="button" class="btn-copy" id="copy-link-btn" style="margin-top:8px">📋 Chép link</button>';
      document.getElementById("copy-link-btn").onclick = function () {
        navigator.clipboard.writeText(link).then(function () {
          toast("Đã chép link");
        });
      };
      document.getElementById("space-name-input").value = "";
    } catch (e) {
      console.error(e);
      toast("Lỗi khi tạo — kiểm tra config.js và mạng");
    } finally {
      btn.disabled = false;
      btn.textContent = "Tạo link mới";
    }
  };
})();
