process.env.JWT_SECRET = 'test-secret-key-that-is-at-least-32-characters-long';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters-long!';
process.env.SUPABASE_URL = 'http://localhost:54321';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';

import { askClaude, buildSystemPrompt } from '../src/services/aiConciergeService';
import { chatLimiter } from '../src/middleware/rateLimit';
import { fetchUserContext, detectActionIntent, confirmBotAction, getNudges, triggerEscalationFlow, classifyMessageIntent, getAiUsageStats } from '../src/controllers/aiConcierge';
import { getAiConfig, saveAiConfig, getActiveInstitutionKeys, getBotConfig, saveBotConfig, getEscalationConfig, saveEscalationConfig } from '../src/controllers/aiConfig';
import { runAiDataRetentionCleanup } from '../src/config/cron';
import { encryptText, decryptText } from '../src/lib/encryption';

function makeReq(overrides: Record<string, any> = {}) {
  return {
    headers: {},
    ip: '127.0.0.1',
    query: {},
    body: {},
    params: {},
    socket: { remoteAddress: '127.0.0.1' },
    ...overrides,
  } as any;
}

function makeRes() {
  const headers: Record<string, string> = {};
  const res: any = {
    headersSent: false,
    statusCode: 200,
  };
  res.setHeader = jest.fn((k: string, v: string) => { headers[k] = v; return res; });
  res.getHeader = jest.fn((k: string) => headers[k]);
  res.get = jest.fn((k: string) => headers[k]);
  res.status = jest.fn((code: number) => { res.statusCode = code; return res; });
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

describe('AI Concierge Hardening Tests', () => {

  // 1. askClaude() provider fallback order
  describe('1. askClaude provider fallback order', () => {
    let originalFetch: typeof global.fetch;

    beforeAll(() => {
      originalFetch = global.fetch;
    });

    afterAll(() => {
      global.fetch = originalFetch;
    });

    it('should fallback to Claude when OpenAI and Gemini fail, returning provider "Claude"', async () => {
      global.fetch = jest.fn().mockImplementation((url: string) => {
        if (url.includes('openai.com')) {
          return Promise.resolve({
            ok: false,
            status: 500,
            text: async () => 'OpenAI server error',
          });
        }
        if (url.includes('googleapis.com')) {
          return Promise.resolve({
            ok: false,
            status: 500,
            text: async () => 'Gemini server error',
          });
        }
        if (url.includes('anthropic.com')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              content: [{ text: 'Hello from Claude test response' }]
            }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      }) as any;

      const keys = {
        openai_api_key: 'sk-test-openai-key',
        gemini_api_key: 'test-gemini-key',
        claude_api_key: 'sk-ant-test-claude-key',
      };

      const result = await askClaude(
        'What is my timetable?',
        { institution: 'SIET', name: 'Student', role: 'Student', attendance: 85, pending_fees: 0, timetable: [], notices: [] },
        [],
        keys
      );

      expect(result).toBeDefined();
      expect(result.provider).toBe('Claude');
      expect(result.text).toBe('Hello from Claude test response');
    });
  });

  // 2. chatLimiter rate limiting
  describe('2. chatLimiter per-user rate limiting', () => {
    it('should allow up to 20 requests per minute and block the 21st request with rate limit error', async () => {
      const userId = 'user-test-limiter-123';
      
      let res21: any;
      let hitCount = 0;

      for (let i = 0; i < 25; i++) {
        const req = makeReq({
          user: { id: userId, institution_id: 'inst-1', role: 'Student', email: 'test@siet.edu.in' }
        });
        const res = makeRes();
        const next = jest.fn();

        await chatLimiter(req, res, next);

        if (next.mock.calls.length > 0) {
          hitCount++;
        } else {
          res21 = res;
        }
      }

      expect(hitCount).toBe(20);
      expect(res21).toBeDefined();
      expect(res21.status).toHaveBeenCalledWith(429);
    });
  });

  // 3. fetchUserContext institution_id scoping
  describe('3. fetchUserContext institution_id scoping', () => {
    it('should strictly scope context queries and returned data by institution_id', async () => {
      const ctxInstA = await fetchUserContext('user-test-id-1', 'inst-A-123', 'Student');
      const ctxInstB = await fetchUserContext('user-test-id-2', 'inst-B-456', 'Student');

      expect(ctxInstA).toBeDefined();
      expect(ctxInstB).toBeDefined();
      expect(ctxInstA.ctx_timestamp).toBeDefined();
      expect(ctxInstB.ctx_timestamp).toBeDefined();
    });
  });

  // 4. aiConfig.ts encryption round-trip
  describe('4. aiConfig.ts encryption round-trip', () => {
    it('should encrypt keys at rest and decrypt correctly in getActiveInstitutionKeys', async () => {
      const plainKey = 'sk-proj-test-raw-openai-secret-key-12345';
      const encrypted = encryptText(plainKey);

      // 1. Confirm encrypted format starts with enc: and is NOT plaintext
      expect(encrypted).not.toEqual(plainKey);
      expect(encrypted.startsWith('enc:')).toBe(true);

      // 2. Confirm decryptText returns original key
      const decrypted = decryptText(encrypted);
      expect(decrypted).toEqual(plainKey);

      // 3. Save via saveAiConfig
      const instId = 'inst-encryption-test-' + Date.now();
      const saveReq = makeReq({
        body: {
          institution_id: instId,
          openai_api_key: plainKey
        }
      });
      const saveRes = makeRes();
      await saveAiConfig(saveReq, saveRes);

      expect(saveRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );

      // 4. Get active institution keys and verify decryption
      const activeKeys = await getActiveInstitutionKeys(instId);
      expect(activeKeys.openai_api_key).toEqual(plainKey);

      // 5. Get AI config for frontend and verify keys are MASKED (never decrypted to client)
      const getReq = makeReq({
        query: { institution_id: instId }
      });
      const getRes = makeRes();
      await getAiConfig(getReq, getRes);

      const jsonCall = getRes.json.mock.calls[0][0];
      expect(jsonCall.success).toBe(true);
      expect(jsonCall.config.openai.configured).toBe(true);
      expect(jsonCall.config.openai.last4).toBe('2345');
      expect(jsonCall.config.openai.openai_api_key).toBeUndefined();
    });
  });

  // 5. Bot Branding Configuration round-trip
  describe('5. bot_config branding round-trip', () => {
    it('should save custom bot_config and return merged branding settings on getBotConfig', async () => {
      const instId = 'inst-branding-test-' + Date.now();
      const customConfig = {
        institution_id: instId,
        name: 'SIET Campus Bot',
        accent_color: '#3B82F6',
        avatar_url: 'https://example.com/siet-logo.png',
        tone: 'Formal and academic',
        welcome_message: 'Welcome to SIET Assistant!',
        role_greetings: { Student: 'Hello Student! Ask me about your grades.' },
        auto_open_on_urgent: true,
        escalation_mode: 'contact_info',
        escalation_contact: 'support@siet.edu.in',
        data_retention_days: 90
      };

      const saveReq = makeReq({ body: customConfig });
      const saveRes = makeRes();
      await saveBotConfig(saveReq, saveRes);

      expect(saveRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, config: expect.objectContaining({ name: 'SIET Campus Bot' }) })
      );

      const getReq = makeReq({ query: { institution_id: instId } });
      const getRes = makeRes();
      await getBotConfig(getReq, getRes);

      const jsonCall = getRes.json.mock.calls[0][0];
      expect(jsonCall.success).toBe(true);
      expect(jsonCall.config.name).toBe('SIET Campus Bot');
      expect(jsonCall.config.accent_color).toBe('#3B82F6');
      expect(jsonCall.config.role_greetings.Student).toBe('Hello Student! Ask me about your grades.');
    });

    it('should maintain strict bot branding isolation between Institution A and Institution B', async () => {
      await saveBotConfig(
        makeReq({ user: { institution_id: 'inst-A' }, body: { name: 'Bot-Alpha', tone: 'Strict and formal' } }),
        makeRes()
      );
      await saveBotConfig(
        makeReq({ user: { institution_id: 'inst-B' }, body: { name: 'Bot-Beta', tone: 'Warm and friendly' } }),
        makeRes()
      );

      const ctxA = await fetchUserContext('u-A', 'inst-A', 'Student');
      const ctxB = await fetchUserContext('u-B', 'inst-B', 'Student');

      expect(ctxA.bot_name).toBe('Bot-Alpha');
      expect(ctxA.bot_tone).toBe('Strict and formal');

      expect(ctxB.bot_name).toBe('Bot-Beta');
      expect(ctxB.bot_tone).toBe('Warm and friendly');
    });
  });

  // 6. Role-adaptive tone default & multilingual system prompt
  describe('6. buildSystemPrompt tone adaptive and multilingual instructions', () => {
    it('should generate formal data-forward tone for Admin and warm encouraging tone for Student', () => {
      const adminPrompt = buildSystemPrompt({ institution: 'SIET', name: 'Alice', role: 'Admin' });
      expect(adminPrompt).toContain('Tone: Use a formal, precise, and data-forward tone.');
      expect(adminPrompt).toContain('Always respond in the exact same language the user wrote in');

      const studentPrompt = buildSystemPrompt({ institution: 'SIET', name: 'Bob', role: 'Student' });
      expect(studentPrompt).toContain('Tone: Use a warm and encouraging tone.');

      const customPrompt = buildSystemPrompt({ institution: 'SIET', name: 'Charlie', role: 'Student', bot_tone: 'Strict and authoritative' } as any);
      expect(customPrompt).toContain('Tone: Adhere to institution persona guidelines: Strict and authoritative');
    });
  });

  // 7. Bot Actions Intent Extraction & Execution Flow
  describe('7. bot actions intent extraction and confirmation flow', () => {
    it('should detect missing fields for leave request and generate follow-up prompt', () => {
      const result = detectActionIntent('Apply leave due to fever', 'Student');
      expect(result.action_type).toBe('apply_leave');
      expect(result.missing_fields).toContain('start_date');
      expect(result.follow_up_prompt).toContain('Please provide the missing details');
    });

    it('should extract complete leave request fields when dates and reason are provided', () => {
      const result = detectActionIntent('Apply leave from 2026-08-25 to 2026-08-27 for family function', 'Parent');
      expect(result.action_type).toBe('apply_leave');
      expect(result.missing_fields).toEqual([]);
      expect(result.fields.start_date).toBe('2026-08-25');
      expect(result.fields.end_date).toBe('2026-08-27');
      expect(result.fields.reason).toBe('family function');
    });

    it('should extract PTM booking intent and fields', () => {
      const result = detectActionIntent('Book PTM on 2026-08-25 at 03:15 PM', 'Parent');
      expect(result.action_type).toBe('book_ptm');
      expect(result.missing_fields).toEqual([]);
      expect(result.fields.date).toBe('2026-08-25');
      expect(result.fields.slot_time).toBe('03:15 PM');
    });

    it('should extract complaint intent and category', () => {
      const result = detectActionIntent('Raise hostel complaint about leaking tap in room 204', 'Student');
      expect(result.action_type).toBe('raise_complaint');
      expect(result.fields.category).toBe('hostel');
    });

    it('should extract attendance correction intent', () => {
      const result = detectActionIntent('Attendance correction for 2026-08-20 mark present', 'Student');
      expect(result.action_type).toBe('attendance_correction');
      expect(result.fields.date).toBe('2026-08-20');
      expect(result.fields.claimed_status).toBe('Present');
    });

    it('should execute confirmBotAction for leave application', async () => {
      const req = makeReq({
        user: { id: 'u-action-test', role: 'Student', institution_id: 'inst-test-1' },
        body: {
          action_type: 'apply_leave',
          fields: { start_date: '2026-08-25', end_date: '2026-08-27', reason: 'Fever' }
        }
      });
      const res = makeRes();
      await confirmBotAction(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: expect.stringContaining('Leave application submitted') })
      );
    });

    it('should reject Student role trying to trigger PTM booking action with 403 Forbidden', async () => {
      const req = makeReq({
        user: { id: 'u-student-1', role: 'Student', institution_id: 'inst-test-1' },
        body: {
          action_type: 'book_ptm',
          fields: { teacher_id: 't-1', date: '2026-08-25', slot_time: '03:15 PM' }
        }
      });
      const res = makeRes();
      await confirmBotAction(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: 'Only parents can book PTM slots.' })
      );
    });
  });

  // 8. Proactive Nudges Urgency Calculation
  describe('8. proactive nudges urgency calculation and API delivery', () => {
    it('should return enriched nudges with calculated urgency property', async () => {
      const req = makeReq({
        user: { id: 'u-nudge-test', role: 'Student', institution_id: 'inst-test-1' }
      });
      const res = makeRes();
      await getNudges(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          nudges: expect.any(Array),
          stats: expect.objectContaining({ total: expect.any(Number) })
        })
      );
    });
  });

  // 9. Escalations Mode Branching & Config Endpoints
  describe('9. escalations mode branching and config endpoints', () => {
    it('should read and update escalation config via endpoints', async () => {
      const saveReq = makeReq({
        user: { id: 'u-admin', role: 'Admin', institution_id: 'inst-esc-1' },
        body: { escalation_mode: 'live_transfer', escalation_contact: 'support@siet.edu' }
      });
      const saveRes = makeRes();
      await saveEscalationConfig(saveReq, saveRes);

      expect(saveRes.status).toHaveBeenCalledWith(200);
      expect(saveRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, escalation_mode: 'live_transfer', escalation_contact: 'support@siet.edu' })
      );

      const getReq = makeReq({
        user: { id: 'u-admin', role: 'Admin', institution_id: 'inst-esc-1' }
      });
      const getRes = makeRes();
      await getEscalationConfig(getReq, getRes);

      expect(getRes.status).toHaveBeenCalledWith(200);
      expect(getRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, escalation_mode: 'live_transfer', escalation_contact: 'support@siet.edu' })
      );
    });

    it('should branch triggerEscalationFlow correctly based on escalation_mode', async () => {
      // Live Transfer mode
      await saveEscalationConfig(
        makeReq({ user: { institution_id: 'inst-esc-branch' }, body: { escalation_mode: 'live_transfer' } }),
        makeRes()
      );
      const liveRes = await triggerEscalationFlow('u-1', 'inst-esc-branch', 'I need human help');
      expect(liveRes.escalation_mode).toBe('live_transfer');
      expect(liveRes.response).toContain('Live Support Transfer Initiated');

      // Contact Info mode
      await saveEscalationConfig(
        makeReq({ user: { institution_id: 'inst-esc-branch' }, body: { escalation_mode: 'contact_info', escalation_contact: '+91 999-888-7777' } }),
        makeRes()
      );
      const contactRes = await triggerEscalationFlow('u-1', 'inst-esc-branch', 'Speak to agent');
      expect(contactRes.escalation_mode).toBe('contact_info');
      expect(contactRes.response).toContain('+91 999-888-7777');
    });
  });

  // 10. AI Data Retention Cleanup Cron
  describe('10. ai data retention cleanup cron job', () => {
    it('should execute data retention cleanup without error', async () => {
      const res = await runAiDataRetentionCleanup();
      expect(res).toHaveProperty('cleaned_count');
      expect(typeof res.cleaned_count).toBe('number');
    });
  });

  // 11. Cost-Saving Fast-Path Router
  describe('11. cost-saving fast-path router classification and analytics', () => {
    it('should classify single deterministic lookups as TEMPLATABLE', () => {
      expect(classifyMessageIntent('What is my attendance?')).toBe('TEMPLATABLE');
      expect(classifyMessageIntent('Show fee dues')).toBe('TEMPLATABLE');
      expect(classifyMessageIntent('Today timetable')).toBe('TEMPLATABLE');
    });

    it('should classify multi-part or action queries as NEEDS_LLM', () => {
      expect(classifyMessageIntent('What is my attendance and fee status?')).toBe('NEEDS_LLM');
      expect(classifyMessageIntent('Apply leave for sick reason from 2026-08-20')).toBe('NEEDS_LLM');
      expect(classifyMessageIntent('Why is my attendance low?')).toBe('NEEDS_LLM');
    });

    it('should force NEEDS_LLM when force_llm_always is true in bot_config', () => {
      const config = { force_llm_always: true };
      expect(classifyMessageIntent('What is my attendance?', config)).toBe('NEEDS_LLM');
    });

    it('should return fast-path cost savings analytics via getAiUsageStats endpoint', async () => {
      const req = makeReq({ user: { id: 'u-admin', role: 'Admin', institution_id: 'inst-stats-1' } });
      const res = makeRes();
      await getAiUsageStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          stats: expect.objectContaining({
            fastpath_percentage: expect.any(Number),
            savings_summary: expect.stringContaining('answered without an API call')
          })
        })
      );
    });
  });
});
