import React, { useState, useEffect } from 'react';

interface SubjectProgress {
  id: number;
  subject: string;
  totalChapters: number;
  completedChapters: number;
  currentChapter: string;
  lastStudied: string;
  averageScore: number;
  weeklyGoal: number;
  weeklyCompleted: number;
}

interface ProgressTrackerProps {
  studentId?: number;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ studentId }) => {
  const [progressData, setProgressData] = useState<SubjectProgress[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  useEffect(() => {
    // 임시 데이터
    const mockData: SubjectProgress[] = [
      {
        id: 1,
        subject: '물리학',
        totalChapters: 12,
        completedChapters: 8,
        currentChapter: '제9장: 전기와 자기',
        lastStudied: '2024-08-24',
        averageScore: 85,
        weeklyGoal: 5,
        weeklyCompleted: 3
      },
      {
        id: 2,
        subject: '화학',
        totalChapters: 10,
        completedChapters: 6,
        currentChapter: '제7장: 화학 반응',
        lastStudied: '2024-08-23',
        averageScore: 92,
        weeklyGoal: 4,
        weeklyCompleted: 4
      },
      {
        id: 3,
        subject: '생명과학',
        totalChapters: 8,
        completedChapters: 5,
        currentChapter: '제6장: 유전',
        lastStudied: '2024-08-22',
        averageScore: 78,
        weeklyGoal: 3,
        weeklyCompleted: 2
      },
      {
        id: 4,
        subject: '지구과학',
        totalChapters: 9,
        completedChapters: 7,
        currentChapter: '제8장: 대기와 해양',
        lastStudied: '2024-08-21',
        averageScore: 88,
        weeklyGoal: 4,
        weeklyCompleted: 3
      }
    ];
    setProgressData(mockData);
  }, [studentId]);

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return '#16a34a';
    if (percentage >= 60) return '#eab308';
    if (percentage >= 40) return '#f97316';
    return '#dc2626';
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  const filteredData = selectedSubject === 'all' 
    ? progressData 
    : progressData.filter(p => p.subject === selectedSubject);

  const overallProgress = progressData.reduce((acc, curr) => {
    return acc + (curr.completedChapters / curr.totalChapters * 100);
  }, 0) / progressData.length;

  const overallScore = progressData.reduce((acc, curr) => {
    return acc + curr.averageScore;
  }, 0) / progressData.length;

  return (
    <div style={{ padding: '2rem' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
          📈 학습 진도 관리
        </h2>
        <p style={{ color: '#6b7280' }}>
          과목별 학습 진도와 성취도를 확인하세요.
        </p>
      </div>

      {/* 전체 요약 */}
      <div className="grid grid-3" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  전체 진도율
                </p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: getProgressColor(overallProgress) }}>
                  {overallProgress.toFixed(1)}%
                </p>
              </div>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: `conic-gradient(${getProgressColor(overallProgress)} ${overallProgress * 3.6}deg, #e5e7eb 0deg)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  fontWeight: 'bold'
                }}>
                  {Math.round(overallProgress)}%
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  평균 점수
                </p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>
                  {overallScore.toFixed(1)}점
                </p>
              </div>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '0.5rem',
                background: getProgressColor(overallScore),
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 'bold'
              }}>
                {getScoreGrade(overallScore)}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  이번 주 목표
                </p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                  {progressData.reduce((acc, curr) => acc + curr.weeklyCompleted, 0)} / {progressData.reduce((acc, curr) => acc + curr.weeklyGoal, 0)}
                </p>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  챕터 완료
                </p>
              </div>
              <div style={{ fontSize: '2.5rem' }}>🎯</div>
            </div>
          </div>
        </div>
      </div>

      {/* 필터 */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '0.375rem',
                background: 'white'
              }}
            >
              <option value="all">모든 과목</option>
              <option value="물리학">물리학</option>
              <option value="화학">화학</option>
              <option value="생명과학">생명과학</option>
              <option value="지구과학">지구과학</option>
            </select>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setSelectedPeriod('week')}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid',
                  borderColor: selectedPeriod === 'week' ? '#667eea' : '#e5e7eb',
                  background: selectedPeriod === 'week' ? '#667eea' : 'white',
                  color: selectedPeriod === 'week' ? 'white' : '#6b7280',
                  borderRadius: '0.375rem',
                  cursor: 'pointer'
                }}
              >
                주간
              </button>
              <button
                onClick={() => setSelectedPeriod('month')}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid',
                  borderColor: selectedPeriod === 'month' ? '#667eea' : '#e5e7eb',
                  background: selectedPeriod === 'month' ? '#667eea' : 'white',
                  color: selectedPeriod === 'month' ? 'white' : '#6b7280',
                  borderRadius: '0.375rem',
                  cursor: 'pointer'
                }}
              >
                월간
              </button>
              <button
                onClick={() => setSelectedPeriod('all')}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid',
                  borderColor: selectedPeriod === 'all' ? '#667eea' : '#e5e7eb',
                  background: selectedPeriod === 'all' ? '#667eea' : 'white',
                  color: selectedPeriod === 'all' ? 'white' : '#6b7280',
                  borderRadius: '0.375rem',
                  cursor: 'pointer'
                }}
              >
                전체
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 과목별 진도 */}
      <div className="grid grid-2" style={{ gap: '1.5rem' }}>
        {filteredData.map(subject => {
          const progressPercentage = (subject.completedChapters / subject.totalChapters) * 100;
          const weeklyPercentage = (subject.weeklyCompleted / subject.weeklyGoal) * 100;
          
          return (
            <div key={subject.id} className="card">
              <div className="card-body">
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>
                      {subject.subject}
                    </h3>
                    <span style={{
                      background: getProgressColor(subject.averageScore) + '20',
                      color: getProgressColor(subject.averageScore),
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}>
                      평균 {subject.averageScore}점
                    </span>
                  </div>
                  
                  <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    현재 학습 중: {subject.currentChapter}
                  </p>

                  {/* 전체 진도 */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>전체 진도</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                        {subject.completedChapters} / {subject.totalChapters} 챕터
                      </span>
                    </div>
                    <div style={{ 
                      background: '#f3f4f6', 
                      borderRadius: '9999px', 
                      height: '8px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        background: getProgressColor(progressPercentage), 
                        width: `${progressPercentage}%`, 
                        height: '8px',
                        transition: 'width 0.3s ease'
                      }}></div>
                    </div>
                  </div>

                  {/* 주간 목표 */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>주간 목표</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                        {subject.weeklyCompleted} / {subject.weeklyGoal} 챕터
                      </span>
                    </div>
                    <div style={{ 
                      background: '#f3f4f6', 
                      borderRadius: '9999px', 
                      height: '8px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        background: weeklyPercentage >= 100 ? '#16a34a' : '#fbbf24', 
                        width: `${Math.min(weeklyPercentage, 100)}%`, 
                        height: '8px',
                        transition: 'width 0.3s ease'
                      }}></div>
                    </div>
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    paddingTop: '1rem',
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      마지막 학습: {new Date(subject.lastStudied).toLocaleDateString()}
                    </span>
                    <button className="btn btn-sm btn-primary">
                      학습 계속하기
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressTracker;