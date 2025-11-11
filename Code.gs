/*****
 * Google Apps Script Backend for Gift Card Validator
 * Deployed as a Web App.
 */

// --- CONFIGURATION ---
// IMPORTANT: Set your Sheet ID and Sheet Name
const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID';
const SHEET_NAME = 'GiftCards'; // The name of the sheet/tab within your spreadsheet
const CREDENTIALS_SHEET_NAME = 'Users'; // Sheet for user credentials

// --- WEB APP ENTRY POINTS ---

/**
 * Handles GET requests.
 * Used for fetching card data.
 * e.g., ?action=getCards
 * e.g., ?action=getCard&id=GC123456
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    
    if (action === 'getCards') {
      // Admin action to get all cards
      const { email, token } = e.parameter;
      if (!isTokenValid(email, token, 'admin')) {
        throw new Error('Unauthorized');
      }
      const data = getRowsData(sheet);
      return createContentResponse(JSON.stringify({ success: true, data }));
    }
    
    if (action === 'getCard') {
      const cardId = e.parameter.id;
      const cardData = findRow(sheet, cardId, 1); // Card ID is in column 1
      if (cardData.row > 0) {
        const card = sheetDataToObject(sheet.getRange(cardData.row, 1, 1, sheet.getLastColumn()).getValues()[0]);
        return createContentResponse(JSON.stringify({ success: true, data: card }));
      } else {
        throw new Error('Card not found.');
      }
    }

    throw new Error('Invalid action specified.');

  } catch (error) {
    return createContentResponse(JSON.stringify({ success: false, message: error.message }));
  }
}

/**
 * Handles POST requests.
 * Used for login and all data modifications (add, update, delete).
 */
function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents);
    const { action, email, token } = request;

    if (action === 'login') {
      const { role, password } = request;
      const userSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(CREDENTIALS_SHEET_NAME);
      const user = findRow(userSheet, email, 1);
      
      if (user.row > 0) {
        const userData = userSheet.getRange(user.row, 1, 1, 3).getValues()[0];
        // In a real app, use hashed passwords. For this demo, plain text is used.
        if (userData[1] === password && userData[2] === role) {
          const newToken = generateToken(email, role);
          return createContentResponse(JSON.stringify({ success: true, token: newToken }));
        }
      }
      throw new Error('Invalid credentials or role.');
    }

    // All actions below require a valid token
    const requiredRole = (action === 'deleteCard' || action === 'updateCard') ? 'admin' : 'cashier'; // More granular control
    if (!isTokenValid(email, token, requiredRole)) {
      throw new Error('Unauthorized or invalid token.');
    }

    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);

    switch (action) {
      case 'addCard':
        return handleAddCard(sheet, request);
      case 'updateBalance':
        return handleUpdateBalance(sheet, request);
      case 'updateCard': // Admin only
        return handleUpdateCard(sheet, request);
      case 'deleteCard': // Admin only
        return handleDeleteCard(sheet, request);
      default:
        throw new Error('Invalid action specified.');
    }

  } catch (error) {
    return createContentResponse(JSON.stringify({ success: false, message: error.message }));
  }
}


// --- ACTION HANDLERS ---

function handleAddCard(sheet, request) {
  const { id, balance, email } = request;
  if (!id || !balance) throw new Error('Card ID and Balance are required.');
  
  const existingCard = findRow(sheet, id, 1);
  if (existingCard.row > 0) throw new Error('Card ID already exists.');

  sheet.appendRow([id, parseFloat(balance), 'Active', email, new Date()]);
  return createContentResponse(JSON.stringify({ success: true }));
}

function handleUpdateBalance(sheet, request) {
  const { id, balance } = request;
  if (!id || balance === undefined) throw new Error('Card ID and New Balance are required.');

  const card = findRow(sheet, id, 1);
  if (card.row === 0) throw new Error('Card not found.');

  sheet.getRange(card.row, 2).setValue(parseFloat(balance)); // Update balance in Column 2
  return createContentResponse(JSON.stringify({ success: true }));
}

function handleUpdateCard(sheet, request) {
  const { rowIndex, id, balance, status } = request;
  if (!rowIndex) throw new Error('Row index is required for updates.');

  const range = sheet.getRange(rowIndex, 1, 1, 3); // ID, Balance, Status
  range.setValues([[id, parseFloat(balance), status]]);
  return createContentResponse(JSON.stringify({ success: true }));
}

function handleDeleteCard(sheet, request) {
  const { rowIndex } = request;
  if (!rowIndex) throw new Error('Row index is required for deletion.');
  
  sheet.deleteRow(parseInt(rowIndex));
  return createContentResponse(JSON.stringify({ success: true }));
}


// --- HELPER & UTILITY FUNCTIONS ---

function createContentResponse(json) {
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function findRow(sheet, value, col) {
  const data = sheet.getRange(1, col, sheet.getLastRow(), 1).getValues();
  for (let i = 0; i < data.length; i++) {
    if (data[i][0].toString().toLowerCase() === value.toString().toLowerCase()) {
      return { row: i + 1, data: data[i] };
    }
  }
  return { row: 0, data: null };
}

function getRowsData(sheet) {
    if (sheet.getLastRow() < 2) return [];
    const range = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn());
    return range.getValues().map(row => sheetDataToObject(row));
}

function sheetDataToObject(row) {
    return {
        id: row[0],
        balance: parseFloat(row[1]),
        status: row[2],
        createdBy: row[3],
        dateCreated: row[4]
    };
}

// --- AUTHENTICATION ---
// This is a simple, non-production-ready token system.
// In a real app, use a more robust solution like OAuth2 or JWT with a secure secret.

function generateToken(email, role) {
  const secret = "demo_secret"; // Should be a PropertiesService secret
  const validUntil = new Date().getTime() + 3600 * 1000; // 1 hour validity
  const payload = `${email}|${role}|${validUntil}`;
  const signature = Utilities.computeHmacSha256Signature(payload, secret);
  const safeSignature = Utilities.base64Encode(signature);
  return `${Utilities.base64Encode(payload)}.${safeSignature}`;
}

function isTokenValid(email, token, requiredRole) {
  try {
    const secret = "demo_secret";
    const parts = token.split('.');
    const payloadB64 = parts[0];
    const signatureB64 = parts[1];
    
    const signature = Utilities.base64Decode(signatureB64);
    const newSignature = Utilities.computeHmacSha256Signature(payloadB64, secret);

    if (!Utilities.isSameSignature(signature, newSignature)) {
      return false;
    }

    const payload = Utilities.newBlob(Utilities.base64Decode(payloadB64)).getDataAsString().split('|');
    const tokenEmail = payload[0];
    const tokenRole = payload[1];
    const validUntil = parseInt(payload[2]);

    if (tokenEmail === email && new Date().getTime() < validUntil) {
      // Check if the user's role is sufficient (admin can do anything)
      return tokenRole === 'admin' || tokenRole === requiredRole;
    }
    return false;
  } catch (e) {
    return false;
  }
}
