import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const institutions = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Harvard University',
    type: 'university',
    address: 'Cambridge',
    city: 'Cambridge',
    state: 'MA',
    phone: '+1-617-495-1000',
    email: 'admin@harvard.edu',
    plan_tier: 'Enterprise',
    is_active: true
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'MIT',
    type: 'university',
    address: '77 Massachusetts Ave',
    city: 'Cambridge',
    state: 'MA',
    phone: '+1-617-253-1000',
    email: 'admin@mit.edu',
    plan_tier: 'Campus',
    is_active: true
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Stanford University',
    type: 'university',
    address: '450 Serra Mall',
    city: 'Stanford',
    state: 'CA',
    phone: '+1-650-723-2300',
    email: 'admin@stanford.edu',
    plan_tier: 'Enterprise',
    is_active: true
  }
];

async function seed() {
  console.log("Seeding institutions...");
  const { data, error } = await supabase
    .from('institutions')
    .upsert(institutions, { onConflict: 'email' })
    .select();

  if (error) {
    console.error("Error inserting institutions:", error);
  } else {
    console.log("Successfully inserted institutions:", data.length);
  }
}

seed();
