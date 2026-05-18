/**
 * Script to:
 * 1. Inspect current BEIN_NEW rows
 * 2. Add duration_order column via direct UPDATE
 * 3. Set duration_order based on plan_name duration pattern
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gmfhnszfhxejmwdcbtll.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtZmhuc3pmaHhlam13ZGNidGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3MDk4ODIsImV4cCI6MjA5NDI4NTg4Mn0.45rnGExTIsrRN27WhK4dSxIBmPq_xflmkQqfUV9MjOg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  // Step 1: Fetch all BEIN_NEW rows to see structure
  console.log('=== Fetching BEIN_NEW rows ===');
  const { data: beinRows, error: fetchErr } = await supabase
    .from('pricing_plans')
    .select('*')
    .eq('category', 'BEIN_NEW')
    .order('sort_order', { ascending: true });

  if (fetchErr) {
    console.error('Fetch error:', fetchErr);
    return;
  }

  console.log(`Found ${beinRows.length} BEIN_NEW rows:`);
  beinRows.forEach(r => {
    console.log(`  id=${r.id} | plan_name="${r.plan_name}" | duration="${r.duration}" | sort_order=${r.sort_order} | group_order=${r.group_order} | price=${r.price}`);
  });

  // Show all column names
  if (beinRows.length > 0) {
    console.log('\n=== Column names ===');
    console.log(Object.keys(beinRows[0]).join(', '));
  }

  // Step 2: Check if duration_order column already exists
  const hasDurationOrder = beinRows.length > 0 && 'duration_order' in beinRows[0];
  console.log(`\nduration_order column exists: ${hasDurationOrder}`);

  // Step 3: Calculate and update duration_order for each row
  console.log('\n=== Updating duration_order values ===');
  
  for (const row of beinRows) {
    const name = (row.plan_name || '').toUpperCase();
    let durationOrder = 999;
    
    if (/3\s*MONTH|3\s*شهر/.test(name)) durationOrder = 1;
    else if (/6\s*MONTH|6\s*شهر/.test(name)) durationOrder = 2;
    else if (/1\s*YEAR|سنة|12\s*MONTH/.test(name)) durationOrder = 3;
    
    console.log(`  Updating id=${row.id} "${row.plan_name}" -> duration_order=${durationOrder}`);
    
    const { error: updateErr } = await supabase
      .from('pricing_plans')
      .update({ duration_order: durationOrder })
      .eq('id', row.id);

    if (updateErr) {
      console.error(`  ERROR updating id=${row.id}:`, updateErr.message);
    } else {
      console.log(`  ✓ Updated successfully`);
    }
  }

  // Step 4: Verify the updates
  console.log('\n=== Verifying updated rows ===');
  const { data: updated, error: verifyErr } = await supabase
    .from('pricing_plans')
    .select('id, plan_name, duration, duration_order, sort_order, category')
    .eq('category', 'BEIN_NEW')
    .order('duration_order', { ascending: true });

  if (verifyErr) {
    console.error('Verify error:', verifyErr);
    return;
  }

  updated.forEach(r => {
    console.log(`  id=${r.id} | plan_name="${r.plan_name}" | duration_order=${r.duration_order} | sort_order=${r.sort_order}`);
  });

  console.log('\nDone!');
}

main().catch(console.error);
