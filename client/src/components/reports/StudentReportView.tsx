import React from 'react';
import {
  ChartBarIcon,
  BookOpenIcon,
  QuestionMarkCircleIcon,
  DocumentTextIcon,
  StarIcon,
  TrendingUpIcon
} from '@heroicons/react/24/outline';

const SUBJECT_LABELS: { [key: string]: string } = {
  physics: '물리학',
  chemistry: '화학',
  biology: '생명과학',
  earth_science: '지구과학',
  integrated_science: '통합과학',
};

interface StudentReportData {
  studentInfo: {
    id: number;
    name: string;
    email: string;
    username: string;
  };
  reportPeriod: {
    startDate: string | null;
    endDate: string | null;
    generatedAt: string;
  };
  summary: {
    overallPerformance: number;
    lectureCompletionRate: number;
    assignmentCompletionRate: number;
    totalStudyTime: number;
    avgFocusScore: number;
    avgEngagementScore: number;
  };
  lectureStats: {
    total_lectures: number;
    completed_lectures: number;
    avg_study_time: number;
    total_study_time: number;
  };
  subjectProgress: Array<{
    subject: string;
    total_lectures: number;
    completed_lectures: number;
    completion_rate: number;
  }>;
  questionStats: {
    total_questions: number;
    resolved_questions: number;
    avg_difficulty: number;
  };
  assignmentStats: {
    total_assignments: number;
    submitted_assignments: number;
    graded_assignments: number;
    avg_score: number;
    overdue_assignments: number;
  };
  gradeStats: Array<{
    subject: string;
    test_count: number;
    avg_score: number;
    max_score: number;
    min_score: number;
  }>;
  analyticsStats: {
    avg_focus_score: number;
    avg_engagement_score: number;
    avg_study_duration: number;
    total_sessions: number;
  };
  monthlyActivity: Array<{
    month: string;
    lectures_completed: number;
  }>;
  recentActivity: Array<{
    type: string;
    title: string;
    date: string;
  }>;
}

interface StudentReportViewProps {
  report: StudentReportData;
  onPrint?: () => void;
  onExport?: () => void;
}

