import logger from '../config/logger';

/**
 * Reliable async background task runner with retry and error monitoring (#11)
 */
export function enqueueTask(
  taskName: string,
  taskFn: () => Promise<void>,
  maxRetries: number = 3
): void {
  setImmediate(async () => {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        await taskFn();
        return;
      } catch (err) {
        attempt++;
        logger.error(`[BACKGROUND WORKER] ${taskName} failed (attempt ${attempt}/${maxRetries}):`, err);
        if (attempt < maxRetries) {
          // Exponential backoff delay
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 500));
        } else {
          logger.error(`[BACKGROUND WORKER] ${taskName} permanently failed after ${maxRetries} attempts.`);
        }
      }
    }
  });
}
