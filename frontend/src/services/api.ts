import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse } from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || '/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle common errors
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        const status = error.response?.status;
        if (status === 401) {
          // Token expired or invalid
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        } else if (status === 503) {
          const message = error.response?.data?.message || '서비스가 점검 중입니다. 잠시 후 다시 이용해 주세요.';
          try {
            sessionStorage.setItem('maintenance_message', message);
          } catch (storageError) {
            // ignore storage errors (e.g., private mode)
          }
          if (window.location.pathname !== '/maintenance') {
            window.location.href = '/maintenance';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(username: string, password: string): Promise<ApiResponse> {
    const response = await this.api.post('/auth/login', { username, password });
    return response.data;
  }

  async registerStudent(data: {
    username: string;
    password: string;
    name: string;
    email?: string;
    phone?: string;
  }): Promise<ApiResponse> {
    const response = await this.api.post('/auth/register/student', data);
    return response.data;
  }

  async registerParent(data: {
    username: string;
    password: string;
    name: string;
    email?: string;
    phone?: string;
    studentNumber: string;
    relationship?: string;
  }): Promise<ApiResponse> {
    const response = await this.api.post('/auth/register/parent', data);
    return response.data;
  }

  async registerTeacher(data: {
    username: string;
    password: string;
    name: string;
    email?: string;
    phone?: string;
  }): Promise<ApiResponse> {
    const response = await this.api.post('/auth/register/teacher', data);
    return response.data;
  }

  async validateStudentNumber(studentNumber: string): Promise<ApiResponse> {
    const response = await this.api.get(`/auth/student/${studentNumber}`);
    return response.data;
  }

  async logout(): Promise<ApiResponse> {
    const response = await this.api.post('/auth/logout');
    return response.data;
  }

  // User endpoints
  async getCurrentUser(): Promise<ApiResponse> {
    const response = await this.api.get('/users/me');
    return response.data;
  }

  // Course endpoints
  async getCourses(): Promise<ApiResponse> {
    const response = await this.api.get('/courses/user/courses');
    return response.data;
  }

  async getCourse(id: number): Promise<ApiResponse> {
    const response = await this.api.get(`/courses/${id}`);
    return response.data;
  }

  async getClassStudents(classId: number): Promise<ApiResponse> {
    const response = await this.api.get(`/courses/classes/${classId}/students`);
    return response.data;
  }

  async getAssignableStudents(): Promise<ApiResponse> {
    const response = await this.api.get('/courses/assignable-students');
    return response.data;
  }

  // Test endpoints
  async getTests(): Promise<ApiResponse> {
    const response = await this.api.get('/tests/user/tests');
    return response.data;
  }

  async getTest(id: number): Promise<ApiResponse> {
    const response = await this.api.get(`/tests/${id}`);
    return response.data;
  }

  async createTest(data: {
    title: string;
    description?: string;
    timeLimit?: number | null;
    totalScore?: number | null;
    teacherId?: number;
    dueDate: string;
    classId: number;
    isPublished?: boolean;
    publishAt?: string | null;
    courseId?: number | null;
  }): Promise<ApiResponse> {
    const response = await this.api.post('/tests', data);
    return response.data;
  }

  async updateTest(id: number, data: {
    title?: string;
    description?: string | null;
    timeLimit?: number | null;
    totalScore?: number | null;
    isPublished?: boolean;
    publishAt?: string | null;
    dueDate?: string | null;
    classId?: number | null;
    courseId?: number | null;
  }): Promise<ApiResponse> {
    const response = await this.api.put(`/tests/${id}`, data);
    return response.data;
  }

  async deleteTest(id: number): Promise<ApiResponse> {
    const response = await this.api.delete(`/tests/${id}`);
    return response.data;
  }

  async createTestQuestion(data: {
    testId: number;
    type: 'ox' | 'short_answer' | 'multiple_choice' | 'essay';
    questionText: string;
    questionData: any;
    points?: number;
    orderIndex?: number;
  }): Promise<ApiResponse> {
    const response = await this.api.post('/tests/question', data);
    return response.data;
  }

  async updateTestQuestion(questionId: number, data: {
    questionText?: string;
    questionData?: any;
    points?: number;
    orderIndex?: number;
  }): Promise<ApiResponse> {
    const response = await this.api.put(`/tests/question/${questionId}`, data);
    return response.data;
  }

  async deleteTestQuestion(questionId: number): Promise<ApiResponse> {
    const response = await this.api.delete(`/tests/question/${questionId}`);
    return response.data;
  }

  async reorderTestQuestions(testId: number, orderedIds: number[]): Promise<ApiResponse> {
    const response = await this.api.put(`/tests/${testId}/questions/reorder`, { orderedIds });
    return response.data;
  }

  async getTestAttempt(testId: number): Promise<ApiResponse> {
    const response = await this.api.get(`/tests/${testId}/attempt`);
    return response.data;
  }

  async submitTest(data: { testId: number; answers: Record<string, any> }): Promise<ApiResponse> {
    const response = await this.api.post('/tests/submit', data);
    return response.data;
  }

  async getTestSubmissions(testId: number): Promise<ApiResponse> {
    const response = await this.api.get(`/tests/${testId}/submissions`);
    return response.data;
  }

  async gradeTestSubmission(submissionId: number, data: { score: number; gradedResults?: any; publish?: boolean; feedback?: string }): Promise<ApiResponse> {
    const response = await this.api.put(`/tests/grade/${submissionId}`, data);
    return response.data;
  }

  async publishTestSubmission(submissionId: number): Promise<ApiResponse> {
    const response = await this.api.put(`/tests/submission/${submissionId}/publish`);
    return response.data;
  }

  async unpublishTestSubmission(submissionId: number): Promise<ApiResponse> {
    const response = await this.api.put(`/tests/submission/${submissionId}/unpublish`);
    return response.data;
  }

  async getTestSubmissionResult(testId: number, params?: { studentId?: number }): Promise<ApiResponse> {
    const response = await this.api.get(`/tests/submission/${testId}`, { params });
    return response.data;
  }

  // Q&A endpoints
  async getCourseQna(courseId: number): Promise<ApiResponse> {
    const response = await this.api.get(`/qna/course/${courseId}`);
    return response.data;
  }

  async getMyQna(): Promise<ApiResponse> {
    const response = await this.api.get('/qna/me');
    return response.data;
  }

  async getTeacherQna(): Promise<ApiResponse> {
    const response = await this.api.get('/qna/teacher');
    return response.data;
  }

  async createQnaQuestion(courseId: number, question: string, isPublic: boolean = true): Promise<ApiResponse> {
    const response = await this.api.post('/qna', { courseId, question, isPublic });
    return response.data;
  }

  async answerQnaQuestion(questionId: number, answer: string): Promise<ApiResponse> {
    const response = await this.api.put(`/qna/${questionId}/answer`, { answer });
    return response.data;
  }

  async deleteQnaQuestion(questionId: number): Promise<ApiResponse> {
    const response = await this.api.delete(`/qna/${questionId}`);
    return response.data;
  }

  // Video progress endpoints
  async getVideoProgress(studentId: number, blockId: number): Promise<ApiResponse> {
    const response = await this.api.get(`/video-progress/${studentId}/${blockId}`);
    return response.data;
  }

  async getMyVideoProgress(): Promise<ApiResponse> {
    const response = await this.api.get('/video-progress');
    return response.data;
  }

  async getMyVideoProgressByBlock(blockId: number): Promise<ApiResponse> {
    const response = await this.api.get(`/video-progress/block/${blockId}`);
    return response.data;
  }

  async getCourseVideoProgress(courseId: number): Promise<ApiResponse> {
    const response = await this.api.get(`/video-progress/course/${courseId}`);
    return response.data;
  }

  async getCourseVideoSummary(courseId: number): Promise<ApiResponse> {
    const response = await this.api.get(`/video-progress/course/${courseId}/summary`);
    return response.data;
  }

  async getTeacherCourseVideoProgress(): Promise<ApiResponse> {
    const response = await this.api.get('/video-progress/teacher/courses');
    return response.data;
  }

  async updateVideoProgress(data: {
    videoBlockId: number;
    watchedDuration: number;
    totalDuration: number;
  }): Promise<ApiResponse> {
    const response = await this.api.post('/video-progress', data);
    return response.data;
  }

  // Notification endpoints
  async getNotifications(): Promise<ApiResponse> {
    const response = await this.api.get('/notifications');
    return response.data;
  }

  async markNotificationRead(id: number): Promise<ApiResponse> {
    const response = await this.api.put(`/notifications/${id}/read`);
    return response.data;
  }

  async getUnreadNotificationCount(): Promise<ApiResponse> {
    const response = await this.api.get('/notifications/unread-count');
    return response.data;
  }

  async markAllNotificationsRead(): Promise<ApiResponse> {
    const response = await this.api.put('/notifications/read-all');
    return response.data;
  }

  // Report endpoints
  async getMyStudentReport(params?: { startDate?: string; endDate?: string }): Promise<ApiResponse> {
    const response = await this.api.get('/reports/student', {
      params
    });
    return response.data;
  }

  async getStudentReport(studentId: number, startDate: string, endDate: string): Promise<ApiResponse> {
    const response = await this.api.get(`/reports/student/${studentId}`, {
      params: { startDate, endDate }
    });
    return response.data;
  }

  async getParentChildren(): Promise<ApiResponse> {
    const response = await this.api.get('/parent/children');
    return response.data;
  }

  async getParentChildReport(studentId: number, params?: { startDate?: string; endDate?: string }): Promise<ApiResponse> {
    const response = await this.api.get(`/parent/children/${studentId}/report`, { params });
    return response.data;
  }

  // Admin endpoints
  async getAdminOverview(): Promise<ApiResponse> {
    const response = await this.api.get('/admin/overview');
    return response.data;
  }

  async getAdminUsers(params?: { role?: string; status?: string; search?: string }): Promise<ApiResponse> {
    const response = await this.api.get('/admin/users', { params });
    return response.data;
  }

  async approveAdminUser(userId: number): Promise<ApiResponse> {
    const response = await this.api.put(`/admin/users/${userId}/approve`);
    return response.data;
  }

  async updateAdminUser(userId: number, data: any): Promise<ApiResponse> {
    const response = await this.api.put(`/admin/users/${userId}`, data);
    return response.data;
  }

  async deactivateAdminUser(userId: number): Promise<ApiResponse> {
    const response = await this.api.put(`/admin/users/${userId}/deactivate`);
    return response.data;
  }

  async deleteAdminUser(userId: number): Promise<ApiResponse> {
    const response = await this.api.delete(`/admin/users/${userId}`);
    return response.data;
  }

  async getAdminSubjects(params?: { includeInactive?: boolean }): Promise<ApiResponse> {
    const response = await this.api.get('/admin/subjects', { params });
    return response.data;
  }

  async createAdminSubject(data: { name: string; description?: string; gradeLevel?: number | null; isActive?: boolean }): Promise<ApiResponse> {
    const response = await this.api.post('/admin/subjects', data);
    return response.data;
  }

  async updateAdminSubject(id: number, data: { name?: string; description?: string | null; gradeLevel?: number | null; isActive?: boolean }): Promise<ApiResponse> {
    const response = await this.api.put(`/admin/subjects/${id}`, data);
    return response.data;
  }

  async archiveAdminSubject(id: number): Promise<ApiResponse> {
    const response = await this.api.delete(`/admin/subjects/${id}`);
    return response.data;
  }


  async getAdminClasses(params?: { includeInactive?: boolean }): Promise<ApiResponse> {
    const response = await this.api.get('/admin/classes', { params });
    return response.data;
  }

  async getAdminClassStudents(classId: number): Promise<ApiResponse> {
    const response = await this.api.get(`/admin/classes/${classId}/students`);
    return response.data;
  }

  async createAdminClass(data: {
    name: string;
    subjectId: number;
    teacherId?: number | null;
    gradeLevel?: number | null;
    maxStudents?: number;
    isActive?: boolean;
    studentIds?: number[];
  }): Promise<ApiResponse> {
    const response = await this.api.post('/admin/classes', data);
    return response.data;
  }

  async updateAdminClass(id: number, data: {
    name?: string;
    subjectId?: number;
    teacherId?: number | null;
    gradeLevel?: number | null;
    maxStudents?: number;
    isActive?: boolean;
    studentIds?: number[];
  }): Promise<ApiResponse> {
    const response = await this.api.put(`/admin/classes/${id}`, data);
    return response.data;
  }

  async archiveAdminClass(id: number): Promise<ApiResponse> {
    const response = await this.api.delete(`/admin/classes/${id}`);
    return response.data;
  }


  async getAdminCourses(): Promise<ApiResponse> {
    const response = await this.api.get('/admin/courses');
    return response.data;
  }

  async getManageCourse(courseId: number): Promise<ApiResponse> {
    const response = await this.api.get(`/courses/${courseId}/manage`);
    return response.data;
  }

  async createCourse(data: {
    title: string;
    classId: number;
    teacherId?: number;
    description?: string;
    isPublished?: boolean;
    studentIds?: number[];
    initialVideoUrl: string;
    initialVideoTitle?: string;
  }): Promise<ApiResponse> {
    const response = await this.api.post('/courses', data);
    return response.data;
  }

  async updateCourse(courseId: number, data: {
    title?: string;
    description?: string;
    classId?: number;
    teacherId?: number;
    isPublished?: boolean;
    studentIds?: number[];
  }): Promise<ApiResponse> {
    const response = await this.api.put(`/courses/${courseId}`, data);
    return response.data;
  }

  async deleteCourse(courseId: number): Promise<ApiResponse> {
    const response = await this.api.delete(`/courses/${courseId}`);
    return response.data;
  }

  async publishCourse(courseId: number, isPublished: boolean): Promise<ApiResponse> {
    const response = await this.api.patch(`/courses/${courseId}/publish`, { isPublished });
    return response.data;
  }

  async createContentBlock(courseId: number, data: {
    type: 'video' | 'test' | 'mindmap' | 'text';
    title: string;
    content: any;
    isRequired?: boolean;
  }): Promise<ApiResponse> {
    const response = await this.api.post(`/courses/${courseId}/blocks`, data);
    return response.data;
  }

  async updateContentBlock(courseId: number, blockId: number, data: {
    type?: 'video' | 'test' | 'mindmap' | 'text';
    title?: string;
    content?: any;
    isRequired?: boolean;
  }): Promise<ApiResponse> {
    const response = await this.api.put(`/courses/${courseId}/blocks/${blockId}`, data);
    return response.data;
  }

  async deleteContentBlock(courseId: number, blockId: number): Promise<ApiResponse> {
    const response = await this.api.delete(`/courses/${courseId}/blocks/${blockId}`);
    return response.data;
  }

  async reorderContentBlocks(courseId: number, orderedIds: number[]): Promise<ApiResponse> {
    const response = await this.api.put(`/courses/${courseId}/blocks/reorder`, { orderedIds });
    return response.data;
  }

  async getAdminActivityReport(params?: { startDate?: string; endDate?: string }): Promise<ApiResponse> {
    const response = await this.api.get('/admin/reports/activity', { params });
    return response.data;
  }

  async getAdminSettings(): Promise<ApiResponse> {
    const response = await this.api.get('/admin/settings');
    return response.data;
  }

  async updateAdminSettings(data: Partial<{ allowRegistrations: boolean; maintenanceMode: boolean; supportEmail: string; apiRateLimit: number }>): Promise<ApiResponse> {
    const response = await this.api.put('/admin/settings', data);
    return response.data;
  }

  // Public endpoints
  async getPublicSettings(): Promise<ApiResponse> {
    const response = await this.api.get('/public/settings');
    return response.data;
  }

  async getMyActivityLogs(limit = 20): Promise<ApiResponse> {
    const response = await this.api.get('/activity/me', { params: { limit } });
    return response.data;
  }

  // Calendar endpoints
  async getCalendarEvents(params: { startDate: string; endDate: string }): Promise<ApiResponse> {
    const response = await this.api.get('/calendar', { params });
    return response.data;
  }

  async getCalendarContext(): Promise<ApiResponse> {
    const response = await this.api.get('/calendar/context');
    return response.data;
  }

  async createCalendarEvent(data: {
    eventType: 'teacher_schedule' | 'test_deadline';
    title: string;
    description?: string;
    startDate: string;
    endDate?: string;
    classId?: number;
    testId?: number;
    teacherId?: number;
  }): Promise<ApiResponse> {
    const response = await this.api.post('/calendar', data);
    return response.data;
  }

  async updateCalendarEvent(id: number, data: {
    title?: string;
    description?: string | null;
    startDate?: string;
    endDate?: string;
    classId?: number | null;
    testId?: number | null;
    teacherId?: number | null;
  }): Promise<ApiResponse> {
    const response = await this.api.put(`/calendar/${id}`, data);
    return response.data;
  }

  async deleteCalendarEvent(id: number): Promise<ApiResponse> {
    const response = await this.api.delete(`/calendar/${id}`);
    return response.data;
  }

  async getActivityLogs(params?: { userId?: number; activityType?: string; limit?: number }): Promise<ApiResponse> {
    const response = await this.api.get('/activity', { params });
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;
