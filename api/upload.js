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

  const busboy = new Busboy({ headers: req.headers });
  let runpodId = null;
  let imageFile = null;
  let imageFilename = null;

  const buffers = [];

  busboy.on("field", (fieldname, val) => {
    if (fieldname === "runpod_id") {
      runpodId = val;
    }
  });

  busboy.on("file", (fieldname, file, filename) => {
    imageFilename = filename;

    file.on("data", (data) => {
      buffers.push(data);
    });

    file.on("end", () => {
      imageFile = Buffer.concat(buffers);
    });
  });

  busboy.on("finish", async () => {
    if (!runpodId || !imageFile) {
      return res.status(400).json({ message: "Missing runpod_id or image" });
    }

    const formData = new FormData();
    const bufferStream = new stream.PassThrough();
    bufferStream.end(imageFile);
    formData.append("image", bufferStream, imageFilename);

    try {
      const response = await axios.post(
        `https://${runpodId}-7860.proxy.runpod.net/upload-image`,
        formData,
        {
          headers: formData.getHeaders(),
        }
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
        error: err.message,
      });
    }
  });

  req.pipe(busboy);
}
