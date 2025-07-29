import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false, // Required for formidable
  },
};

export default async function handler(req, res) {
  const form = new formidable.IncomingForm({ maxFileSize: 10 * 1024 * 1024 }); // 10MB

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: 'Upload failed', details: err });
    }

    const file = files.file;
    const data = fs.readFileSync(file[0].filepath);
    const base64 = data.toString('base64');

    // You can forward this to RunPod here or return it
    res.status(200).json({
      filename: file[0].originalFilename,
      base64: base64.slice(0, 100) + '...', // Preview only
    });
  });
}
