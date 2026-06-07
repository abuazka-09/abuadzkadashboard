const credentials = {
  Admin: { password: "123456", label: "Administrator", canEdit: true, canInput: true, readOnly: false },
  Staff: { password: "111111", label: "Staff Operasional", canEdit: false, canInput: true, readOnly: false },
  Owner: { password: "000000", label: "Owner Monitoring", canEdit: false, canInput: false, readOnly: true }
};

const titles = {
  main: "Dashboard Utama",
  attendance: "Absensi Karyawan",
  inventory: "Daftar Inventaris Perusahaan",
  stock: "Stock Barang",
  finance: "Laporan Keuangan"
};

const starterData = {
  attendance: [
    { id: 1, name: "Andi Pratama", division: "IT Support", date: "2026-06-07", status: "Hadir", in: "08:02", out: "17:00", photo: "", note: "Tepat waktu" },
    { id: 2, name: "Siti Aisyah", division: "Finance", date: "2026-06-07", status: "Hadir", in: "07:58", out: "17:04", photo: "", note: "Produktif" },
    { id: 3, name: "Budi Santoso", division: "Warehouse", date: "2026-06-07", status: "Izin", in: "-", out: "-", photo: "", note: "Urusan keluarga" },
    { id: 4, name: "Dewi Lestari", division: "Admin", date: "2026-06-07", status: "Hadir", in: "08:15", out: "17:05", photo: "", note: "Terlambat 15 menit" }
  ],
  inventory: [
    { id: 1, item: "Laptop Dell XPS 13", code: "INV-001", owner: "IT", location: "Ruang Server", condition: "Baik", value: 18500000 },
    { id: 2, item: "Proyektor Epson EB-X51", code: "INV-002", owner: "Marketing", location: "Meeting Room", condition: "Baik", value: 7200000 },
    { id: 3, item: "Meja Direktur Premium", code: "INV-003", owner: "Owner", location: "Office 1", condition: "Baik", value: 9800000 },
    { id: 4, item: "Printer LaserJet Pro", code: "INV-004", owner: "Admin", location: "Front Office", condition: "Perawatan", value: 4100000 }
  ],
  stock: [
    { id: 1, item: "Mouse Wireless", sku: "STK-101", category: "Aksesoris", qty: 5, min: 10, unit: "Unit", supplier: "TechnoMart" },
    { id: 2, item: "Keyboard Mechanical", sku: "STK-102", category: "Aksesoris", qty: 8, min: 12, unit: "Unit", supplier: "DigiSupply" },
    { id: 3, item: "Kertas A4 Premium", sku: "STK-103", category: "ATK", qty: 58, min: 30, unit: "Rim", supplier: "PaperOne" },
    { id: 4, item: "Tinta Printer Hitam", sku: "STK-104", category: "ATK", qty: 14, min: 8, unit: "Botol", supplier: "OfficeHub" }
  ],
  finance: [
    { id: 1, date: "2026-06-01", type: "Pemasukan", category: "Project Dashboard", desc: "DP dashboard custom", amount: 45000000 },
    { id: 2, date: "2026-06-03", type: "Pengeluaran", category: "Operasional", desc: "Lisensi software desain", amount: 6200000 },
    { id: 3, date: "2026-06-05", type: "Pemasukan", category: "Maintenance", desc: "Retainer bulanan", amount: 18000000 },
    { id: 4, date: "2026-06-06", type: "Pengeluaran", category: "Gaji", desc: "Payroll tim kreatif", amount: 13500000 }
  ]
};

let state = JSON.parse(localStorage.getItem("abuAdzkaDashboardState") || "null") || starterData;
let currentUser = JSON.parse(sessionStorage.getItem("abuAdzkaSession") || "null");
let activeView = "main";
let editing = null;

const $ = (selector) => document.querySelector(selector);

function saveState() {
  localStorage.setItem("abuAdzkaDashboardState", JSON.stringify(state));
}

function money(value) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

function shortMoney(value) {
  if (value >= 1000000000) return `Rp ${(value / 1000000000).toFixed(1).replace(".", ",")} M`;
  if (value >= 1000000) return `Rp ${(value / 1000000).toFixed(1).replace(".", ",")} Jt`;
  return money(value);
}

function roleRules() {
  return currentUser ? credentials[currentUser.name] : credentials.Owner;
}

function canWrite() {
  return roleRules().canInput || roleRules().canEdit;
}

function canEditRows() {
  return roleRules().canEdit;
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2400);
}

