export interface LogPayload {
  timestamp?: string;
  subject?: string;
  grade?: string;
  mode?: string;
  success: boolean;
  model?: string;
  errorType?: string;
}

export async function logToGoogleSheets(
  webAppUrl: string,
  payload: LogPayload
): Promise<boolean> {
  if (!webAppUrl || !webAppUrl.trim().startsWith('http')) {
    return false;
  }

  try {
    const dataToSend = {
      timestamp: payload.timestamp || new Date().toISOString(),
      subject: payload.subject || 'auto',
      grade: payload.grade || 'all',
      mode: payload.mode || 'guided',
      success: payload.success ? 'TRUE' : 'FALSE',
      model: payload.model || 'gemini-3.7-flash',
      errorType: payload.errorType || '',
    };

    // Use mode: 'no-cors' so standard Google Apps Script Web Apps receive payload smoothly
    await fetch(webAppUrl.trim(), {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToSend),
    });

    return true;
  } catch (err) {
    // Google Sheets logging failure must NEVER break the chat response
    console.warn('[Google Sheets Logging Info] Sheet write skipped or failed silently:', err);
    return false;
  }
}

export async function testGoogleSheetsUrl(webAppUrl: string): Promise<boolean> {
  if (!webAppUrl || !webAppUrl.trim().startsWith('http')) {
    return false;
  }

  try {
    const testPayload: LogPayload = {
      timestamp: new Date().toISOString(),
      subject: 'KiemTraKetNoi',
      grade: 'Test',
      mode: 'guided',
      success: true,
      model: 'Test Connection',
    };

    return await logToGoogleSheets(webAppUrl, testPayload);
  } catch {
    return false;
  }
}

