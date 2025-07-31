import formidable from 'formidable';

// Prevent Next.js default body parser for this route
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Parse with formidable
  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({ error: 'Error parsing form data.' });
    }

    if (!files.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const file = files.file;
    const filename = file.originalFilename || file.newFilename || file.name;

    // Read the uploaded file (buffer)
    const fs = require('fs');
    const fileBuffer = fs.readFileSync(file.filepath);

    // You MUST provide your runpod_id (or send it as a form field)
    // Here, for demonstration, replace with your actual value or parse from query/fields
    const runpod_id = fields.runpod_id || 's61u83w3t2vryv';

    // Forward to Runpod/ComfyUI
    const formData = new FormData();
    formData.append('file', new Blob([fileBuffer]), filename);

    const uploadURL = `https://${runpod_id}-8188.proxy.runpod.net/upload-image`;

    const runpodResponse = await fetch(uploadURL, {
      method: 'POST',
      body: formData,
      // 'Content-Type' header will be set automatically by fetch
    });

    if (!runpodResponse.ok) {
      const errorText = await runpodResponse.text();
      return res.status(runpodResponse.status).json({ error: 'Error uploading to Runpod', details: errorText });
    }

    // Build your response
    return res.status(201).json({
        status: 'Complete',
        message: 'Upload completed successfully.',
        filename: filename,
        path: `/ComfyUI/input/${filename}`,
    });
  });
}