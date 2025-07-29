import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const form = new formidable.IncomingForm({ maxFileSize: 10 * 1024 * 1024 });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Formidable error:', err);
      return res.status(500).json({ error: 'File upload error', details: err });
    }

    try {
      const uploadedFile = files.file?.[0];
      const fileBuffer = fs.readFileSync(uploadedFile.filepath);
      const base64 = fileBuffer.toString('base64');

      res.status(200).json({
        filename: uploadedFile.originalFilename,
        base64: base64.substring(0, 100) + '...',
      });
    } catch (readErr) {
      console.error('File read error:', readErr);
      return res.status(500).json({ error: 'File read error', details: readErr });
    }
  });
}
