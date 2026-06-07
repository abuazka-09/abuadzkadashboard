const SPREADSHEET_NAME = "ABU ADZKA Dashboard Database";
const PHOTO_FOLDER_NAME = "ABU ADZKA Bukti Absensi";

const SHEETS = {
  attendance: {
    name: "Absensi",
    headers: ["id", "name", "division", "date", "status", "in", "out", "photo", "note", "createdAt", "updatedAt"]
  },
  inventory: {
    name: "Inventaris",
    headers: ["id", "item", "code", "owner", "location", "condition", "value", "createdAt", "updatedAt"]
  },
  stock: {
    name: "Stock",
    headers: ["id", "item", "sku", "category", "qty", "min", "unit", "supplier", "createdAt", "updatedAt"]
  },
  sales: {
    name: "Penjualan",
    headers: ["id", "saleId", "productDesc", "vendorName", "hpp", "sellPrice", "volume", "totalSales", "vendorPayment", "balance", "createdAt", "updatedAt"]
  },
  finance: {
    name: "Keuangan",
    headers: ["id", "date", "type", "category", "desc", "amount", "createdAt", "updatedAt"]
  }
};

function doGet() {
  return jsonResponse({ ok: true, message: "ABU ADZKA Apps Script aktif." });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || "{}");
    setupDatabase();

    if (body.action === "list") return jsonResponse({ ok: true, data: listAll() });
    if (body.action === "upsert") return jsonResponse({ ok: true, data: upsertRecord(body.kind, body.record) });
    if (body.action === "delete") return jsonResponse({ ok: true, data: deleteRecord(body.kind, body.id) });
    if (body.action === "reset") return jsonResponse({ ok: true, data: resetSheet(body.kind) });

    return jsonResponse({ ok: false, error: "Action tidak dikenal." });
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error && error.message ? error.message : error) });
  }
}

function setupDatabase() {
  const ss = getSpreadsheet();
  Object.keys(SHEETS).forEach((kind) => {
    const config = SHEETS[kind];
    let sheet = ss.getSheetByName(config.name);
    if (!sheet) sheet = ss.insertSheet(config.name);
    const headerRange = sheet.getRange(1, 1, 1, config.headers.length);
    const current = headerRange.getValues()[0];
    if (current.join("") !== config.headers.join("")) {
      headerRange.setValues([config.headers]);
      sheet.setFrozenRows(1);
    }
  });
}

function getSpreadsheet() {
  const props = PropertiesService.getScriptProperties();
  const savedId = props.getProperty("SPREADSHEET_ID");
  if (savedId) return SpreadsheetApp.openById(savedId);

  const ss = SpreadsheetApp.create(SPREADSHEET_NAME);
  props.setProperty("SPREADSHEET_ID", ss.getId());
  return ss;
}

function getSheet(kind) {
  const config = SHEETS[kind];
  if (!config) throw new Error("Jenis data tidak valid: " + kind);
  return getSpreadsheet().getSheetByName(config.name);
}

function listAll() {
  const output = {};
  Object.keys(SHEETS).forEach((kind) => {
    output[kind] = readSheet(kind);
  });
  return output;
}

function readSheet(kind) {
  const config = SHEETS[kind];
  const sheet = getSheet(kind);
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  return values.slice(1).filter((row) => row[0] !== "").map((row) => {
    const item = {};
    config.headers.forEach((header, index) => item[header] = row[index]);
    return item;
  });
}

function upsertRecord(kind, record) {
  const config = SHEETS[kind];
  const sheet = getSheet(kind);
  const now = new Date().toISOString();
  const id = Number(record.id || Date.now());
  const rows = sheet.getDataRange().getValues();
  let rowIndex = -1;

  for (let i = 1; i < rows.length; i++) {
    if (Number(rows[i][0]) === id) {
      rowIndex = i + 1;
      break;
    }
  }

  const existing = rowIndex > -1 ? rowToObject(config.headers, sheet.getRange(rowIndex, 1, 1, config.headers.length).getValues()[0]) : {};
  const merged = Object.assign({}, existing, record, {
    id,
    createdAt: existing.createdAt || now,
    updatedAt: now
  });

  if (kind === "sales") {
    const hpp = Number(merged.hpp || 0);
    const sellPrice = Number(merged.sellPrice || 0);
    const volume = Number(merged.volume || 0);
    merged.hpp = hpp;
    merged.sellPrice = sellPrice;
    merged.volume = volume;
    merged.totalSales = sellPrice * volume;
    merged.vendorPayment = hpp * volume;
    merged.balance = merged.totalSales - merged.vendorPayment;
  }

  if (kind === "attendance" && merged.photo && String(merged.photo).indexOf("data:image") === 0) {
    merged.photo = savePhotoToDrive(merged.photo, merged.name || "absensi", id);
  }

  const outputRow = config.headers.map((header) => merged[header] === undefined ? "" : merged[header]);
  if (rowIndex > -1) sheet.getRange(rowIndex, 1, 1, outputRow.length).setValues([outputRow]);
  else sheet.appendRow(outputRow);

  return merged;
}

function deleteRecord(kind, id) {
  const sheet = getSheet(kind);
  const values = sheet.getDataRange().getValues();
  for (let i = values.length - 1; i >= 1; i--) {
    if (Number(values[i][0]) === Number(id)) {
      sheet.deleteRow(i + 1);
      return { deleted: true };
    }
  }
  return { deleted: false };
}

function resetSheet(kind) {
  const config = SHEETS[kind];
  const sheet = getSheet(kind);
  sheet.clear();
  sheet.getRange(1, 1, 1, config.headers.length).setValues([config.headers]);
  sheet.setFrozenRows(1);
  return { reset: true };
}

function rowToObject(headers, row) {
  const object = {};
  headers.forEach((header, index) => object[header] = row[index]);
  return object;
}

function savePhotoToDrive(dataUrl, employeeName, id) {
  const folder = getPhotoFolder();
  const match = String(dataUrl).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return dataUrl;

  const mimeType = match[1];
  const extension = mimeType.split("/")[1].replace("jpeg", "jpg");
  const safeName = String(employeeName).replace(/[^a-zA-Z0-9-_ ]/g, "").replace(/\s+/g, "-");
  const bytes = Utilities.base64Decode(match[2]);
  const blob = Utilities.newBlob(bytes, mimeType, `${id}-${safeName}.${extension}`);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

function getPhotoFolder() {
  const props = PropertiesService.getScriptProperties();
  const savedId = props.getProperty("PHOTO_FOLDER_ID");
  if (savedId) return DriveApp.getFolderById(savedId);

  const folder = DriveApp.createFolder(PHOTO_FOLDER_NAME);
  props.setProperty("PHOTO_FOLDER_ID", folder.getId());
  return folder;
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
