import { verifyMessage } from 'viem';

/**
 * Verify that the signature is valid for the given address and message
 */
export async function verifyWalletSignature(
  address: string,
  message: string,
  signature: string
): Promise<boolean> {
  try {
    const isValid = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });
    return isValid;
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

/**
 * Generate a session message for signing
 */
export function generateSessionMessage(address: string, timestamp: number): string {
  return `Sign this message to start your certificate session.\n\nAddress: ${address}\nTimestamp: ${timestamp}\n\nThis signature will not trigger any blockchain transaction or cost any gas fees.\n\nSession valid for 24 hours.`;
}

/**
 * Verify timestamp is within acceptable range (24 hours for sessions)
 * FIXED: Only allow past timestamps (prevent future timestamp attack)
 */
export function isTimestampValid(timestamp: number): boolean {
  const now = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  
  // Timestamp must be in the past (not future)
  if (timestamp > now) {
    return false;
  }
  
  // Timestamp must be within last 24 hours
  if (now - timestamp > twentyFourHours) {
    return false;
  }
  
  return true;
}
