const { app } = require('../server');
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer(app);
server.listen(3004, async () => {
  try {
    console.log('Testing /api/analyze/image with test-sample.bmp...');
    const filePath = path.join(__dirname, 'test-sample.bmp');
    const fileBytes = fs.readFileSync(filePath);

    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const header = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="image"; filename="test-sample.bmp"\r\n` +
      `Content-Type: image/bmp\r\n\r\n`
    );
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
    const postBody = Buffer.concat([header, fileBytes, footer]);

    const res = await fetch('http://127.0.0.1:3004/api/analyze/image', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: postBody
    });

    const data = await res.json();
    console.log('Image API Status:', res.status);
    console.log('OCR Extracted Text:', data.ocr?.extractedText);
    console.log('OCR Confidence:', data.ocr?.confidence);
    console.log('Report Assessment:', data.report?.assessment);
    console.log('Report Risk Level:', data.report?.riskLevel);
    console.log('Summary:', data.report?.summary);
  } catch (err) {
    console.error('Error during image test:', err);
  } finally {
    server.close();
  }
});
