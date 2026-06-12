import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';

// 1. Mock Firebase before importing the server app to keep testing 100% isolated
const mockDocsList: any[] = [];
const mockGetDocs = vi.fn().mockImplementation(() => {
  return Promise.resolve({
    docs: mockDocsList.map(item => ({
      id: item.id || 'mock-id',
      data: () => item
    }))
  });
});

const mockSetDoc = vi.fn().mockResolvedValue(undefined);
const mockDoc = vi.fn().mockReturnValue({ id: 'mocked-submission-id' });
const mockCollection = vi.fn().mockReturnValue({});

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn().mockReturnValue({}),
  deleteApp: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('firebase/firestore', () => ({
  initializeFirestore: vi.fn().mockReturnValue({}),
  getDocs: mockGetDocs,
  setDoc: mockSetDoc,
  doc: mockDoc,
  collection: mockCollection,
}));

// Stub environment secrets for testing
vi.stubEnv('ADMIN_API_SECRET', 'test-super-secret-key-123');
vi.stubEnv('RECAPTCHA_SECRET_KEY', 'test-recaptcha-key-456');
vi.stubEnv('NODE_ENV', 'test');

// Import server app
import app from './server';

describe('Express Backend Integration Tests', () => {
  let fetchSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDocsList.length = 0;
    
    // Spy on global fetch to mock Google reCAPTCHA verification
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  describe('GET /api/health', () => {
    it('should return 200 ok status and validation message', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok' });
    });
  });

  describe('Administrative Route Protection (401/200)', () => {
    describe('POST /api/clear-cache', () => {
      it('should return 401 Unauthorized if no admin secret is provided', async () => {
        const res = await request(app).post('/api/clear-cache');
        expect(res.status).toBe(401);
        expect(res.body.error).toContain('Unauthorized');
      });

      it('should return 401 Unauthorized if wrong admin secret is provided', async () => {
        const res = await request(app)
          .post('/api/clear-cache')
          .set('x-admin-secret', 'wrong-secret');
        expect(res.status).toBe(401);
      });

      it('should return 200 and clear cache if correct admin secret is provided in headers', async () => {
        const res = await request(app)
          .post('/api/clear-cache')
          .set('x-admin-secret', 'test-super-secret-key-123');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ status: 'Cache cleared' });
      });

      it('should return 200 and clear cache if correct admin secret is provided in query params', async () => {
        const res = await request(app)
          .post('/api/clear-cache?secret=test-super-secret-key-123');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ status: 'Cache cleared' });
      });
    });

    describe('GET /api/migrate', () => {
      it('should return 401 Unauthorized if no credentials are sent', async () => {
        const res = await request(app).get('/api/migrate');
        expect(res.status).toBe(401);
      });

      it('should allow request and migration flow to proceed with correct admin secret', async () => {
        // Set up dry mock data for migration read
        mockGetDocs.mockResolvedValueOnce({ docs: [] }); // levels
        mockGetDocs.mockResolvedValueOnce({ docs: [] }); // future_levels
        mockGetDocs.mockResolvedValueOnce({ docs: [] }); // verifiers
        mockGetDocs.mockResolvedValueOnce({ docs: [] }); // record_submissions
        mockGetDocs.mockResolvedValueOnce({ docs: [] }); // app_users
        mockGetDocs.mockResolvedValueOnce({ docs: [] }); // user_profiles
        mockGetDocs.mockResolvedValueOnce({ docs: [] }); // admins

        const res = await request(app)
          .get('/api/migrate')
          .set('x-admin-secret', 'test-super-secret-key-123');
        
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('success');
        expect(res.body.message).toContain('Data migrated successfully');
      });
    });
  });

  describe('POST /api/submit-record (Form Validation)', () => {
    const validPayload = {
      username: 'GamerGD',
      levelName: 'Sonic Wave',
      progress: 100,
      videoProof: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      userEmail: 'gamer@test.com',
      userId: 'testuserid123'
    };

    it('should return 400 when videoProof URL design is invalid', async () => {
      const invalidVideoPayload = {
        ...validPayload,
        videoProof: 'https://not-youtube-or-twitch.com/play-gd'
      };

      const res = await request(app)
        .post('/api/submit-record')
        .send(invalidVideoPayload);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid video URL');
    });

    it('should submit successfully when the payload is valid', async () => {
      const res = await request(app)
        .post('/api/submit-record')
        .send(validPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.id).toBe('mocked-submission-id');
      expect(mockSetDoc).toHaveBeenCalledTimes(1);
    });
  });
});
