# 🛡️ PhantomCheck AI — Think Before You Share

> **AI-Powered Fake News, Scam & Hoax Analyzer**  
> Developed for the media-literacy problem statement *“Fake or Phantom?”*.  
> 100% private, on-device analysis powered by local **Gemma AI** via **Ollama**.

---

## 📖 Table of Contents
1. [Overview & Core Principles](#-overview--core-principles)
2. [Key Features & Modes](#-key-features--modes)
3. [Prerequisites](#-prerequisites)
4. [Step-by-Step Installation Guide](#-step-by-step-installation-guide)
   - [Step 1: Install Node.js](#step-1-install-nodejs)
   - [Step 2: Install Ollama & Download Gemma](#step-2-install-ollama--download-gemma)
   - [Step 3: Clone / Navigate to Project Directory](#step-3-clone--navigate-to-project-directory)
   - [Step 4: Configure Environment Variables (.env)](#step-4-configure-environment-variables-env)
   - [Step 5: Install Project Dependencies](#step-5-install-project-dependencies)
   - [Step 6: Start the Server](#step-6-start-the-server)
5. [Testing the AI Connection](#-testing-the-ai-connection)
6. [How It Works: Three Investigation Modes](#-how-it-works-three-investigation-modes)
7. [Running Automated Tests](#-running-automated-tests)
8. [Comprehensive Troubleshooting Guide](#-comprehensive-troubleshooting-guide)
9. [Security, Privacy & Responsible AI Design](#-security-privacy--responsible-ai-design)

---

## 🌟 Overview & Core Principles

In an era of viral misinformation, forwarded messaging scams, and deceptive headlines, **PhantomCheck AI** acts as an objective, educational investigation workbench. Rather than giving a simplistic "true" or "false" verdict, it teaches users to recognize:
- **Artificial urgency** and pressure tactics (e.g. "Account suspended in 24 hours").
- **Credential harvesting** requests (PINs, OTPs, passwords).
- **Missing attribution** and lack of verifiable primary sources.
- **Miracle health claims** or sensational viral hoaxes.

### 🔒 100% Local Inference — Zero Cloud Data Leakage
- All AI reasoning runs entirely on your local machine using **Ollama** and Google's open **Gemma** model.
- **No API keys** are required.
- **No data is transmitted** to OpenAI, Anthropic, Google Cloud, or third-party cloud servers.
- Uploaded screenshots are deleted immediately after text OCR extraction.

---

## 🚀 Key Features & Modes

1. **💬 Mode 1: Suspicious Message Analysis**
   - Inspect forwarded WhatsApp messages, SMS, emails, and social media posts.
   - Character count validator (up to 10,000 characters).
   - Built-in real-world scam and hoax test samples.

2. **🖼️ Mode 2: Screenshot OCR Analysis**
   - Drag-and-drop or browse JPG, JPEG, PNG, or WebP screenshots.
   - Optical Character Recognition (OCR) powered by **Tesseract.js**.
   - Review and edit extracted OCR text to correct typos before running Gemma analysis.
   - Clear limitation notice: Analyzes text content; does not inspect deepfakes or altered pixels.
   - Immediate automatic file cleanup in temporary storage.

3. **🌐 Mode 3: Website URL Analysis**
   - Fetches public web articles and inspects readable content with **Cheerio**.
   - **Hardened SSRF Defense**: Strictly forbids requests to `localhost`, loopback (`127.0.0.1`), private RFC1918 subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), link-local IPs, and non-HTTP protocols.
   - Re-validates DNS destinations across all redirect hops.
   - Strips ads, navigation, and scripts before AI analysis.

4. **📊 Results Dashboard & 4 Verdict Categories**
   - Color- and icon-coded assessment badges:
     - 🛡️ **SAFE — Green** (`No Significant Threats Detected`): Shown when sufficient evidence supports legitimacy and no significant red flags are detected.
     - ⚠️ **SUSPICIOUS — Red** (`Suspicious Indicators Found`): Concrete phishing signals, deceptive URL patterns, or uncorroborated pressure tactics detected.
     - 🚨 **HIGH RISK — Dark Red** (`High Risk Threat Detected`): Severe threats such as credential theft, OTP/banking requests, or aggressive impersonation. Features a prominent critical warning banner.
     - 🔍 **UNVERIFIED — Amber** (`Needs Verification`): Used when evidence is insufficient, claims lack corroboration, or content could not be accessed.
   - Distinct risk levels: **HIGH**, **MEDIUM**, **LOW**, or **UNKNOWN**.
   - Warning sign breakdown highlighting exact quoted phrases/evidence and why they matter.
   - Comparison of **Supporting Evidence** vs. **Evidence Gaps**.
   - Step-by-step **Independent Verification Checklist** (following the SIFT method).
   - Recommended **Safe Immediate Actions**.
   - Export options: **Copy Full Report** (Markdown) & **Download Report (.txt)**.

5. **🔊 Polished Sound Effects Engine (Web Audio API)**
   - **Button Click Sound**: Short, quiet mechanical tick on analysis buttons and tab switches (debounced).
   - **Verdict Result Sounds**: Exactly **2 seconds after the result is ready and rendered**, plays a tailored chime:
     - **SAFE**: Pleasant, gentle ascending confirmation chime (C5 -> E5 -> G5).
     - **SUSPICIOUS**: Descending caution warning chime (B4 -> G4).
     - **HIGH RISK**: Urgent double-pulse danger alert tone.
     - **UNVERIFIED**: Neutral mellow informational bell.
   - **Sound Toggle**: Header button (🔊 Sound On / 🔇 Muted) with `localStorage` persistence.

---

## 📋 Prerequisites

- **Operating System**: Windows 10/11, macOS, or Linux.
- **Node.js**: Version 18.0.0 or higher (Node 20+ or 22+ LTS recommended).
- **Ollama**: Installed and running locally.

---

## 🛠️ Step-by-Step Installation Guide

### Step 1: Install Node.js
If Node.js is not already installed:
1. Visit [https://nodejs.org/](https://nodejs.org/) and download the **LTS (Long Term Support)** installer.
2. Run the installer and follow the setup wizard.
3. Verify installation in your terminal:
   ```bash
   node -v
   npm -v
   ```

---

### Step 2: Install Ollama & Download Gemma
1. Download Ollama from [https://ollama.com/download](https://ollama.com/download) and install it.
2. Start the Ollama desktop application or run in your terminal:
   ```bash
   ollama serve
   ```
3. In a new terminal window, download the required Gemma model.
   - **Recommended default:**
     ```bash
     ollama pull gemma4:e2b
     ```
   - *Alternative models if you have an existing Gemma model installed:*
     ```bash
     ollama pull gemma2:2b
     # OR
     ollama pull gemma:2b
     ```
4. Verify your installed models by checking:
   ```bash
   ollama list
   ```
   Note the exact name shown in the `NAME` column (e.g. `gemma4:e2b`, `gemma2:2b`).

---

### Step 3: Clone / Navigate to Project Directory
Open your terminal in the `PhantomCheck-AI` directory (e.g. `c:\Users\shrav\Downloads\AI`):
```bash
cd c:\Users\shrav\Downloads\AI
```

---

### Step 4: Configure Environment Variables (.env)
A `.env.example` file is included in the project root. Copy it to `.env`:
```bash
# On Windows (PowerShell):
Copy-Item .env.example .env

# On macOS/Linux:
cp .env.example .env
```

Open `.env` and configure your settings if necessary:
```ini
# Server Port
PORT=3000

# Ollama Host Base URL
OLLAMA_BASE_URL=http://127.0.0.1:11434

# Exact Gemma model installed on your machine (from 'ollama list')
OLLAMA_MODEL=gemma4:e2b

# Upload & Timeout settings
MAX_IMAGE_MB=5
AI_REQUEST_TIMEOUT_MS=60000
URL_FETCH_TIMEOUT_MS=8000
```

> 💡 **Tip:** If your `ollama list` shows `gemma2:2b` or another variant, simply set `OLLAMA_MODEL=gemma2:2b` in your `.env` file!

---

### Step 5: Install Project Dependencies
Install the required Node.js libraries:
```bash
npm install
```

---

### Step 6: Start the Server
Start the Express server:
```bash
npm start
```
You will see the startup banner:
```
=======================================================
🛡️  PhantomCheck AI Server running at http://localhost:3000
🤖 Configured Ollama URL: http://127.0.0.1:11434
🧠 Configured Gemma Model: gemma4:e2b
=======================================================
```

Open your browser and navigate to:
👉 **`http://localhost:3000`**

---

## 🩺 Testing the AI Connection

1. In the top navigation bar, observe the **AI Status Pill**:
   - 🟢 **Connected: gemma4:e2b** — Local Ollama and Gemma are active and ready.
   - 🟡 **Model Missing** — Ollama is running, but the model configured in `.env` needs to be pulled (`ollama pull <model>`).
   - 🔴 **Ollama Offline** — Ollama is not running. Start Ollama with `ollama serve`.
2. Click the **"Test AI"** button in the header.
3. An interactive diagnostic modal appears. Click **"Run AI Ping Test"** to test live latency and response directly from your local Gemma model.

---

## 🔍 How It Works: Three Investigation Modes

### 1. Message / Claim Mode
- Paste suspicious text from an SMS, WhatsApp forward, email, or social media post.
- You can also click one of the quick test sample buttons (e.g. *"Bank KYC Scam"*, *"Miracle Cancer Remedy"*).
- Click **"Analyze Message with Gemma"** (or press `Ctrl+Enter`).

### 2. Screenshot OCR Mode
- Drag and drop any chat screenshot, flyer, or infographic (JPG, PNG, WebP up to 5MB).
- Click **"Extract Text & Analyze"**.
- Tesseract OCR extracts the printed text. You can inspect the extracted text, fix any optical typos in the editable review box, and re-analyze the refined text.
- Uploaded image files are deleted immediately after OCR.

### 3. Website URL Mode
- Enter a link to a news article or suspicious website (must start with `http://` or `https://`).
- The server checks the destination against SSRF rules, fetches the page safely, strips away scripts and navigation clutter, and passes the clean text to Gemma.

---

## 🧪 Running Automated Tests

PhantomCheck AI includes an automated test suite verifying SSRF prevention, HTML parsing, AI output sanitization, OCR functionality, and API endpoints.

To run the automated tests:
```bash
npm test
```

Expected output:
```
=======================================================
🧪 Starting PhantomCheck AI Automated Test Suite
=======================================================

--- 1. SSRF IP Validation Tests ---
  ✅ PASS: Detects IPv4 loopback (127.0.0.1)
  ✅ PASS: Detects IPv4 private 10.x.x.x
  ✅ PASS: Detects IPv4 private 192.168.x.x
  ...
--- 2. SSRF URL Rejection Tests ---
  ✅ PASS: Rejects localhost hostname
  ✅ PASS: Rejects file:// URI scheme
  ...
--- 3. AI Response Parser & Sanitizer Tests ---
  ✅ PASS: Parses clean, valid JSON report
  ✅ PASS: Strips Markdown ```json fences from AI output
  ...
--- 5. Express API Endpoints Integration Tests ---
  ✅ PASS: GET /api/health returns health status
  ✅ PASS: Tesseract OCR successfully extracts text from image
  ...
=======================================================
Test Results: 27 passed, 0 failed.
=======================================================
```

---

## 🛠️ Comprehensive Troubleshooting Guide

### 1. Ollama Offline (`ECONNREFUSED` / Red Pill)
- **Problem:** Status indicator is red and shows "Ollama Offline".
- **Solution:**
  1. Check if the Ollama desktop application is running in your system tray.
  2. Open a terminal and run `ollama serve`.
  3. Ensure Ollama is reachable at `http://127.0.0.1:11434`.

### 2. Model Missing (`404 Not Found` / Amber Pill)
- **Problem:** Status shows "Model Missing: gemma4:e2b".
- **Solution:**
  1. Open terminal and run `ollama list` to see what models are currently installed.
  2. If the model is not installed, pull it:
     ```bash
     ollama pull gemma4:e2b
     ```
  3. If you have another Gemma model already downloaded (e.g. `gemma2:2b`), update your `.env` file:
     ```ini
     OLLAMA_MODEL=gemma2:2b
     ```
  4. Restart the server (`npm start`).

### 3. Port Conflict (`EADDRINUSE: address already in use :::3000`)
- **Problem:** Port 3000 is occupied by another application.
- **Solution:**
  1. Open `.env`.
  2. Change `PORT=3000` to an available port, such as `PORT=3005`.
  3. Restart with `npm start` and browse to `http://localhost:3005`.

### 4. OCR No Legible Text (`422 Unprocessable Entity`)
- **Problem:** Screenshot upload returns "No legible text was found in this screenshot".
- **Solution:**
  - Ensure the screenshot is clear, high-contrast, and not blurry.
  - OCR requires printed text characters. Abstract graphics, diagrams without text, or heavily compressed photos may fail.
  - You can copy and paste the text directly into **Message Mode**.

### 5. Website URL Fetch Blocked (`400 Bad Request`)
- **Problem:** URL analysis fails with "Access to IP address is blocked: private, loopback, or internal address detected".
- **Solution:**
  - This is an intentional security safeguard (SSRF defense) preventing attacks against local networks (`127.0.0.1`, `192.168.x`, router gateways).
  - Only public, accessible HTTP/HTTPS websites can be analyzed.
  - Paywalled websites or websites requiring JavaScript-rendered login portals cannot be scraped; copy their article text into Message Mode instead.

---

## 🛡️ Security, Privacy & Responsible AI Design

- **Prompt Injection Defense:** All user input is wrapped inside strict `<untrusted_content>` boundary tags with explicit system instructions prohibiting execution of instructions embedded in analyzed messages.
- **Strict Safe DOM Rendering:** All user input, OCR text, and AI responses are rendered using `textContent` and safe DOM elements, preventing Cross-Site Scripting (XSS).
- **Transient Storage:** Uploaded screenshots are deleted via `fs.promises.unlink` immediately after OCR finishes.
- **No Deceptive Guarantees:** The application explicitly clarifies that *"No Major Warning Signs Detected"* does not mean certified truth, and content analysis cannot replace official independent verification.

---

## 📜 License & Acknowledgments

- **License:** MIT License
- Built with [Express.js](https://expressjs.com/), [Ollama](https://ollama.com/), [Google Gemma](https://ai.google.dev/gemma), [Tesseract.js](https://tesseract.projectnaptha.com/), and [Cheerio](https://cheerio.js.org/).
