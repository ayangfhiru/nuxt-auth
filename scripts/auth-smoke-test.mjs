/**
 * scripts/auth-smoke-test.mjs — smoke test alur auth (docs/AUTH_FLOW.md §13).
 *
 * Cara pakai:
 *   1. jalankan dev server:  pnpm dev        (port 3000)
 *   2. jalankan test:        node scripts/auth-smoke-test.mjs
 *
 * Penting:
 *   - TIDAK mengirim email sungguhan: script membuka SMTP catcher lokal di
 *     port 2525 (sesuai default .env) dan menangkap kode OTP dari sana.
 *   - Tidak menambah dependency: memakai node:net + fetch bawaan Node.
 *   - Beberapa skenario sengaja menunggu (cooldown 60 dtk / rate limit).
 *
 * Skenario yang dicakup ada di bagian akhir file (lihat §13 docs/AUTH_FLOW.md).
 */
import net from "node:net";

const BASE = process.env["SMOKE_BASE_URL"] ?? "http://localhost:3000";
const SMTP_PORT = Number(process.env["SMOKE_SMTP_PORT"] ?? 2525);
const OTP_LENGTH = 6;

/* ------------------------------------------------------------------ *
 * SMTP catcher lokal — menangkap email OTP tanpa mengirim ke mana pun
 * ------------------------------------------------------------------ */
function createSmtpCatcher() {
  /** @type {{to: string, body: string}[]} */
  const emails = [];

  const server = net.createServer((socket) => {
    let buffer = "";
    let inData = false;
    /** @type {{from: string, to: string, body: string} | null} */
    let current = null;

    socket.on("error", () => {});
    socket.write("220 localhost ESMTP\r\n");

    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf8");

      for (;;) {
        if (inData) {
          const end = buffer.indexOf("\r\n.\r\n");
          if (end === -1) return; // tunggu potongan berikutnya

          const body = buffer.slice(0, end);
          buffer = buffer.slice(end + 5);
          inData = false;

          if (current) {
            current.body = body;
            emails.push({ to: current.to, body });
          }
          current = null;
          socket.write("250 OK\r\n");
          continue;
        }

        const lineEnd = buffer.indexOf("\r\n");
        if (lineEnd === -1) return;

        const line = buffer.slice(0, lineEnd);
        buffer = buffer.slice(lineEnd + 2);
        const upper = line.toUpperCase();

        if (upper.startsWith("EHLO") || upper.startsWith("HELO")) {
          socket.write("250-localhost\r\n250 8BITMIME\r\n");
        } else if (upper.startsWith("MAIL FROM")) {
          current = { from: line.slice(10), to: "", body: "" };
          socket.write("250 OK\r\n");
        } else if (upper.startsWith("RCPT TO")) {
          if (current) current.to = line.slice(8);
          socket.write("250 OK\r\n");
        } else if (upper.startsWith("DATA")) {
          inData = true;
          socket.write("354 End data with <CRLF>.<CRLF>\r\n");
        } else if (upper.startsWith("RSET")) {
          current = null;
          socket.write("250 OK\r\n");
        } else if (upper.startsWith("QUIT")) {
          socket.write("221 Bye\r\n");
          socket.end();
        } else {
          socket.write("250 OK\r\n");
        }
      }
    });
  });

  return {
    emails,
    listen() {
      return new Promise((resolve) => server.listen(SMTP_PORT, "127.0.0.1", resolve));
    },
    close() {
      return new Promise((resolve) => server.close(() => resolve(undefined)));
    },
    /** ambil OTP terbaru untuk sebuah alamat (menunggu sampai `timeoutMs`) */
    async waitForOtp(email, timeoutMs = 15_000) {
      const deadline = Date.now() + timeoutMs;
      const normalize = (value) => value.replaceAll("<", "").replaceAll(">", "").trim().toLowerCase();

      for (;;) {
        const match = [...emails]
          .reverse()
          .find((mail) => normalize(mail.to).includes(email.toLowerCase()));

        if (match) {
          const otp = match.body.match(new RegExp(`\\b(\\d{${OTP_LENGTH}})\\b`));
          if (otp) return otp[1];
        }

        if (Date.now() > deadline) {
          throw new Error(`Tidak menerima email OTP untuk ${email} dalam ${timeoutMs}ms`);
        }
        await sleep(300);
      }
    },
  };
}

