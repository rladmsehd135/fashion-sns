const sharp = require('sharp');
const path  = require('path');
const fs    = require('fs');

const resizeImage = async (filePath, width = 1080) => {
  const ext      = path.extname(filePath);
  const baseName = path.basename(filePath, ext);
  const dir      = path.dirname(filePath);
  const output   = path.join(dir, `${baseName}_resized${ext}`);

  await sharp(filePath)
    .resize(width, null, { withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toFile(output);

  fs.unlinkSync(filePath);
  fs.renameSync(output, filePath);
};

module.exports = { resizeImage };