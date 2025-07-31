// pages/api/upload-image.js

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

  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({ error: 'Error parsing form data.' });
    }

    if (!files.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    // Use runpod_id from fields if passed, or your default
    const runpod_id = fields.runpod_id;
    const file = files.file;
    const filename = file.originalFilename || file.newFilename || file.name;

    // Use fs.createReadStream (file.filepath is fine in serverless for temp file)
    const fileStream = fs.createReadStream(file.filepath);

    // FormData for forwarding to Runpod/ComfyUI
    const formData = new FormData();
    formData.append('file', fileStream, filename);

    try {
      const response = await fetch(`https://${runpod_id}-8188.proxy.runpod.net/upload-image`, {
        method: 'POST',
        headers: formData.getHeaders(),
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({ error: 'Error uploading to Runpod', details: errorText });
      }

      // Success response as you requested
      res.status(201).json({
        message: 'Image uploaded successfully.',
        filename,
        path: `/ComfyUI/input/${filename}`,
      });
    } catch (e) {
      res.status(500).json({ error: 'Upload failed', details: e.message });
    }
  });
}