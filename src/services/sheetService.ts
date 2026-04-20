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
 *   var neighborhood = e.parameter.neighborhood;
 *   if (!action) return ContentService.createTextOutput("✅ Backend EcoTrack Vigo Activo.").setMimeType(ContentService.MimeType.TEXT);
 *   
 *   var sheet = SpreadsheetApp.getActiveSpreadsheet();
 *   
 *   if (action === 'getRankings') {
 *     var userSheet = sheet.getSheetByName('Users') || sheet.insertSheet('Users');
 *     var data = userSheet.getDataRange().getValues();
 *     data.shift(); // remove headers
 *     var neighborhoodTotals = {};
 *     data.forEach(function(row) {
 *       var name = row[3] || "Vigo"; 
 *       var points = parseFloat(row[4]) || 0;
 *       if (!neighborhoodTotals[name]) neighborhoodTotals[name] = { points: 0, trend: 0 };
 *       neighborhoodTotals[name].points += points;
 *     });
 *     var result = Object.keys(neighborhoodTotals).map(function(name) {
 *       return { neighborhood: name, points: neighborhoodTotals[name].points, trend: 0 };
 *     }).sort(function(a, b) { return b.points - a.points; });
 *     return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
 *   }
 *
 *   if (action === 'getNeighborhoodUsers') {
 *     var userSheet = sheet.getSheetByName('Users') || sheet.insertSheet('Users');
 *     var data = userSheet.getDataRange().getValues();
 *     data.shift();
 *     var users = data.filter(function(row) { return row[3] == neighborhood; })
 *                    .map(function(row) { return { name: row[1], points: parseFloat(row[4]) || 0, avatar: row[5] }; })
 *                    .sort(function(a, b) { return b.points - a.points; });
 *     return ContentService.createTextOutput(JSON.stringify(users)).setMimeType(ContentService.MimeType.JSON);
 *   }
 *
 *   if (action === 'login') {
 *     var username = e.parameter.username;
 *     var password = e.parameter.password;
 *     var userSheet = sheet.getSheetByName('Users') || sheet.insertSheet('Users');
 *     var data = userSheet.getDataRange().getValues();
 *     var headers = data.shift();
 *     // We assume username is unique or we use the userId if they log in with that
 *     var userRow = data.find(function(row) { 
 *       return (row[0] == username || row[1] == username) && row[9] == password; 
 *     });
 *     if (userRow) {
 *       var obj = {};
 *       headers.forEach(function(h, i) { obj[h] = userRow[i]; });
 *       return ContentService.createTextOutput(JSON.stringify({ success: true, user: obj })).setMimeType(ContentService.MimeType.JSON);
 *     }
 *     return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Credenciales inválidas' })).setMimeType(ContentService.MimeType.JSON);
 *   }
 *   
 *   if (action === 'getUserProfile') {
 *     var userSheet = sheet.getSheetByName('Users') || sheet.insertSheet('Users');
 *     var data = userSheet.getDataRange().getValues();
 *     var headers = data.shift();
 *     var userRow = data.find(function(row) { return row[0] == userId; });
 *     if (userRow) {
 *       var obj = {};
 *       headers.forEach(function(header, i) { obj[header] = userRow[i]; });
 *       return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
 *     }
 *     return ContentService.createTextOutput(JSON.stringify(null)).setMimeType(ContentService.MimeType.JSON);
 *   }
 *
 *   if (action === 'getHistory') {
 *     var historySheet = sheet.getSheetByName('History') || sheet.insertSheet('History');
 *     var data = historySheet.getDataRange().getValues();
 *     var headers = data.shift();
 *     var userHistory = data.filter(function(row) { return row[0] == userId; }).map(function(row) {
 *       var obj = {};
 *       headers.forEach(function(header, i) { obj[header] = row[i]; });
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
 *     if (data.action === 'register') {
 *       var userSheet = sheet.getSheetByName('Users') || sheet.insertSheet('Users');
 *       if (userSheet.getLastRow() === 0) userSheet.appendRow(["userId", "name", "email", "neighborhood", "points", "avatar", "level", "streak", "savings", "password"]);
 *       var existing = userSheet.getDataRange().getValues();
 *       var alreadyExists = existing.some(function(row) { return row[0] == data.id; });
 *       if (alreadyExists) return ContentService.createTextOutput(JSON.stringify({success: false, error: 'El usuario ya existe'})).setMimeType(ContentService.MimeType.JSON);
 *       
 *       userSheet.appendRow([data.id, data.name, data.email, data.neighborhood, 0, data.avatar, 1, 0, 0, data.password]);
 *       return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
 *     }
 *
 *     if (data.action === 'logScan' || data.action === 'logBag' || data.action === 'logSurvey') {
 *       var logSheet = sheet.getSheetByName('Logs') || sheet.insertSheet('Logs');
 *       if (logSheet.getLastRow() === 0) logSheet.appendRow(["date", "userId", "action", "details"]);
 *       logSheet.appendRow([new Date(), data.userId, data.action, JSON.stringify(data)]);
 *       var userSheet = sheet.getSheetByName('Users') || sheet.insertSheet('Users');
 *       var userData = userSheet.getDataRange().getValues();
 *       var rowIndex = -1;
 *       for (var i = 0; i < userData.length; i++) { if (userData[i][0] == data.userId) { rowIndex = i; break; } }
 *       if (rowIndex > 0) {
 *         var p = parseFloat(userData[rowIndex][4]) || 0;
 *         var s = parseFloat(userData[rowIndex][8]) || 0;
 *         userSheet.getRange(rowIndex + 1, 5).setValue(p + (parseFloat(data.points) || 0));
 *         userSheet.getRange(rowIndex + 1, 9).setValue(s + (parseFloat(data.savings) || 0));
 *       }
 *       var historySheet = sheet.getSheetByName('History') || sheet.insertSheet('History');
 *       historySheet.appendRow([data.userId, new Date().toISOString().split('T')[0], data.points || 0, (parseFloat(data.points) * 0.1), data.item || data.action]);
 *       return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
 *     }
 *
 *     if (data.action === 'updateProfile') {
 *       var userSheet = sheet.getSheetByName('Users') || sheet.insertSheet('Users');
 *       var userData = userSheet.getDataRange().getValues();
 *       var p = data.profile;
 *       var rowIndex = -1;
 *       for (var k = 0; k < userData.length; k++) { if (userData[k][0] == p.id) { rowIndex = k; break; } }
 *       if (rowIndex > 0) {
 *         userSheet.getRange(rowIndex + 1, 3).setValue(p.email);
 *         userSheet.getRange(rowIndex + 1, 4).setValue(p.neighborhood);
 *       }
 *       return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
 *     }
 *   } catch (f) {
 *     return ContentService.createTextOutput(JSON.stringify({success: false, error: f.toString()})).setMimeType(ContentService.MimeType.JSON);
 *   }
 * }
 */

const GOOGLE_SCRIPT_URL = import.meta.env.VITE_GOOGLE_SHEETS_URL || "";

export async function loginUserFromSheet(username: string, password: string): Promise<{ success: boolean, user?: any, error?: string }> {
  if (!GOOGLE_SCRIPT_URL) return { success: false, error: "Backend no configurado" };
  try {
    const url = new URL(GOOGLE_SCRIPT_URL);
    url.searchParams.set('action', 'login');
    url.searchParams.set('username', username);
    url.searchParams.set('password', password);
    url.searchParams.set('t', Date.now().toString());

    const response = await fetch(url.toString());
    if (!response.ok) return { success: false, error: "Error de servidor" };
    const data = await response.json();
    if (data.success) {
      return {
        success: true,
        user: {
          ...data.user,
          points: parseFloat(data.user.points) || 0,
          savings: parseFloat(data.user.savings) || 0
        }
      };
    }
    return { success: false, error: data.error || "Error desconocido" };
  } catch (error) {
    return { success: false, error: "Error de conexión" };
  }
}

export async function registerUserInSheet(userData: any): Promise<{ success: boolean, error?: string }> {
  if (!GOOGLE_SCRIPT_URL) return { success: false, error: "Backend no configurado" };
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'register', ...userData })
    });
    
    // In many cases with Apps Script, CORS might make response not directly readable 
    // if mode is no-cors. But we need to know if it succeeded.
    // Try with cors first. If it fails, fallback.
    const text = await response.text();
    const result = JSON.parse(text);
    return result;
  } catch (error) {
    // If CORS fails, we can't be sure, but we'll try to provide a better error
    return { success: false, error: "Error al registrar. Verifica la consola." };
  }
}

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
    url.searchParams.set('t', Date.now().toString());
    
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
    url.searchParams.set('t', Date.now().toString());
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

  if (!GOOGLE_SCRIPT_URL) return defaultUsers;

  try {
    const url = new URL(GOOGLE_SCRIPT_URL);
    url.searchParams.set('action', 'getNeighborhoodUsers');
    url.searchParams.set('neighborhood', neighborhood);
    url.searchParams.set('t', Date.now().toString());
    
    const response = await fetch(url.toString());
    if (!response.ok) return defaultUsers;
    const data = await response.json();
    return Array.isArray(data) && data.length > 0 ? data : defaultUsers;
  } catch (error) {
    return defaultUsers;
  }
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
