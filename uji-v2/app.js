const credentials = {
 Owner:{label:"Pemilik Usaha",canEdit:true,canInput:true},
 Admin:{label:"Administrator",canEdit:true,canInput:true},
 Staf:{label:"Staf Operasional",canEdit:false,canInput:true}
};

const titles = {
  main: "Dashboard Utama",
  attendance: "Absensi Karyawan",
  inventory: "Daftar Inventaris Perusahaan",
  stock: "Stock Barang",
  sales: "Laporan Penjualan",
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
  sales: [
    { id: 1, saleId: "INV-2026-001", productDesc: "Dashboard Custom Premium", vendorName: "Markaz Dakwah Digital", hpp: 8500000, sellPrice: 15000000, volume: 2, totalSales: 30000000, vendorPayment: 17000000, balance: 13000000 },
    { id: 2, saleId: "INV-2026-002", productDesc: "Paket PWA Company Profile", vendorName: "Creative Partner", hpp: 3200000, sellPrice: 6500000, volume: 3, totalSales: 19500000, vendorPayment: 9600000, balance: 9900000 },
    { id: 3, saleId: "INV-2026-003", productDesc: "Maintenance Dashboard Bulanan", vendorName: "Internal Team", hpp: 1200000, sellPrice: 3500000, volume: 4, totalSales: 14000000, vendorPayment: 4800000, balance: 9200000 }
  ],
  finance: [
    { id: 1, date: "2026-06-01", type: "Pemasukan", category: "Project Dashboard", desc: "DP dashboard custom", amount: 45000000 },
    { id: 2, date: "2026-06-03", type: "Pengeluaran", category: "Operasional", desc: "Lisensi software desain", amount: 6200000 },
    { id: 3, date: "2026-06-05", type: "Pemasukan", category: "Maintenance", desc: "Retainer bulanan", amount: 18000000 },
    { id: 4, date: "2026-06-06", type: "Pengeluaran", category: "Gaji", desc: "Payroll tim kreatif", amount: 13500000 }
  ]
};

