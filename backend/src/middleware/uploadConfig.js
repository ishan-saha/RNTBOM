const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(process.cwd(), 'uploads', 'configs');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const SUPPORTED_EXTS = new Set([
  '.json', '.yaml', '.yml', '.xml', '.ini', '.cfg', '.conf',
  '.properties', '.props', '.reg', '.plist',
  '.sysctl', '.nginx', '.ssh_config',
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `config-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (SUPPORTED_EXTS.has(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type "${ext}". Supported formats: JSON, YAML, XML, INI, CONF, CFG, Properties, REG, Plist, sysctl, nginx, SSH config`), false);
  }
};

const uploadConfig = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 },
});

module.exports = uploadConfig;
