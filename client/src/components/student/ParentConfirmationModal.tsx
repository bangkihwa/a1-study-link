import React, { useState } from 'react';

interface StudyRecord {
  date: string;
  subject: string;
  duration: string;
  content: string;
  completed: boolean;
}

interface ParentConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  weekStart: Date;
  weekEnd: Date;
  studentId: number;
  studentName: string;
  onConfirm: (password: string, comment: string) => void;
}

const ParentConfirmationModal: React.FC<ParentConfirmationModalProps> = ({
  isOpen,
  onClose,
  weekStart,
  weekEnd,
  studentId,
  studentName,
  onConfirm
}) => {
  const [parentPassword, setParentPassword] = useState('');
  const [parentComment, setParentComment] = useState('');
  const [weeklyStudyRecords, setWeeklyStudyRecords] = useState<StudyRecord[]>([]);

  React.useEffect(() => {
    if (isOpen) {
      loadWeeklyStudyRecords();
    }
  }, [isOpen, weekStart, weekEnd]);

  const loadWeeklyStudyRecords = () => {
    // Load study records for the week from localStorage
    const progress = JSON.parse(localStorage.getItem('studentProgress') || '[]');
    const weekRecords = progress.filter((record: any) => {
      const recordDate = new Date(record.date);
      return record.studentId === studentId && 
             recordDate >= weekStart && 
             recordDate <= weekEnd;
    });

    const formattedRecords = weekRecords.map((record: any) => ({
      date: record.date,
      subject: record.lectureName || '일반 학습',
      duration: record.duration || '30분',
      content: record.notes || record.content || '학습 완료',
      completed: record.completed || true
    }));

    setWeeklyStudyRecords(formattedRecords);
  };

  const formatDate = (date: Date) => {
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  const getTotalStudyTime = () => {
    return weeklyStudyRecords.reduce((total, record) => {
      const duration = parseInt(record.duration) || 30;
      return total + duration;
    }, 0);
  };

  const handleConfirmClick = () => {
    if (!parentPassword) {
      alert('학부모 비밀번호를 입력해주세요.');
      return;
    }

    // Verify parent password
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const student = users.find((u: any) => u.id === studentId);
    
    if (!student || !student.parentPassword) {
      alert('학부모 비밀번호가 설정되지 않았습니다. 학생 정보에서 설정해주세요.');
      return;
    }

    if (student.parentPassword !== parentPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    onConfirm(parentPassword, parentComment);
    setParentPassword('');
    setParentComment('');
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
            📝 주간 학습 확인서
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            ×
          </button>
        </div>

        <div style={{
          backgroundColor: '#f3f4f6',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem'
        }}>
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>
            학생: {studentName}
          </p>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
            기간: {formatDate(weekStart)} - {formatDate(weekEnd)}
          </p>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>
            📚 이번 주 학습 내역
          </h3>
          
          {weeklyStudyRecords.length > 0 ? (
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              <table style={{ width: '100%', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>날짜</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>과목</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>학습시간</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>학습내용</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyStudyRecords.map((record, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '0.5rem' }}>{record.date}</td>
                      <td style={{ padding: '0.5rem' }}>{record.subject}</td>
                      <td style={{ padding: '0.5rem' }}>{record.duration}</td>
                      <td style={{ padding: '0.5rem' }}>{record.content}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              이번 주 학습 기록이 없습니다.
            </p>
          )}
          
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            backgroundColor: '#eff6ff',
            borderRadius: '6px',
            fontSize: '0.875rem'
          }}>
            <strong>총 학습 시간:</strong> {getTotalStudyTime()}분
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: '500',
            fontSize: '0.875rem'
          }}>
            학부모 의견 (선택사항)
          </label>
          <textarea
            value={parentComment}
            onChange={(e) => setParentComment(e.target.value)}
            placeholder="자녀의 학습에 대한 의견을 남겨주세요..."
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '0.875rem',
              minHeight: '80px',
              resize: 'vertical'
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: '500',
            fontSize: '0.875rem'
          }}>
            학부모 비밀번호 *
          </label>
          <input
            type="password"
            value={parentPassword}
            onChange={(e) => setParentPassword(e.target.value)}
            placeholder="학부모 비밀번호를 입력하세요"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '0.875rem'
            }}
          />
          <p style={{
            marginTop: '0.25rem',
            fontSize: '0.75rem',
            color: '#6b7280'
          }}>
            * 학부모 비밀번호가 설정되지 않은 경우, 학생 정보 수정에서 설정해주세요.
          </p>
        </div>

        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.75rem 1.5rem',
              border: '1px solid #d1d5db',
              backgroundColor: 'white',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            취소
          </button>
          <button
            onClick={handleConfirmClick}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            확인 완료
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParentConfirmationModal;