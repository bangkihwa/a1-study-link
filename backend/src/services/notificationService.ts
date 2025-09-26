import { NotificationModel } from '../models/notificationModel';
import { Notification } from '../types';

export class NotificationService {
  // 알림 생성
  static async createNotification(notificationData: {
    userId: number;
    type: string;
    title: string;
    message: string;
    relatedId?: number;
  }): Promise<number> {
    return await NotificationModel.create(notificationData);
  }

  // 사용자의 알림 목록 조회
  static async getNotificationsByUser(userId: number, limit: number = 20): Promise<Notification[]> {
    return await NotificationModel.getNotificationsByUser(userId, limit);
  }

  // 알림 읽음 처리
  static async markAsRead(notificationId: number, userId: number): Promise<boolean> {
    return await NotificationModel.markAsRead(notificationId, userId);
  }

  // 사용자의 읽지 않은 알림 수 조회
  static async getUnreadCount(userId: number): Promise<number> {
    return await NotificationModel.getUnreadCount(userId);
  }

  // 사용자의 모든 알림 읽음 처리
  static async markAllAsRead(userId: number): Promise<number> {
    return await NotificationModel.markAllAsRead(userId);
  }

  // 다양한 이벤트에 대한 알림 생성 헬퍼 메서드
  static async createAssignmentNotification(studentId: number, assignmentTitle: string, courseId: number): Promise<number> {
    return await this.createNotification({
      userId: studentId,
      type: 'assignment',
      title: '새 과제가 등록되었습니다',
      message: `"${assignmentTitle}" 과제가 등록되었습니다. 확인해주세요.`,
      relatedId: courseId
    });
  }

  static async createAnswerNotification(studentId: number, questionTitle: string, courseId: number): Promise<number> {
    return await this.createNotification({
      userId: studentId,
      type: 'answer',
      title: '질문에 답변이 등록되었습니다',
      message: `"${questionTitle}" 질문에 답변이 등록되었습니다.`,
      relatedId: courseId
    });
  }

  static async createGradeNotification(studentId: number, testName: string, score: number, courseId: number): Promise<number> {
    return await this.createNotification({
      userId: studentId,
      type: 'grade',
      title: '채점 결과가 나왔습니다',
      message: `"${testName}" 테스트의 채점 결과가 나왔습니다. 점수: ${score}점`,
      relatedId: courseId
    });
  }

  static async createAnnouncementNotification(userId: number, announcementTitle: string): Promise<number> {
    return await this.createNotification({
      userId,
      type: 'announcement',
      title: '새 공지사항이 등록되었습니다',
      message: `"${announcementTitle}" 공지사항이 등록되었습니다. 확인해주세요.`,
    });
  }

  // 반(클래스) 관련 알림
  static async createClassAssignedNotification(teacherId: number, className: string, classId: number): Promise<number> {
    return await this.createNotification({
      userId: teacherId,
      // enum 확장: 'class_change'
      type: 'class_change',
      title: '새 반이 배정되었습니다',
      message: `"${className}" 반이 배정되었습니다. 담당 교사로 지정되었습니다.`,
      relatedId: classId
    });
  }

  static async createClassUpdatedNotification(teacherId: number, className: string, classId: number): Promise<number> {
    return await this.createNotification({
      userId: teacherId,
      type: 'class_change',
      title: '담당 반 정보가 변경되었습니다',
      message: `"${className}" 반의 정보가 수정되었습니다. 내용을 확인해주세요.`,
      relatedId: classId
    });
  }

  static async createClassUnassignedNotification(teacherId: number, className: string, classId: number): Promise<number> {
    return await this.createNotification({
      userId: teacherId,
      type: 'class_change',
      title: '담당 반에서 해제되었습니다',
      message: `"${className}" 반의 담당에서 해제되었습니다.`,
      relatedId: classId
    });
  }

  static async createClassDeletedNotification(teacherId: number, className: string): Promise<number> {
    return await this.createNotification({
      userId: teacherId,
      type: 'class_change',
      title: '담당 반이 아카이브되었습니다',
      message: `"${className}" 반이 비활성화되었습니다.`
    });
  }

  // 강의(Course) 관련 알림
  static async createCourseAssignedNotification(teacherId: number, courseTitle: string, courseId: number): Promise<number> {
    return await this.createNotification({
      userId: teacherId,
      type: 'course_change',
      title: '새 강의가 배정되었습니다',
      message: `"${courseTitle}" 강의가 배정되었습니다. 담당 교사로 지정되었습니다.`,
      relatedId: courseId
    });
  }

  static async createCourseUpdatedNotification(teacherId: number, courseTitle: string, courseId: number): Promise<number> {
    return await this.createNotification({
      userId: teacherId,
      type: 'course_change',
      title: '담당 강의 정보가 변경되었습니다',
      message: `"${courseTitle}" 강의의 정보가 수정되었습니다. 내용을 확인해주세요.`,
      relatedId: courseId
    });
  }

  static async createCourseUnassignedNotification(teacherId: number, courseTitle: string, courseId: number): Promise<number> {
    return await this.createNotification({
      userId: teacherId,
      type: 'course_change',
      title: '담당 강의에서 해제되었습니다',
      message: `"${courseTitle}" 강의의 담당에서 해제되었습니다.`,
      relatedId: courseId
    });
  }

  static async createCourseDeletedNotification(teacherId: number, courseTitle: string): Promise<number> {
    return await this.createNotification({
      userId: teacherId,
      type: 'course_change',
      title: '담당 강의가 아카이브되었습니다',
      message: `"${courseTitle}" 강의가 비활성화되었습니다.`
    });
  }

  static async createCoursePublishStateChangedNotification(teacherId: number, courseTitle: string, courseId: number, isPublished: boolean): Promise<number> {
    const stateText = isPublished ? '공개' : '비공개';
    return await this.createNotification({
      userId: teacherId,
      type: 'course_change',
      title: '강의 공개 상태가 변경되었습니다',
      message: `"${courseTitle}" 강의의 공개 상태가 "${stateText}"로 변경되었습니다.`,
      relatedId: courseId
    });
  }

  // 테스트(Test) 관련 알림
  static async createTestGradedNotification(studentId: number, testTitle: string, score: number | null, testId: number): Promise<number> {
    const scoreText = typeof score === 'number' ? ` 점수: ${score}점` : '';
    return await this.createNotification({
      userId: studentId,
      type: 'grade',
      title: '테스트 채점 결과가 공개되었습니다',
      message: `"${testTitle}" 테스트의 채점 결과가 공개되었습니다.${scoreText}`,
      relatedId: testId
    });
  }

  static async createTestResultPublishedNotification(studentId: number, testTitle: string, testId: number): Promise<number> {
    return await this.createNotification({
      userId: studentId,
      type: 'grade',
      title: '테스트 결과가 공개되었습니다',
      message: `"${testTitle}" 테스트 결과가 공개되었습니다. 확인해주세요.`,
      relatedId: testId
    });
  }
}
