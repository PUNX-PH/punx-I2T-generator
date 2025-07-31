import formidable from 'formidable';
import FormData from 'form-data';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Use formidable to handle file upload
  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({ error: 'Error parsing form data.' });
    }

    const file = files.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    // Either use provided runpod_id or hardcode your own
    const runpod_id = fields.runpod_id || 's61u83w3t2vryv';
    const filename = file.originalFilename || file.newFilename || file.name;
    const filepath = file.filepath;

    // This is very important: use fs.createReadStream, which works with formidable temporary files!
    const fileStream = fs.createReadStream(filepath);

    // Send it as multipart/form-data to Runpod
    const formData = new FormData();
    formData.append('file', fileStream, filename);

    try {
      // Use node-fetch (built-in in Next.js 13+ functions) or install it separately if needed
      const response = await fetch(`https://${runpod_id}-8188.proxy.runpod.net/upload-image`, {
        method: 'POST',
        headers: formData.getHeaders(),
        body: formData,
      });
      if (!response.ok) {
        const errorTxt = await response.text();
        return res.status(response.status).json({ error: 'Error uploading to Runpod', details: errorTxt });
      }

      return res.status(201).json({
        message: "Image uploaded successfully.",
        filename,
        path: `/ComfyUI/input/${filename}`,
      });
    } catch (error) {
      return res.status(500).json({ error: 'Upload failed', details: error.message });
    }
  });
}