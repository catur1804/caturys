"use strict";
// Ubah daftar mata kuliah di sini sesuai jadwalmu.
const COURSES = ["Matematika Diskrit","Arsitektur dan Organisasi Komputer","Pengantar Pemrograman","Matematika Dasar","Media Sosial","Bahasa Indonesia","Lainnya"];
const KEY = "tugasku.v1";
const $ = s => document.querySelector(s);
const DAYS = ["Sen","Sel","Rab","Kam","Jum","Sab","Min"];

let S = { tasks: [], notifs: [], remind: 60 };
try { S = Object.assign(S, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

const pad = n => String(n).padStart(2, "0");
const dkey = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
let sel = dkey(new Date());
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt = iso => new Date(iso).toLocaleString("id-ID", {weekday:"short", day:"numeric", month:"short", hour:"2-digit", minute:"2-digit"}).replace(/\./g, ":") + " WIB";
const isLate = t => !t.done && new Date(t.due) < new Date();
const byDue = (a, b) => new Date(a.due) - new Date(b.due);

function toast(msg) {
  const el = document.createElement("div");
  el.className = "toast"; el.textContent = msg;
  $("#toasts").appendChild(el);
  setTimeout(() => el.remove(), 5000);
}

function notify(text) {
  S.notifs.unshift({ id: Date.now() + Math.random(), text, time: new Date().toISOString(), read: false });
  S.notifs = S.notifs.slice(0, 50);
  save(); toast(text); renderNotifs();
  if ("Notification" in window && Notification.permission === "granted") {
    try { new Notification("Tugasku", { body: text }); } catch (e) {}
  }
}

function checkDeadlines() {
  const now = Date.now(); let changed = false;
  S.tasks.forEach(t => {
    if (t.done) return;
    const diff = new Date(t.due) - now;
    t.sent = t.sent || {};
    if (diff < 0 && !t.sent.late) { t.sent.late = true; changed = true; notify(`Terlambat: "${t.title}" (${t.course}) sudah lewat batas waktu.`); }
    else if (diff >= 0 && diff <= S.remind * 60000 && !t.sent.soon) { t.sent.soon = true; changed = true; notify(`Segera: "${t.title}" (${t.course}) batas ${fmt(t.due)}.`); }
  });
  if (changed) { save(); render(); }
}

function renderWeek() {
  const now = new Date();
  const mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const dueKeys = new Set(S.tasks.filter(t => !t.done).map(t => t.due.slice(0, 10)));
  $("#week").innerHTML = DAYS.map((n, i) => {
    const d = new Date(mon); d.setDate(mon.getDate() + i);
    const k = dkey(d);
    return `<button class="day ${k===sel?"sel":""} ${dueKeys.has(k)?"has":""}" data-k="${k}" aria-label="${n} ${d.getDate()}">${n}<b>${d.getDate()}</b><i></i></button>`;
  }).join("");
  $("#todayLabel").textContent = "Hari ini: " + now.toLocaleDateString("id-ID", {day:"numeric", month:"long", year:"numeric"});
  const list = S.tasks.filter(t => t.due.slice(0, 10) === sel).sort(byDue);
  $("#dayList").innerHTML = list.length ? list.map(t => `
    <label class="mini ${isLate(t)?"late":""}"><input type="checkbox" data-done="${t.id}" ${t.done?"checked":""}>
    <span>${esc(t.title)}<small>${esc(t.course)} · ${new Date(t.due).toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"}).replace(".",":")} WIB</small></span></label>`).join("")
    : `<p class="empty">Tidak ada tugas di tanggal ini</p>`;
}

function renderTodo() {
  const open = S.tasks.filter(t => !t.done).sort(byDue);
  $("#todoCount").textContent = open.length;
  $("#todoList").innerHTML = open.length ? open.slice(0, 6).map(t => `
    <li class="${isLate(t)?"late":""}"><input type="checkbox" data-done="${t.id}" aria-label="Selesai">
    <div><strong>${esc(t.title)}</strong><small>${esc(t.course)}</small><small class="d">Batas: ${fmt(t.due)}</small></div></li>`).join("")
    : `<p class="empty">Semua beres. Buat tugas baru di kanan.</p>`;
  const done = S.tasks.filter(t => t.done).length, tot = S.tasks.length;
  $("#doneText").textContent = `Selesai: ${done} dari ${tot} tugas`;
  $("#doneBar").style.width = tot ? (done / tot * 100) + "%" : "0";
}

function renderTasks() {
  const q = $("#q").value.trim().toLowerCase(), st = $("#fStatus").value;
  const list = S.tasks.filter(t =>
    (st === "semua" || (st === "aktif" ? !t.done : t.done)) &&
    (!q || (t.title + " " + t.course).toLowerCase().includes(q))).sort(byDue);
  $("#taskGrid").innerHTML = list.length ? list.map(t => `
    <article class="task ${t.done?"done":""}">
      <span class="tag">${esc(t.course)}</span>
      <h3>${esc(t.title)}</h3>
      <div class="meta">Batas: ${fmt(t.due)}</div>
      <div><span class="tag ${esc(t.prio)}">Prioritas ${esc(t.prio)}</span> ${isLate(t)?'<span class="tag late">Terlambat</span>':""}</div>
      ${t.note ? `<div class="note">${esc(t.note)}</div>` : ""}
      <div class="btns">
        <button class="btn small" data-toggle="${t.id}">${t.done?"Buka lagi":"Tandai selesai"}</button>
        <button class="btn small ghost" data-edit="${t.id}">Ubah</button>
        <button class="btn small ghost" data-del="${t.id}">Hapus</button>
      </div>
    </article>`).join("") : `<p class="empty">Belum ada tugas. Isi formulir di atas untuk membuat tugas pertamamu.</p>`;
}

function renderNotifs() {
  const unread = S.notifs.filter(n => !n.read).length;
  $("#badge").hidden = !unread; $("#badge").textContent = unread;
  $("#notifList").innerHTML = S.notifs.length ? S.notifs.map(n => `
    <li class="${n.read?"":"unread"}">${esc(n.text)}<small>${new Date(n.time).toLocaleString("id-ID")}</small></li>`).join("")
    : `<li class="empty">Belum ada notifikasi</li>`;
  const p = $("#permBtn");
  if (!("Notification" in window)) p.hidden = true;
  else if (Notification.permission === "granted") { p.textContent = "Notifikasi browser aktif"; p.disabled = true; }
}

function render() { renderWeek(); renderTodo(); renderTasks(); renderNotifs(); }

function resetForm() {
  $("#taskForm").reset(); $("#editId").value = "";
  $("#formTitle").textContent = "Buat Tugas Baru"; $("#saveBtn").textContent = "Simpan tugas"; $("#cancelEdit").hidden = true;
}

// Events
$("#fCourse").innerHTML = COURSES.map(c => `<option>${esc(c)}</option>`).join("");
$("#remindSel").value = String(S.remind);
$("#remindSel").onchange = e => { S.remind = +e.target.value; S.tasks.forEach(t => t.sent && delete t.sent.soon); save(); checkDeadlines(); };

$("#taskForm").onsubmit = e => {
  e.preventDefault();
  const data = { title: $("#fTitle").value.trim(), course: $("#fCourse").value, prio: $("#fPrio").value, due: $("#fDue").value, note: $("#fNote").value.trim() };
  if (!data.title || !data.due) return;
  const id = $("#editId").value;
  if (id) {
    const t = S.tasks.find(x => x.id == id);
    if (t.due !== data.due) t.sent = {};
    Object.assign(t, data); toast("Tugas diperbarui");
  } else {
    S.tasks.push({ id: Date.now(), done: false, sent: {}, ...data });
    notify(`Tugas baru: "${data.title}" (${data.course}), batas ${fmt(data.due)}.`);
  }
  save(); resetForm(); render(); checkDeadlines();
};
$("#cancelEdit").onclick = resetForm;
$("#q").oninput = renderTasks; $("#fStatus").onchange = renderTasks;

document.addEventListener("click", e => {
  const el = e.target.closest("[data-k],[data-toggle],[data-edit],[data-del],[data-done]");
  if (el) {
    const d = el.dataset;
    if (d.k) { sel = d.k; renderWeek(); return; }
    const id = d.toggle || d.edit || d.del || d.done;
    const t = S.tasks.find(x => x.id == id); if (!t) return;
    if (d.toggle) t.done = !t.done;
    if (d.del) { if (!confirm("Hapus tugas ini?")) return; S.tasks = S.tasks.filter(x => x !== t); }
    if (d.edit) {
      $("#editId").value = t.id; $("#fTitle").value = t.title; $("#fCourse").value = t.course;
      $("#fPrio").value = t.prio; $("#fDue").value = t.due; $("#fNote").value = t.note || "";
      $("#formTitle").textContent = "Ubah Tugas"; $("#saveBtn").textContent = "Simpan perubahan"; $("#cancelEdit").hidden = false;
      $("#fTitle").focus(); window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (d.done) t.done = el.checked;
    save(); render(); return;
  }
  if (e.target.closest("#bellBtn")) { $("#notifPanel").hidden = !$("#notifPanel").hidden; return; }
  if (!e.target.closest("#notifPanel")) $("#notifPanel").hidden = true;
});
$("#readAll").onclick = () => { S.notifs.forEach(n => n.read = true); save(); renderNotifs(); };
$("#permBtn").onclick = async () => {
  if (!("Notification" in window)) return;
  const r = await Notification.requestPermission();
  toast(r === "granted" ? "Notifikasi browser aktif" : "Izin notifikasi ditolak. Notifikasi tetap muncul di dalam halaman.");
  renderNotifs();
};

render();
checkDeadlines();
setInterval(checkDeadlines, 30000);
