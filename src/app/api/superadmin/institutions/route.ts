import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Admin client that bypasses RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// GET - List all institutions
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('institutions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ institutions: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST - Create a new institution
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, type, email, phone, plan_tier, is_active, address, city, state } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 });
    }

    const PLAN_PRICING: Record<string, number> = {
      Seed: 0, Campus: 10000, University: 25000, Enterprise: 50000,
    };

    const { data, error } = await supabaseAdmin
      .from('institutions')
      .insert({
        name,
        type: type || 'university',
        email,
        phone: phone || null,
        address: address || null,
        city: city || null,
        state: state || null,
        plan_tier: plan_tier || 'Campus',
        is_active: is_active !== undefined ? is_active : true,
        plan_price_monthly: PLAN_PRICING[plan_tier] || 0,
        subscription_status: 'active',
        subscription_start_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ institution: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH - Update an institution
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Institution ID is required.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('institutions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ institution: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE - Delete an institution
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Institution ID is required.' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('institutions')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
