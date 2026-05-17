import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
// @ts-ignore
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";

// Configure PDF.js worker using Vite's URL import
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  try {
    if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
      return await extractTextFromPDF(file);
    } else if (
      fileType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileName.endsWith(".docx")
    ) {
      return await extractTextFromDOCX(file);
    } else if (fileType === "text/plain" || fileName.endsWith(".txt")) {
      return await file.text();
    } else {
      throw new Error(
        "Unsupported file type. Please upload a PDF, DOCX, or TXT file.",
      );
    }
  } catch (error) {
    console.error("Error extracting text from file:", error);
    throw new Error(
      "Failed to read file content. Please try copying and pasting the text instead.",
    );
  }
}

async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(" ");
    fullText += pageText + "\n\n";
  }

  return fullText.trim();
}

async function extractTextFromDOCX(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value.trim();
}
