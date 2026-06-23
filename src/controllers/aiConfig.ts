import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

/** GET /api/v1/core/ai/config - Get current AI API configurations */
export async function getAiConfig(req: Request, res: Response) {
  try {
    const institutionId = req.query.institution_id as string;
    if (!institutionId) {
      return res.status(400).json({ success: false, error: 'institution_id is required' });
    }

    const { data, error } = await supabaseAdmin
      .from('institutions')
      .select('gemini_api_key, openai_api_key, claude_api_key')
      .eq('id', institutionId)
      .single();

    if (error) throw error;

    return res.json({
      success: true,
      config: data || {
        gemini_api_key: '',
        openai_api_key: '',
        claude_api_key: '',
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/** POST /api/v1/core/ai/config - Save AI API configurations */
export async function saveAiConfig(req: Request, res: Response) {
  try {
    const { institution_id, gemini_api_key, openai_api_key, claude_api_key } = req.body;

    if (!institution_id) {
      return res.status(400).json({ success: false, error: 'institution_id is required.' });
    }

    const { error } = await supabaseAdmin
      .from('institutions')
      .update({
        gemini_api_key: gemini_api_key || null,
        openai_api_key: openai_api_key || null,
        claude_api_key: claude_api_key || null,
      })
      .eq('id', institution_id);

    if (error) throw error;

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
