import { Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { supabaseAdmin, isSupabaseOffline } from '../config/supabase';
import logger from '../config/logger';
import { getFingerprintHash } from '../lib/auth-helpers';

// ============================================================
// ZOD VALIDATION SCHEMAS
// ============================================================

export const registerApplicantSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(10, 'Invalid phone number'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  slug: z.string().min(1, 'Institution slug is required'),
  institution_id: z.string().uuid().optional(),
  cycle_id: z.string().uuid().optional()
});

export const verifyOtpSchema = z.object({
  phone: z.string().min(10),
  otp: z.string().length(6, 'OTP must be 6 digits')
});

export const personalDetailsSchema = z.object({
  dob: z.string().optional(),
  gender: z.string().optional(),
  category: z.string().optional(),
  domicile_state: z.string().optional(),
  aadhar_number: z.string().optional(),
  photo_url: z.string().optional(),
  address: z.object({
    permanent: z.string().optional(),
    correspondence: z.string().optional()
  }).optional(),
  guardian_name: z.string().optional(),
  guardian_phone: z.string().optional(),
  guardian_relation: z.string().optional()
});

export const programSelectionSchema = z.object({
  programs: z.array(z.object({
    program_id: z.string().uuid(),
    preference_order: z.number().int().positive()
  })).min(1, 'Select at least one program option')
});

export const academicRecordSchema = z.object({
  level: z.enum(['10th', '12th', 'graduation']),
  board_university: z.string().min(1),
  year_of_passing: z.number().int().positive(),
  percentage: z.number().min(0).max(100).optional(),
  cgpa: z.number().min(0).max(10).optional(),
  subjects: z.array(z.object({
    subject: z.string(),
    marks_obtained: z.number(),
    max_marks: z.number()
  })).optional(),
  marksheet_url: z.string().optional(),
  certificate_url: z.string().optional()
});

export const entranceScoreSchema = z.object({
  exam_name: z.string().min(1),
  roll_number: z.string().optional(),
  score: z.number().optional(),
  percentile: z.number().optional(),
  rank: z.number().int().optional(),
  scorecard_url: z.string().optional()
});

export const initiatePaymentSchema = z.object({
  applicant_id: z.string().uuid(),
  fee_type: z.enum(['application', 'confirmation', 'enrollment']),
  amount: z.number().positive()
});

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  applicant_id: z.string().uuid(),
  fee_type: z.enum(['application', 'confirmation', 'enrollment']),
  amount: z.number()
});

export const meritWeightConfigSchema = z.object({
  cycle_id: z.string().uuid(),
  program_id: z.string().uuid(),
  weight_12th: z.number().min(0).max(100),
  weight_entrance: z.number().min(0).max(100),
  weight_extracurricular: z.number().min(0).max(100)
});

export const crmLeadSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().nullable(),
  phone: z.string().min(10),
  source: z.enum(['website', 'social', 'event', 'walkin', 'referral']),
  program_interest: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});

// ============================================================
// PUBLIC FLOWS
// ============================================================

export async function getInstitutionAdmissions(req: Request, res: Response) {
  try {
    const { slug } = req.params;
    
    // Query institution details by slug
    const { data: inst, error: instErr } = await supabaseAdmin
      .from('institutions')
      .select('id, name, banner_url, logo_url')
      .eq('slug', slug)
      .maybeSingle();

    if (instErr) throw instErr;
    if (!inst) {
      return res.status(404).json({ success: false, error: 'Institution not found.' });
    }

    // Query all admission cycles configured for the institution
    const { data: cycles, error: cyclesErr } = await supabaseAdmin
      .from('admission_cycles')
      .select('*')
      .eq('institution_id', inst.id)
      .order('created_at', { ascending: false });

    if (cyclesErr) throw cyclesErr;

    const formattedCycles = (cycles || []).map(c => ({
      id: c.id,
      name: c.name,
      academic_year: c.academic_year,
      start_date: c.start_date,
      end_date: c.end_date,
      status: c.status
    }));

    const institution = {
      id: inst.id,
      name: inst.name,
      banner_url: inst.banner_url || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1470&auto=format&fit=crop',
      logo_url: inst.logo_url || 'https://api.iris365.in/assets/logo-purple.png',
      open_cycles: formattedCycles
    };
    
    return res.status(200).json({ success: true, institution });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getOpenPrograms(req: Request, res: Response) {
  try {
    const { slug } = req.params;
    const { data, error } = await supabaseAdmin
      .from('programs')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;
    return res.status(200).json({ success: true, programs: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function registerApplicant(req: Request, res: Response) {
  try {
    const parse = registerApplicantSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    }

    const { first_name, last_name, email, phone, password, slug, cycle_id: clientCycleId } = parse.data;

    // 1. Server-side lookup of institution details by slug (never trust client-supplied institution_id)
    const { data: inst, error: instErr } = await supabaseAdmin
      .from('institutions')
      .select('id, name, code, slug, is_active')
      .eq('slug', slug)
      .maybeSingle();

    if (instErr) {
      return res.status(500).json({ success: false, error: `Failed to resolve institution: ${instErr.message}` });
    }

    if (!inst || inst.is_active === false) {
      return res.status(404).json({ success: false, error: 'Institution not found or is currently inactive.' });
    }

    const targetInstId = inst.id;

    // 2. Fetch admission cycles for this institution to verify open cycle
    const { data: cycles, error: cyclesErr } = await supabaseAdmin
      .from('admission_cycles')
      .select('id, name, academic_year, status')
      .eq('institution_id', targetInstId)
      .order('created_at', { ascending: false });

    if (cyclesErr) {
      return res.status(500).json({ success: false, error: `Failed to fetch admission cycles: ${cyclesErr.message}` });
    }

    const openCycles = (cycles || []).filter(c => c.status === 'active' || c.status === 'open');
    let targetCycle = openCycles.find(c => clientCycleId && c.id === clientCycleId);
    if (!targetCycle && openCycles.length > 0) {
      targetCycle = openCycles[0];
    }
    if (!targetCycle && cycles && cycles.length > 0) {
      targetCycle = cycles[0];
    }

    if (!targetCycle) {
      return res.status(400).json({
        success: false,
        error: 'Admissions are currently closed for this institution. No open admission cycles found.'
      });
    }

    const targetCycleId = targetCycle.id;

    // 3. Check if this email is already registered for this institution
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', email)
      .eq('institution_id', targetInstId)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists for this institution. Please log in instead, or use a different email to register.'
      });
    }

    // 4. Generate unique Application Number from institution's real code/slug
    const rawCode = (inst as any).code || (inst as any).short_name || inst.slug || slug || 'SIET';
    const instCode = String(rawCode).toUpperCase().replace(/[^A-Z0-9-]/g, '');
    const academicYear = targetCycle.academic_year ? targetCycle.academic_year.split('-')[0] : '2026';
    const randomSerial = Math.floor(100000 + Math.random() * 900000);
    const applicationNumber = `${instCode}-${academicYear}-${randomSerial}`;

    // 3. Create User account inside auth and users DB
    const { data: userRecord, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        name: `${first_name} ${last_name}`,
        email,
        phone,
        role: 'Applicant',
        institution_id: targetInstId,
        is_active: true
      })
      .select()
      .single();

    if (userError) {
      // Friendly message for any remaining duplicate key violation
      if (userError.code === '23505') {
        return res.status(409).json({
          success: false,
          error: 'An account with this email or phone number already exists. Please log in or use different contact details.'
        });
      }
      return res.status(409).json({ success: false, error: `Account registration failed: ${userError.message}` });
    }

    // 3. Create record in applicants table
    const { data: applicant, error: applicantError } = await supabaseAdmin
      .from('applicants')
      .insert({
        id: userRecord.id, // match user ID to keep authentication unified
        institution_id: targetInstId,
        cycle_id: targetCycleId,
        application_number: applicationNumber,
        first_name,
        last_name,
        email,
        phone,
        status: 'draft'
      })
      .select()
      .single();

    if (applicantError) {
      // Cleanup user record if applicant insert fails to avoid orphaned users
      await supabaseAdmin.from('users').delete().eq('id', userRecord.id);
      if (applicantError.code === '23505') {
        return res.status(409).json({
          success: false,
          error: 'An application already exists with this email for the current admission cycle. Please log in to continue your existing application.'
        });
      }
      return res.status(500).json({ success: false, error: applicantError.message });
    }

    // Send Welcome SMS/WhatsApp mock trigger
    logger.info(`[SMS/WhatsApp Welcome] Sent to ${phone} with Application ID: ${applicationNumber}`);

    const tokenClaims = {
      id: userRecord.id,
      institution_id: targetInstId,
      role: 'applicant',
      email: email,
      fingerprint: getFingerprintHash(req),
      institute_type: 'college'
    };
    
    const token = jwt.sign(tokenClaims, process.env.JWT_SECRET as string, { expiresIn: '7d' });

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Verify mobile OTP to activate your dashboard credentials.',
      application_number: applicationNumber,
      applicant,
      token
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function verifyOTP(req: Request, res: Response) {
  try {
    const parse = verifyOtpSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    }

    const { phone, otp } = parse.data;
    
    // Simulate OTP checking: Accept '123456' as valid sandbox trigger
    if (otp !== '123456' && otp !== '654321') {
      return res.status(400).json({ success: false, error: 'Incorrect verification code. Please request new code.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Mobile number verified successfully.'
    });
      return res.status(400).json({ success: false, error: 'application_number and dob are required.' });
    }

    const appNo = (application_number as string).trim();
    const dobStr = (dob as string).trim();

    const { data: applicant, error: appErr } = await supabaseAdmin
      .from('applicants')
      .select('id, date_of_birth, dob, personal_details')
      .ilike('application_number', appNo)
      .maybeSingle();

    if (appErr || !applicant) {
      return res.status(404).json({ success: false, error: 'Application verification failed.' });
    }

    const storedDob = applicant.date_of_birth || applicant.dob || applicant.personal_details?.dob || '';
    if (storedDob && storedDob.slice(0, 10) !== dobStr.slice(0, 10)) {
      return res.status(403).json({ success: false, error: 'Date of birth verification failed.' });
    }

    let targetOfferId = offer_id;
    if (!targetOfferId) {
      const { data: latestOffer } = await supabaseAdmin
        .from('admission_offers')
        .select('id')
        .eq('applicant_id', applicant.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latestOffer) targetOfferId = latestOffer.id;
    }

    if (!targetOfferId) {
      return res.status(404).json({ success: false, error: 'No active offer found for this application.' });
    }

    const { data: offer, error: offerErr } = await supabaseAdmin
      .from('admission_offers')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', targetOfferId)
      .select()
      .single();

    if (offerErr || !offer) {
      return res.status(500).json({ success: false, error: 'Failed to update offer status.' });
    }

    await supabaseAdmin
      .from('applicants')
      .update({ status: 'admitted', updated_at: new Date().toISOString() })
      .eq('id', applicant.id);

    return res.status(200).json({
      success: true,
      message: 'Offer accepted successfully! Please proceed to seat confirmation fee payment.',
      offer
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function trackDeclineOffer(req: Request, res: Response) {
  try {
    const { application_number, dob, offer_id, reason } = req.body;
    if (!application_number || !dob) {
      return res.status(400).json({ success: false, error: 'application_number and dob are required.' });
    }

    const appNo = (application_number as string).trim();
    const dobStr = (dob as string).trim();

    const { data: applicant, error: appErr } = await supabaseAdmin
      .from('applicants')
      .select('id, date_of_birth, dob, personal_details')
      .ilike('application_number', appNo)
      .maybeSingle();

    if (appErr || !applicant) {
      return res.status(404).json({ success: false, error: 'Application verification failed.' });
    }

    const storedDob = applicant.date_of_birth || applicant.dob || applicant.personal_details?.dob || '';
    if (storedDob && storedDob.slice(0, 10) !== dobStr.slice(0, 10)) {
      return res.status(403).json({ success: false, error: 'Date of birth verification failed.' });
    }

    let targetOfferId = offer_id;
    if (!targetOfferId) {
      const { data: latestOffer } = await supabaseAdmin
        .from('admission_offers')
        .select('id')
        .eq('applicant_id', applicant.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latestOffer) targetOfferId = latestOffer.id;
    }

    if (!targetOfferId) {
      return res.status(404).json({ success: false, error: 'No active offer found for this application.' });
    }

    const { data: offer, error: offerErr } = await supabaseAdmin
      .from('admission_offers')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejection_reason: reason || 'Declined via tracking portal'
      })
      .eq('id', targetOfferId)
      .select()
      .single();

    if (offerErr || !offer) {
      return res.status(500).json({ success: false, error: 'Failed to decline offer.' });
    }

    await supabaseAdmin
      .from('applicants')
      .update({ status: 'withdrawn', updated_at: new Date().toISOString() })
      .eq('id', applicant.id);

    return res.status(200).json({
      success: true,
      message: 'Offer declined. Your application status has been updated to withdrawn.',
      offer
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function trackBookCounseling(req: Request, res: Response) {
  try {
    const { application_number, dob, session_id, slot_time } = req.body;
    if (!application_number || !dob) {
      return res.status(400).json({ success: false, error: 'application_number and dob are required.' });
    }

    const appNo = (application_number as string).trim();
    const dobStr = (dob as string).trim();

    const { data: applicant, error: appErr } = await supabaseAdmin
      .from('applicants')
      .select('id, date_of_birth, dob, personal_details')
      .ilike('application_number', appNo)
      .maybeSingle();

    if (appErr || !applicant) {
      return res.status(404).json({ success: false, error: 'Application verification failed.' });
    }

    const storedDob = applicant.date_of_birth || applicant.dob || applicant.personal_details?.dob || '';
    if (storedDob && storedDob.slice(0, 10) !== dobStr.slice(0, 10)) {
      return res.status(403).json({ success: false, error: 'Date of birth verification failed.' });
    }

    const { data: slot, error: slotErr } = await supabaseAdmin
      .from('counseling_slots')
      .insert({
        session_id: session_id || 'c1111111-1111-1111-1111-111111111111',
        applicant_id: applicant.id,
        slot_time: slot_time || new Date(Date.now() + 86400000).toISOString(),
        officer_id: 'b0000000-0000-0000-0000-000000000002',
        status: 'assigned',
        attended: false
      })
      .select()
      .single();

    if (slotErr) throw slotErr;

    return res.status(201).json({
      success: true,
      message: 'Counseling slot booked successfully.',
      slot
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
