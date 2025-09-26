import { ReportModel } from '../models/reportModel';

export class ReportService {
  // 학생의 학습 리포트 조회
  static async getStudentReport(studentId: number, startDate: string, endDate: string) {
    return await ReportModel.getStudentReport(studentId, startDate, endDate);
  }

  // 반별 학습 리포트 조회 (교사용)
  static async getClassReport(classId: number, startDate: string, endDate: string) {
    return await ReportModel.getClassReport(classId, startDate, endDate);
  }

  // 전체 학습 활동 로그 조회 (관리자용)
  static async getAdminActivityReport(startDate: string, endDate: string) {
    return await ReportModel.getAdminActivityReport(startDate, endDate);
  }

  // 날짜 범위 유효성 검사
  static validateDateRange(startDate: string, endDate: string): { isValid: boolean; error?: string } {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { isValid: false, error: 'Invalid date format' };
    }
    
    if (start > end) {
      return { isValid: false, error: 'Start date cannot be after end date' };
    }
    
    // 최대 1년 범위 제한
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    if (end.getTime() - start.getTime() > oneYear) {
      return { isValid: false, error: 'Date range cannot exceed 1 year' };
    }
    
    return { isValid: true };
  }
}