const StudentReportView: React.FC<StudentReportViewProps> = ({ 
  report, 
  onPrint, 
  onExport 
}) => {
  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getPerformanceLabel = (score: number) => {
    if (score >= 90) return '우수';
    if (score >= 70) return '양호';
    if (score >= 50) return '보통';
    return '노력 필요';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}시간 ${mins}분` : `${mins}분`;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* 헤더 */}
      <div className="card">
        <div className="card-body">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {report.studentInfo.name} 학습 리포트
              </h1>
              <p className="text-gray-600 mt-2">
                {report.reportPeriod.startDate && report.reportPeriod.endDate ? (
                  `기간: ${formatDate(report.reportPeriod.startDate)} ~ ${formatDate(report.reportPeriod.endDate)}`
                ) : (
                  '전체 기간 리포트'
                )}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                생성일: {formatDate(report.reportPeriod.generatedAt)}
              </p>
            </div>
            <div className="flex space-x-2">
              {onPrint && (
                <button onClick={onPrint} className="btn-secondary">
                  인쇄
                </button>
              )}
              {onExport && (
                <button onClick={onExport} className="btn-primary">
                  내보내기
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 종합 성취도 */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold flex items-center">
            <StarIcon className="w-5 h-5 mr-2" />
            종합 성취도
          </h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className={`text-4xl font-bold ${getPerformanceColor(report.summary.overallPerformance)}`}>
                {report.summary.overallPerformance}점
              </div>
              <div className={`text-lg font-medium ${getPerformanceColor(report.summary.overallPerformance)}`}>
                {getPerformanceLabel(report.summary.overallPerformance)}
              </div>
              <p className="text-sm text-gray-600 mt-2">전체 성취도</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {report.summary.lectureCompletionRate}%
                </div>
                <p className="text-sm text-gray-600">강의 완료율</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {report.summary.assignmentCompletionRate}%
                </div>
                <p className="text-sm text-gray-600">과제 제출률</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(report.summary.avgFocusScore)}점
                </div>
                <p className="text-sm text-gray-600">평균 집중도</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {formatTime(report.summary.totalStudyTime)}
                </div>
                <p className="text-sm text-gray-600">총 학습시간</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 과목별 진행 현황 */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold flex items-center">
              <BookOpenIcon className="w-5 h-5 mr-2" />
              과목별 진행 현황
            </h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {report.subjectProgress.map((subject) => (
                <div key={subject.subject} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {SUBJECT_LABELS[subject.subject as keyof typeof SUBJECT_LABELS] || subject.subject}
                      </span>
                      <span className="text-sm text-gray-600">
                        {subject.completed_lectures}/{subject.total_lectures}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${subject.completion_rate}%` }}
                      ></div>
                    </div>
                    <div className="text-right mt-1">
                      <span className="text-sm font-medium text-blue-600">
                        {Math.round(subject.completion_rate)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 성적 현황 */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold flex items-center">
              <ChartBarIcon className="w-5 h-5 mr-2" />
              성적 현황
            </h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {report.gradeStats.map((grade) => (
                <div key={grade.subject} className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">
                    {SUBJECT_LABELS[grade.subject as keyof typeof SUBJECT_LABELS] || grade.subject}
                  </h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">평균: </span>
                      <span className="font-medium">{Math.round(grade.avg_score)}점</span>
                    </div>
                    <div>
                      <span className="text-gray-600">최고: </span>
                      <span className="font-medium text-green-600">{grade.max_score}점</span>
                    </div>
                    <div>
                      <span className="text-gray-600">시험수: </span>
                      <span className="font-medium">{grade.test_count}회</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 질문 및 피드백 */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold flex items-center">
              <QuestionMarkCircleIcon className="w-5 h-5 mr-2" />
              질문 및 피드백
            </h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {report.questionStats.total_questions}
                </div>
                <p className="text-sm text-gray-600">총 질문 수</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {report.questionStats.resolved_questions}
                </div>
                <p className="text-sm text-gray-600">해결된 질문</p>
              </div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-lg font-bold text-orange-600">
                평균 난이도: {Math.round(report.questionStats.avg_difficulty * 10) / 10}/5
              </div>
            </div>
          </div>
        </div>

        {/* 과제 현황 */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold flex items-center">
              <DocumentTextIcon className="w-5 h-5 mr-2" />
              과제 현황
            </h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {report.assignmentStats.total_assignments}
                </div>
                <p className="text-sm text-gray-600">총 과제 수</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {report.assignmentStats.submitted_assignments}
                </div>
                <p className="text-sm text-gray-600">제출한 과제</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-lg font-bold text-purple-600">
                  {Math.round(report.assignmentStats.avg_score)}점
                </div>
                <p className="text-sm text-gray-600">평균 점수</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-lg font-bold text-red-600">
                  {report.assignmentStats.overdue_assignments}
                </div>
                <p className="text-sm text-gray-600">지각 제출</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 학습 분석 */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold flex items-center">
            <TrendingUpIcon className="w-5 h-5 mr-2" />
            학습 분석
          </h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {Math.round(report.analyticsStats.avg_focus_score)}
              </div>
              <p className="text-sm text-gray-600">평균 집중도</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${report.analyticsStats.avg_focus_score}%` }}
                ></div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {Math.round(report.analyticsStats.avg_engagement_score)}
              </div>
              <p className="text-sm text-gray-600">평균 참여도</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${report.analyticsStats.avg_engagement_score}%` }}
                ></div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {formatTime(report.analyticsStats.avg_study_duration)}
              </div>
              <p className="text-sm text-gray-600">평균 학습 시간</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {report.analyticsStats.total_sessions}
              </div>
              <p className="text-sm text-gray-600">총 학습 세션</p>
            </div>
          </div>
        </div>
      </div>

      {/* 최근 활동 */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold">최근 활동</h3>
        </div>
        <div className="card-body">
          <div className="flow-root">
            <ul className="-mb-8">
              {report.recentActivity.slice(0, 10).map((activity, index) => (
                <li key={index}>
                  <div className="relative pb-8">
                    {index !== report.recentActivity.length - 1 && index < 9 && (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                    )}
                    <div className="relative flex space-x-3">
                      <div>
                        {activity.type === 'lecture_completed' ? (
                          <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                            <BookOpenIcon className="w-4 h-4 text-white" />
                          </span>
                        ) : activity.type === 'question_asked' ? (
                          <span className="h-8 w-8 rounded-full bg-orange-500 flex items-center justify-center">
                            <QuestionMarkCircleIcon className="w-4 h-4 text-white" />
                          </span>
                        ) : (
                          <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                            <DocumentTextIcon className="w-4 h-4 text-white" />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-900">
                          {activity.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(activity.date)}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentReportView;