const socket = io();
const form = document.getElementById('uploadForm');
const status = document.getElementById('status');

socket.on('connected', function (id) {
    document.getElementById('socketId').value = id;
});

socket.on('statusUpdate', function (message) {
    status.innerText = message;
});

form.addEventListener('submit', function (e) {
    e.preventDefault();

    status.innerText = 'Uploading...';

    const formData = new FormData(form);
    fetch('/upload', {
        method: 'POST',
        body: formData
    }).then(res => {
        if (res.ok) {
            status.innerText = 'Upload complete. Processing...';
        } else {
            status.innerText = 'Upload failed.';
        }
    });
});