let state = Object.fromEntries(Object.keys(starterData).map(k=>[k,[]]));
let currentUser = null;
let activeView = "main";
let editing = null;
const onlineEnabled = true;
const $ = s=>document.querySelector(s);
function safe(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function saveState(){}
function money(value) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

function shortMoney(value) {
  if (value >= 1000000000) return `Rp ${(value / 1000000000).toFixed(1).replace(".", ",")} M`;
  if (value >= 1000000) return `Rp ${(value / 1000000).toFixed(1).replace(".", ",")} Jt`;
  return money(value);
}

function roleRules() {
  return currentUser ? credentials[currentUser.role] : credentials.Owner;
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

function setNotice(){
 const el=$("#permissionNotice");el.classList.toggle("hidden",activeView==="main");
 el.textContent=currentUser?.role==="Staf"?"Staf: lihat laporan, tambah pesanan dan record operasional. Pembukuan hanya Owner/Admin.":"Pembukuan dikonfirmasi server. Data lama terpisah dari buku kas. Koreksi transaksi dibukukan dengan pembalik.";
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
  if (activeView === "sales") renderSales();
  if (activeView === "finance") renderFinance();
}

function renderDashboard() {
  const uniqueEmployees = new Set(state.attendance.map((row) => row.name)).size;
  const inventoryTotal = state.inventory.length;
  const stockTotal = state.stock.reduce((sum, row) => sum + Number(row.qty), 0);
  const salesProfit = (state.sales || []).reduce((sum, row) => sum + Number(row.balance || 0), 0);
  const income = state.finance.filter((row) => row.type === "Pemasukan").reduce((sum, row) => sum + Number(row.amount), 0) + salesProfit;
  const expense = state.finance.filter((row) => row.type === "Pengeluaran").reduce((sum, row) => sum + Number(row.amount), 0);

  $("#metricEmployees").textContent = uniqueEmployees;
  $("#metricInventory").textContent = inventoryTotal;
  $("#metricStock").textContent = stockTotal.toLocaleString("id-ID");
  $("#metricProfit").textContent = shortMoney(income - expense);

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
      <strong>${safe(row.item)}</strong>
      <span>Tersisa ${safe(row.qty)} ${safe(row.unit)}</span>
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
      : `<input name="${field.name}" type="${field.type || "text"}" value="${safe(value)}" placeholder="${field.placeholder || ""}" ${disabled} ${field.required === false ? "" : "required"}>`;
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
            <p class="muted">Catatan lama tersimpan per record di server. Terpisah dari buku kas baru.</p>
          </div>
          <button class="table-btn" data-reset="${kind}">Pulihkan Record</button>
        </div>
        <div class="table-wrap">${rowsHtml}</div>
      </article>
    </div>
  `;
}

function actionButtons(kind, id) {
  return `
    <div class="table-actions">
      <button class="table-btn" data-edit="${kind}:${safe(id)}" ${canEditRows() ? "" : "disabled"}>Edit</button>
      <button class="table-btn delete" data-delete="${kind}:${safe(id)}" ${canEditRows() ? "" : "disabled"}>Hapus</button>
    </div>
  `;
}

function renderAttendance() {
  $("#view-attendance").innerHTML = pageShell("attendance", "Input Absensi", "Kelola data kehadiran karyawan.", [
    { name: "name", label: "Nama Karyawan", placeholder: "Nama lengkap" },
    { name: "division", label: "Divisi", placeholder: "Divisi" },
    { name: "date", label: "Tanggal", type: "date", value: today() },
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
          <td><strong>${safe(row.name)}</strong><small>${safe(row.division)}</small></td>
          <td>${safe(row.date)}</td>
          <td><span class="status-pill ${row.status === "Alpha" ? "bad" : row.status === "Izin" || row.status === "Sakit" ? "warn" : ""}">${safe(row.status)}</span></td>
          <td>${safe(row.in || "-")}</td>
          <td>${safe(row.out || "-")}</td>
          <td>${photoCell(row)}</td>
          <td>${safe(row.note || "-")}</td>
          <td>${actionButtons("attendance", row.id)}</td>
        </tr>`).join("")}</tbody>
    </table>
  `);
}

function photoCell(row) {
 if(!row.photo)return '<span class="photo-empty">Belum ada</span>';
 if(/^data:image\/(png|jpeg|webp);base64,/.test(row.photo))return `<img class="attendance-photo" src="${safe(row.photo)}" alt="Bukti absensi">`;
 if(/^https:\/\//.test(row.photo))return `<a class="photo-link" href="${safe(row.photo)}" target="_blank" rel="noopener">Lihat Foto</a>`;
 return '<span>Format foto tidak didukung</span>';
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
          <td><strong>${safe(row.item)}</strong></td>
          <td>${safe(row.code)}</td>
          <td>${safe(row.owner)}</td>
          <td>${safe(row.location)}</td>
          <td><span class="status-pill ${row.condition === "Perawatan" ? "warn" : row.condition === "Rusak" ? "bad" : "info"}">${safe(row.condition)}</span></td>
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
          <td><strong>${safe(row.item)}</strong></td>
          <td>${safe(row.sku)}</td>
          <td>${safe(row.category)}</td>
          <td>${safe(row.qty)} ${safe(row.unit)}</td>
          <td>${safe(row.min)} ${safe(row.unit)}</td>
          <td>${safe(row.supplier)}</td>
          <td><span class="status-pill ${Number(row.qty) <= Number(row.min) ? "bad" : "info"}">${Number(row.qty) <= Number(row.min) ? "Menipis" : "Aman"}</span></td>
          <td>${actionButtons("stock", row.id)}</td>
        </tr>`).join("")}</tbody>
    </table>
  `);
}

function calculateSale(record) {
  const hpp = Number(record.hpp || 0);
  const sellPrice = Number(record.sellPrice || 0);
  const volume = Number(record.volume || 0);
  return {
    ...record,
    hpp,
    sellPrice,
    volume,
    totalSales: sellPrice * volume,
    vendorPayment: hpp * volume,
    balance: (sellPrice * volume) - (hpp * volume)
  };
}

function renderSales() {
  const rows = (state.sales || []).map(calculateSale);
  const totalSales = rows.reduce((sum, row) => sum + Number(row.totalSales), 0);
  const totalVendor = rows.reduce((sum, row) => sum + Number(row.vendorPayment), 0);
  const totalProfit = rows.reduce((sum, row) => sum + Number(row.balance), 0);
  const margin = totalSales > 0 ? Math.round((totalProfit / totalSales) * 100) : 0;

  $("#view-sales").innerHTML = pageShell("sales", "Input Laporan Penjualan", "Catat transaksi, modal vendor, total penjualan, dan profit bersih.", [
    { name: "saleId", label: "ID", placeholder: "INV-2026-001" },
    { name: "productDesc", label: "Deskripsi Produk", placeholder: "Nama produk atau jasa" },
    { name: "vendorName", label: "Nama Vendor", placeholder: "Supplier / vendor produk" },
    { name: "hpp", label: "HPP", type: "number", placeholder: "0" },
    { name: "sellPrice", label: "Harga Jual", type: "number", placeholder: "0" },
    { name: "volume", label: "Volume", type: "number", placeholder: "0" }
  ], `
    <table>
      <thead><tr><th>No.</th><th>ID</th><th>Deskripsi Produk</th><th>Nama Vendor</th><th>HPP</th><th>Harga Jual</th><th>Volume</th><th>Total Penjualan</th><th>Pembayaran Vendor</th><th>Saldo Akhir</th><th>Aksi</th></tr></thead>
      <tbody>${rows.map((row, index) => `
        <tr>
          <td>${index + 1}</td>
          <td><strong>${safe(row.saleId)}</strong></td>
          <td>${safe(row.productDesc)}</td>
          <td>${safe(row.vendorName)}</td>
          <td>${money(row.hpp)}</td>
          <td>${money(row.sellPrice)}</td>
          <td>${safe(row.volume)}</td>
          <td><strong>${money(row.totalSales)}</strong></td>
          <td>${money(row.vendorPayment)}</td>
          <td><span class="status-pill ${row.balance < 0 ? "bad" : "info"}">${money(row.balance)}</span></td>
          <td>${actionButtons("sales", row.id)}</td>
        </tr>`).join("")}</tbody>
    </table>
  `, `
    <div class="metric-grid" style="grid-template-columns:repeat(3,minmax(0,1fr));margin-bottom:16px">
      <article class="metric-card blue"><span>Total Penjualan</span><strong>${shortMoney(totalSales)}</strong><small>Omzet customer</small></article>
      <article class="metric-card gold"><span>Pembayaran Vendor</span><strong>${shortMoney(totalVendor)}</strong><small>Total modal</small></article>
      <article class="metric-card mint"><span>Saldo Akhir</span><strong>${shortMoney(totalProfit)}</strong><small>Margin ${margin}%</small></article>
    </div>
  `);
}

function renderFinance() {
  const income = state.finance.filter((row) => row.type === "Pemasukan").reduce((sum, row) => sum + Number(row.amount), 0);
  const expense = state.finance.filter((row) => row.type === "Pengeluaran").reduce((sum, row) => sum + Number(row.amount), 0);
  $("#view-finance").innerHTML = pageShell("finance", "Input Laporan Keuangan", "Buat catatan pemasukan dan pengeluaran.", [
    { name: "date", label: "Tanggal", type: "date", value: today() },
    { name: "type", label: "Jenis", options: ["Pemasukan", "Pengeluaran"] },
    { name: "category", label: "Kategori", placeholder: "Kategori" },
    { name: "amount", label: "Nominal", type: "number", placeholder: "0" },
    { name: "desc", label: "Deskripsi", placeholder: "Keterangan transaksi", full: true }
  ], `
    <table>
      <thead><tr><th>Tanggal</th><th>Jenis</th><th>Kategori</th><th>Deskripsi</th><th>Nominal</th><th>Aksi</th></tr></thead>
      <tbody>${state.finance.map((row) => `
        <tr>
          <td>${safe(row.date)}</td>
          <td><span class="status-pill ${row.type === "Pengeluaran" ? "bad" : ""}">${safe(row.type)}</span></td>
          <td>${safe(row.category)}</td>
          <td>${safe(row.desc)}</td>
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

function exportCsv() {
  const rows = state[activeView];
  if (!Array.isArray(rows)) {
    showToast("Dashboard utama tidak memiliki tabel untuk diekspor.");
    return;
  }
  const headers = Object.keys(rows[0] || {});
  const csv = [headers.join(","), ...rows.map((row) => headers.map((header) => `"${csvSafe(row[header]).replaceAll('"', '""')}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${activeView}-abu-adzka.csv`;
  link.click();
  URL.revokeObjectURL(url);
}


function csvSafe(value){const s=String(value??"");return /^[=+@\-\t\r]/.test(s)?"'"+s:s;}
