import SubjectModel from '../models/subjectModel';
import ClassModel, { ClassRecord } from '../models/classModel';
import { UserModel } from '../models/userModel';
import { Subject } from '../types';
import { NotificationService } from './notificationService';

export class AcademyService {
  // Subjects
  static async getSubjects(includeInactive = false): Promise<Subject[]> {
    return await SubjectModel.findAll(includeInactive);
  }

  static async createSubject(data: {
    name: string;
    description?: string;
    gradeLevel?: number;
    isActive?: boolean;
  }): Promise<Subject> {
    const subjectId = await SubjectModel.create(data);
    const subject = await SubjectModel.findById(subjectId);
    if (!subject) {
      throw new Error('Failed to create subject');
    }
    return subject;
  }

  static async updateSubject(id: number, updates: {
    name?: string;
    description?: string | null;
    gradeLevel?: number | null;
    isActive?: boolean;
  }): Promise<Subject> {
    const existing = await SubjectModel.findById(id);
    if (!existing) {
      throw new Error('Subject not found');
    }

    await SubjectModel.update(id, updates);
    const updated = await SubjectModel.findById(id);
    if (!updated) {
      throw new Error('Subject not found');
    }
    return updated;
  }

  static async deleteSubject(id: number): Promise<void> {
    const existing = await SubjectModel.findById(id);
    if (!existing) {
      throw new Error('Subject not found');
    }
    await SubjectModel.delete(id);
  }


  // Classes
  static async getClasses(includeInactive = false): Promise<ClassRecord[]> {
    return await ClassModel.findAll(includeInactive);
  }

  static async getClassesForTeacher(teacherId: number): Promise<ClassRecord[]> {
    return await ClassModel.findByTeacherId(teacherId);
  }

  private static async validateSubject(subjectId: number) {
    const subject = await SubjectModel.findById(subjectId);
    if (!subject) {
      throw new Error('Subject not found');
    }
    if (!subject.isActive) {
      throw new Error('Subject is inactive');
    }
  }

  private static async validateTeacher(teacherId: number | null | undefined) {
    if (!teacherId) {
      return;
    }
    const teacher = await UserModel.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      throw new Error('Teacher not found');
    }
    if (!teacher.isApproved) {
      throw new Error('Teacher not approved');
    }
    if (!teacher.isActive) {
      throw new Error('Teacher is inactive');
    }
  }

  static async createClass(data: {
    name: string;
    subjectId: number;
    teacherId?: number | null;
    gradeLevel?: number;
    maxStudents?: number;
    isActive?: boolean;
    studentIds?: number[];
  }): Promise<ClassRecord> {
    await this.validateSubject(data.subjectId);
    await this.validateTeacher(data.teacherId ?? null);

    const classId = await ClassModel.create(data);
    const created = await ClassModel.findById(classId);
    if (!created) {
      throw new Error('Failed to create class');
    }

    if (Array.isArray(data.studentIds)) {
      await ClassModel.setClassStudents(classId, data.studentIds);
    }

    if (created.teacherId) {
      await NotificationService.createClassAssignedNotification(created.teacherId, created.name, created.id);
    }
    return created;
  }

  static async updateClass(id: number, updates: {
    name?: string;
    subjectId?: number;
    teacherId?: number | null;
    gradeLevel?: number | null;
    maxStudents?: number;
    isActive?: boolean;
    studentIds?: number[];
  }): Promise<ClassRecord> {
    const existing = await ClassModel.findById(id);
    if (!existing) {
      throw new Error('Class not found');
    }

    if (updates.subjectId !== undefined) {
      await this.validateSubject(updates.subjectId);
    }

    if (updates.teacherId !== undefined) {
      await this.validateTeacher(updates.teacherId);
    }

    await ClassModel.update(id, updates);
    const updated = await ClassModel.findById(id);
    if (!updated) {
      throw new Error('Class not found');
    }

    const prevTeacherId = existing.teacherId ?? null;
    const nextTeacherId = updated.teacherId ?? null;
    const className = updated.name;

    if (prevTeacherId && prevTeacherId !== nextTeacherId) {
      await NotificationService.createClassUnassignedNotification(prevTeacherId, className, id);
    }
    if (nextTeacherId && prevTeacherId !== nextTeacherId) {
      await NotificationService.createClassAssignedNotification(nextTeacherId, className, id);
    } else {
      const hasNonTeacherChange = Object.keys(updates).some((k) => k !== 'teacherId');
      if (nextTeacherId && hasNonTeacherChange) {
        await NotificationService.createClassUpdatedNotification(nextTeacherId, className, id);
      }
    }

    if (updates.studentIds !== undefined) {
      await ClassModel.setClassStudents(id, updates.studentIds ?? []);
    }

    return updated;
  }

  static async setClassStudents(classId: number, studentIds: number[]): Promise<void> {
    const existing = await ClassModel.findById(classId);
    if (!existing) {
      throw new Error('Class not found');
    }
    await ClassModel.setClassStudents(classId, studentIds);
  }

  static async deleteClass(id: number): Promise<void> {
    const existing = await ClassModel.findById(id);
    if (!existing) {
      throw new Error('Class not found');
    }
    await ClassModel.delete(id);
    if (existing.teacherId) {
      await NotificationService.createClassDeletedNotification(existing.teacherId, existing.name);
    }
  }

}

export default AcademyService;
