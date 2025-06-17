const admin = require("./firebase");  
const Busboy = require("busboy");
const path = require("path");
const os = require("os");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const pdfParse = require("pdf-parse");
const { makeBedrockRequest } = require("./services/bedrock-client");
const cors = require("cors")({ origin: true });

// Firebase Storage bucket
const bucket = admin.storage().bucket();
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

exports.handleUpload = (req, res) => {
  // Set CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Accept");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  console.log('Request method:', req.method, 'Path:', req.path);

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const busboy = Busboy({ headers: req.headers });
  const tmpdir = os.tmpdir();

  let jobDescriptionText = "";
  let fileSizeError = null;
  const uploadedFilesData = [];
  const fileUploadPromises = [];
  let uploadedFileInfo = null;
  let fileTypeError = null;
  let jobDescriptionId = uuidv4(); // Generate unique ID for job description

  busboy.on("file", (fieldname, file, info) => {
    const { filename, encoding, mimeType } = info;
    console.log('File event:', { fieldname, filename, mimetype: mimeType });
    if (fieldname !== "resumeFile") {
      console.log('Skipping non-resume file:', fieldname);
      file.resume();
      return;
    }
    if (typeof filename !== "string" || !filename) {
      console.log('Invalid filename received:', filename);
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
          console.log('File uploaded to Firebase Storage:', destination);
          uploadedFilesData.push({
            fieldname,
            storagePath: destination,
            mimetype: mimeType,
            uniqueFileName,
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
    console.log('Field event:', { fieldname, val });
    if (fieldname === "jobDescription") {
      jobDescriptionText = val;
      // Create a Buffer from the job description text
      const jobDescriptionBuffer = Buffer.from(val, 'utf-8');
      // Store job description in Firebase Storage
      const jobDescriptionPath = `job-descriptions/${jobDescriptionId}.txt`;
      const jobDescriptionFile = bucket.file(jobDescriptionPath);
      
      const jobDescriptionPromise = jobDescriptionFile.save(jobDescriptionBuffer, {
        contentType: 'text/plain',
        metadata: {
          timestamp: new Date().toISOString()
        }
      }).then(() => {
        console.log('Job description uploaded to Firebase Storage:', jobDescriptionPath);
        uploadedFilesData.push({
          fieldname,
          storagePath: jobDescriptionPath,
          mimetype: 'text/plain',
          uniqueFileName: `${jobDescriptionId}.txt`
        });
      }).catch(err => {
        console.error('Error uploading job description:', err);
        throw err;
      });
      
      fileUploadPromises.push(jobDescriptionPromise);
    }
  });

  busboy.on("finish", async () => {
    console.log('Busboy finish event');
    if (fileTypeError) {
      return res.status(400).json({ message: fileTypeError });
    }
    if (!jobDescriptionText || !jobDescriptionText.trim()) {
      return res.status(400).json({ message: "Job description is required." });
    }
    try {
      await Promise.all(fileUploadPromises);
      console.log('All file uploads complete:', uploadedFilesData);
      let extractedText = "";

      if (uploadedFileInfo) {
        const [fileBuffer] = await bucket.file(uploadedFileInfo.destination).download();
        // Extract text from PDF
        const pdfData = await pdfParse(fileBuffer);
        extractedText = pdfData.text;
      }

        const fileReferences = {
          cv: uploadedFileInfo.destination,
          jobDescription: `job-descriptions/${jobDescriptionId}.txt`
        };

      // After successful file upload and processing
      console.log('Sending success response with:', {
        extractedText: extractedText ? 'present' : 'missing',
        bedrockResult: bedrockResult ? 'present' : 'missing',
        fileReferences
      });

      res.status(200).json({
        success: true,
        message: "Files uploaded successfully",
        extractedText: extractedText || '',
        jobDescription: jobDescriptionText,
        bedrockResult: {
          content: bedrockResult,
          isComplete: false,
          questionCount: 1
        },
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
