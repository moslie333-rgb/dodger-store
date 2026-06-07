import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://gmfhnszfhxejmwdcbtll.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtZmhuc3pmaHhlam13ZGNidGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3MDk4ODIsImV4cCI6MjA5NDI4NTg4Mn0.45rnGExTIsrRN27WhK4dSxIBmPq_xflmkQqfUV9MjOg'
);

async function checkTables() {
  const tables = ['pricing_plans', 'site_videos', 'site_content'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(20);
    console.log(`\n================== Table: ${table} ==================`);
    if (error) {
      console.error(error);
    } else {
      console.log(`Record count (first 20 shown): ${data.length}`);
      console.log('Columns:', data.length > 0 ? Object.keys(data[0]) : 'Empty table');
      console.log('Data:', JSON.stringify(data, null, 2));
    }
  }
}

checkTables();
