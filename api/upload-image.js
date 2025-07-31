import formidable from "formidable";
import FormData from "form-data";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false, // Disables Next.js' default body parser to handle form-data
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // Parse incoming form-data
  const form = new formidable.IncomingForm();

  // Promisify for async/await
  const parseForm = () =>
    new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

  try {
    const { fields, files } = await parseForm();
    const runpod_id = fields.runpod_id;
    const file = files.file;

    // Validate
    if (!runpod_id || !file) {
      res.status(400).json({ error: "runpod_id (text field) and file (file field) are required" });
      return;
    }

    // Prepare FormData for forwarding
    const formData = new FormData();
    formData.append("file", fs.createReadStream(file.filepath), file.originalFilename);

    // Forward to Runpod ComfyUI API
    const apiRes = await fetch(
      `https://${runpod_id}-7860.proxy.runpod.net/upload-image`,
      {
        method: "POST",
        headers: formData.getHeaders(),
        body: formData,
      }
    );

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      res.status(500).json({ error: "Failed uploading to Runpod", detail: errText });
      return;
    }

    // (Assumption) The actual filename on ComfyUI will match the uploaded name.
    const filename = file.originalFilename;
    const relative_path = `/ComfyUI/input/${filename}`;

    res.status(200).json({
      message: "Image uploaded successfully.",
      filename: filename,
      relative_path: relative_path
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}