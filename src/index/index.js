// eslint-disable-next-line no-undef
const dropZone = document.getElementById('drag-drop-zone');

dropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  event.stopPropagation();

  for (const f of event.dataTransfer.files) {
    // Using the path attribute to get absolute file path
    console.log('File Path of dragged files: ', f.path);
    // deleteApp(f.path);
  }
});

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
});
