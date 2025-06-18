const form = document.getElementById('upload-form');
const fileInput = document.getElementById('csvFile');
const dropdown = document.getElementById('file-dropdown');

form.addEventListener('submit', function (event) {
    event.preventDefault();

    const file = fileInput.files[0];
    if (!file) {
        alert('Please select a CSV file');
        return;
    }

    const formData = new FormData();
    formData.append('csvFile', file);

    fetch('/upload', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            console.log('Upload success:', data);
            alert(data.message);
            loadFiles(); // Reload the list of files in the dropdown
        })
        .catch(error => {
            console.error('Error uploading file:', error);
            alert('File upload failed. Please try again.');
        });
});

// Load files into the dropdown when the page is loaded
function loadFiles() {
    fetch('/')
        .then(response => response.json())
        .then(files => {
            dropdown.innerHTML = '';  // Clear current dropdown options
            files.forEach(file => {
                const option = document.createElement('option');
                option.value = file;
                option.textContent = file;
                dropdown.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error loading files:', error);
            alert('Failed to load available files.');
        });
}

// Load the files when the page is ready
window.onload = loadFiles;
