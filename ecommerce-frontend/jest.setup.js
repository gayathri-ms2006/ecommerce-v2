import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Global mock for fetch to prevent ReferenceError: fetch is not defined in jsdom environment
global.fetch = jest.fn().mockImplementation(() => Promise.resolve({
  json: () => Promise.resolve({ success: true, data: {} }),
  ok: true,
}));