function setNotice() {
  const notice = $("#permissionNotice");
  if (!currentUser) return;
  if (activeView === "main") {
    notice.classList.add("hidden");
    return;
  }
  const text = {
    Admin: "Mode Admin aktif: Anda dapat menambah, mengedit, dan menghapus seluruh data.",
    Staff: "Mode Staff aktif: Anda dapat menginput data baru. Edit dan hapus data dikunci untuk administrator.",
    Owner: "Mode Owner aktif: seluruh data tersedia sebagai monitoring read-only."
  }[currentUser.name];
  notice.textContent = text;
  notice.classList.remove("hidden");
}

function login(user, pass) {
  const normalized = Object.keys(credentials).find((name) => name.toLowerCase() === user.trim().toLowerCase());
  if (!normalized || credentials[normalized].password !== pass) return false;
  currentUser = { name: normalized };
  sessionStorage.setItem("abuAdzkaSession", JSON.stringify(currentUser));
  $("#loginScreen").classList.add("hidden");
  $("#appShell").classList.remove("hidden");
  $("#profileName").textContent = normalized;
  $("#profileRole").textContent = credentials[normalized].label;
  $("#roleCaption").textContent = credentials[normalized].label;
  render();
  return true;
}

function logout() {
  currentUser = null;
  sessionStorage.removeItem("abuAdzkaSession");
  $("#appShell").classList.add("hidden");
  $("#loginScreen").classList.remove("hidden");
  $("#password").value = "";
}

