import { ParentService } from '../src/services/parentService';
import { getChildReport, getChildren } from '../src/controllers/parentController';

jest.mock('../src/services/parentService', () => ({
  ParentService: {
    getLinkedChildren: jest.fn(),
    getChildReport: jest.fn()
  }
}));

const mockedParentService = ParentService as jest.Mocked<typeof ParentService>;

const createMockResponse = () => {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  return {
    res: { status } as unknown as any,
    status,
    json
  };
};

describe('Parent routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns linked children for authenticated parent', async () => {
    mockedParentService.getLinkedChildren.mockResolvedValueOnce([
      {
        studentId: 1,
        studentName: '김철수',
        studentNumber: 'A1B2C3D4',
        grade: 2,
        classId: 10,
        className: '중2-A반',
        subjectName: '과학',
        relationship: 'guardian',
        linkedAt: new Date()
      }
    ]);

    const { res, status, json } = createMockResponse();
    const next = jest.fn();

    await getChildren(
      {
        user: {
          id: 101,
          username: 'parent_user',
          role: 'parent',
          name: 'Parent User',
          isApproved: true,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      } as any,
      res,
      next
    );

    expect(next).not.toHaveBeenCalled();
    expect(mockedParentService.getLinkedChildren).toHaveBeenCalledWith(101);
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalled();
    const payload = json.mock.calls[0][0];
    expect(payload.data).toHaveLength(1);
    expect(payload.data[0].studentName).toBe('김철수');
  });

  it('returns child report data when parent has access', async () => {
    mockedParentService.getChildReport.mockResolvedValueOnce({
      videoProgress: {
        totalVideos: 5,
        completedVideos: 4,
        averageProgress: 88.5
      },
      testSubmissions: {
        totalTests: 3,
        gradedTests: 3,
        averageScore: 92.1
      },
      questions: {
        totalQuestions: 2,
        answeredQuestions: 2
      },
      loginActivity: {
        totalLogins: 14
      }
    });

    const { res, status, json } = createMockResponse();
    const next = jest.fn();

    await getChildReport(
      {
        params: { studentId: '1' },
        query: { startDate: '2024-01-01', endDate: '2024-01-31' },
        user: {
          id: 101,
          username: 'parent_user',
          role: 'parent',
          name: 'Parent User',
          isApproved: true,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      } as any,
      res,
      next
    );

    expect(next).not.toHaveBeenCalled();
    expect(mockedParentService.getChildReport).toHaveBeenCalledWith(101, 1, '2024-01-01', '2024-01-31');
    expect(status).toHaveBeenCalledWith(200);
    const payload = json.mock.calls[0][0];
    expect(payload.data.videoProgress.totalVideos).toBe(5);
  });
});
