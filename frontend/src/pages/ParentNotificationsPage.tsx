import React from 'react';
import StudentNotificationsPage from './StudentNotificationsPage';

// 학부모와 학생 모두 동일한 알림 기능을 사용하므로 재사용합니다.
const ParentNotificationsPage: React.FC = () => {
  return <StudentNotificationsPage />;
};

export default ParentNotificationsPage;
