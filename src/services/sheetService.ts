/**
 * Google Sheets Integration Service
 * 
 * To make this work, you need to:
 * 1. Create a Google Sheet.
 * 2. Create a Google Apps Script (Extensions > Apps Script).
 * 3. Use a script that handles GET/POST requests and interacts with the sheet.
 * 4. Deploy as a Web App and set access to "Anyone".
 * 
 * --- GOOGLE APPS SCRIPT CODE (Copy this to your script editor) ---
 * 
 * function doGet(e) {
 *   var action = e.parameter.action;
 *   var userId = e.parameter.userId;
 *   if (!action) return ContentService.createTextOutput("✅ Backend EcoTrack Vigo Activo.").setMimeType(ContentService.MimeType.TEXT);
 *   
 *   var sheet = SpreadsheetApp.getActiveSpreadsheet();
 *   
 *   if (action === 'getRankings') {
 *     var rankingSheet = sheet.getSheetByName('Rankings') || sheet.getSheets()[0];
 *     var data = rankingSheet.getDataRange().getValues();
 *     var headers = data.shift();
 *     var result = data.map(row => {
 *       var obj = {};
 *       headers.forEach((header, i) => obj[header] = row[i]);
 *       return obj;
 *     });
 *     return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
 *   }
 *   
 *   if (action === 'getUserProfile') {
 *     var userSheet = sheet.getSheetByName('Users') || sheet.insertSheet('Users');
 *     var data = userSheet.getDataRange().getValues();
 *     var headers = data.shift();
 *     var userRow = data.find(row => row[0] == userId);
 *     if (userRow) {
 *       var obj = {};
 *       headers.forEach((header, i) => obj[header] = userRow[i]);
 *       return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
 *     }
 *     return ContentService.createTextOutput(JSON.stringify(null)).setMimeType(ContentService.MimeType.JSON);
 *   }
 *
 *   if (action === 'getHistory') {
 *     var historySheet = sheet.getSheetByName('History') || sheet.insertSheet('History');
 *     var data = historySheet.getDataRange().getValues();
 *     var headers = data.shift();
 *     var userHistory = data.filter(row => row[0] == userId).map(row => {
 *       var obj = {};
 *       headers.forEach((header, i) => obj[header] = row[i]);
 *       return obj;
 *     });
 *     return ContentService.createTextOutput(JSON.stringify(userHistory)).setMimeType(ContentService.MimeType.JSON);
 *   }
 * }
 * 
 * function doPost(e) {
 *   try {
 *     var data = JSON.parse(e.postData.contents);
 *     var sheet = SpreadsheetApp.getActiveSpreadsheet();
 *     
 *     if (data.action === 'logScan' || data.action === 'logBag') {
 *       var logSheet = sheet.getSheetByName('Logs') || sheet.insertSheet('Logs');
 *       if (logSheet.getLastRow() === 0) logSheet.appendRow(["date", "userId", "action", "details"]);
 *       
 *       // Check for duplicate QR codes (only for bags)
 *       if (data.action === 'logBag') {
 *         var logs = logSheet.getDataRange().getValues();
 *         for (var i = 0; i < logs.length; i++) {
 *           if (logs[i][2] === 'logBag') {
 *             try {
 *               var details = JSON.parse(logs[i][3]);
 *               if (details.bagCode === data.bagCode) {
 *                 return ContentService.createTextOutput(JSON.stringify({success: false, error: "QR ya utilizado"})).setMimeType(ContentService.MimeType.JSON);
 *               }
 *             } catch(e) {}
 *           }
 *         }
 *       }
 *
 *       logSheet.appendRow([new Date(), data.userId, data.action, JSON.stringify(data)]);
 *       
 *       // 1. Update user points and savings
 *       var userSheet = sheet.getSheetByName('Users') || sheet.insertSheet('Users');
 *       if (userSheet.getLastRow() === 0) userSheet.appendRow(["userId", "name", "email", "neighborhood", "points", "avatar", "level", "streak", "savings"]);
 *       
 *       var userData = userSheet.getDataRange().getValues();
 *       var rowIndex = -1;
 *       for (var i = 0; i < userData.length; i++) {
 *         if (userData[i][0] == data.userId) { rowIndex = i; break; }
 *       }
 *       
 *       var userNeighborhood = "Vigo";
 *       if (rowIndex > 0) {
 *         var currentPoints = parseFloat(userData[rowIndex][4]) || 0;
 *         var currentSavings = parseFloat(userData[rowIndex][8]) || 0;
 *         var pointsToAdd = parseFloat(data.points) || 0;
 *         var savingsToAdd = parseFloat(data.savings) || (pointsToAdd * 0.10);
 *         
 *         userSheet.getRange(rowIndex + 1, 5).setValue(currentPoints + pointsToAdd);
 *         userSheet.getRange(rowIndex + 1, 9).setValue(currentSavings + savingsToAdd);
 *         userNeighborhood = userData[rowIndex][3] || "Vigo";
 *       } else {
 *         // Create user if they don't exist
 *         userSheet.appendRow([data.userId, "Usuario Nuevo", "", "Vigo", data.points || 0, "", "1", "0", data.savings || 0]);
 *       }
 *       
 *       // 2. Add to History
 *       var historySheet = sheet.getSheetByName('History') || sheet.insertSheet('History');
 *       if (historySheet.getLastRow() === 0) {
 *         historySheet.appendRow(["userId", "date", "points", "savings", "item"]);
 *       }
 *       var histSavings = parseFloat(data.savings) || (parseFloat(data.points) * 0.10);
 *       historySheet.appendRow([data.userId, new Date().toISOString().split('T')[0], data.points || 0, histSavings, data.item || data.bagCode || "Residuo"]);
 *       
 *       // 3. Update Rankings
 *       var rankingSheet = sheet.getSheetByName('Rankings') || sheet.insertSheet('Rankings');
 *       if (rankingSheet.getLastRow() === 0) rankingSheet.appendRow(["neighborhood", "points", "trend"]);
 *       
 *       var rankingData = rankingSheet.getDataRange().getValues();
 *       var rankRowIndex = -1;
 *       for (var j = 0; j < rankingData.length; j++) {
 *         if (rankingData[j][0] == userNeighborhood) { rankRowIndex = j; break; }
 *       }
 *       
 *       if (rankRowIndex > 0) {
 *         var currentRankPoints = parseFloat(rankingData[rankRowIndex][1]) || 0;
 *         rankingSheet.getRange(rankRowIndex + 1, 2).setValue(currentRankPoints + (parseFloat(data.points) || 0));
 *       } else {
 *         rankingSheet.appendRow([userNeighborhood, data.points || 0, 0]);
 *       }
 *       
 *       return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
 *     }
 *
 *     if (data.action === 'updateProfile') {
 *       var userSheet = sheet.getSheetByName('Users') || sheet.insertSheet('Users');
 *       var userData = userSheet.getDataRange().getValues();
 *       var profile = data.profile;
 *       var rowIndex = -1;
 *       for (var k = 0; k < userData.length; k++) {
 *         if (userData[k][0] == profile.id) { rowIndex = k; break; }
 *       }
 *       
 *       if (rowIndex > 0) {
 *         userSheet.getRange(rowIndex + 1, 2).setValue(profile.name);
 *         userSheet.getRange(rowIndex + 1, 4).setValue(profile.neighborhood);
 *       } else {
 *         if (userSheet.getLastRow() === 0) userSheet.appendRow(["userId", "name", "email", "neighborhood", "points", "avatar", "level", "streak", "savings"]);
 *         userSheet.appendRow([profile.id, profile.name, profile.email, profile.neighborhood, profile.points || 0, profile.avatar, "1", "0", profile.savings || 0]);
 *       }
 *       return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
 *     }
 *   } catch (f) {
 *     return ContentService.createTextOutput(JSON.stringify({success: false, error: f.toString()})).setMimeType(ContentService.MimeType.JSON);
 *   }
 * }
 */

