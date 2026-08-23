import { initializeApp, cert, App } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { supabaseAdmin } from '../config/supabase';
import logger from '../config/logger';

let firebaseApp: App | null = null;

try {
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    firebaseApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    logger.info('[FCM SERVICE] Firebase Admin initialized.');
  } else {
    logger.info('[FCM SERVICE] Firebase credentials missing. Running in mock-delivery fallback mode.');
  }
} catch (err) {
  logger.error('[FCM SERVICE] Initialization error:', err);
}

/**
 * Sends a push notification to all active devices registered for the given user.
 */
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data: Record<string, string> = {}
): Promise<boolean> {
  try {
    // Fetch all active device tokens for the user
    const { data: tokens, error } = await supabaseAdmin
      .from('device_tokens')
      .select('device_token')
      .eq('user_id', userId);

    if (error || !tokens || tokens.length === 0) {
      logger.debug(`[FCM SERVICE MOCK] No device tokens registered for user ${userId}. Skipping push notification.`);
      return false;
    }

    const deviceTokens = tokens.map(t => t.device_token);

    if (firebaseApp) {
      const messaging = getMessaging(firebaseApp);
      const response = await messaging.sendEachForMulticast({
        tokens: deviceTokens,
        notification: { title, body },
        data
      });
      
      logger.info(`[FCM SERVICE] Push notification sent to user ${userId}. Success: ${response.successCount}, Failure: ${response.failureCount}`);
      
      // Clean up invalid/expired tokens
      if (response.failureCount > 0) {
        const tokensToDelete: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success && resp.error) {
            const code = resp.error.code;
            if (
              code === 'messaging/invalid-registration-token' ||
              code === 'messaging/registration-token-not-registered'
            ) {
              tokensToDelete.push(deviceTokens[idx]);
            }
          }
        });
        
        if (tokensToDelete.length > 0) {
          await supabaseAdmin
            .from('device_tokens')
            .delete()
            .in('device_token', tokensToDelete);
          logger.info(`[FCM SERVICE] Cleaned up ${tokensToDelete.length} stale/invalid tokens.`);
        }
      }
      return true;
    } else {
      // Mock push notification delivery
      logger.debug(`[FCM SERVICE MOCK] Sending push to user ${userId} on tokens: ${JSON.stringify(deviceTokens)}`);
      logger.debug(`[FCM SERVICE MOCK] Title: "${title}" | Body: "${body}" | Data:`, data);
      return true;
    }
  } catch (err) {
    logger.error('[FCM SERVICE] Error sending push notification:', err);
    return false;
  }
}
