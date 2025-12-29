import multer from "multer";
import path from "path";
import fs from "fs";
import {fileURLToPath}from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "../../../uploads");
// const imagePath = req.file?.path.replace(/\\/g, "/")
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null,`${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = [
    "image/",
    "video/",
    "application/pdf"
  ];

  if (
    allowedTypes.some(type => file.mimetype.startsWith(type))
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only images, videos, and PDFs are allowed"), false);
  }
};


export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 200 * 1024 * 1024,
  },
})

