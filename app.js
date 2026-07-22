(function () {
  "use strict";

  var BUCKET = "note-images";
  var UNCATEGORIZED = "Chưa phân loại";

  var cfg = window.KHO_CONFIG || {};
  var sb = null;

  // Thư viện supabase-js bản UMD gắn vào globalThis.supabase (bản cũ: window.supabase)
  function supabaseLib() {
    var g = (typeof globalThis !== "undefined" ? globalThis : window);
    return g.supabase || window.supabase || null;
  }

  var state = {
    token: null,
    space: null,
    notes: [],
    activeCategory: null, // null = tất cả
    editingNote: null,    // note đang sửa (null = thêm mới)
    imageRemoved: false,  // người dùng bấm "Bỏ ảnh" khi sửa
  };

  // ===== Tiện ích =====

  function $(id) { return document.getElementById(id); }

  function showStatus(icon, text) {
    $("status-icon").textContent = icon;
    $("status-text").innerHTML = text;
    $("status-screen").hidden = false;
    $("app").hidden = true;
  }

  function showApp() {
    $("status-screen").hidden = true;
    $("app").hidden = false;
  }

  var toastTimer = null;
  function toast(msg) {
    var el = $("toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 2200);
  }

  function publicImageUrl(path) {
    return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  function getToken() {
    // Hỗ trợ /k/<token>, ?k=<token> và #<token>
    var m = location.pathname.match(/\/k\/([A-Za-z0-9_-]+)/);
    if (m) return m[1];
    var q = new URLSearchParams(location.search).get("k");
    if (q) return q;
    if (location.hash.length > 1) return location.hash.slice(1);
    return null;
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try {
        document.execCommand("copy") ? resolve() : reject(new Error("copy failed"));
      } catch (e) {
        reject(e);
      } finally {
        ta.remove();
      }
    });
  }

  // Thu nhỏ ảnh trước khi upload để tiết kiệm dung lượng free tier
  function shrinkImage(file) {
    var MAX = 1600;
    if (file.type === "image/gif" || file.size < 300 * 1024) {
      return Promise.resolve(file);
    }
    return new Promise(function (resolve) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        var w = img.naturalWidth, h = img.naturalHeight;
        var scale = Math.min(1, MAX / Math.max(w, h));
        var canvas = document.createElement("canvas");
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(function (blob) {
          resolve(blob && blob.size < file.size ? blob : file);
        }, "image/jpeg", 0.85);
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        resolve(file);
      };
      img.src = url;
    });
  }

  function randomName(blob) {
    var ext = blob.type === "image/png" ? "png"
      : blob.type === "image/gif" ? "gif"
      : blob.type === "image/webp" ? "webp" : "jpg";
    var rand = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    return rand + "." + ext;
  }

  // ===== Tải dữ liệu =====

  async function loadSpace() {
    var res = await sb.from("spaces").select("*").eq("token", state.token).maybeSingle();
    if (res.error) throw res.error;
    return res.data;
  }

  async function loadNotes() {
    var res = await sb.from("notes")
      .select("*")
      .eq("space_id", state.space.id)
      .order("updated_at", { ascending: false });
    if (res.error) throw res.error;
    state.notes = res.data || [];
  }

  // ===== Render =====

  function categories() {
    var set = [];
    state.notes.forEach(function (n) {
      var c = (n.category || "").trim() || UNCATEGORIZED;
      if (set.indexOf(c) === -1) set.push(c);
    });
    set.sort(function (a, b) { return a.localeCompare(b, "vi"); });
    return set;
  }

  function renderCategoryBar() {
    var bar = $("category-bar");
    bar.innerHTML = "";
    var cats = categories();

    if (state.activeCategory && cats.indexOf(state.activeCategory) === -1) {
      state.activeCategory = null;
    }

    function makeChip(label, value) {
      var b = document.createElement("button");
      b.className = "chip" + (state.activeCategory === value ? " active" : "");
      b.textContent = label;
      b.onclick = function () {
        state.activeCategory = value;
        renderCategoryBar();
        renderNotes();
      };
      return b;
    }

    bar.appendChild(makeChip("Tất cả", null));
    cats.forEach(function (c) { bar.appendChild(makeChip(c, c)); });
    bar.style.display = cats.length > 0 ? "" : "none";
  }

  function visibleNotes() {
    if (!state.activeCategory) return state.notes;
    return state.notes.filter(function (n) {
      return ((n.category || "").trim() || UNCATEGORIZED) === state.activeCategory;
    });
  }

  function renderNotes() {
    var list = $("note-list");
    list.innerHTML = "";
    var notes = visibleNotes();
    $("empty-state").hidden = state.notes.length > 0;

    notes.forEach(function (note) {
      var card = document.createElement("article");
      card.className = "note-card";

      var top = document.createElement("div");
      top.className = "note-card-top";

      var titleWrap = document.createElement("div");
      var title = document.createElement("h3");
      title.className = "note-title";
      title.textContent = note.title;
      titleWrap.appendChild(title);
      if ((note.category || "").trim()) {
        var cat = document.createElement("span");
        cat.className = "note-cat";
        cat.textContent = note.category.trim();
        titleWrap.appendChild(cat);
      }
      top.appendChild(titleWrap);

      var editBtn = document.createElement("button");
      editBtn.className = "icon-btn";
      editBtn.textContent = "✏️";
      editBtn.setAttribute("aria-label", "Sửa ghi chú");
      editBtn.onclick = function () { openDialog(note); };
      top.appendChild(editBtn);
      card.appendChild(top);

      if ((note.content || "").trim()) {
        var content = document.createElement("p");
        content.className = "note-content";
        content.textContent = note.content;
        card.appendChild(content);
      }

      if (note.image_path) {
        var img = document.createElement("img");
        img.className = "note-thumb";
        img.loading = "lazy";
        img.alt = note.title;
        img.src = publicImageUrl(note.image_path);
        img.onclick = function () { openLightbox(note); };
        card.appendChild(img);
      }

      var actions = document.createElement("div");
      actions.className = "note-actions";

      if ((note.content || "").trim()) {
        var copyBtn = document.createElement("button");
        copyBtn.className = "btn-copy";
        copyBtn.textContent = "📋 Chép";
        copyBtn.onclick = function () {
          copyText(note.content).then(
            function () { toast("Đã chép vào bộ nhớ tạm"); },
            function () { toast("Không chép được — hãy giữ tay để chọn chữ"); }
          );
        };
        actions.appendChild(copyBtn);
      }

      if (note.image_path) {
        var viewBtn = document.createElement("button");
        viewBtn.className = "btn-small";
        viewBtn.textContent = "🖼️ Xem ảnh";
        viewBtn.onclick = function () { openLightbox(note); };
        actions.appendChild(viewBtn);
      }

      var delBtn = document.createElement("button");
      delBtn.className = "btn-small btn-danger";
      delBtn.textContent = "Xóa";
      delBtn.onclick = function () { deleteNote(note); };
      actions.appendChild(delBtn);

      card.appendChild(actions);
      list.appendChild(card);
    });
  }

  function renderAll() {
    renderCategoryBar();
    renderNotes();
  }

  // ===== Lightbox =====

  function openLightbox(note) {
    var url = publicImageUrl(note.image_path);
    $("lightbox-img").src = url;
    $("lightbox-download").href = url;
    $("lightbox").showModal();
  }

  // ===== Thêm / sửa / xóa =====

  function refreshCategoryOptions() {
    var dl = $("category-options");
    dl.innerHTML = "";
    categories().forEach(function (c) {
      if (c === UNCATEGORIZED) return;
      var opt = document.createElement("option");
      opt.value = c;
      dl.appendChild(opt);
    });
  }

  function openDialog(note) {
    state.editingNote = note || null;
    state.imageRemoved = false;
    $("dialog-title").textContent = note ? "Sửa ghi chú" : "Thêm ghi chú";
    $("f-title").value = note ? note.title : "";
    $("f-content").value = note ? (note.content || "") : "";
    $("f-category").value = note ? (note.category || "") : (state.activeCategory && state.activeCategory !== UNCATEGORIZED ? state.activeCategory : "");
    $("f-image").value = "";
    refreshCategoryOptions();
    updateImagePreview();
    $("note-dialog").showModal();
  }

  function updateImagePreview() {
    var wrap = $("image-preview-wrap");
    var img = $("image-preview");
    var file = $("f-image").files[0];
    if (file) {
      img.src = URL.createObjectURL(file);
      wrap.hidden = false;
    } else if (state.editingNote && state.editingNote.image_path && !state.imageRemoved) {
      img.src = publicImageUrl(state.editingNote.image_path);
      wrap.hidden = false;
    } else {
      img.src = "";
      wrap.hidden = true;
    }
  }

  async function saveNote(ev) {
    ev.preventDefault();
    var saveBtn = $("save-btn");
    saveBtn.disabled = true;
    saveBtn.textContent = "Đang lưu…";

    try {
      var title = $("f-title").value.trim();
      var content = $("f-content").value.trim();
      var category = $("f-category").value.trim();
      var file = $("f-image").files[0];
      var editing = state.editingNote;

      var imagePath = editing ? editing.image_path : null;
      var oldPath = null;

      if (file) {
        var blob = await shrinkImage(file);
        var path = state.space.id + "/" + randomName(blob);
        var up = await sb.storage.from(BUCKET).upload(path, blob, {
          contentType: blob.type || file.type,
        });
        if (up.error) throw up.error;
        oldPath = imagePath;
        imagePath = path;
      } else if (state.imageRemoved) {
        oldPath = imagePath;
        imagePath = null;
      }

      var row = {
        title: title,
        content: content || null,
        category: category || null,
        image_path: imagePath,
        updated_at: new Date().toISOString(),
      };

      var res;
      if (editing) {
        res = await sb.from("notes").update(row).eq("id", editing.id);
      } else {
        row.space_id = state.space.id;
        res = await sb.from("notes").insert(row);
      }
      if (res.error) throw res.error;

      if (oldPath) {
        await sb.storage.from(BUCKET).remove([oldPath]);
      }

      $("note-dialog").close();
      await loadNotes();
      renderAll();
      toast(editing ? "Đã cập nhật" : "Đã thêm ghi chú");
    } catch (e) {
      console.error(e);
      toast("Lỗi khi lưu — kiểm tra mạng rồi thử lại");
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Lưu";
    }
  }

  async function deleteNote(note) {
    if (!confirm('Xóa ghi chú "' + note.title + '"?')) return;
    try {
      var res = await sb.from("notes").delete().eq("id", note.id);
      if (res.error) throw res.error;
      if (note.image_path) {
        await sb.storage.from(BUCKET).remove([note.image_path]);
      }
      await loadNotes();
      renderAll();
      toast("Đã xóa");
    } catch (e) {
      console.error(e);
      toast("Lỗi khi xóa — thử lại sau");
    }
  }

  // ===== Khởi động =====

  async function init() {
    if (!cfg.SUPABASE_URL || cfg.SUPABASE_URL.indexOf("YOUR-PROJECT") !== -1) {
      showStatus("⚙️", "App chưa được cấu hình.<br>Hãy điền thông tin Supabase vào <code>config.js</code>.");
      return;
    }
    var lib = supabaseLib();
    if (!lib || typeof lib.createClient !== "function") {
      showStatus("📡", "Không tải được thư viện kết nối.<br>Kiểm tra mạng rồi tải lại trang.");
      return;
    }
    sb = lib.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);

    state.token = getToken();
    if (!state.token) {
      var saved = localStorage.getItem("kho_token");
      if (saved) {
        state.token = saved;
      } else {
        showStatus("🔗", "Không tìm thấy link kho ghi chú.<br>Hãy mở đúng đường link riêng đã được cấp cho bạn.");
        return;
      }
    }

    try {
      state.space = await loadSpace();
    } catch (e) {
      console.error(e);
      showStatus("📡", "Không kết nối được máy chủ.<br>Kiểm tra mạng rồi tải lại trang.");
      return;
    }

    if (!state.space) {
      localStorage.removeItem("kho_token");
      showStatus("❓", "Link này không tồn tại hoặc đã bị thu hồi.<br>Hãy kiểm tra lại đường link.");
      return;
    }

    // Nhớ token để lần sau mở app (PWA) không cần link
    localStorage.setItem("kho_token", state.token);

    $("space-name").textContent = state.space.name;
    document.title = state.space.name + " — Kho ghi chú";

    try {
      await loadNotes();
    } catch (e) {
      console.error(e);
      showStatus("📡", "Không tải được ghi chú.<br>Kiểm tra mạng rồi tải lại trang.");
      return;
    }

    renderAll();
    showApp();
  }

  // ===== Gắn sự kiện =====

  $("add-btn").onclick = function () { openDialog(null); };
  $("cancel-btn").onclick = function () { $("note-dialog").close(); };
  $("note-form").onsubmit = saveNote;
  $("f-image").onchange = function () {
    state.imageRemoved = false;
    updateImagePreview();
  };
  $("remove-image-btn").onclick = function () {
    $("f-image").value = "";
    state.imageRemoved = true;
    updateImagePreview();
  };
  $("lightbox-close").onclick = function () { $("lightbox").close(); };
  $("lightbox").onclick = function (ev) {
    if (ev.target === $("lightbox")) $("lightbox").close();
  };

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () { /* bỏ qua */ });
    });
  }

  // Bọc init để mọi lỗi bất ngờ đều hiện thông báo, không đứng im ở màn hình chờ
  init().catch(function (e) {
    console.error(e);
    showStatus("⚠️", "Có lỗi khi mở kho ghi chú.<br>Hãy tải lại trang.");
  });
})();
