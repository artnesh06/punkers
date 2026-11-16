import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { Request, Response, Headers } from 'node-fetch';

// Polyfill for TextEncoder/TextDecoder in Node.js test environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Polyfill for Request/Response in Node.js test environment
global.Request = Request;
global.Response = Response;
global.Headers = Headers;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;
