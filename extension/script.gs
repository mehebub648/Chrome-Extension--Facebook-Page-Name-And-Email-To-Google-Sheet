// Code.gs
function doPost(e) {
  try {
    const body = JSON.parse(e.postData && e.postData.contents ? e.postData.contents : '{}');
    const { sheetId, sheetName, name, email, link } = body;
    if (!sheetId || !sheetName) return respond({ ok: false, error: 'Missing sheetId or sheetName' });

    const ss = SpreadsheetApp.openById(sheetId);
    let sh = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);

    // Optional header row if sheet is empty
    if (sh.getLastRow() === 0) {
      sh.appendRow(['Timestamp', 'Name', 'Email', 'Link']);
    }

    sh.appendRow([new Date(), name || '', email || '', link || '']);
    return respond({ ok: true });
  } catch (err) {
    return respond({ ok: false, error: String(err) });
  }
}

function respond(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
