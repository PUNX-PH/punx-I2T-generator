import Busboy from "busboy";
import axios from "axios";
import FormData from "form-data";
import stream from "stream";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const busboy = Busboy({ headers: req.headers });
  let runpodId;
  let imageBuffer = [];
  let imageFilename;

  busboy.on("field", (name, value) => {
    if (name === "runpod_id") runpodId = value;
  });

  busboy.on("file", (name, file, filename) => {
    imageFilename = filename;
    file.on("data", (data) => imageBuffer.push(data));
    file.on("end", () => {
      imageBuffer = Buffer.concat(imageBuffer);
    });
  });

  busboy.on("finish", async () => {
    if (!runpodId || !imageBuffer || !imageFilename) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const formData = new FormData();
    const bufferStream = new stream.PassThrough();
    bufferStream.end(imageBuffer);
    formData.append("image", bufferStream, imageFilename);

    try {
      const response = await axios.post(
        `https://${runpodId}-7860.proxy.runpod.net/upload-image`,
        formData,
        { headers: formData.getHeaders() }
      );

      const { filename, relative_path } = response.data;
      return res.status(200).json({
        message: "Uploaded successfully.",
        filename,
        path: relative_path,
      });
    } catch (err) {
      return res.status(500).json({
        message: "Upload failed",
        error: err.response?.data || err.message,
      });
    }
  });

  req.pipe(busboy);
}
