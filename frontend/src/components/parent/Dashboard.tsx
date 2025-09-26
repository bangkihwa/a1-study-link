import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const ParentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // 실제 API 호출로 대체해야 함
        // 이 예제에서는 모의 데이터를 사용
        setTimeout(() => {
          setChildren([
            { 
              id: 1, 
              name: '김철수', 
              grade: '1학년', 
              courses: [
                { id: 1, title: '수학', progress: 75, lastTestScore: 85 },
                { id: 2, title: '과학', progress: 60, lastTestScore: 78 },
                { id: 3, title: '영어', progress: 85, lastTestScore: 92 }
              ]
            }
          ]);
          
          setNotifications([
            { id: 1, type: 'grade', title: '채점 결과', message: '김철수 학생의 수학 중간고사 채점 결과가 나왔습니다.', time: '2시간 전' },
            { id: 2, type: 'assignment', title: '과제 제출', message: '김철수 학생이 과학 과제를 제출했습니다.', time: '1일 전' },
            { id: 3, type: 'announcement', title: '학원 공지사항', message: '5월 20일은 토요수업이 있습니다.', time: '2일 전' }
          ]);
          
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">학부모 대시보드</h1>
        {user && <p className="text-gray-600 mt-1">{user.name}님, 자녀의 학습 현황을 확인해보세요.</p>}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">자녀 학습 현황</h2>
            <div className="space-y-6">
              {children.map((child) => (
                <div key={child.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-lg">{child.name} ({child.grade})</h3>
                    <span className="text-sm text-gray-500">평균 진도율: {
                      child.courses.length > 0 
                        ? Math.round(child.courses.reduce((sum: number, course: any) => sum + course.progress, 0) / child.courses.length) 
                        : 0
                    }%</span>
                  </div>
                  <div className="space-y-3">
                    {child.courses.map((course: any) => (
                      <div key={course.id} className="border-b pb-3 last:border-b-0 last:pb-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium">{course.title}</span>
                          <div className="flex space-x-4">
                            <span className="text-sm">진도율: {course.progress}%</span>
                            <span className="text-sm">최근 점수: {course.lastTestScore}점</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${course.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">알림</h2>
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div key={notification.id} className="border-b pb-3 last:border-b-0 last:pb-0">
                  <h3 className="font-medium">{notification.title}</h3>
                  <p className="text-sm text-gray-600">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">학습 통계</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>이번 주 학습 시간</span>
                <span className="font-medium">18시간 15분</span>
              </div>
              <div className="flex justify-between">
                <span>완료한 과제</span>
                <span className="font-medium">12개</span>
              </div>
              <div className="flex justify-between">
                <span>평균 점수</span>
                <span className="font-medium">85점</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;
