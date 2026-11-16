export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function validateAddress(address: string): boolean {
  return isValidEthereumAddress(address);
}

export function shortenAddress(address: string): string {
  if (!isValidEthereumAddress(address)) {
    return address;
  }
  return `${address.slice(0, 5)}...${address.slice(-3)}`;
}

/**
 * Validate pagination parameters
 * @param page - Page number (must be >= 1)
 * @param limit - Items per page (must be >= 1 and <= 100)
 * @returns Object with isValid flag and error message if invalid
 */
export function validatePagination(
  page: number,
  limit: number
): { isValid: boolean; error?: string } {
  if (!Number.isInteger(page) || page < 1) {
    return {
      isValid: false,
      error: 'Page must be a positive integer',
    };
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return {
      isValid: false,
      error: 'Limit must be an integer between 1 and 100',
    };
  }

  return { isValid: true };
}
