import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Global mocks if needed
vi.stubEnv('ADMIN_API_SECRET', 'test-super-secret-key-123');
