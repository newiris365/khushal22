import logger from '../config/logger';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

function isSandboxMode(): boolean {
  return !TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN;
}

async function twilioFetch(endpoint: string, body: URLSearchParams): Promise<any> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}${endpoint}`;
  const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Twilio API error ${response.status}: ${errorText}`);
  }

  return response.json();
}

export async function sendWhatsAppMessage(
  to: string,
  templateName: string,
  params: Record<string, string>
): Promise<boolean> {
  if (isSandboxMode()) {
    logger.info(`[WHATSAPP SANDBOX] To: ${to}, Template: ${templateName}, Params: ${JSON.stringify(params)}`);
    return true;
  }

  try {
    const body = new URLSearchParams({
      To: to,
      From: TWILIO_WHATSAPP_FROM,
      ContentTemplateSid: templateName,
      ContentVariables: JSON.stringify(params),
    });

    await twilioFetch('/Messages.json', body);
    logger.info(`WhatsApp message sent to ${to} using template ${templateName}`);
    return true;
  } catch (err: any) {
    logger.error(`Failed to send WhatsApp message to ${to}: ${err.message}`);
    return false;
  }
}

export async function sendFeeReminder(
  studentPhone: string,
  studentName: string,
  feeName: string,
  amount: number,
  dueDate: string,
  daysOverdue: number
): Promise<boolean> {
  if (isSandboxMode()) {
    logger.info(
      `[WHATSAPP FEE REMINDER SANDBOX] To: ${studentPhone}, Student: ${studentName}, Fee: ${feeName}, Amount: ₹${amount}, Due: ${dueDate}, Days Overdue: ${daysOverdue}`
    );
    return true;
  }

  try {
    const messageBody = daysOverdue > 0
      ? `Dear ${studentName}, your fee payment of ₹${amount} for "${feeName}" was due on ${dueDate} and is now ${daysOverdue} day(s) overdue. Please pay immediately to avoid late charges. - IRIS 365`
      : `Dear ${studentName}, this is a reminder that your fee payment of ₹${amount} for "${feeName}" is due on ${dueDate}. Please ensure timely payment. - IRIS 365`;

    const body = new URLSearchParams({
      To: studentPhone,
      From: TWILIO_WHATSAPP_FROM,
      Body: messageBody,
    });

    await twilioFetch('/Messages.json', body);
    logger.info(`Fee reminder sent to ${studentPhone} for ${feeName}`);
    return true;
  } catch (err: any) {
    logger.error(`Failed to send fee reminder to ${studentPhone}: ${err.message}`);
    return false;
  }
}

export interface FeeReminderEntry {
  student_id: string;
  student_name: string;
  student_phone: string;
  fee_name: string;
  amount: number;
  due_date: string;
  days_overdue: number;
}

export async function sendBulkReminders(reminders: FeeReminderEntry[]): Promise<{ sent: number; failed: number; details: { student_id: string; status: string }[] }> {
  let sent = 0;
  let failed = 0;
  const details: { student_id: string; status: string }[] = [];

  for (const reminder of reminders) {
    if (!reminder.student_phone) {
      failed++;
      details.push({ student_id: reminder.student_id, status: 'no_phone' });
      continue;
    }

    const success = await sendFeeReminder(
      reminder.student_phone,
      reminder.student_name,
      reminder.fee_name,
      reminder.amount,
      reminder.due_date,
      reminder.days_overdue
    );

    if (success) {
      sent++;
      details.push({ student_id: reminder.student_id, status: 'sent' });
    } else {
      failed++;
      details.push({ student_id: reminder.student_id, status: 'failed' });
    }
  }

  logger.info(`Bulk reminders: ${sent} sent, ${failed} failed out of ${reminders.length}`);
  return { sent, failed, details };
}