const GOOGLE_SCRIPT_URL = import.meta.env.VITE_GOOGLE_SHEETS_URL || "";

export async function logScanToSheet(userId: string, data: any) {
  if (!GOOGLE_SCRIPT_URL) {
    console.warn("⚠️ VITE_GOOGLE_SHEETS_URL no configurada. Guardando localmente.");
    saveToLocalStorage('scans', data);
    return { success: false };
  }

  console.log(`📤 Enviando escaneo al backend para usuario ${userId}...`);
  try {
    const payload = JSON.stringify({ action: 'logScan', userId, ...data });
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', // Importante para evitar problemas de CORS en Apps Script
      cache: 'no-cache',
      headers: { 'Content-Type': 'text/plain' },
      body: payload
    });
    
    // Con no-cors no podemos ver la respuesta, pero si no hay error en el fetch, asumimos envío
    // Apps Script devuelve un estado 'opaque' que no es 'ok', así que confiamos en que no haya saltado el catch
    console.log("✅ Petición de escaneo enviada correctamente filtrada.");
    return { success: true };
  } catch (error) {
    console.error("❌ Error crítico enviando escaneo:", error);
    saveToLocalStorage('scans', data);
    return { success: false };
  }
}

export async function logBagToSheet(userId: string, data: any) {
  if (!GOOGLE_SCRIPT_URL) {
    console.warn("⚠️ VITE_GOOGLE_SHEETS_URL no configurada. Guardando localmente.");
    saveToLocalStorage('bags', data);
    return { success: true };
  }

  console.log(`📤 Enviando registro de bolsa al backend para usuario ${userId}...`);
  try {
    const payload = JSON.stringify({ action: 'logBag', userId, ...data });
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      cache: 'no-cache',
      headers: { 'Content-Type': 'text/plain' },
      body: payload
    });
    console.log("✅ Petición de bolsa enviada correctamente.");
    return { success: true };
  } catch (error) {
    console.error("❌ Error crítico enviando bolsa:", error);
    saveToLocalStorage('bags', data);
    return { success: false };
  }
}

