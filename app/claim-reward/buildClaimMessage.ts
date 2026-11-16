/**
 * Builds the SIWE claim message for the reward distribution flow.
 *
 * The output format matches the parser in `lib/services/claim-reward-service.ts`
 * (`parseClaimMessage`) exactly: four lines joined with LF (`\n`), with a
 * literal blank line between the header and the `Address:` field.
 *
 * Format:
 *   Claim Reward Distribution
 *   <blank line>
 *   Address: <lowercased address>
 *   Timestamp: <unixSeconds>
 *
 * @param address       Wallet address (any casing); will be lowercased in the output.
 * @param unixSeconds   Unix timestamp in seconds.
 * @returns             The canonical claim message string.
 */
export function buildClaimMessage(address: string, unixSeconds: number): string {
  return [
    'Claim Reward Distribution',
    '',
    `Address: ${address.toLowerCase()}`,
    `Timestamp: ${unixSeconds}`,
  ].join('\n');
}
