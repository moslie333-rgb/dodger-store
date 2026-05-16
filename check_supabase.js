import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://gmfhnszfhxejmwdcbtll.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtZmhuc3pmaHhlam13ZGNidGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3MDk4ODIsImV4cCI6MjA5NDI4NTg4Mn0.45rnGExTIsrRN27WhK4dSxIBmPq_xflmkQqfUV9MjOg'
);

async function checkTables() {
  const tables = ['tod_plans', 'bein_plans', 'bein_renewal_plans', 'videos'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    console.log(`Table: ${table}`);
    if (error) {
      console.error(error);
    } else {
      console.log('Columns:', data.length > 0 ? Object.keys(data[0]) : 'Empty table');
      console.log('Data:', data);
    }
  }
}

checkTables();
