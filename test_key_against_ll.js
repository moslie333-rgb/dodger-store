async function test() {
  const url = 'https://gmfhnszfhxejmwdcbtll.supabase.co/rest/v1/';
  const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtZmhuc3pmaHhlam13ZGNidDFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3MDk4ODIsImV4cCI6MjA5NDI4NTg4Mn0.45rnGExTIsrRN27WhK4dSxIBmPq_xflmkQqfUV9MjOg';
  
  try {
    console.log(`Testing URL: ${url} with provided Key`);
    const response = await fetch(url, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Body:', text);
  } catch (e) {
    console.error('Fetch Error:', e.message);
  }
}

test();
