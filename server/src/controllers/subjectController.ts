import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { loadSubjects, saveSubjects, Subject } from '../utils/dataStorage';

// 과목 데이터 로드
let subjects: Subject[] = loadSubjects();

// 전체 과목 목록 조회
export const getAllSubjects = async (req: Request, res: Response) => {
  try {
    res.json({ subjects });
  } catch (error) {
    console.error('Get all subjects error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// 과목 생성 검증
export const createSubjectValidation = [
  body('name').isLength({ min: 1, max: 50 }).withMessage('과목명은 1-50자여야 합니다.'),
  body('code').isLength({ min: 1, max: 10 }).withMessage('과목코드는 1-10자여야 합니다.'),
  body('description').optional().isLength({ max: 200 }).withMessage('설명은 최대 200자까지 가능합니다.')
];

// 과목 생성 (관리자만)
export const createSubject = async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user.role;
    
    if (userRole !== 'admin') {
      return res.status(403).json({ error: '관리자만 접근 가능합니다.' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, code, description } = req.body;

    // 중복 체크
    const existingSubject = subjects.find(s => s.name === name || s.code === code);
    if (existingSubject) {
      return res.status(400).json({ error: '이미 존재하는 과목명 또는 과목코드입니다.' });
    }

    const newSubject: Subject = {
      id: subjects.length > 0 ? Math.max(...subjects.map(s => s.id)) + 1 : 1,
      name,
      code,
      description: description || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    subjects.push(newSubject);
    saveSubjects(subjects);

    res.status(201).json({
      message: '과목이 생성되었습니다.',
      subject: newSubject
    });
  } catch (error) {
    console.error('Create subject error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// 과목 수정 (관리자만)
export const updateSubject = async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user.role;
    
    if (userRole !== 'admin') {
      return res.status(403).json({ error: '관리자만 접근 가능합니다.' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { subjectId } = req.params;
    const { name, code, description } = req.body;

    const subjectIndex = subjects.findIndex(s => s.id === parseInt(subjectId));
    if (subjectIndex === -1) {
      return res.status(404).json({ error: '과목을 찾을 수 없습니다.' });
    }

    // 중복 체크 (자기 자신은 제외)
    const existingSubject = subjects.find(s => 
      s.id !== parseInt(subjectId) && (s.name === name || s.code === code)
    );
    if (existingSubject) {
      return res.status(400).json({ error: '이미 존재하는 과목명 또는 과목코드입니다.' });
    }

    subjects[subjectIndex].name = name;
    subjects[subjectIndex].code = code;
    subjects[subjectIndex].description = description || '';
    subjects[subjectIndex].updated_at = new Date().toISOString();
    saveSubjects(subjects);

    res.json({
      message: '과목이 수정되었습니다.',
      subject: subjects[subjectIndex]
    });
  } catch (error) {
    console.error('Update subject error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// 과목 삭제 (관리자만)
export const deleteSubject = async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user.role;
    
    if (userRole !== 'admin') {
      return res.status(403).json({ error: '관리자만 접근 가능합니다.' });
    }

    const { subjectId } = req.params;

    const subjectIndex = subjects.findIndex(s => s.id === parseInt(subjectId));
    if (subjectIndex === -1) {
      return res.status(404).json({ error: '과목을 찾을 수 없습니다.' });
    }

    const deletedSubject = subjects.splice(subjectIndex, 1)[0];
    saveSubjects(subjects);

    res.json({
      message: '과목이 삭제되었습니다.',
      subject: deletedSubject
    });
  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};