function switchView(view) {
  activeView = view;
  editing = null;
  $(".view.active")?.classList.remove("active");
  $(`#view-${view}`).classList.add("active");
  document.querySelectorAll(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  $("#viewTitle").textContent = titles[view];
  $(".sidebar").classList.remove("open");
  render();
}

function render() {
  if (!currentUser) return;
  setNotice();
  renderDashboard();
  if (activeView === "attendance") renderAttendance();
  if (activeView === "inventory") renderInventory();
  if (activeView === "stock") renderStock();
  if (activeView === "finance") renderFinance();
}

function renderDashboard() {
  const uniqueEmployees = new Set(state.attendance.map((row) => row.name)).size + 124;
  const inventoryTotal = state.inventory.length + 348;
  const stockTotal = state.stock.reduce((sum, row) => sum + Number(row.qty), 0) + 1160;
  const income = state.finance.filter((row) => row.type === "Pemasukan").reduce((sum, row) => sum + Number(row.amount), 0);
  const expense = state.finance.filter((row) => row.type === "Pengeluaran").reduce((sum, row) => sum + Number(row.amount), 0);

  $("#metricEmployees").textContent = uniqueEmployees;
  $("#metricInventory").textContent = inventoryTotal;
  $("#metricStock").textContent = stockTotal.toLocaleString("id-ID");
  $("#metricProfit").textContent = shortMoney(income - expense + 156800000);

  $("#activityList").innerHTML = [
    ["Karyawan baru ditambahkan", "Andi Pratama bergabung sebagai Staff IT", "2 jam lalu"],
    ["Inventaris diperbarui", "Laptop Dell XPS 13 ditambahkan", "5 jam lalu"],
    ["Stock barang masuk", "58 rim Kertas A4 Premium tersedia", "1 hari lalu"],
    ["Laporan keuangan dibuat", "Laporan Juni 2026 berhasil disimpan", "2 hari lalu"]
  ].map((item, index) => `
    <div class="activity-item">
      <div class="activity-icon">${["HR", "INV", "STK", "FIN"][index]}</div>
      <div><strong>${item[0]}</strong><small>${item[1]}</small></div>
      <small>${item[2]}</small>
    </div>
  `).join("");

  const lowRows = state.stock.filter((row) => Number(row.qty) <= Number(row.min)).slice(0, 4);
  $("#lowStockList").innerHTML = lowRows.map((row) => `
    <div class="low-row">
      <strong>${row.item}</strong>
      <span>Tersisa ${row.qty} ${row.unit}</span>
    </div>
  `).join("") || `<p class="muted">Tidak ada stock menipis.</p>`;
}

function pageShell(kind, heading, subheading, fields, rowsHtml, summaryHtml = "") {
  const disabled = canWrite() ? "" : "disabled";
  const submitText = editing ? "Simpan Perubahan" : "Tambah Data";
  const formHtml = fields.map((field) => {
    const value = editing?.[field.name] ?? field.value ?? "";
    const options = field.options ? field.options.map((option) => `<option ${String(value) === option ? "selected" : ""}>${option}</option>`).join("") : "";
    const input = field.type === "file"
      ? `<input name="${field.name}" type="file" accept="${field.accept || "image/*"}" ${field.capture ? `capture="${field.capture}"` : ""} ${disabled} ${field.required ? "required" : ""}>`
      : field.options
      ? `<select name="${field.name}" ${disabled}>${options}</select>`
      : `<input name="${field.name}" type="${field.type || "text"}" value="${value}" placeholder="${field.placeholder || ""}" ${disabled} ${field.required === false ? "" : "required"}>`;
    return `<label class="${field.full ? "full" : ""}"><span>${field.label}</span>${input}</label>`;
  }).join("");

  return `
    <div class="data-layout">
      <article class="panel form-panel">
        <div class="section-head">
          <div>
            <h3>${heading}</h3>
            <p>${subheading}</p>
          </div>
        </div>
        ${summaryHtml}
        <form data-form="${kind}">
          <div class="form-grid">${formHtml}</div>
          <button class="primary-btn" type="submit" ${disabled}>${submitText}</button>
          ${editing ? `<button class="table-btn" type="button" data-cancel-edit>Batal Edit</button>` : ""}
        </form>
      </article>
      <article class="panel table-panel">
        <div class="toolbar">
          <div>
            <h3>Database ${titles[kind]}</h3>
            <p class="muted">Data demo tersimpan otomatis di browser.</p>
          </div>
          <button class="table-btn" data-reset="${kind}">Reset Data</button>
        </div>
        <div class="table-wrap">${rowsHtml}</div>
      </article>
    </div>
  `;
}

function actionButtons(kind, id) {
  return `
    <div class="table-actions">
      <button class="table-btn" data-edit="${kind}:${id}" ${canEditRows() ? "" : "disabled"}>Edit</button>
      <button class="table-btn delete" data-delete="${kind}:${id}" ${canEditRows() ? "" : "disabled"}>Hapus</button>
    </div>
  `;
}

function renderAttendance() {
  $("#view-attendance").innerHTML = pageShell("attendance", "Input Absensi", "Kelola data kehadiran karyawan.", [
    { name: "name", label: "Nama Karyawan", placeholder: "Nama lengkap" },
    { name: "division", label: "Divisi", placeholder: "Divisi" },
    { name: "date", label: "Tanggal", type: "date", value: new Date().toISOString().slice(0, 10) },
    { name: "status", label: "Status", options: ["Hadir", "Izin", "Sakit", "Alpha"] },
    { name: "in", label: "Jam Masuk", type: "time", required: false },
    { name: "out", label: "Jam Pulang", type: "time", required: false },
    { name: "photo", label: "Upload Foto (Kamera / Galeri)", type: "file", accept: "image/*", full: true, required: false },
    { name: "note", label: "Catatan", placeholder: "Keterangan", full: true, required: false }
  ], `
    <table>
      <thead><tr><th>Nama</th><th>Tanggal</th><th>Status</th><th>Masuk</th><th>Pulang</th><th>Foto</th><th>Catatan</th><th>Aksi</th></tr></thead>
      <tbody>${state.attendance.map((row) => `
        <tr>
          <td><strong>${row.name}</strong><small>${row.division}</small></td>
          <td>${row.date}</td>
          <td><span class="status-pill ${row.status === "Alpha" ? "bad" : row.status === "Izin" || row.status === "Sakit" ? "warn" : ""}">${row.status}</span></td>
          <td>${row.in || "-"}</td>
          <td>${row.out || "-"}</td>
          <td>${row.photo ? `<img class="attendance-photo" src="${row.photo}" alt="Bukti absensi ${row.name}">` : `<span class="photo-empty">Belum ada</span>`}</td>
          <td>${row.note || "-"}</td>
          <td>${actionButtons("attendance", row.id)}</td>
        </tr>`).join("")}</tbody>
    </table>
  `);
}

function renderInventory() {
  const totalValue = state.inventory.reduce((sum, row) => sum + Number(row.value), 0);
  $("#view-inventory").innerHTML = pageShell("inventory", "Input Inventaris", "Catat aset dan lokasi inventaris perusahaan.", [
    { name: "item", label: "Nama Inventaris", placeholder: "Nama barang" },
    { name: "code", label: "Kode Aset", placeholder: "INV-005" },
    { name: "owner", label: "Penanggung Jawab", placeholder: "Divisi / PIC" },
    { name: "location", label: "Lokasi", placeholder: "Lokasi aset" },
    { name: "condition", label: "Kondisi", options: ["Baik", "Perawatan", "Rusak", "Diganti"] },
    { name: "value", label: "Nilai Aset", type: "number", placeholder: "0" }
  ], `
    <table>
      <thead><tr><th>Inventaris</th><th>Kode</th><th>PIC</th><th>Lokasi</th><th>Kondisi</th><th>Nilai</th><th>Aksi</th></tr></thead>
      <tbody>${state.inventory.map((row) => `
        <tr>
          <td><strong>${row.item}</strong></td>
          <td>${row.code}</td>
          <td>${row.owner}</td>
          <td>${row.location}</td>
          <td><span class="status-pill ${row.condition === "Perawatan" ? "warn" : row.condition === "Rusak" ? "bad" : "info"}">${row.condition}</span></td>
          <td>${money(row.value)}</td>
          <td>${actionButtons("inventory", row.id)}</td>
        </tr>`).join("")}</tbody>
    </table>
  `, `<div class="metric-card gold"><span>Total Nilai Aset</span><strong>${shortMoney(totalValue)}</strong><small>${state.inventory.length} item tercatat</small></div>`);
}

function renderStock() {
  $("#view-stock").innerHTML = pageShell("stock", "Input Stock Barang", "Pantau stok masuk, sisa barang, dan supplier.", [
    { name: "item", label: "Nama Barang", placeholder: "Nama barang" },
    { name: "sku", label: "SKU", placeholder: "STK-105" },
    { name: "category", label: "Kategori", placeholder: "Kategori" },
    { name: "qty", label: "Jumlah", type: "number", placeholder: "0" },
    { name: "min", label: "Minimum Stock", type: "number", placeholder: "0" },
    { name: "unit", label: "Satuan", placeholder: "Unit / Rim" },
    { name: "supplier", label: "Supplier", placeholder: "Nama supplier", full: true }
  ], `
    <table>
      <thead><tr><th>Barang</th><th>SKU</th><th>Kategori</th><th>Jumlah</th><th>Minimum</th><th>Supplier</th><th>Status</th><th>Aksi</th></tr></thead>
      <tbody>${state.stock.map((row) => `
        <tr>
          <td><strong>${row.item}</strong></td>
          <td>${row.sku}</td>
          <td>${row.category}</td>
          <td>${row.qty} ${row.unit}</td>
          <td>${row.min} ${row.unit}</td>
          <td>${row.supplier}</td>
          <td><span class="status-pill ${Number(row.qty) <= Number(row.min) ? "bad" : "info"}">${Number(row.qty) <= Number(row.min) ? "Menipis" : "Aman"}</span></td>
          <td>${actionButtons("stock", row.id)}</td>
        </tr>`).join("")}</tbody>
    </table>
  `);
}

function renderFinance() {
  const income = state.finance.filter((row) => row.type === "Pemasukan").reduce((sum, row) => sum + Number(row.amount), 0);
  const expense = state.finance.filter((row) => row.type === "Pengeluaran").reduce((sum, row) => sum + Number(row.amount), 0);
  $("#view-finance").innerHTML = pageShell("finance", "Input Laporan Keuangan", "Buat catatan pemasukan dan pengeluaran.", [
    { name: "date", label: "Tanggal", type: "date", value: new Date().toISOString().slice(0, 10) },
    { name: "type", label: "Jenis", options: ["Pemasukan", "Pengeluaran"] },
    { name: "category", label: "Kategori", placeholder: "Kategori" },
    { name: "amount", label: "Nominal", type: "number", placeholder: "0" },
    { name: "desc", label: "Deskripsi", placeholder: "Keterangan transaksi", full: true }
  ], `
    <table>
      <thead><tr><th>Tanggal</th><th>Jenis</th><th>Kategori</th><th>Deskripsi</th><th>Nominal</th><th>Aksi</th></tr></thead>
      <tbody>${state.finance.map((row) => `
        <tr>
          <td>${row.date}</td>
          <td><span class="status-pill ${row.type === "Pengeluaran" ? "bad" : ""}">${row.type}</span></td>
          <td>${row.category}</td>
          <td>${row.desc}</td>
          <td>${money(row.amount)}</td>
          <td>${actionButtons("finance", row.id)}</td>
        </tr>`).join("")}</tbody>
    </table>
  `, `
    <div class="metric-grid" style="grid-template-columns:1fr 1fr;margin-bottom:16px">
      <article class="metric-card mint"><span>Pemasukan</span><strong>${shortMoney(income)}</strong><small>Total masuk</small></article>
      <article class="metric-card coral"><span>Pengeluaran</span><strong>${shortMoney(expense)}</strong><small>Total keluar</small></article>
    </div>
  `);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file || file.size === 0) return resolve("");
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function submitForm(form) {
  const kind = form.dataset.form;
  if (!canWrite()) {
    showToast("Mode Owner hanya dapat melihat data.");
    return;
  }
  const formData = new FormData(form);
  const record = Object.fromEntries(formData.entries());
  if (kind === "attendance") {
    const photoFile = form.querySelector('input[name="photo"]')?.files?.[0];
    const photoData = await readFileAsDataUrl(photoFile);
    if (photoData) record.photo = photoData;
    else if (editing?.photo) record.photo = editing.photo;
    else record.photo = "";
  }
  ["value", "qty", "min", "amount"].forEach((field) => {
    if (record[field] !== undefined) record[field] = Number(record[field] || 0);
  });
  if (editing && canEditRows()) {
    state[kind] = state[kind].map((row) => row.id === editing.id ? { ...row, ...record } : row);
    showToast("Data berhasil diperbarui.");
  } else {
    state[kind].unshift({ id: Date.now(), ...record });
    showToast("Data baru berhasil ditambahkan.");
  }
  editing = null;
  saveState();
  render();
}

function handleTableAction(target) {
  const editTarget = target.closest("[data-edit]");
  const deleteTarget = target.closest("[data-delete]");
  const resetTarget = target.closest("[data-reset]");
  const cancelTarget = target.closest("[data-cancel-edit]");

  if (cancelTarget) {
    editing = null;
    render();
    return;
  }
  if (resetTarget) {
    const kind = resetTarget.dataset.reset;
    if (!canEditRows()) return showToast("Reset data hanya untuk Admin.");
    state[kind] = structuredClone(starterData[kind]);
    saveState();
    render();
    showToast("Data demo dikembalikan.");
    return;
  }
  if (editTarget) {
    if (!canEditRows()) return showToast("Edit data hanya untuk Admin.");
    const [kind, id] = editTarget.dataset.edit.split(":");
    editing = state[kind].find((row) => row.id === Number(id));
    activeView = kind;
    render();
    showToast("Mode edit aktif.");
    return;
  }
  if (deleteTarget) {
    if (!canEditRows()) return showToast("Hapus data hanya untuk Admin.");
    const [kind, id] = deleteTarget.dataset.delete.split(":");
    state[kind] = state[kind].filter((row) => row.id !== Number(id));
    saveState();
    render();
    showToast("Data dihapus.");
  }
}

function exportCsv() {
  const rows = state[activeView];
  if (!Array.isArray(rows)) {
    showToast("Dashboard utama tidak memiliki tabel untuk diekspor.");
    return;
  }
  const headers = Object.keys(rows[0] || {});
  const csv = [headers.join(","), ...rows.map((row) => headers.map((header) => `"${String(row[header] ?? "").replaceAll('"', '""')}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${activeView}-abu-adzka.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

$("#loginForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const ok = login($("#username").value, $("#password").value);
  $("#loginError").textContent = ok ? "" : "User atau password tidak sesuai.";
});

document.querySelectorAll("[data-login]").forEach((button) => {
  button.addEventListener("click", () => {
    $("#username").value = button.dataset.login;
    $("#password").value = button.dataset.pass;
  });
});

document.querySelectorAll(".nav-item").forEach((button) => button.addEventListener("click", () => switchView(button.dataset.view)));
$("#logoutBtn").addEventListener("click", logout);
$("#menuToggle").addEventListener("click", () => $(".sidebar").classList.toggle("open"));
$("#themeToggle").addEventListener("click", () => document.body.classList.toggle("dark"));
$("#exportBtn").addEventListener("click", exportCsv);

document.addEventListener("submit", (event) => {
  if (event.target.matches("[data-form]")) {
    event.preventDefault();
    submitForm(event.target);
  }
});

document.addEventListener("click", (event) => handleTableAction(event.target));

$("#globalSearch").addEventListener("input", (event) => {
  const query = event.target.value.toLowerCase();
  const rows = document.querySelectorAll(".view.active tbody tr");
  rows.forEach((row) => row.style.display = row.textContent.toLowerCase().includes(query) ? "" : "none");
});

if (currentUser) {
  $("#loginScreen").classList.add("hidden");
  $("#appShell").classList.remove("hidden");
  $("#profileName").textContent = currentUser.name;
  $("#profileRole").textContent = credentials[currentUser.name].label;
  $("#roleCaption").textContent = credentials[currentUser.name].label;
  render();
}

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  });
}
