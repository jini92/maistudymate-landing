/* MAISTUDYMATE — Join app prototype
   Screen flow + mock data + VI/KO toggle. No backend (demo only).
   Maps to D003: S1 board → S2 profile → S3 match → S4 confirm/pay → S5 done / S6 open-table. */

/* ---------- i18n ---------- */
const LANG_KEY = "msm-join-lang";
function setLang(l) {
  document.documentElement.dataset.lang = l;
  document.documentElement.lang = l;
  localStorage.setItem(LANG_KEY, l);
  document.querySelectorAll("[data-setlang]").forEach(b => b.classList.toggle("active", b.dataset.setlang === l));
}
document.querySelectorAll("[data-setlang]").forEach(b => b.addEventListener("click", () => setLang(b.dataset.setlang)));
setLang(localStorage.getItem(LANG_KEY) || "ko");

/* ---------- helpers ---------- */
const $ = s => document.querySelector(s);
const bi = (vi, ko) => `<span class="vi">${vi}</span><span class="ko">${ko}</span>`;
const TOPIC = {
  topik: bi("TOPIK", "TOPIK"),
  conversation: bi("Hội thoại", "회화"),
  kculture: bi("K-Culture", "K-컬처"),
  eps: bi("EPS-TOPIK", "EPS"),
};
const LEVELS = ["zero", "beginner", "intermediate", "advanced"];
const LEVEL_LABEL = {
  zero: bi("Mới", "입문"), beginner: bi("Sơ cấp", "초급"),
  intermediate: bi("Trung cấp", "중급"), advanced: bi("Cao cấp", "고급"),
};

/* ---------- mock board (today) ---------- */
const SESSIONS = [
  { id: "s1", time: "09:30", topic: "conversation", level: "beginner", type: "paid",
    name: bi("Cà phê &amp; Hội thoại — Sơ cấp", "카페 회화테이블 — 초급"),
    meta: bi("Bàn 3 · Tutor Linh · 60ph", "3번 · 린 튜터 · 60분"), table: "3", dur: 60, price: 90000, seats: 2 },
  { id: "s2", time: "11:00", topic: "topik", level: "intermediate", type: "peer",
    name: bi("Bàn tự học: TOPIK", "셀프 스터디: TOPIK"),
    meta: bi("Bàn 4 · ghép cùng chủ đề · 2/4 đang mở", "4번 · 같은 공부끼리 · 2/4명 모집 중"), table: "4", dur: 60, price: 0, seats: 4 },
  { id: "s3", time: "14:00", topic: "topik", level: "intermediate", type: "paid",
    name: bi("TOPIK II — Đọc hiểu", "TOPIK II — 읽기"),
    meta: bi("Bàn 1 · Tutor Minh · 90ph", "1번 · 민 튜터 · 90분"), table: "1", dur: 90, price: 120000, seats: 1 },
  { id: "s4", time: "17:30", topic: "kculture", level: "zero", type: "paid",
    name: bi("K-Culture: học qua lời K-pop", "K-컬처: 가사로 배우는 한국어"),
    meta: bi("Lounge · 45ph · buổi đầu 0₫", "라운지 · 45분 · 첫 회 무료"), table: "L", dur: 45, price: 0, seats: 8, freeTrial: true },
  { id: "s5", time: "19:00", topic: "conversation", level: "intermediate", type: "paid",
    name: bi("Hội thoại tối — Trung cấp", "저녁 회화테이블 — 중급"),
    meta: bi("Bàn 2 · Tutor Hà · 60ph", "2번 · 하 튜터 · 60분"), table: "2", dur: 60, price: 90000, seats: 4 },
];
const vnd = n => n === 0 ? bi("0₫", "무료") : (n / 1000) + "k₫";

/* ---------- state ---------- */
const state = { topic: null, level: null, name: "", zalo: "", session: null, pay: null, credits: +(localStorage.getItem("msm-credits") || 0) };
function renderCredits() { const el = $("#creditCount"); if (el) el.textContent = state.credits; }

