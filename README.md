# TERO - File Compression Web App

**TERO** is a Node.js-based web application that allows users to upload files and compress them using server-side logic. The app supports local hosting and also runs in a Dockerized environment.

---

## 🚀 Features

- Simple and responsive UI for uploading files.
- Backend compression logic using Node.js.
- Returns original and compressed file sizes.
- Docker support for consistent deployment.

---

## 🧰 Tech Stack

- **Frontend:** HTML5, Bootstrap 5
- **Backend:** Node.js (Express)
- **Compression:** `adm-zip` or similar
- **Containerization:** Docker

---

## 🧪 Local Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Yash-Pandey19/tero.git
cd tero
```

### 2. Install Dependencies

```bash
npm install
```
### 3. Run the App

```bash
node node.js
```
#### Visit: http://localhost:3000

---

## 🐳 Docker Setup
### 1. Build and Run Using Dockerfile

```bash
 docker build -t tero-compressor .
```
### 2. Run the container on port 3000

```bash
 docker run -p 3000:3000 tero-compressor
```
#### App will be live at: http://localhost:3000

---

## 📁 Project Structure

```
TERO/
│
├── public/ # Static assets (HTML, CSS, favicon, logo)
│ └── index.html
│
├── uploads/ # Uploaded files (auto-generated)
├── compressed/ # Compressed output files (auto-generated)
│
├── server.js # Main Node.js server
├── package.json # Project metadata and dependencies
├── Dockerfile # Docker image definition
├── .dockerignore # Ignored files during docker build
├── README.md # Project documentation

```

---

## 📂 File Upload & Compression

--Visit the app in your browser.

--Upload a file using the form.

--The server compresses the file and returns:

---Original Size

---Compressed Size

---Compression Ratio

--The compressed file is saved in the compressed/ directory.

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

- [Yash Pandey](https://github.com/Yash-Pandey19)
