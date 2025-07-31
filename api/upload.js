import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false, // Required for formidable
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST allowed' });
  }

  const form = new formidable.IncomingForm({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Form parse error:', err);
      return res.status(500).json({ error: 'Error parsing form' });
    }

    const file = files.image;
    if (!file) return res.status(400).json({ error: 'No image uploaded' });

    const fileStream = fs.createReadStream(file.filepath);

    // Forward image to JupyterLab server endpoint
    try {
      const response = await fetch('http://g8jtq4h2gagsmr-8888/upload-endpoint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${file.originalFilename}"`,
        },
        body: fileStream,
      });

      const result = await response.json();
      res.status(200).json({ message: 'Uploaded to JupyterLab', result });
    } catch (error) {
      console.error('Error uploading to Jupyter:', error);
      res.status(500).json({ error: 'Upload to JupyterLab failed' });
    }
  });
}