/* ---------- screen nav ---------- */
function go(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.toggle("active", s.dataset.screen === id));
  $("#app").scrollTop = 0;
  window.scrollTo(0, 0);
}
document.querySelectorAll("[data-go]").forEach(b => b.addEventListener("click", () => go(b.dataset.go)));

/* ---------- S1: board ---------- */
function statusChip(s) {
  if (s.seats <= 0) return `<span class="chip full">${bi("Hết", "마감")}</span>`;
  if (s.price === 0 && s.type === "peer") return `<span class="chip free">${bi("0₫", "무료")}</span>`;
  if (s.freeTrial) return `<span class="chip free">FREE</span>`;
  if (s.seats <= 1) return `<span class="chip hot">${bi("Sắp đầy", "마감임박")}</span>`;
  return `<span class="chip open">${bi(`Còn ${s.seats}`, `${s.seats}석`)}</span>`;
}
function cardHTML(s, onclickAttr) {
  const cls = "card" + (s.type === "peer" ? " peer" : "") + (s.seats <= 0 ? " full" : "");
  return `<button class="${cls}" ${s.seats > 0 ? onclickAttr : "disabled"}>
    <span class="time">${s.time}</span>
    <span><span class="name">${s.name}</span><span class="meta">${s.meta}</span></span>
    ${statusChip(s)}
  </button>`;
}
function renderBoard() {
  $("#board").innerHTML = SESSIONS.map(s => cardHTML(s, `data-pick="${s.id}"`)).join("");
  bindPick("#board");
}
function bindPick(scope) {
  document.querySelectorAll(`${scope} [data-pick]`).forEach(b =>
    b.addEventListener("click", () => { state.session = SESSIONS.find(x => x.id === b.dataset.pick); go("s2"); }));
}

/* ---------- S2: profile (segmented + fields) ---------- */
document.querySelectorAll(".seg").forEach(seg => {
  seg.addEventListener("click", e => {
    const btn = e.target.closest("button"); if (!btn) return;
    seg.querySelectorAll("button").forEach(b => b.classList.remove("sel"));
    btn.classList.add("sel");
    const f = seg.dataset.field;
    if (f) state[f] = btn.dataset.val;
  });
});
$("#toMatch").addEventListener("click", () => {
  state.name = $("#fName").value.trim();
  state.zalo = $("#fZalo").value.trim();
  // prefill defaults if user skipped (demo tolerant)
  if (!state.topic) state.topic = state.session ? state.session.topic : "topik";
  if (!state.level) state.level = "intermediate";
  if (state.name) localStorage.setItem("msm-name", state.name);
  renderMatch();
  go("s3");
});

/* ---------- S3: match ---------- */
function levelNear(a, b) { return Math.abs(LEVELS.indexOf(a) - LEVELS.indexOf(b)) <= 1; }
function renderMatch() {
  $("#matchMeta").innerHTML = `${bi("Chủ đề", "주제")}=${TOPIC[state.topic]} · ${bi("Trình độ", "레벨")}=${LEVEL_LABEL[state.level]}`;
  const matches = SESSIONS.filter(s => s.topic === state.topic && levelNear(s.level, state.level) && s.seats > 0);
  const list = matches.length ? matches : SESSIONS.filter(s => s.seats > 0).slice(0, 2); // fallback: open tables
  $("#matchList").innerHTML = list.map(s => cardHTML(s, `data-sel="${s.id}"`)).join("")
    || `<p class="hint">${bi("Chưa có bàn phù hợp.", "맞는 테이블이 없어요.")}</p>`;
  document.querySelectorAll('#matchList [data-sel]').forEach(b =>
    b.addEventListener("click", () => { state.session = SESSIONS.find(x => x.id === b.dataset.sel); renderConfirm(); go("s4"); }));
}

