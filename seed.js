/**
 * Seed script — inserts dummy data to test the PublicDisplay feature.
 * Run:  node seed.js
 */
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function seed() {
  console.log('🌱 Seeding database...\n');

  // 1. Create a test teacher
  const teacherPass = await bcrypt.hash('teacher123', 10);
  const { data: teacher, error: tErr } = await supabase
    .from('users')
    .upsert([{
      name: 'John Teacher',
      email: 'teacher@test.com',
      password_hash: teacherPass,
      role: 'teacher'
    }], { onConflict: 'email' })
    .select()
    .single();

  if (tErr) { console.error('Teacher insert error:', tErr.message); return; }
  console.log('✅ Teacher created:', teacher.id, '(teacher@test.com / teacher123)');

  // 2. Create a test principal
  const principalPass = await bcrypt.hash('principal123', 10);
  const { data: principal, error: pErr } = await supabase
    .from('users')
    .upsert([{
      name: 'Jane Principal',
      email: 'principal@test.com',
      password_hash: principalPass,
      role: 'principal'
    }], { onConflict: 'email' })
    .select()
    .single();

  if (pErr) { console.error('Principal insert error:', pErr.message); return; }
  console.log('✅ Principal created:', principal.id, '(principal@test.com / principal123)');

  // 3. Create approved content with ACTIVE time windows (now ± 24 hours)
  const now = new Date();
  const startTime = new Date(now.getTime() - 60 * 60 * 1000).toISOString();  // 1 hour ago
  const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours from now

  const contentItems = [
    {
      title: 'Algebra Basics - Chapter 1',
      description: 'Introduction to algebraic expressions and equations',
      subject: 'maths',
      file_url: 'https://picsum.photos/seed/math1/800/600',
      file_type: 'image/jpeg',
      file_size: 102400,
      uploaded_by: teacher.id,
      status: 'approved',
      approved_by: principal.id,
      approved_at: now.toISOString(),
      start_time: startTime,
      end_time: endTime,
      rotation_duration: 5
    },
    {
      title: 'Geometry Formulas',
      description: 'Area and perimeter formulas for all shapes',
      subject: 'maths',
      file_url: 'https://picsum.photos/seed/math2/800/600',
      file_type: 'image/jpeg',
      file_size: 98000,
      uploaded_by: teacher.id,
      status: 'approved',
      approved_by: principal.id,
      approved_at: now.toISOString(),
      start_time: startTime,
      end_time: endTime,
      rotation_duration: 5
    },
    {
      title: 'Newton\'s Laws of Motion',
      description: 'The three fundamental laws of classical mechanics',
      subject: 'science',
      file_url: 'https://picsum.photos/seed/science1/800/600',
      file_type: 'image/jpeg',
      file_size: 115000,
      uploaded_by: teacher.id,
      status: 'approved',
      approved_by: principal.id,
      approved_at: now.toISOString(),
      start_time: startTime,
      end_time: endTime,
      rotation_duration: 3
    },
    {
      title: 'Chemical Bonding',
      description: 'Ionic and covalent bonds explained',
      subject: 'science',
      file_url: 'https://picsum.photos/seed/science2/800/600',
      file_type: 'image/png',
      file_size: 89000,
      uploaded_by: teacher.id,
      status: 'approved',
      approved_by: principal.id,
      approved_at: now.toISOString(),
      start_time: startTime,
      end_time: endTime,
      rotation_duration: 3
    },
    {
      title: 'Pending Announcement',
      description: 'This one is still pending approval',
      subject: 'maths',
      file_url: 'https://picsum.photos/seed/pending1/800/600',
      file_type: 'image/jpeg',
      file_size: 75000,
      uploaded_by: teacher.id,
      status: 'pending',
      start_time: startTime,
      end_time: endTime,
      rotation_duration: 5
    }
  ];

  const { data: inserted, error: cErr } = await supabase
    .from('content')
    .insert(contentItems)
    .select();

  if (cErr) { console.error('Content insert error:', cErr.message); return; }
  console.log(`✅ ${inserted.length} content items created\n`);

  // 4. Create content_slots
  for (const subj of ['maths', 'science']) {
    const { data: existingSlot } = await supabase
      .from('content_slots')
      .select('id')
      .eq('subject', subj)
      .single();

    if (!existingSlot) {
      await supabase.from('content_slots').insert([{ subject: subj }]);
    }
  }
  console.log('✅ Content slots created\n');

  // Print test URLs
  console.log('─────────────────────────────────────────');
  console.log('📋 TEST CREDENTIALS:');
  console.log('   Teacher:   teacher@test.com / teacher123');
  console.log('   Principal: principal@test.com / principal123');
  console.log('');
  console.log('🖥️  TEST URLs:');
  console.log(`   Public Display: http://localhost:5173/display/${teacher.id}`);
  console.log(`   Backend API:    http://localhost:5000/content/live/${teacher.id}`);
  console.log('─────────────────────────────────────────');
}

seed().catch(console.error);
