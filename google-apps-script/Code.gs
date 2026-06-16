// Storage V2 - Google Apps Script Backend
// Deploy as Web App: Execute as "Me", Who has access: "Anyone"

const TIMEZONE = 'Asia/Taipei';

function doGet(e) {
  const action = e.parameter.action;

  if (action === 'ping') {
    return jsonResponse({ success: true, version: '1.0', timestamp: now() });
  }

  if (action === 'loadAll') {
    return loadAll(e.parameter.accountId);
  }

  return jsonResponse({ error: 'Unknown action' });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;

    if (action === 'saveAll') {
      return saveAll(body);
    }

    if (action === 'uploadPhoto') {
      return uploadPhoto(body);
    }

    return jsonResponse({ error: 'Unknown action' });
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

// --- Data Operations ---

function loadAll(accountId) {
  const ss = getOrCreateSpreadsheet();

  const itemsSheet = ss.getSheetByName('Items');
  const projectsSheet = ss.getSheetByName('Projects');

  const items = sheetToObjects(itemsSheet);
  const projects = sheetToObjects(projectsSheet);

  // Filter by accountId if provided
  const filteredProjects = accountId
    ? projects.filter(p => p.ownerId === accountId)
    : projects;
  const projectIds = new Set(filteredProjects.map(p => p.id));
  const filteredItems = items.filter(i => projectIds.has(i.projectId));

  return jsonResponse({ success: true, items: filteredItems, projects: filteredProjects });
}

function saveAll(body) {
  const ss = getOrCreateSpreadsheet();
  const data = typeof body.data === 'string' ? JSON.parse(body.data) : body.data;

  const projects = data.projects || [];
  const items = data.items || [];

  // Save projects
  const projectsSheet = ss.getSheetByName('Projects');
  const existingProjects = sheetToObjects(projectsSheet);
  const mergedProjects = mergeById(existingProjects, projects);
  objectsToSheet(projectsSheet, mergedProjects, ['id', 'name', 'ownerId', 'createdAt']);

  // Save items
  const itemsSheet = ss.getSheetByName('Items');
  const existingItems = sheetToObjects(itemsSheet);
  const mergedItems = mergeById(existingItems, items);
  objectsToSheet(itemsSheet, mergedItems, ['id', 'name', 'imageUrl', 'note', 'parentId', 'projectId', 'createdAt']);

  return jsonResponse({ success: true, timestamp: now() });
}

// --- Photo Upload ---

function uploadPhoto(body) {
  const base64Data = body.base64;
  const mimeType = body.mimeType || 'image/jpeg';
  const fileName = body.fileName || ('photo_' + new Date().getTime() + '.jpg');

  const folder = getOrCreatePhotoFolder();
  const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, fileName);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  const fileId = file.getId();
  const url = 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w1000';

  return jsonResponse({ success: true, url: url, fileId: fileId });
}

// --- Helpers ---

function getOrCreateSpreadsheet() {
  const props = PropertiesService.getScriptProperties();
  let ssId = props.getProperty('SPREADSHEET_ID');

  if (ssId) {
    try { return SpreadsheetApp.openById(ssId); } catch(e) { /* deleted, recreate */ }
  }

  const ss = SpreadsheetApp.create('Storage V2 Data');
  props.setProperty('SPREADSHEET_ID', ss.getId());

  // Create sheets
  let itemsSheet = ss.getSheetByName('Items');
  if (!itemsSheet) {
    itemsSheet = ss.insertSheet('Items');
    itemsSheet.appendRow(['id', 'name', 'imageUrl', 'note', 'parentId', 'projectId', 'createdAt']);
    // Rule 1: force date columns to plain text
    itemsSheet.getRange(2, 7, itemsSheet.getMaxRows() - 1, 1).setNumberFormat('@');
  }

  let projectsSheet = ss.getSheetByName('Projects');
  if (!projectsSheet) {
    projectsSheet = ss.insertSheet('Projects');
    projectsSheet.appendRow(['id', 'name', 'ownerId', 'createdAt']);
    projectsSheet.getRange(2, 4, projectsSheet.getMaxRows() - 1, 1).setNumberFormat('@');
  }

  // Remove default Sheet1
  const defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet) ss.deleteSheet(defaultSheet);

  return ss;
}

function getOrCreatePhotoFolder() {
  const props = PropertiesService.getScriptProperties();
  let folderId = props.getProperty('PHOTO_FOLDER_ID');

  if (folderId) {
    try { return DriveApp.getFolderById(folderId); } catch(e) { /* deleted, recreate */ }
  }

  const folder = DriveApp.createFolder('Storage V2 Photos');
  props.setProperty('PHOTO_FOLDER_ID', folder.getId());
  return folder;
}

function sheetToObjects(sheet) {
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  const headers = data[0];
  const objects = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue; // skip empty rows
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      let val = row[j];
      // Rule 1: coerce any Date objects to string
      if (val instanceof Date) {
        val = Utilities.formatDate(val, TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
      }
      obj[headers[j]] = val === '' ? null : String(val);
    }
    objects.push(obj);
  }
  return objects;
}

function objectsToSheet(sheet, objects, headers) {
  if (!sheet || objects.length === 0) return;

  // Clear existing data (keep header)
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
  }

  // Rule 1: force text format on date columns before writing
  const dateColIndices = headers.reduce((acc, h, i) => {
    if (h.toLowerCase().includes('at') || h.toLowerCase().includes('date')) acc.push(i + 1);
    return acc;
  }, []);
  dateColIndices.forEach(col => {
    sheet.getRange(2, col, Math.max(objects.length, sheet.getMaxRows() - 1), 1).setNumberFormat('@');
  });

  const rows = objects.map(obj => headers.map(h => obj[h] != null ? String(obj[h]) : ''));
  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
}

function mergeById(existing, incoming) {
  const map = {};
  existing.forEach(item => { if (item.id) map[item.id] = item; });
  incoming.forEach(item => {
    if (!item.id) return;
    const ex = map[item.id];
    if (!ex || (item.createdAt && (!ex.createdAt || item.createdAt > ex.createdAt))) {
      map[item.id] = item;
    }
  });
  return Object.values(map);
}

function now() {
  return Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
