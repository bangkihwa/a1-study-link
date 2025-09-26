/// <reference types="jest" />

// Mock external dependencies BEFORE importing the controller under test
jest.mock('express-validator', () => ({
  validationResult: jest.fn(() => ({ isEmpty: () => true, array: () => [] }))
}));

jest.mock('../src/services/systemSettingsService', () => ({
  __esModule: true,
  default: {
    getCachedSettings: jest.fn()
  }
}));

jest.mock('../src/services/userService', () => ({
  UserService: {
    registerStudent: jest.fn(),
    registerParent: jest.fn(),
    registerTeacher: jest.fn()
  }
}));

// Now import the SUT (subject under test) and mocked modules
import { registerStudent, registerParent, registerTeacher } from '../src/controllers/authController';
import SystemSettingsService from '../src/services/systemSettingsService';
import { UserService } from '../src/services/userService';

const mockedSettings = SystemSettingsService as unknown as { getCachedSettings: jest.Mock };
const mockedUserService = UserService as jest.Mocked<typeof UserService>;

const createMockResponse = () => {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  return {
    res: { status } as unknown as any,
    status,
    json
  };
};

describe('Auth registration policy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Registrations disabled (allowRegistrations = false)', () => {
    it('allows registration but sets isApproved=false (admin approval required)', async () => {
      mockedSettings.getCachedSettings.mockResolvedValue({
        allowRegistrations: false,
        maintenanceMode: false,
        supportEmail: 'support@test.com',
        apiRateLimit: 100,
        autoApproveTeachers: false
      });

      const { res: resS } = createMockResponse();
      await registerStudent(
        {
          body: { username: 'stu', password: 'pw', name: '학생' }
        } as any,
        resS,
        jest.fn()
      );
      expect(mockedUserService.registerStudent).toHaveBeenCalledWith(
        expect.objectContaining({ username: 'stu', isApproved: false })
      );

      const { res: resP } = createMockResponse();
      await registerParent(
        {
          body: { username: 'par', password: 'pw', name: '학부모', studentNumber: 'S-001' }
        } as any,
        resP,
        jest.fn()
      );
      expect(mockedUserService.registerParent).toHaveBeenCalledWith(
        expect.objectContaining({ username: 'par', isApproved: false })
      );

      const { res: resT } = createMockResponse();
      await registerTeacher(
        {
          body: { username: 'tea', password: 'pw', name: '교사' }
        } as any,
        resT,
        jest.fn()
      );
      expect(mockedUserService.registerTeacher).toHaveBeenCalledWith(
        expect.objectContaining({ username: 'tea', autoApprove: false })
      );
    });
  });

  describe('Registrations enabled (allowRegistrations = true)', () => {
    it('auto-approves student registration and calls service with isApproved=true', async () => {
      mockedSettings.getCachedSettings.mockResolvedValue({
        allowRegistrations: true,
        maintenanceMode: false,
        supportEmail: 'support@test.com',
        apiRateLimit: 100,
        autoApproveTeachers: true
      });

      mockedUserService.registerStudent.mockResolvedValueOnce({ id: 101, isApproved: true } as any);

      const { res, status, json } = createMockResponse();
      const next = jest.fn();

      await registerStudent(
        {
          body: { username: 'stu', password: 'pw', name: '학생', email: 's@x.com', phone: '010' }
        } as any,
        res,
        next
      );

      expect(next).not.toHaveBeenCalled();
      expect(mockedUserService.registerStudent).toHaveBeenCalledWith(
        expect.objectContaining({ username: 'stu', isApproved: true })
      );
    });

    it('auto-approves parent registration and calls service with isApproved=true', async () => {
      mockedSettings.getCachedSettings.mockResolvedValue({
        allowRegistrations: true,
        maintenanceMode: false,
        supportEmail: 'support@test.com',
        apiRateLimit: 100,
        autoApproveTeachers: true
      });

      mockedUserService.registerParent.mockResolvedValueOnce({ id: 202, isApproved: true } as any);

      const { res, status, json } = createMockResponse();
      const next = jest.fn();

      await registerParent(
        {
          body: { username: 'par', password: 'pw', name: '학부모', studentNumber: 'S-001', relationship: 'guardian' }
        } as any,
        res,
        next
      );

      expect(next).not.toHaveBeenCalled();
      expect(mockedUserService.registerParent).toHaveBeenCalledWith(
        expect.objectContaining({ username: 'par', isApproved: true, studentNumber: 'S-001' })
      );
    });

    it('teacher registration: autoApproveTeachers=true -> approved status', async () => {
      mockedSettings.getCachedSettings.mockResolvedValue({
        allowRegistrations: true,
        maintenanceMode: false,
        supportEmail: 'support@test.com',
        apiRateLimit: 100,
        autoApproveTeachers: true
      });

      mockedUserService.registerTeacher.mockResolvedValueOnce({ id: 303, isApproved: true } as any);

      const { res, status, json } = createMockResponse();
      const next = jest.fn();

      await registerTeacher(
        {
          body: { username: 'tea', password: 'pw', name: '교사' }
        } as any,
        res,
        next
      );

      expect(next).not.toHaveBeenCalled();
      expect(mockedUserService.registerTeacher).toHaveBeenCalledWith(
        expect.objectContaining({ username: 'tea', autoApprove: true })
      );
    });

    it('teacher registration: autoApproveTeachers=false -> pending_approval status', async () => {
      mockedSettings.getCachedSettings.mockResolvedValue({
        allowRegistrations: true,
        maintenanceMode: false,
        supportEmail: 'support@test.com',
        apiRateLimit: 100,
        autoApproveTeachers: false
      });

      mockedUserService.registerTeacher.mockResolvedValueOnce({ id: 404, isApproved: false } as any);

      const { res, status, json } = createMockResponse();
      const next = jest.fn();

      await registerTeacher(
        {
          body: { username: 'tea2', password: 'pw', name: '교사2' }
        } as any,
        res,
        next
      );

      expect(next).not.toHaveBeenCalled();
      expect(mockedUserService.registerTeacher).toHaveBeenCalledWith(
        expect.objectContaining({ username: 'tea2', autoApprove: false })
      );
    });
  });
});
