const fs = require('fs');
const path = require('path');

const StorageService = {
  writeFile: (file, meta) => new Promise((resolve, reject) => {
    const filename = +new Date() + meta.filename;
    const uploadPath = path.resolve(__dirname, '../../uploads/covers');

    // Create directory if not exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    const filePath = path.join(uploadPath, filename);
    const fileStream = fs.createWriteStream(filePath);

    fileStream.on('error', (error) => reject(error));

    file.pipe(fileStream);

    file.on('end', () => resolve(filename));
  }),

  deleteFile: (filename) => {
    const filePath = path.resolve(__dirname, '../../uploads/covers', filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  },
};

module.exports = StorageService;
