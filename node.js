const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const AdmZip = require('adm-zip');
const sharp = require('sharp');
const { exec } = require('child_process');
const fileType = require('file-type');

const app = express();
const port = 3000;

// Ensure 'compressed' directory exists
const compressedDir = path.resolve(__dirname, 'compressed');
if (!fs.existsSync(compressedDir)) {
    fs.mkdirSync(compressedDir);
}

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public')); // Serve frontend files

// Serve homepage
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>File Compression</title>
        </head>
        <body>
            <h1>Upload a File for Compression</h1>
            <form action="/upload" method="POST" enctype="multipart/form-data">
                <label for="file">Choose a file:</label>
                <input type="file" id="file" name="file" required>
                <button type="submit">Upload</button>
            </form>
        </body>
        </html>
    `);
});

// Video Compression Function
const compressVideo = (inputPath, outputPath) => {
    return new Promise((resolve, reject) => {
        const command = `ffmpeg -y -i "${inputPath}" -vcodec libx264 -crf 28 "${outputPath}"`;
        console.log(`Executing FFmpeg command: ${command}`); // Debug
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error('FFmpeg Error:', stderr); // Debug
                reject(error);
            } else {
                console.log('FFmpeg Output:', stdout); // Debug
                resolve(outputPath);
            }
        });
    });
};

// Image Compression Function
const compressImage = async (inputPath, outputPath) => {
    try {
        console.log(`Compressing image: ${inputPath}`); // Debug
        await sharp(inputPath)
            .resize({ width: 800 }) // Optional: Resize image
            .toFile(outputPath);
        console.log('Image compression successful:', outputPath); // Debug
    } catch (err) {
        console.error('Error compressing image:', err); // Debug
        throw new Error('Error compressing image');
    }
};

// PDF Compression Function
const compressPDF = async (inputPath, outputPath) => {
    try {
        console.log(`Compressing PDF: ${inputPath}`); // Debug
        const pdfBytes = fs.readFileSync(inputPath);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const newPdfDoc = await PDFDocument.create();
        const pages = await newPdfDoc.copyPages(pdfDoc, pdfDoc.getPageIndices());
        pages.forEach((page) => newPdfDoc.addPage(page));
        const compressedBytes = await newPdfDoc.save({ useObjectStreams: true });
        fs.writeFileSync(outputPath, compressedBytes);
        console.log('PDF compression successful:', outputPath); // Debug
    } catch (err) {
        console.error('Error compressing PDF:', err); // Debug
        throw new Error('Error compressing PDF');
    }
};

// Text File Compression Function
const JSZip = require('jszip');

const compressWordFile = async (inputPath, outputPath) => {
    const zip = new JSZip();
    const fileContent = fs.readFileSync(inputPath);
    const docx = await zip.loadAsync(fileContent);

    // Optimize images in the 'word/media/' folder
    const mediaFolder = 'word/media/';
    const mediaFiles = Object.keys(docx.files).filter((file) => file.startsWith(mediaFolder));

    for (const mediaFile of mediaFiles) {
        const imageBuffer = await docx.files[mediaFile].async('nodebuffer');
        const optimizedImageBuffer = await sharp(imageBuffer).resize({ width: 800 }).toBuffer();
        docx.file(mediaFile, optimizedImageBuffer); // Replace with optimized image
    }

    // Save optimized DOCX
    const optimizedBuffer = await docx.generateAsync({ type: 'nodebuffer' });
    fs.writeFileSync(outputPath, optimizedBuffer);
    console.log('Word file compression successful:', outputPath);
};


// Handle file upload and compression
app.post('/upload', upload.single('file'), async (req, res) => {
    console.log('Uploaded file details:', req.file); // Debug

    const filePath = path.resolve(req.file.path);
    const originalName = req.file.originalname;
    console.log('File saved to temporary path:', filePath); // Debug

    let compressedFilePath = path.resolve(compressedDir, `compressed_${originalName}`);

    try {
        const fileTypeResult = await fileType.fromFile(filePath);
        console.log('Detected file type:', fileTypeResult); // Debug

        const fileExtension = fileTypeResult?.ext || path.extname(originalName).slice(1).toLowerCase();
        console.log('File extension:', fileExtension); // Debug

        if (fileExtension === 'pdf') {
            await compressPDF(filePath, compressedFilePath);
        } else if (fileExtension === 'docx') {
            await compressWordFile(filePath, compressedFilePath); // Fix: Use compressWordFile instead
        } else if (['jpg', 'jpeg', 'png', 'webp'].includes(fileExtension)) {
            await compressImage(filePath, compressedFilePath);
        } else if (['mp4', 'avi', 'mov'].includes(fileExtension)) {
            await compressVideo(filePath, compressedFilePath);
        } else if (fileExtension === 'txt') {
            const zipFilePath = path.resolve(compressedDir, `compressed_${originalName}.zip`);
            await compressTextFile(filePath, zipFilePath, originalName); // Improved handling
            compressedFilePath = zipFilePath;
        } else {
            return res.status(400).send(`Unsupported file type (${fileExtension}). Please upload a PDF, Word document, image, video, or text file.`);
        }

        // 📏 Compare sizes
        const originalSize = fs.statSync(filePath).size;
        const compressedSize = fs.statSync(compressedFilePath).size;
        const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

        res.send(`
            <!DOCTYPE html>
            <html>
                <head>
                <title>Compression Report</title>
                <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
                <style>
                    body {
                    font-family: Arial, sans-serif;
                    text-align: center;
                    margin: 30px;
                    }
                    canvas {
                    max-width: 400px;
                    margin: auto;
                    }
                </style>
                </head>
                <body>
                <h2>Compression Successful</h2>
                <p><strong>Original Size:</strong> ${(originalSize / 1024).toFixed(2)} KB</p>
                <p><strong>Compressed Size:</strong> ${(compressedSize / 1024).toFixed(2)} KB</p>
                <p><strong>Compression Ratio:</strong> ${compressionRatio.toFixed(2)}%</p>

                <canvas id="sizeChart"></canvas>

                <script>
                    const ctx = document.getElementById('sizeChart').getContext('2d');
                    new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['Original', 'Compressed'],
                        datasets: [{
                        label: 'File Size (KB)',
                        data: [${(originalSize / 1024).toFixed(2)}, ${(compressedSize / 1024).toFixed(2)}],
                        backgroundColor: ['#007bff', '#28a745']
                        }]
                    },
                    options: {
                        scales: {
                        y: {
                            beginAtZero: true
                        }
                        }
                    }
                    });
                </script>

                <br><br>
                <a href="/download/${path.basename(compressedFilePath)}" download>
                    📥 Download Compressed File
                </a>
                </body>
            </html>
        `);

    } catch (error) {
        console.error('Error compressing file:', error); // Debug
        return res.status(500).send(`Error compressing file: ${error.message}`);
    } finally {
        // Clean up the uploaded file after compression
        fs.unlink(filePath, (err) => {
            if (err) console.error('Error cleaning up uploaded file:', err); // Debug
        });
    }
});

// Route to serve compressed file for download
app.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.resolve(compressedDir, filename);

    console.log('Downloading file:', filePath); // Debug

    res.download(filePath, (err) => {
        if (err) {
            console.error('Error in download:', err); // Debug
            return res.status(500).send('Error downloading file');
        }

        // Cleanup file after successful download
        fs.unlink(filePath, (err) => {
            if (err) console.error('Error cleaning up compressed file:', err); // Debug
        });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`File compression server listening at http://localhost:${port}`);
});
