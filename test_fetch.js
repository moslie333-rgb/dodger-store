async function test() {
  try {
    const url = 'https://gmfhnszfhxejmwdcbt1l.supabase.co/rest/v1/';
    console.log(`Testing URL: ${url}`);
    const response = await fetch(url);
    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Body:', text);
  } catch (e) {
    console.error('Fetch Error:', e.message);
  }
}

test();
