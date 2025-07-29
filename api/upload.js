import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const form = new formidable.IncomingForm({
    uploadDir: "/tmp",
    keepExtensions: true,
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Upload failed." });
    }

    const file = files.file;
    console.log("Uploaded file:", file);

    // OPTIONAL: Read file, encode it, or forward it elsewhere
    const filePath = file[0].filepath;
    const fileBuffer = fs.readFileSync(filePath);
    const base64 = fileBuffer.toString("base64");

    return res.status(200).json({ message: "Upload successful!", base64 });
  });
}
