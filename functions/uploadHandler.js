const admin = require("./firebase");  
const Busboy = require("busboy");
const path = require("path");
const os = require("os");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const pdfParse = require("pdf-parse");


const bucket = admin.storage().bucket();
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

exports.handleUpload = (req, res) => {



  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const busboy = Busboy({ headers: req.headers });
  const tmpdir = os.tmpdir();

  let jobDescriptionText = "";
  let fileSizeError = null;
  const fileUploadPromises = [];
  let uploadedFileInfo = null;
  let fileTypeError = null;
  let jobDescriptionId = uuidv4(); 

  busboy.on("file", (fieldname, file, info) => {
    const { filename, mimeType } = info;
    if (fieldname !== "resumeFile") {
      file.resume();
      return;
    }
    if (typeof filename !== "string" || !filename) {
      file.resume();
      return;
    }
    if (mimeType !== "application/pdf") {
      fileTypeError = "Only PDF files are supported.";
      file.resume();
      return;
    }
    const uniqueFileName = `${uuidv4()}_${filename.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    const filepath = path.join(tmpdir, uniqueFileName);
    const writeStream = fs.createWriteStream(filepath);
    let totalBytes = 0;

    file.on("data", (data) => {
      totalBytes += data.length;
      if (totalBytes > MAX_FILE_SIZE) {
        fileSizeError = "File size exceeds 10MB limit.";
        file.unpipe(writeStream);
        writeStream.end();
        file.resume();
      }
    });

    file.pipe(writeStream);

    const filePromise = new Promise((resolve, reject) => {
      writeStream.on("finish", async () => {
        if (fileSizeError) {
          fs.unlink(filepath, () => {});
          return reject(new Error(fileSizeError));
        }
        const destination = `uploads/${uniqueFileName}`;
        try {
          await bucket.upload(filepath, {
            destination,
            contentType: mimeType,
            metadata: {},
          });


          uploadedFileInfo = { destination, mimeType };
          resolve();
        } catch (err) {
          console.error('Firebase Storage Upload Error:', err);
          reject(err);
        } finally {
          fs.unlink(filepath, () => {});
        }
      });
      writeStream.on("error", (err) => {
        console.error('Write stream error:', err);
        reject(err);
      });
    });
    fileUploadPromises.push(filePromise);
  });

  busboy.on("field", (fieldname, val) => {
    if (fieldname === "jobDescription") {
      jobDescriptionText = val;
      const jobDescriptionBuffer = Buffer.from(val, 'utf-8');
      const jobDescriptionPath = `job-descriptions/${jobDescriptionId}.txt`;
      const jobDescriptionFile = bucket.file(jobDescriptionPath);
      
      const jobDescriptionPromise = jobDescriptionFile.save(jobDescriptionBuffer, {
        contentType: 'text/plain',
        metadata: {
          timestamp: new Date().toISOString()
        }
      }).then(() => {


      }).catch(err => {
        console.error('Error uploading job description:', err);
        throw err;
      });
      
      fileUploadPromises.push(jobDescriptionPromise);
    }
  });

  busboy.on("finish", async () => {
    if (fileTypeError) {
      return res.status(400).json({ message: fileTypeError });
    }
    if (!jobDescriptionText || !jobDescriptionText.trim()) {
      return res.status(400).json({ message: "Job description is required." });
    }
    try {
      await Promise.all(fileUploadPromises);
      let extractedText = "";

      if (uploadedFileInfo) {
        const [fileBuffer] = await bucket.file(uploadedFileInfo.destination).download();
        const pdfData = await pdfParse(fileBuffer);
        extractedText = pdfData.text;
      }

        const fileReferences = {
          cv: uploadedFileInfo.destination,
          jobDescription: `job-descriptions/${jobDescriptionId}.txt`
        };



      res.status(200).json({
        success: true,
        message: "Files uploaded successfully",
        extractedText: extractedText || '',
        jobDescription: jobDescriptionText,
        fileReferences
      });
    } catch (error) {
      console.error("Error in upload handler:", error);
      res.status(500).json({
        success: false,
        message: "Error processing request",
        error: error.message
      });
    }
  });

  busboy.end(req.rawBody);
}; 
