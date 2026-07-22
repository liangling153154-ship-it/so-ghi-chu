// Server tĩnh tối giản để chạy trên Railway (hoặc bất kỳ host Node nào).
// Không cần thư viện ngoài — chỉ dùng module có sẵn của Node.
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function send(res, status, headers, body) {
  res.writeHead(status, headers);
  res.end(body);
}

const server = http.createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(url.parse(req.url).pathname);
  } catch {
    return send(res, 400, { "Content-Type": "text/plain" }, "Bad request");
  }

  // Link riêng của người dùng: /k/<token> → trả về app chính
  if (pathname === "/" || /^\/k\/[^/]*\/?$/.test(pathname)) {
    pathname = "/index.html";
  }

  // Chặn path traversal: mọi đường dẫn phải nằm trong ROOT
  const filePath = path.join(ROOT, pathname);
  if (!filePath.startsWith(ROOT + path.sep)) {
    return send(res, 403, { "Content-Type": "text/plain" }, "Forbidden");
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      return send(res, 404, { "Content-Type": "text/plain; charset=utf-8" }, "Không tìm thấy trang");
    }

    const ext = path.extname(filePath).toLowerCase();
    const headers = { "Content-Type": MIME[ext] || "application/octet-stream" };

    // Icon/ảnh cache lâu; HTML và service worker luôn lấy bản mới
    if (ext === ".png" || ext === ".jpg" || ext === ".svg" || ext === ".ico") {
      headers["Cache-Control"] = "public, max-age=604800";
    } else {
      headers["Cache-Control"] = "no-cache";
    }

    headers["Content-Length"] = stat.size;
    res.writeHead(200, headers);

    // HEAD chỉ cần header, không cần nội dung
    if (req.method === "HEAD") return res.end();

    const stream = fs.createReadStream(filePath);
    stream.on("error", () => res.destroy());
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log("Kho ghi chú đang chạy tại http://localhost:" + PORT);
});
