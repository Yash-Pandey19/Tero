document.getElementById("uploadForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];
  if (!file) return;

  const originalSize = file.size;
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/compress", {
    method: "POST",
    body: formData,
  });

  if (response.ok) {
    const blob = await response.blob();
    const compressedSize = blob.size;

    const originalSizeKB = (originalSize / 1024).toFixed(2);
    const compressedSizeKB = (compressedSize / 1024).toFixed(2);
    const ratio = ((compressedSize / originalSize) * 100).toFixed(2);

    // Update result section
    document.getElementById("originalSize").textContent = `${originalSizeKB} KB`;
    document.getElementById("compressedSize").textContent = `${compressedSizeKB} KB`;
    document.getElementById("compressionRatio").textContent = `${ratio}%`;

    const url = URL.createObjectURL(blob);
    const downloadLink = document.getElementById("downloadLink");
    downloadLink.href = url;
    downloadLink.download = `compressed_${file.name}`;

    document.getElementById("resultSection").style.display = "block";
  } else {
    alert("Compression failed.");
  }
});
