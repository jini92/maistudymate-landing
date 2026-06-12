/* MAISTUDYMATE landing — language toggle, scroll reveal, inquiry form */

document.documentElement.classList.add("js"); // enables reveal-on-scroll CSS (no-JS users see everything)

const CONFIG = {
  // Set to a Formspree/Getform-style endpoint to receive submissions as POST JSON.
  // Leave empty to fall back to a pre-filled mailto: draft.
  FORM_ENDPOINT: "",
  FALLBACK_EMAIL: "hello@maistudymate.com",
};

/* ---------- language toggle (VI default / KO) ---------- */
const LANG_KEY = "msm-lang";

function setLang(lang) {
  document.documentElement.dataset.lang = lang;
  document.documentElement.lang = lang;
  localStorage.setItem(LANG_KEY, lang);
  document.querySelectorAll("[data-setlang]").forEach((b) => {
    b.classList.toggle("active", b.dataset.setlang === lang);
  });
  // swap <option> labels (can't nest spans inside options)
  document.querySelectorAll("option[data-vi]").forEach((opt) => {
    opt.textContent = lang === "ko" ? opt.dataset.ko : opt.dataset.vi;
  });
  document.title =
    lang === "ko"
      ? "MAISTUDYMATE — 매일 새로 내리는 한국어 | 호치민"
      : "MAISTUDYMATE — Hôm nay vào quán, MAI nói tiếng Hàn | TP.HCM";
}

document.querySelectorAll("[data-setlang]").forEach((btn) => {
  btn.addEventListener("click", () => setLang(btn.dataset.setlang));
});
setLang(localStorage.getItem(LANG_KEY) || "vi");

/* body uses data-lang from <html>; mirror for CSS selectors */
new MutationObserver(() => {
  document.body.dataset.lang = document.documentElement.dataset.lang;
}).observe(document.documentElement, { attributes: true, attributeFilter: ["data-lang"] });
document.body.dataset.lang = document.documentElement.dataset.lang;

/* ---------- mobile menu ---------- */
const menuBtn = document.getElementById("menuBtn");
const nav = document.getElementById("nav");
menuBtn?.addEventListener("click", () => nav.classList.toggle("open"));
nav?.addEventListener("click", (e) => {
  if (e.target.tagName === "A") nav.classList.remove("open");
});

/* ---------- scroll reveal ---------- */
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add("in");
        io.unobserve(en.target);
      }
    });
  },
  { threshold: 0.12 }
);
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

/* ---------- CTA prefill (B2B / partner buttons preselect interest) ---------- */
document.querySelectorAll("[data-prefill]").forEach((a) => {
  a.addEventListener("click", () => {
    const sel = document.getElementById("f-interest");
    if (sel) sel.value = a.dataset.prefill;
  });
});

/* ---------- inquiry form ---------- */
const form = document.getElementById("inquiryForm");
const formMsg = document.getElementById("formMsg");

const MSG = {
  vi: {
    ok: "✓ Đã nhận đăng ký! Chúng tôi sẽ liên hệ qua Zalo trong vòng 24 giờ.",
    mailto: "Đang mở email soạn sẵn — bấm gửi để hoàn tất đăng ký.",
    invalid: "Vui lòng điền họ tên và số điện thoại.",
    fail: "Gửi không thành công — vui lòng nhắn Zalo hoặc email cho chúng tôi.",
  },
  ko: {
    ok: "✓ 신청이 접수되었습니다! 24시간 내 Zalo로 연락드립니다.",
    mailto: "메일 초안이 열립니다 — 전송 버튼을 누르면 신청이 완료됩니다.",
    invalid: "이름과 전화번호를 입력해 주세요.",
    fail: "전송에 실패했습니다 — Zalo 또는 이메일로 연락 주세요.",
  },
};

function showMsg(key, isErr) {
  const lang = document.documentElement.dataset.lang || "vi";
  formMsg.textContent = MSG[lang][key];
  formMsg.classList.add("show");
  formMsg.classList.toggle("err", !!isErr);
}

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());

  if (!data.name?.trim() || !data.phone?.trim()) {
    showMsg("invalid", true);
    return;
  }

  if (CONFIG.FORM_ENDPOINT) {
    try {
      const res = await fetch(CONFIG.FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ...data, lang: document.documentElement.dataset.lang, source: "landing" }),
      });
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      showMsg("ok");
    } catch {
      showMsg("fail", true);
    }
    return;
  }

  // no endpoint configured → mailto fallback
  const subject = `[MAISTUDYMATE] Inquiry — ${data.interest} — ${data.name}`;
  const body = [
    `Name: ${data.name}`,
    `Phone/Zalo: ${data.phone}`,
    `Email: ${data.email || "-"}`,
    `Interest: ${data.interest}`,
    `Topic: ${data.topic}`,
    `Level: ${data.level}`,
    `Message: ${data.message || "-"}`,
  ].join("\n");
  window.location.href = `mailto:${CONFIG.FALLBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  showMsg("mailto");
});
