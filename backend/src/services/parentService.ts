import { ParentModel } from '../models/parentModel';
import { ParentChildSummary, StudentReportSummary } from '../types';
import { ReportService } from './reportService';

export class ParentService {
  static async getLinkedChildren(parentId: number): Promise<ParentChildSummary[]> {
    return ParentModel.getChildrenByParentId(parentId);
  }

  static async getChildReport(
    parentId: number,
    studentId: number,
    startDate: string,
    endDate: string
  ): Promise<StudentReportSummary> {
    const isLinked = await ParentModel.isParentLinkedToStudent(parentId, studentId);

    if (!isLinked) {
      throw new Error('Access denied to student report');
    }

    return ReportService.getStudentReport(studentId, startDate, endDate);
  }
}
