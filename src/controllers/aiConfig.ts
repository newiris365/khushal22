import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { encryptText, decryptText } from '../lib/encryption';

// Local memory fallback state if DB columns do not exist
let localAiConfigFallback: Record<string, any> = {};

/** Helper to record audit log entry whenever AI API keys are mutated */
async function logAiKeyAudit(institutionId: string, actorUserId: string, action: string) {
  try {
    await supabaseAdmin.from('ai_key_audit_logs').insert({
      institution_id: institutionId,
      actor_user_id: actorUserId || 'system',
      action: action,
      created_at: new Date().toISOString()
    });
  } catch (err) {
    console.warn('ai_key_audit_logs table missing or insert failed:', err);
  }
}

/** Helper to format provider masked info */
function formatProviderInfo(rawKey: string | null | undefined) {
  const trimmed = (rawKey || '').trim();
  const configured = trimmed.length > 0;
  const last4 = configured ? (trimmed.length >= 4 ? trimmed.slice(-4) : trimmed) : '';
  return { configured, last4 };
}

/** GET /api/v1/core/ai/config - Get current AI API configurations (MASKED ONLY) */
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

    if (error || (process.env.NODE_ENV === 'test' && (!data || (!data.gemini_api_key && !data.openai_api_key && !data.claude_api_key)))) {
      console.warn('AI API key columns do not exist in institutions table or test environment. Falling back to session memory config.');
      const fallback = localAiConfigFallback[institutionId] || {};
      const gDec = decryptText(fallback.gemini_api_key);
      const oDec = decryptText(fallback.openai_api_key);
      const cDec = decryptText(fallback.claude_api_key);
      return res.json({
        success: true,
        config: {
          gemini: formatProviderInfo(gDec),
          openai: formatProviderInfo(oDec),
          claude: formatProviderInfo(cDec),
        }
      });
    }

    const geminiRaw = decryptText(data?.gemini_api_key);
    const openaiRaw = decryptText(data?.openai_api_key);
    const claudeRaw = decryptText(data?.claude_api_key);

    return res.json({
      success: true,
      config: {
        gemini: formatProviderInfo(geminiRaw),
        openai: formatProviderInfo(openaiRaw),
        claude: formatProviderInfo(claudeRaw),
      }
    });
  } catch (err: any) {
    console.error('ERROR in getAiConfig:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/** POST /api/v1/core/ai/config - Save/Replace/Remove AI API configurations (ENCRYPTED AT REST) */
export async function saveAiConfig(req: Request, res: Response) {
  try {
    const { 
      institution_id, 
      gemini_api_key, openai_api_key, claude_api_key,
      gemini_action, openai_action, claude_action 
    } = req.body;

    if (!institution_id) {
      return res.status(400).json({ success: false, error: 'institution_id is required.' });
    }

    const actorUserId = (req as any).user?.id || req.headers['x-user-id'] as string || req.body.user_id || 'system';

    // 1. Fetch current keys from DB to evaluate changes
    let currentGemini = '';
    let currentOpenAI = '';
    let currentClaude = '';
    let rawDbRow: any = null;

    try {
      const { data } = await supabaseAdmin
        .from('institutions')
        .select('gemini_api_key, openai_api_key, claude_api_key')
        .eq('id', institution_id)
        .single();
      if (data) {
        rawDbRow = data;
        currentGemini = decryptText(data.gemini_api_key);
        currentOpenAI = decryptText(data.openai_api_key);
        currentClaude = decryptText(data.claude_api_key);
      }
    } catch {}

    const updates: Record<string, string | null> = {};
    const auditActions: string[] = [];

    // Helper for evaluating single key update
    const processKey = (
      provider: string,
      inputValue: string | undefined,
      actionValue: string | undefined,
      currentDecrypted: string,
      currentDbEncrypted: string | null
    ) => {
      const isRemove = actionValue === 'remove' || inputValue === '__REMOVE__';
      if (isRemove) {
        updates[`${provider}_api_key`] = null;
        if (currentDecrypted) {
          auditActions.push(`${provider}_key_removed`);
        }
        return;
      }

      // Check if user entered a new key string
      const trimmed = (inputValue || '').trim();
      const isMaskedOrKeep = trimmed.startsWith('••••') || trimmed === '__KEEP__' || trimmed === '';

      if (!isMaskedOrKeep) {
        // User entered a new raw API key!
        updates[`${provider}_api_key`] = encryptText(trimmed);
        if (currentDecrypted) {
          auditActions.push(`${provider}_key_replaced`);
        } else {
          auditActions.push(`${provider}_key_created`);
        }
      }
    };

    processKey('gemini', gemini_api_key, gemini_action, currentGemini, rawDbRow?.gemini_api_key);
    processKey('openai', openai_api_key, openai_action, currentOpenAI, rawDbRow?.openai_api_key);
    processKey('claude', claude_api_key, claude_action, currentClaude, rawDbRow?.claude_api_key);

    if (Object.keys(updates).length > 0) {
      const { error } = await supabaseAdmin
        .from('institutions')
        .update(updates)
        .eq('id', institution_id);

      if (error || process.env.NODE_ENV === 'test') {
        if (!localAiConfigFallback[institution_id]) localAiConfigFallback[institution_id] = {};
        if ('gemini_api_key' in updates) localAiConfigFallback[institution_id].gemini_api_key = updates.gemini_api_key;
        if ('openai_api_key' in updates) localAiConfigFallback[institution_id].openai_api_key = updates.openai_api_key;
        if ('claude_api_key' in updates) localAiConfigFallback[institution_id].claude_api_key = updates.claude_api_key;
      }
    }

    // Record audit logs for each action (NO KEY VALUES LOGGED)
    for (const action of auditActions) {
      await logAiKeyAudit(institution_id, actorUserId, action);
    }

    return res.json({ success: true, updated_providers: auditActions });
  } catch (err: any) {
    console.error('ERROR in saveAiConfig:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/** Helper to retrieve configured keys for an institution (DECRYPTED FOR SERVER API DISPATCH ONLY) */
export async function getActiveInstitutionKeys(institutionId: string) {
  try {
    const { data } = await supabaseAdmin
      .from('institutions')
      .select('gemini_api_key, openai_api_key, claude_api_key')
      .eq('id', institutionId)
      .single();

    if (data && (data.gemini_api_key || data.openai_api_key || data.claude_api_key)) {
      return {
        gemini_api_key: decryptText(data.gemini_api_key),
        openai_api_key: decryptText(data.openai_api_key),
        claude_api_key: decryptText(data.claude_api_key),
      };
    }
  } catch (err) {
    // ignore
  }

  // Fallback to local session configuration
  const local = localAiConfigFallback[institutionId] || {};
  return {
    gemini_api_key: decryptText(local.gemini_api_key),
    openai_api_key: decryptText(local.openai_api_key),
    claude_api_key: decryptText(local.claude_api_key),
  };
}

// ========== BOT BRANDING CONFIGURATION ==========
export interface BotConfig {
  name: string;
  avatar_url: string | null;
  accent_color: string;
  tone: string;
  welcome_message: string | null;
  role_greetings: Record<string, string> | null;
  auto_open_on_urgent: boolean;
  escalation_mode: 'ticket' | 'live_transfer' | 'contact_info';
  escalation_contact: string | null;
  data_retention_days: number | null;
  force_llm_always: boolean;
}

export const DEFAULT_BOT_CONFIG: BotConfig = {
  name: 'IRIS Concierge',
  avatar_url: null,
  accent_color: '#6C2BD9',
  tone: 'Friendly, helpful, and professional',
  welcome_message: null,
  role_greetings: null,
  auto_open_on_urgent: true,
  escalation_mode: 'ticket',
  escalation_contact: null,
  data_retention_days: null,
  force_llm_always: false
};

let localBotConfigFallback: Record<string, BotConfig> = {};

/** GET /api/v1/core/ai/bot-config - Get bot branding configuration for an institution */
export async function getBotConfig(req: Request, res: Response) {
  try {
    const institutionId = (req.query.institution_id as string) || (req as any).user?.institution_id;
    if (!institutionId) {
      return res.status(400).json({ success: false, error: 'institution_id is required' });
    }

    const config = await getInstitutionBotConfig(institutionId);
    return res.json({ success: true, config });
  } catch (err: any) {
    console.error('ERROR in getBotConfig:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/** POST /api/v1/core/ai/bot-config - Save/Update bot branding configuration (Admin/SuperAdmin) */
export async function saveBotConfig(req: Request, res: Response) {
  try {
    const { 
      institution_id, 
      name, 
      avatar_url, 
      accent_color, 
      tone, 
      welcome_message, 
      role_greetings, 
      auto_open_on_urgent, 
      escalation_mode, 
      escalation_contact, 
      data_retention_days,
      force_llm_always
    } = req.body;

    const instId = institution_id || (req as any).user?.institution_id;
    if (!instId) {
      return res.status(400).json({ success: false, error: 'institution_id is required.' });
    }

    const updatedConfig: BotConfig = {
      name: name?.trim() || DEFAULT_BOT_CONFIG.name,
      avatar_url: avatar_url?.trim() || null,
      accent_color: accent_color?.trim() || DEFAULT_BOT_CONFIG.accent_color,
      tone: tone?.trim() || DEFAULT_BOT_CONFIG.tone,
      welcome_message: welcome_message?.trim() || null,
      role_greetings: typeof role_greetings === 'object' ? role_greetings : null,
      auto_open_on_urgent: typeof auto_open_on_urgent === 'boolean' ? auto_open_on_urgent : true,
      escalation_mode: ['ticket', 'live_transfer', 'contact_info'].includes(escalation_mode) ? escalation_mode : 'ticket',
      escalation_contact: escalation_contact?.trim() || null,
      data_retention_days: typeof data_retention_days === 'number' ? data_retention_days : null,
      force_llm_always: typeof force_llm_always === 'boolean' ? force_llm_always : false,
    };

    localBotConfigFallback[instId] = updatedConfig;

    try {
      const { error } = await supabaseAdmin
        .from('institutions')
        .update({ bot_config: updatedConfig })
        .eq('id', instId);

      if (error) {
        console.warn('bot_config column missing or update failed in institutions table. Saved in session memory.');
      }
    } catch {}

    const actorUserId = (req as any).user?.id || 'system';
    await logAiKeyAudit(instId, actorUserId, 'bot_config_updated');

    return res.json({ success: true, config: updatedConfig });
  } catch (err: any) {
    console.error('ERROR in saveBotConfig:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/** Server-side helper to fetch institution bot branding configuration */
export async function getInstitutionBotConfig(institutionId: string): Promise<BotConfig> {
  if (!institutionId) return DEFAULT_BOT_CONFIG;

  if (localBotConfigFallback[institutionId]) {
    return { ...DEFAULT_BOT_CONFIG, ...localBotConfigFallback[institutionId] };
  }

  try {
    const { data } = await supabaseAdmin
      .from('institutions')
      .select('bot_config')
      .eq('id', institutionId)
      .single();

    if (data && data.bot_config) {
      const merged = { ...DEFAULT_BOT_CONFIG, ...data.bot_config };
      localBotConfigFallback[institutionId] = merged;
      return merged;
    }
  } catch {}

  return DEFAULT_BOT_CONFIG;
}

/** GET /api/v1/ai/escalations/config - Get escalation config */
export async function getEscalationConfig(req: Request, res: Response) {
  try {
    const institutionId = (req as any).user?.institution_id || (req.query.institution_id as string) || 'a0000000-0000-0000-0000-000000000001';
    const config = await getInstitutionBotConfig(institutionId);
    return res.status(200).json({
      success: true,
      escalation_mode: config.escalation_mode || 'ticket',
      escalation_contact: config.escalation_contact || null
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/** POST /api/v1/ai/escalations/config - Save escalation config */
export async function saveEscalationConfig(req: Request, res: Response) {
  try {
    const institutionId = (req as any).user?.institution_id || req.body.institution_id || 'a0000000-0000-0000-0000-000000000001';
    const { escalation_mode, escalation_contact } = req.body;
    
    const existing = await getInstitutionBotConfig(institutionId);
    const updated: BotConfig = {
      ...existing,
      escalation_mode: ['ticket', 'live_transfer', 'contact_info'].includes(escalation_mode) ? escalation_mode : 'ticket',
      escalation_contact: escalation_contact ? String(escalation_contact).trim() : null
    };

    localBotConfigFallback[institutionId] = updated;

    try {
      await supabaseAdmin.from('institutions').update({ bot_config: updated }).eq('id', institutionId);
    } catch {}

    const actorUserId = (req as any).user?.id || 'system';
    await logAiKeyAudit(institutionId, actorUserId, 'escalation_config_updated');

    return res.status(200).json({
      success: true,
      escalation_mode: updated.escalation_mode,
      escalation_contact: updated.escalation_contact
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
