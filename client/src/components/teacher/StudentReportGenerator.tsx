import React, { useState, useEffect } from 'react';

interface Student {
  id: number;
  name: string;
  username: string;
  email?: string;
  phone?: string;
  classIds?: number[];
  classNames?: string[];
}

interface Lecture {
  id: number;
  title: string;
  subject: string;
  completedAt?: string;
}

interface Question {
  id: number;
  lectureTitle: string;
  question: string;
  answer?: string;
  createdAt: string;
  answeredAt?: string;
}

interface Assignment {
  id: number;
  title: string;
  dueDate: string;
  submittedAt?: string;
  score?: number;
  feedback?: string;
}

interface StudentReportGeneratorProps {
  teacherId: number;
  teacherName: string;
  onBack: () => void;
}

const StudentReportGenerator: React.FC<StudentReportGeneratorProps> = ({ teacherId, teacherName, onBack }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  const [showReport, setShowReport] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadStudents();
    // 기본 날짜 설정 (최근 1개월)
    const today = new Date();
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(oneMonthAgo.toISOString().split('T')[0]);
  }, []);

  const loadStudents = () => {
    // 교사가 담당하는 반의 학생들 로드
    const classes = JSON.parse(localStorage.getItem('classes') || '[]');
    const teacherClasses = classes.filter((cls: any) => 
      cls.teacherIds?.includes(teacherId)
    );
    
    const allStudents = JSON.parse(localStorage.getItem('students') || '[]');
    const classStudentIds = new Set<number>();
    
    teacherClasses.forEach((cls: any) => {
      if (cls.students) {
        cls.students.forEach((student: any) => {
          const studentId = typeof student === 'object' ? student.id : student;
          classStudentIds.add(studentId);
        });
      }
    });
    
    const teacherStudents = allStudents.filter((s: Student) => 
      classStudentIds.has(s.id)
    );
    
    setStudents(teacherStudents);
  };

  const generateReport = () => {
    if (!selectedStudent || !startDate || !endDate) {
      alert('학생과 기간을 선택해주세요.');
      return;
    }

    setIsGenerating(true);
    
    // 학습 진도 데이터
    const progress = JSON.parse(localStorage.getItem('studentProgress') || '[]');
    const studentProgress = progress.filter((p: any) => 
      p.studentId === selectedStudent.id &&
      p.completedAt >= startDate &&
      p.completedAt <= endDate
    );

    // 질문/답변 데이터
    const questions = JSON.parse(localStorage.getItem('teacherQuestions') || '[]');
    const studentQuestions = questions.filter((q: any) => 
      q.studentId === selectedStudent.id &&
      q.createdAt >= startDate &&
      q.createdAt <= endDate
    );

    // 과제 데이터
    const assignments = JSON.parse(localStorage.getItem('assignments') || '[]');
    const studentAssignments = assignments.filter((a: any) => {
      if (a.completedStudents?.includes(selectedStudent.id)) {
        const submissionDate = a.submissions?.find((s: any) => 
          s.studentId === selectedStudent.id
        )?.submittedAt;
        return submissionDate >= startDate && submissionDate <= endDate;
      }
      return false;
    });

    // 강의 데이터
    const lectures = JSON.parse(localStorage.getItem('lectures') || '[]');
    const completedLectureIds = studentProgress.map((p: any) => p.lectureId);
    const completedLectures = lectures.filter((l: any) => 
      completedLectureIds.includes(l.id)
    );

    // 통계 계산
    const stats = {
      totalLectures: completedLectures.length,
      totalQuestions: studentQuestions.length,
      answeredQuestions: studentQuestions.filter((q: any) => q.isAnswered).length,
      totalAssignments: studentAssignments.length,
      avgScore: calculateAverageScore(studentAssignments),
      attendanceRate: calculateAttendanceRate(selectedStudent, startDate, endDate),
      progressRate: calculateProgressRate(studentProgress, lectures)
    };

    const report = {
      student: selectedStudent,
      period: { startDate, endDate },
      stats,
      lectures: completedLectures,
      questions: studentQuestions,
      assignments: studentAssignments,
      progress: studentProgress,
      generatedAt: new Date().toISOString(),
      generatedBy: teacherName
    };

    setReportData(report);
    setShowReport(true);
    setIsGenerating(false);
  };

  const calculateAverageScore = (assignments: any[]) => {
    const scores = assignments
      .map(a => a.submissions?.find((s: any) => s.studentId === selectedStudent?.id)?.score)
      .filter(score => score !== undefined);
    
    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  const calculateAttendanceRate = (student: Student, start: string, end: string) => {
    // 출석 데이터가 있다면 계산, 없으면 기본값
    const attendance = JSON.parse(localStorage.getItem('attendance') || '[]');
    const studentAttendance = attendance.filter((a: any) => 
      a.studentId === student.id &&
      a.date >= start &&
      a.date <= end
    );
    
    if (studentAttendance.length === 0) return 95; // 기본값
    
    const presentDays = studentAttendance.filter((a: any) => a.status === 'present').length;
    return Math.round((presentDays / studentAttendance.length) * 100);
  };

  const calculateProgressRate = (progress: any[], allLectures: any[]) => {
    if (allLectures.length === 0) return 0;
    return Math.round((progress.length / allLectures.length) * 100);
  };

  const printReport = () => {
    window.print();
  };

  const saveReport = () => {
    if (!reportData) return;
    
    const reports = JSON.parse(localStorage.getItem('studentReports') || '[]');
    reports.push(reportData);
    localStorage.setItem('studentReports', JSON.stringify(reports));
    
    alert('보고서가 저장되었습니다.');
  };

  return (
    <div>
      {!showReport ? (
        <>
          <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button onClick={onBack} className="btn btn-secondary">
                ← 뒤로
              </button>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
                📊 학생 학습 보고서 생성
              </h2>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    학생 선택 *
                  </label>
                  <select
                    value={selectedStudent?.id || ''}
                    onChange={(e) => {
                      const student = students.find(s => s.id === Number(e.target.value));
                      setSelectedStudent(student || null);
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                  >
                    <option value="">학생을 선택하세요</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id}>
                        {student.name} ({student.username})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    시작일 *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    종료일 *
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={generateReport}
                  disabled={isGenerating || !selectedStudent}
                  className="btn btn-primary"
                  style={{ padding: '0.75rem 2rem', fontSize: '1.125rem' }}
                >
                  {isGenerating ? '생성 중...' : '📄 보고서 생성'}
                </button>
              </div>
            </div>
          </div>

          {/* 최근 생성한 보고서 목록 */}
          <div className="card" style={{ marginTop: '2rem' }}>
            <div className="card-header">
              <div className="card-title">📋 최근 생성 보고서</div>
            </div>
            <div className="card-body">
              {(() => {
                const reports = JSON.parse(localStorage.getItem('studentReports') || '[]')
                  .filter((r: any) => r.generatedBy === teacherName)
                  .slice(-5)
                  .reverse();
                
                if (reports.length === 0) {
                  return (
                    <p style={{ textAlign: 'center', color: '#6b7280' }}>
                      아직 생성한 보고서가 없습니다.
                    </p>
                  );
                }
                
                return (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>학생</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>기간</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>생성일</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>작업</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((report: any, idx: number) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.75rem' }}>{report.student.name}</td>
                          <td style={{ padding: '0.75rem' }}>
                            {report.period.startDate} ~ {report.period.endDate}
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            {new Date(report.generatedAt).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                            <button
                              onClick={() => {
                                setReportData(report);
                                setShowReport(true);
                              }}
                              className="btn btn-secondary"
                              style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                            >
                              보기
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          </div>
        </>
      ) : (
        <div className="report-container">
          {/* 인쇄 시에만 보이는 스타일 */}
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              .report-container, .report-container * {
                visibility: visible;
              }
              .report-container {
                position: absolute;
                left: 0;
                top: 0;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>

          {/* 버튼 영역 - 인쇄 시 숨김 */}
          <div className="no-print" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
            <button onClick={() => setShowReport(false)} className="btn btn-secondary">
              ← 뒤로
            </button>
            <button onClick={printReport} className="btn btn-primary">
              🖨️ 인쇄
            </button>
            <button onClick={saveReport} className="btn btn-primary">
              💾 저장
            </button>
          </div>

          {/* 보고서 본문 */}
          <div style={{
            background: 'white',
            padding: '3rem',
            maxWidth: '800px',
            margin: '0 auto',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            borderRadius: '0.5rem'
          }}>
            {/* 헤더 */}
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                학습 성과 보고서
              </h1>
              <div style={{ fontSize: '1.125rem', color: '#6b7280' }}>
                A1 과학학원
              </div>
            </div>

            {/* 학생 정보 */}
            <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
                학생 정보
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <strong>이름:</strong> {reportData?.student.name}
                </div>
                <div>
                  <strong>기간:</strong> {reportData?.period.startDate} ~ {reportData?.period.endDate}
                </div>
                <div>
                  <strong>담당 교사:</strong> {reportData?.generatedBy}
                </div>
                <div>
                  <strong>보고서 생성일:</strong> {new Date(reportData?.generatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* 학습 통계 */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
                학습 통계
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <div style={{ padding: '1rem', background: '#eff6ff', borderRadius: '0.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2563eb' }}>
                    {reportData?.stats.totalLectures}개
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>수강 완료</div>
                </div>
                <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: '0.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a34a' }}>
                    {reportData?.stats.attendanceRate}%
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>출석률</div>
                </div>
                <div style={{ padding: '1rem', background: '#fef3c7', borderRadius: '0.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ca8a04' }}>
                    {reportData?.stats.avgScore}점
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>평균 점수</div>
                </div>
              </div>
            </div>

            {/* 수강 완료 강의 */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
                수강 완료 강의
              </h2>
              {reportData?.lectures.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>강의명</th>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>과목</th>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>완료일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData?.lectures.map((lecture: any, idx: number) => {
                      const progress = reportData.progress.find((p: any) => p.lectureId === lecture.id);
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.5rem' }}>{lecture.title}</td>
                          <td style={{ padding: '0.5rem' }}>{lecture.subject}</td>
                          <td style={{ padding: '0.5rem' }}>
                            {progress?.completedAt ? new Date(progress.completedAt).toLocaleDateString() : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p style={{ color: '#6b7280' }}>이 기간 동안 완료한 강의가 없습니다.</p>
              )}
            </div>

            {/* 질문/답변 활동 */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
                질문/답변 활동
              </h2>
              <div style={{ marginBottom: '1rem' }}>
                <span style={{ marginRight: '2rem' }}>
                  <strong>총 질문:</strong> {reportData?.stats.totalQuestions}개
                </span>
                <span>
                  <strong>답변 받은 질문:</strong> {reportData?.stats.answeredQuestions}개
                </span>
              </div>
              {reportData?.questions.length > 0 && (
                <div style={{ maxHeight: '200px', overflow: 'auto', border: '1px solid #e5e7eb', borderRadius: '0.25rem', padding: '0.5rem' }}>
                  {reportData?.questions.map((q: any, idx: number) => (
                    <div key={idx} style={{ marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ fontWeight: '500' }}>Q: {q.question}</div>
                      {q.answer && (
                        <div style={{ marginTop: '0.25rem', paddingLeft: '1rem', color: '#16a34a' }}>
                          A: {q.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 과제 수행 */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
                과제 수행
              </h2>
              {reportData?.assignments.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>과제명</th>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>제출일</th>
                      <th style={{ padding: '0.5rem', textAlign: 'center' }}>점수</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData?.assignments.map((assignment: any, idx: number) => {
                      const submission = assignment.submissions?.find((s: any) => 
                        s.studentId === reportData.student.id
                      );
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.5rem' }}>{assignment.title}</td>
                          <td style={{ padding: '0.5rem' }}>
                            {submission?.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : '-'}
                          </td>
                          <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                            {submission?.score || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p style={{ color: '#6b7280' }}>이 기간 동안 제출한 과제가 없습니다.</p>
              )}
            </div>

            {/* 종합 의견 */}
            <div style={{ marginTop: '3rem', padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
                교사 의견
              </h2>
              <div style={{ minHeight: '100px', padding: '1rem', background: 'white', border: '1px solid #e5e7eb', borderRadius: '0.25rem' }}>
                <p style={{ color: '#6b7280', fontStyle: 'italic' }}>
                  {reportData?.stats.progressRate >= 80 
                    ? '학습 진도가 매우 우수합니다. 꾸준한 학습 태도를 보이고 있습니다.'
                    : reportData?.stats.progressRate >= 60
                      ? '학습 진도가 양호합니다. 조금 더 적극적인 참여를 권장합니다.'
                      : '학습 진도 향상이 필요합니다. 추가 지도가 필요할 수 있습니다.'}
                </p>
              </div>
            </div>

            {/* 서명 */}
            <div style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderBottom: '1px solid #000', marginBottom: '0.5rem', height: '40px' }}></div>
                <div>담당 교사: {reportData?.generatedBy}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderBottom: '1px solid #000', marginBottom: '0.5rem', height: '40px' }}></div>
                <div>확인: 학부모/보호자</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentReportGenerator;