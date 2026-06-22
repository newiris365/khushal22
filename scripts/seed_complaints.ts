import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') }); // Fallback

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log("Seeding hostel data...");

  // 1. Create a dummy institution
  const { data: inst, error: instErr } = await supabase.from('institutions').insert({
    name: 'IRIS University',
    type: 'university'
  }).select().single();
  
  const institutionId = inst ? inst.id : 'a0000000-0000-0000-0000-000000000000'; // Default if fail due to RLS

  // Try to use an existing institution if creation fails (e.g., unique constraint)
  const { data: existingInst } = await supabase.from('institutions').select('id').limit(1).single();
  const validInstId = existingInst ? existingInst.id : institutionId;

  // 2. Create a dummy student
  const studentId = 'c0000000-0000-0000-0000-000000000006';
  await supabase.from('students').upsert({
    id: studentId,
    institution_id: validInstId,
    name: 'Khushal Gehlot',
    roll_number: '23CSE051',
    email: 'khushal@iris.edu',
    gender: 'male',
    is_active: true
  });

  // 3. Create a dummy block
  const { data: block } = await supabase.from('hostel_blocks').upsert({
    id: 'b0000000-0000-0000-0000-000000000001',
    institution_id: validInstId,
    name: 'Block A',
    type: 'boys'
  }).select().single();

  const blockId = block ? block.id : 'b0000000-0000-0000-0000-000000000001';

  // 4. Create a dummy room
  const roomId = 'e4000000-0000-0000-0000-000000000001';
  await supabase.from('hostel_rooms').upsert({
    id: roomId,
    block_id: blockId,
    room_number: 'A-101',
    capacity: 2,
    occupied: 1,
    room_type: 'double'
  });

  // 5. Create allocation
  await supabase.from('hostel_allocations').upsert({
    id: 'f0000000-0000-0000-0000-000000000001',
    student_id: studentId,
    room_id: roomId,
    allotted_date: new Date().toISOString(),
    is_current: true
  });

  // 6. Delete old mock complaints to avoid duplicates
  await supabase.from('hostel_complaints').delete().eq('student_id', studentId);

  // 7. Seed complaints
  const complaints = [
    {
      student_id: studentId,
      room_id: roomId,
      institution_id: validInstId,
      title: 'Wi-Fi connection drops repeatedly',
      category: 'internet',
      description: 'The Wi-Fi router in the lobby keeps turning off. The signal inside A-101 is extremely weak.',
      priority: 'high',
      status: 'open',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      student_id: studentId,
      room_id: roomId,
      institution_id: validInstId,
      title: 'Bathroom tap leakage',
      category: 'plumbing',
      description: 'The bathroom basin tap is dripping constantly, causing water wastage.',
      priority: 'medium',
      status: 'in_progress',
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      student_id: studentId,
      room_id: roomId,
      institution_id: validInstId,
      title: 'Broken chair in room',
      category: 'maintenance',
      description: 'One of the study chairs is broken and wobbly.',
      priority: 'low',
      status: 'resolved',
      created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
      resolved_at: new Date(Date.now() - 86400000 * 8).toISOString(),
      resolution_notes: 'Replaced with a new chair.',
      student_rating: 4
    }
  ];

  for (const c of complaints) {
    const { error } = await supabase.from('hostel_complaints').insert(c);
    if (error) {
      console.error("Error inserting complaint:", error.message);
    }
  }

  console.log("Seeding complete!");
}

seed().catch(console.error);