/* ---------- S4: confirm + pay ---------- */
function renderConfirm() {
  const s = state.session, free = s.price === 0;
  $("#confirmCard").innerHTML = `
    <div class="nm">${s.name}</div>
    <div class="sub">${s.time} · ${bi("Bàn", "테이블")} ${s.table} · ${s.dur}${bi("ph", "분")}</div>
    ${free ? `<div class="price free">${bi("Miễn phí", "무료")}</div>` : ``}`;
  if (free) {
    $("#payBlock").innerHTML = `
      <p class="drinknote">☕ ${bi("Vé vào = một ly nước (không cần thanh toán app)", "입장권은 음료 한 잔 (앱 결제 없음)")}</p>
      <button class="btn btn-jade wide" id="joinFree">${bi("Tham gia miễn phí", "무료로 조인")}</button>`;
    $("#joinFree").addEventListener("click", () => finishJoin());
    return;
  }
  // 유료: 선결제(예약가·10%↓) vs 현장 후불(현장가·정액)
  const fullK = s.price / 1000, preK = Math.round(s.price * 0.9 / 1000);
  state.timing = "prepay"; state.pay = null;
  function renderPay() {
    const pre = state.timing === "prepay";
    $("#payBlock").innerHTML =
      `<div class="timing">
        <button class="tm-opt ${pre ? "sel" : ""}" data-timing="prepay"><b>${preK}k₫</b>${bi("Trả trước · -10%", "선결제 예약가 · 10%↓")}</button>
        <button class="tm-opt ${pre ? "" : "sel"}" data-timing="onsite"><b>${fullK}k₫</b>${bi("Tại quán · sau buổi", "현장 결제 · 수업 후")}</button>
      </div>
      <p class="drinknote">💡 ${bi("Phí buổi học trả cho gia sư độc lập · quán nhận phí không gian và đồ uống", "세션비는 독립 강사에게 · 카페는 공간료·음료")}</p>` + (pre
        ? `<p class="paylabel">${bi("Thanh toán", "결제")}</p>
        <div class="pays"><div class="pay" data-pay="momo">MoMo</div><div class="pay" data-pay="zalopay">ZaloPay</div></div>
        <button class="btn btn-red wide" id="goBtn" disabled>${bi("Trả trước &amp; tham gia", "선결제하고 조인")}</button>`
        : `<p class="drinknote">${bi("Giữ chỗ — trả tại quầy sau buổi học (cần Zalo để xác nhận).", "좌석 예약 — 수업 후 카운터 결제 (확인용 Zalo 필요).")}</p>
        <button class="btn btn-ink wide" id="goBtn">${bi("Giữ chỗ (trả tại quán)", "현장 결제로 예약")}</button>`);
    document.querySelectorAll("#payBlock .tm-opt").forEach(b =>
      b.addEventListener("click", () => { state.timing = b.dataset.timing; state.pay = null; renderPay(); }));
    if (pre) {
      document.querySelectorAll("#payBlock .pay").forEach(p =>
        p.addEventListener("click", () => {
          document.querySelectorAll("#payBlock .pay").forEach(x => x.classList.remove("sel"));
          p.classList.add("sel"); state.pay = p.dataset.pay; $("#goBtn").disabled = false;
        }));
    }
    $("#goBtn").addEventListener("click", () => finishJoin());
  }
  renderPay();
}
function finishJoin(host = false) {
  const s = state.session;
  $("#doneTitle").innerHTML = host ? bi("Đã mở bàn!", "테이블을 열었어요!") : bi("Đã tham gia!", "조인 완료!");
  const fullK = s.price / 1000, preK = Math.round(s.price * 0.9 / 1000);
  const paidStr = !s.price ? "" : (state.timing === "onsite"
    ? " · " + bi(`tại quán ${fullK}k (sau buổi)`, `현장 ${fullK}k(수업 후)`)
    : " · " + bi(`trả trước ${preK}k ✓`, `선결제 ${preK}k ✓`));
  const line = host
    ? bi("Đang chờ bạn học cùng chủ đề tham gia...", "같은 공부 손님이 합류하길 기다리는 중...")
    : `${s.time} · ${s.dur}${bi("ph", "분")}${paidStr}`;
  $("#doneTicket").innerHTML = `
    <div class="tbl">${bi(`Bàn ${s.table}`, `${s.table}번 테이블`)}</div>
    <div class="ses">${s.name}</div>
    <div class="tm">${line}</div>`;
  // MAI 크레딧 적립: 방문/조인 +1 · 호스트 보너스 +2 · 전문강사(유료) 세션 +1
  const earn = (host ? 2 : 1) + (s.price > 0 ? 1 : 0) + (s.price > 0 && state.timing === "prepay" ? 1 : 0);
  state.credits += earn;
  localStorage.setItem("msm-credits", state.credits);
  renderCredits();
  $("#earnLine").innerHTML = bi(`✶ +${earn}p! · Dùng cho không gian·đồ uống·chỗ ngồi (nạp +10%)`, `✶ +${earn}p 적립! · 공간·F&B·좌석에 사용 (충전 시 +10%)`);
  go("s5");
}