export async function getUserProfileFromSheet(userId: string) {
  if (!GOOGLE_SCRIPT_URL) {
    console.warn("⚠️ No hay URL de backend configurada.");
    return null;
  }
  try {
    const url = new URL(GOOGLE_SCRIPT_URL);
    url.searchParams.set('action', 'getUserProfile');
    url.searchParams.set('userId', userId);
    url.searchParams.set('t', Date.now().toString()); // Evitar cache
    
    console.log(`🔍 Consultando perfil para ${userId}...`);
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const text = await response.text();
    console.log("📥 Respuesta recibida del backend.");
    
    try {
      const profile = JSON.parse(text);
      if (profile) {
        return {
          ...profile,
          points: parseFloat(profile.points) || 0,
          savings: parseFloat(profile.savings) || 0
        };
      }
      return null;
    } catch (e) {
      console.error("❌ Error al procesar JSON del backend. ¿Es la URL correcta (debe terminar en /exec)?", text.substring(0, 100));
      return null;
    }
  } catch (error) {
    console.error("❌ Error de conexión con el backend:", error);
    return null;
  }
}

export async function updateUserProfileInSheet(profile: any) {
  if (!GOOGLE_SCRIPT_URL) return { success: true };
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      cache: 'no-cache',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'updateProfile', profile })
    });
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function getRankingsFromSheet() {
  const defaultRankings = [
    { neighborhood: "Navia", points: 15400, trend: 5 },
    { neighborhood: "Teis", points: 14200, trend: 2 },
    { neighborhood: "Casco Vello", points: 12800, trend: 1 },
    { neighborhood: "Bouzas", points: 11500, trend: -1 },
    { neighborhood: "Coia", points: 10200, trend: 3 },
  ];

  if (!GOOGLE_SCRIPT_URL) return defaultRankings;

  try {
    const url = new URL(GOOGLE_SCRIPT_URL);
    url.searchParams.set('action', 'getRankings');
    const response = await fetch(url.toString());
    if (!response.ok) return defaultRankings;
    const data = await response.json();
    return Array.isArray(data) && data.length > 0 ? data : defaultRankings;
  } catch (error) {
    return defaultRankings;
  }
}

