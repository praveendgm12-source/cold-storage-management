// Saves a jsPDF document. Inside the Android app the WebView cannot download
// blob: URLs, so we hand the file to the native bridge instead.
import type { jsPDF } from 'jspdf';

declare global {
  interface Window {
    CoolzaAndroid?: { saveFile: (base64: string, fileName: string, mime: string) => string };
  }
}

export function savePdf(doc: jsPDF, fileName: string): string | null {
  if (window.CoolzaAndroid?.saveFile) {
    const dataUri = doc.output('datauristring');
    const base64 = dataUri.substring(dataUri.indexOf(',') + 1);
    return window.CoolzaAndroid.saveFile(base64, fileName, 'application/pdf');
  }
  doc.save(fileName);
  return null;
}
