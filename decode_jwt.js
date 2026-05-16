const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtZmhuc3pmaHhlam13ZGNidDFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3MDk4ODIsImV4cCI6MjA5NDI4NTg4Mn0.45rnGExTIsrRN27WhK4dSxIBmPq_xflmkQqfUV9MjOg';
const parts = token.split('.');
const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
console.log(payload);