/* ---------- open a peer table (host): claim an empty table ---------- */
const TABLES = [
  { n: "1", st: "busy" }, { n: "2", st: "busy" }, { n: "3", st: "free" },
  { n: "4", st: "open" }, { n: "5", st: "free" }, { n: "6", st: "free" },
];
function renderTables() {
  state.claimTable = null;
  $("#claimBtn").disabled = true;
  $("#tableGrid").innerHTML = TABLES.map(t => {
    const label = t.st === "busy" ? bi("đang dùng", "사용중") : t.st === "open" ? bi("đang mở", "모집중") : bi("trống", "빈자리");
    const dis = t.st === "free" ? `data-table="${t.n}"` : "disabled";
    return `<button class="tcell ${t.st}" ${dis}><b>${t.n}</b><span>${label}</span></button>`;
  }).join("");
  document.querySelectorAll("#tableGrid [data-table]").forEach(b =>
    b.addEventListener("click", () => {
      document.querySelectorAll("#tableGrid .tcell").forEach(x => x.classList.remove("picked"));
      b.classList.add("picked"); state.claimTable = b.dataset.table; $("#claimBtn").disabled = false;
    }));
}
$("#openTableBtn").addEventListener("click", () => { renderTables(); go("s7"); });
$("#claimBtn").addEventListener("click", () => {
  state.session = { name: bi("Bàn self-study của bạn", "내가 연 셀프 스터디 테이블"), time: "now", table: state.claimTable, dur: 60, price: 0, type: "peer", host: true };
  finishJoin(true);
});

/* ---------- S6: open-table request ---------- */
$("#openSubmit").addEventListener("click", () => { $("#openOk").hidden = false; });
function syncOpenMeta() {
  $("#openMeta").innerHTML = `${bi("Chủ đề", "주제")}=${TOPIC[state.topic] || "—"} · ${bi("Trình độ", "레벨")}=${LEVEL_LABEL[state.level] || "—"}`;
}
document.querySelector('[data-go="s6"]').addEventListener("click", syncOpenMeta);

/* ---------- done actions (demo) ---------- */
$("#addHome").addEventListener("click", () => alert(document.documentElement.dataset.lang === "ko"
  ? "데모: 브라우저 메뉴 → '홈 화면에 추가' (PWA)" : "Demo: trình duyệt → 'Thêm vào màn hình chính' (PWA)"));
$("#zaloSub").addEventListener("click", () => alert(document.documentElement.dataset.lang === "ko"
  ? "데모: Zalo OA 친구추가(Quan tâm) = 회원가입. 세션 리마인드·크레딧·오픈알림을 Zalo로 받습니다." : "Demo: Kết bạn Zalo OA (Quan tâm) = đăng ký. Nhận lịch · điểm · thông báo bàn mở qua Zalo."));

/* ---------- reset ---------- */
$("#resetBtn").addEventListener("click", () => {
  Object.assign(state, { topic: null, level: null, name: "", zalo: "", session: null, pay: null });
  document.querySelectorAll(".seg .sel").forEach(b => b.classList.remove("sel"));
  $("#fName").value = ""; $("#fZalo").value = "";
  $("#openOk").hidden = true;
  $("#earnLine").innerHTML = "";
  go("s1");
});

/* ---------- init ---------- */
renderBoard();
renderCredits();
const savedName = localStorage.getItem("msm-name");
if (savedName) $("#fName").value = savedName; // re-visit prefill (R1/R8)
