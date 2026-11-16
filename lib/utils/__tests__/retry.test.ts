import { withRetry } from '../retry';

describe('withRetry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return result on first successful attempt', async () => {
    const operation = jest.fn().mockResolvedValue('success');

    const result = await withRetry(operation, 3);

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should retry up to maxRetries times on failure', async () => {
    const operation = jest
      .fn()
      .mockRejectedValueOnce(new Error('Attempt 1 failed'))
      .mockRejectedValueOnce(new Error('Attempt 2 failed'))
      .mockResolvedValueOnce('success');

    const result = await withRetry(operation, 3);

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('should throw error after maxRetries attempts', async () => {
    const error = new Error('Operation failed');
    const operation = jest.fn().mockRejectedValue(error);

    await expect(withRetry(operation, 3)).rejects.toThrow('Operation failed');
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('should use exponential backoff between retries', async () => {
    const operation = jest
      .fn()
      .mockRejectedValueOnce(new Error('Attempt 1 failed'))
      .mockRejectedValueOnce(new Error('Attempt 2 failed'))
      .mockResolvedValueOnce('success');

    const startTime = Date.now();
    await withRetry(operation, 3, 100); // Use 100ms base delay for faster test
    const endTime = Date.now();

    // First retry: 100ms, Second retry: 200ms = 300ms total minimum
    // Allow some margin for execution time
    expect(endTime - startTime).toBeGreaterThanOrEqual(250);
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('should use default maxRetries of 3', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('Failed'));

    await expect(withRetry(operation)).rejects.toThrow('Failed');
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('should use default baseDelay of 1000ms', async () => {
    const operation = jest
      .fn()
      .mockRejectedValueOnce(new Error('Attempt 1 failed'))
      .mockResolvedValueOnce('success');

    const startTime = Date.now();
    await withRetry(operation); // Use defaults
    const endTime = Date.now();

    // First retry: 1000ms minimum
    expect(endTime - startTime).toBeGreaterThanOrEqual(900);
    expect(operation).toHaveBeenCalledTimes(2);
  });
});
