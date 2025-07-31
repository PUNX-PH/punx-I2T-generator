import formidable from "formidable";
import FormData from "form-data";
import fs from "fs/promises"; // We use fs.promises for reading as buffer

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // Parse form-data using formidable (need a Promise version)
  const form = new formidable.IncomingForm();

  const data = await new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });

  const runpod_id = data.fields.runpod_id;
  const file = data.files.file;

  if (!runpod_id || !file) {
    res.status(400).json({ error: "runpod_id (text field) and file (file field) are required" });
    return;
  }

  // Read file as Buffer
  let fileBuffer;
  try {
    fileBuffer = await fs.readFile(file.filepath);
  } catch (err) {
    res.status(500).json({ error: "Failed to read file buffer.", detail: err.message });
    return;
  }

  // Prepare FormData for forwarding
  const formData = new FormData();
  formData.append("file", fileBuffer, file.originalFilename);

  try {
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

    const filename = file.originalFilename;
    const relative_path = `/ComfyUI/input/${filename}`;

    res.status(200).json({
      message: "Image uploaded successfully.",
      filename: filename,
      relative_path: relative_path,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}