export async function getHistoryFromSheet(userId: string) {
  if (!GOOGLE_SCRIPT_URL) return [];
  try {
    const url = new URL(GOOGLE_SCRIPT_URL);
    url.searchParams.set('action', 'getHistory');
    url.searchParams.set('userId', userId);
    const response = await fetch(url.toString());
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return [];
  }
}

export async function getUserRankings(neighborhood: string) {
  const defaultUsers = [
    { name: "Marta G.", points: 1250, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marta" },
    { name: "Carlos R.", points: 1120, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos" },
    { name: "Lucía P.", points: 980, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lucia" },
  ];
  return defaultUsers;
}

export async function getContainerLocations() {
  return [
    { id: '1', type: 'AMARILLO', lat: 42.2328, lng: -8.7226, address: "Rúa do Príncipe, 54" },
    { id: '2', type: 'AZUL', lat: 42.2358, lng: -8.7266, address: "Porta do Sol" },
    { id: '3', type: 'VERDE', lat: 42.2158, lng: -8.7466, address: "Av. de Castelao, 20" },
    { id: '4', type: 'MARRÓN', lat: 42.2258, lng: -8.7366, address: "Rúa de Venezuela" },
    { id: '5', type: 'AMARILLO', lat: 42.2310, lng: -8.7150, address: "Rúa de Urzaiz, 10" },
    { id: '6', type: 'AZUL', lat: 42.2380, lng: -8.7200, address: "Rúa de García Barbón, 45" },
    { id: '7', type: 'VERDE', lat: 42.2280, lng: -8.7300, address: "Praza de Compostela" },
    { id: '8', type: 'MARRÓN', lat: 42.2340, lng: -8.7280, address: "Rúa de Policarpo Sanz" },
    { id: '9', type: 'AMARILLO', lat: 42.2200, lng: -8.7500, address: "Av. de Samil" },
    { id: '10', type: 'MARRÓN', lat: 42.2100, lng: -8.7400, address: "Rúa de Tomás Alonso" },
    { id: '11', type: 'AZUL', lat: 42.2400, lng: -8.7100, address: "Rúa de Sanjurjo Badía" },
    { id: '12', type: 'VERDE', lat: 42.2300, lng: -8.7050, address: "Rúa de Travesía de Vigo" },
    { id: '13', type: 'MARRÓN', lat: 42.2250, lng: -8.7250, address: "Rúa de Rosalía de Castro" },
    { id: '14', type: 'AMARILLO', lat: 42.2150, lng: -8.7350, address: "Rúa de Gran Vía, 120" },
  ];
}

export async function getHistoricalData(userId: string) {
  return [
    { date: '2024-03-01', points: 50, savings: 1.2 },
    { date: '2024-03-02', points: 30, savings: 0.8 },
    { date: '2024-03-03', points: 80, savings: 2.1 },
    { date: '2024-03-04', points: 40, savings: 1.0 },
    { date: '2024-03-05', points: 60, savings: 1.5 },
  ];
}

// Local storage fallback for "mock-up funcional"
function saveToLocalStorage(key: string, data: any) {
  const existing = JSON.parse(localStorage.getItem(key) || '[]');
  existing.push({ ...data, id: crypto.randomUUID(), timestamp: Date.now() });
  localStorage.setItem(key, JSON.stringify(existing));
}
