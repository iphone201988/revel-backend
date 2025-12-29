import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import handlebars from "handlebars";
import { fileURLToPath } from "url";

/* ============================
   HANDLEBARS HELPERS
   ============================ */

handlebars.registerHelper("inc", (value) => Number(value) + 1);

handlebars.registerHelper("hasLength", (arr) => {
  return Array.isArray(arr) && arr.length > 0;
});
handlebars.registerHelper("gte", function (a, b) {
  return a >= b;
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generatePdfBuffer(
  templateName: string,
  templateData: Record<string, any>
): Promise<Buffer> {

  const templatePath = path.join(process.cwd(), "templates", templateName);
  const templateHtml = fs.readFileSync(templatePath, "utf-8");

  let html: string;

  try {
    const template = handlebars.compile(templateHtml);
    html = template(templateData);
  } catch (err: any) {
    console.error("❌ HANDLEBARS ERROR:", err.message);
    throw err;
  }

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdfUint8Array = await page.pdf({
    format: "A4",
    printBackground: true,
  });

  await browser.close();

  return Buffer.from(pdfUint8Array);
}
