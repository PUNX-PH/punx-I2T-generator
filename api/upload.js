import formidable from "formidable";
import fs from "fs";
import FormData from "form-data";
import axios from "axios";

export const config = {
  api: {
    bodyParser: false, // Disables default body parser to use formidable
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ message: "Form parsing error" });
    }

    const runpodId = fields.runpod_id;
    const imageFile = files.image;

    if (!runpodId || !imageFile) {
      return res.status(400).json({ message: "Missing runpod_id or image" });
    }

    try {
      const formData = new FormData();
      formData.append("image", fs.createReadStream(imageFile.filepath), imageFile.originalFilename);

      const runpodUrl = `https://${runpodId}-7860.proxy.runpod.net/upload-image`;

      const response = await axios.post(runpodUrl, formData, {
        headers: formData.getHeaders(),
      });

      const { filename, relative_path } = response.data;

      return res.status(200).json({
        message: "Uploaded successfully.",
        filename,
        path: relative_path,
      });
    } catch (error) {
      return res.status(500).json({ message: "Upload failed", error: error.message });
    }
  });
}