/* ------------------------------ util ------------------------------ */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** HTTP client dengan cookie jar (meniru browser) */
function createClient() {
  const jar = new Map();

  return {
    jar,
    async request(path, { method = "GET", body } = {}) {
      const headers = {};
      const cookies = [...jar.entries()].map(([key, value]) => `${key}=${value}`).join("; ");
      if (cookies) headers["cookie"] = cookies;
      if (body) headers["content-type"] = "application/json";
      // Meniru browser: POST selalu membawa header Origin (Better Auth memakainya
      // untuk pemeriksaan trusted origin / CSRF — lihat origin-check.mjs).
      headers["origin"] = BASE;
      headers["referer"] = `${BASE}/`;

      const response = await fetch(BASE + path, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        redirect: "manual",
      });

      for (const raw of response.headers.getSetCookie?.() ?? []) {
        const [pair] = raw.split(";");
        const separator = pair.indexOf("=");
        if (separator === -1) continue;

        const name = pair.slice(0, separator).trim();
        const value = pair.slice(separator + 1).trim();
        const expired = /expires=thu, 01 jan 1970/i.test(raw);

        if (!value || expired) jar.delete(name);
        else jar.set(name, value);
      }

      const text = await response.text();
      let json = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = null;
      }

      return { status: response.status, json, text, headers: response.headers };
    },
  };
}

/* --------------------------- hasil test --------------------------- */
const results = [];

function check(name, passed, detail = "") {
  results.push({ name, passed, detail });
  const mark = passed ? "PASS" : "FAIL";
  console.log(`  [${mark}] ${name}${detail ? ` — ${detail}` : ""}`);
}

/* --------------------------- main --------------------------------- */
const smtp = createSmtpCatcher();
await smtp.listen();
console.log(`SMTP catcher aktif di 127.0.0.1:${SMTP_PORT}`);
console.log(`Target: ${BASE}\n`);

const stamp = Date.now();
const emailA = `alice-${stamp}@example.com`;
const passwordA = "Sup3rSecret!pw";
const passwordANew = "N3wPassword!pw";

const guest = createClient();
const user = createClient();

console.log("== Registrasi & verifikasi email ==");
{
  const res = await guest.request("/api/auth/sign-up/email", {
    method: "POST",
    body: { name: "Alice Tester", email: emailA, password: passwordA },
  });
  check("S1  registrasi email baru diterima", res.status === 200, `status=${res.status}`);

  const otp = await smtp.waitForOtp(emailA);
  check("S2  kode OTP verifikasi diterima via email", otp.length === OTP_LENGTH);

  // S3: email duplikat → respons generik (tidak membocorkan keberadaan akun)
  const duplicate = await guest.request("/api/auth/sign-up/email", {
    method: "POST",
    body: { name: "Alice Tester", email: emailA, password: passwordA },
  });
  check(
    "S3  registrasi email terdaftar tidak membocorkan akun",
    duplicate.status === 200 && duplicate.json?.token === null,
    `status=${duplicate.status}`,
  );

  // S4: email tidak valid
  const invalidEmail = await guest.request("/api/auth/sign-up/email", {
    method: "POST",
    body: { name: "Bad", email: "bukan-email", password: passwordA },
  });
  check("S4  email tidak valid ditolak", invalidEmail.status >= 400, `status=${invalidEmail.status}`);

  // S5: password terlalu pendek
  const shortPassword = await guest.request("/api/auth/sign-up/email", {
    method: "POST",
    body: { name: "Short", email: `short-${stamp}@example.com`, password: "1234567" },
  });
  check(
    "S5  password di bawah minimum ditolak",
    shortPassword.status >= 400 && shortPassword.json?.code === "PASSWORD_TOO_SHORT",
    `code=${shortPassword.json?.code}`,
  );

  // S6: login sebelum verifikasi → ditolak (kebijakan)
  const earlyLogin = await user.request("/api/auth/sign-in/email", {
    method: "POST",
    body: { email: emailA, password: passwordA },
  });
  check(
    "S6  login sebelum verifikasi email ditolak",
    earlyLogin.status === 403 && earlyLogin.json?.code === "EMAIL_NOT_VERIFIED",
    `status=${earlyLogin.status} code=${earlyLogin.json?.code}`,
  );

  // S7: OTP salah
  const wrongOtp = await user.request("/api/auth/email-otp/verify-email", {
    method: "POST",
    body: { email: emailA, otp: "000000" },
  });
  check(
    "S7  verifikasi dengan kode salah ditolak",
    wrongOtp.status >= 400 && wrongOtp.json?.code === "INVALID_OTP",
    `code=${wrongOtp.json?.code}`,
  );

  // S8: kirim ulang sebelum cooldown → 429 + retryAfter
  const tooSoon = await guest.request("/api/auth/otp/send", {
    method: "POST",
    body: { email: emailA, type: "email-verification" },
  });
  check(
    "S8  resend sebelum cooldown ditolak server (429 + retryAfter)",
    tooSoon.status === 429 && typeof tooSoon.json?.data?.retryAfter === "number",
    `status=${tooSoon.status} retryAfter=${tooSoon.json?.data?.retryAfter}`,
  );

  // S9: OTP benar
  const verified = await user.request("/api/auth/email-otp/verify-email", {
    method: "POST",
    body: { email: emailA, otp },
  });
  check("S9  verifikasi dengan kode benar berhasil", verified.status === 200, `status=${verified.status}`);

  // S10: OTP sudah dipakai tidak bisa dipakai ulang
  const reused = await user.request("/api/auth/email-otp/verify-email", {
    method: "POST",
    body: { email: emailA, otp },
  });
  check(
    "S10 kode yang sudah dipakai ditolak",
    reused.status >= 400,
    `status=${reused.status} code=${reused.json?.code}`,
  );
}

console.log("\n== Login & proteksi sesi ==");
{
  const login = await user.request("/api/auth/sign-in/email", {
    method: "POST",
    body: { email: emailA, password: passwordA, rememberMe: true },
  });
  check("S11 login dengan kredensial valid berhasil", login.status === 200, `status=${login.status}`);

  const wrongPassword = createClient();
  const badLogin = await wrongPassword.request("/api/auth/sign-in/email", {
    method: "POST",
    body: { email: emailA, password: "password-salah" },
  });
  check(
    "S12 login dengan password salah ditolak",
    badLogin.status === 401 && badLogin.json?.code === "INVALID_EMAIL_OR_PASSWORD",
    `code=${badLogin.json?.code}`,
  );

  const anonymous = createClient();
  const denied = await anonymous.request("/api/me");
  check("S13 /api/me tanpa sesi → 401", denied.status === 401, `status=${denied.status}`);

  const allowed = await user.request("/api/me");
  check(
    "S14 /api/me dengan sesi valid → data user",
    allowed.status === 200 && allowed.json?.user?.email === emailA,
    `status=${allowed.status}`,
  );

  // body {} wajib: endpoint sign-out mendeklarasikan body schema
  // (client Better Auth juga selalu mengirim body JSON untuk POST)
  const signOut = await user.request("/api/auth/sign-out", {
    method: "POST",
    body: {},
  });
  const afterSignOut = await user.request("/api/me");
  check(
    "S15 setelah logout sesi tidak berlaku lagi",
    signOut.status === 200 && afterSignOut.status === 401,
    `signOut=${signOut.status} me=${afterSignOut.status}`,
  );
}

console.log("\n== Batas percobaan kode (allowedAttempts) ==\n");
{
  // akun khusus untuk menguji allowedAttempts.
  // Catatan: rate limit Better Auth untuk /email-otp/verify-email (3/menit)
  // berlaku per-IP, jadi setiap percobaan di bawah menunggu jendela bila kena 429.
  const emailAttempt = `carol-${stamp}@example.com`;
  await guest.request("/api/auth/sign-up/email", {
    method: "POST",
    body: { name: "Carol", email: emailAttempt, password: passwordA },
  });
  await smtp.waitForOtp(emailAttempt);

  /** kirim kode salah; bila kena 429, tunggu jendela lalu ulangi */
  async function wrongAttempt() {
    let last = null;

    for (let i = 0; i < 5; i += 1) {
      last = await guest.request("/api/auth/email-otp/verify-email", {
        method: "POST",
        body: { email: emailAttempt, otp: "111111" },
      });

      if (last.status !== 429) return last;

      console.log("  … kena rate limit (429), menunggu 62 detik …");
      await sleep(62_000);
    }

    return last;
  }

  // allowedAttempts = 5 → percobaan ke-6 (setelah 5 gagal) harus diblokir
  let last = null;
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    last = await wrongAttempt();
  }

  check(
    "S16 melebihi batas percobaan → kode diblokir",
    last?.json?.code === "TOO_MANY_ATTEMPTS",
    `status=${last?.status} code=${last?.json?.code}`,
  );
}

console.log("\n== Lupa & reset password ==");
{
  const loginWithOld = createClient();
  const oldLogin = await loginWithOld.request("/api/auth/sign-in/email", {
    method: "POST",
    body: { email: emailA, password: passwordA },
  });
  check("S17 sesi lama masih berfungsi sebelum reset", oldLogin.status === 200, `status=${oldLogin.status}`);

  const requestReset = await guest.request("/api/auth/otp/send", {
    method: "POST",
    body: { email: emailA, type: "forget-password" },
  });
  check("S18 permintaan kode reset diterima", requestReset.status === 200, `status=${requestReset.status}`);

  const resetOtp = await smtp.waitForOtp(emailA);

  const reset = await guest.request("/api/auth/email-otp/reset-password", {
    method: "POST",
    body: { email: emailA, otp: resetOtp, password: passwordANew },
  });
  check("S19 reset password dengan kode valid berhasil", reset.status === 200, `status=${reset.status}`);

  const reuseResetOtp = await guest.request("/api/auth/email-otp/reset-password", {
    method: "POST",
    body: { email: emailA, otp: resetOtp, password: "LainLagi!123" },
  });
  check(
    "S20 kode reset tidak bisa dipakai ulang",
    reuseResetOtp.status >= 400,
    `status=${reuseResetOtp.status}`,
  );

  const newLogin = createClient();
  const newLoginResult = await newLogin.request("/api/auth/sign-in/email", {
    method: "POST",
    body: { email: emailA, password: passwordANew },
  });
  check("S21 login dengan password baru berhasil", newLoginResult.status === 200, `status=${newLoginResult.status}`);

  const oldPasswordLogin = createClient();
  const oldPasswordResult = await oldPasswordLogin.request("/api/auth/sign-in/email", {
    method: "POST",
    body: { email: emailA, password: passwordA },
  });
  check(
    "S22 password lama sudah tidak berlaku",
    oldPasswordResult.status === 401,
    `status=${oldPasswordResult.status}`,
  );

  const sessionAfterReset = await loginWithOld.request("/api/me");
  check(
    "S23 sesi lama dicabut setelah reset password",
    sessionAfterReset.status === 401,
    `status=${sessionAfterReset.status}`,
  );
}

console.log("\n== Kegagalan penyedia email & kebersihan konfigurasi ==");
{
  // cooldown emailA sudah lewat (registrasi di awal test), jadi kirim ulang
  // seharusnya diizinkan → tapi provider dimatikan dulu untuk menguji kejujuran.
  await smtp.close();
  await sleep(500);

  const resend = await guest.request("/api/auth/otp/send", {
    method: "POST",
    body: { email: emailA, type: "email-verification" },
  });
  check(
    "S24 provider email mati → permintaan GAGAL (bukan sukses palsu)",
    resend.status >= 500,
    `status=${resend.status} message=${resend.json?.message}`,
  );

  const html = await (await fetch(`${BASE}/login`)).text();
  const leaked = ["BETTER_AUTH_SECRET", "SMTP_PASSWORD", "DATABASE_URL"].filter((key) =>
    html.includes(key),
  );
  check(
    "S25 tidak ada rahasia di HTML yang dikirim ke browser",
    leaked.length === 0,
    leaked.length ? `terdeteksi: ${leaked.join(", ")}` : "bersih",
  );
}

console.log("\n== Render halaman (navigasi Vue & auto-import komponen) ==\n");
{
  const problems = [];

  const guestPages = [
    { path: "/register", marker: "Create your account" },
    { path: "/login", marker: "Welcome back" },
    { path: "/forgot-password", marker: "Forgot your password?" },
    { path: "/verify-email?email=render@example.com", marker: "Verification code" },
    { path: "/reset-password?email=render@example.com", marker: "New password" },
  ];

  for (const page of guestPages) {
    const html = await (await fetch(`${BASE}${page.path}`)).text();

    if (html.includes("Failed to resolve component")) {
      problems.push(`${page.path}: ada komponen yang gagal di-resolve`);
    }
    if (html.includes("data-nuxt-logs") && html.includes("\"error\"")) {
      problems.push(`${page.path}: ada error di log SSR`);
    }
    if (!html.includes(page.marker)) {
      problems.push(`${page.path}: marker "${page.marker}" tidak ada`);
    }
  }

  // halaman terproteksi & pintu arah: tanpa sesi harus redirect (bukan render)
  const dashboard = await fetch(`${BASE}/dashboard`, { redirect: "manual" });
  const home = await fetch(`${BASE}/`, { redirect: "manual" });

  if (dashboard.status !== 302) problems.push(`/dashboard → ${dashboard.status} (harus 302)`);
  if (home.status !== 302) problems.push(`/ → ${home.status} (harus 302)`);

  check(
    "S26 semua halaman render tanpa error & proteksi redirect berfungsi",
    problems.length === 0,
    problems.length ? problems.join("; ") : "bersih",
  );
}

/* --------------------------- ringkasan ---------------------------- */
const failed = results.filter((item) => !item.passed);
console.log(`\nRingkasan: ${results.length - failed.length}/${results.length} lulus.`);

if (failed.length > 0) {
  console.log("Gagal:");
  for (const item of failed) console.log(`  - ${item.name} ${item.detail}`);
  process.exitCode = 1;
}

process.exit(process.exitCode ?? 0);
