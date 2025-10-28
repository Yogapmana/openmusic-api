const fs = require('fs');
const path = require('path');

const StorageService = {
  writeFile: (file, meta) => new Promise((resolve, reject) => {
    const filename = +new Date() + meta.filename;
    const uploadPath = path.resolve(__dirname, '../../../uploads/covers');

    // Create directory if not exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    const filePath = path.join(uploadPath, filename);
    const fileStream = fs.createWriteStream(filePath);

    let hasError = false;

    fileStream.on('error', (error) => {
      hasError = true;
      console.error('WriteStream error:', error);
      reject(error);
    });

    file.on('error', (error) => {
      hasError = true;
      console.error('File stream error:', error);
      reject(error);
    });

    file.on('end', () => {
      if (!hasError) {
        fileStream.end();
      }
    });

    fileStream.on('finish', () => {
      if (!hasError) {
        console.log('File saved successfully:', filePath);
        resolve(filename);
      }
    });

    file.pipe(fileStream);
  }),

  deleteFile: (filename) => {
    const filePath = path.resolve(__dirname, '../../uploads/covers', filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  },
};

module.exports = StorageService;
