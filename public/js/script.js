const socket = io();

// Upload form handler
document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const res = await fetch('/upload', {
        method: 'POST',
        body: formData
    });

    const data = await res.json();
    alert(data.message);
    location.reload();
});

// Scan trigger
document.getElementById('jsonSelector').addEventListener('change', async function () {
    const selectedFile = this.value;
    if (!selectedFile) return;

    const res = await fetch(`/scan?file=${encodeURIComponent(selectedFile)}`);
    const text = await res.text();
    alert(text);
});

// Real-time update
socket.on('statusUpdate', ({ subdomain, status }) => {
    const table = document.getElementById('statusTable');
    const row = document.createElement('tr');
    row.innerHTML = `<td>${subdomain}</td><td>${status}</td>`;
    table.appendChild(row);
});
