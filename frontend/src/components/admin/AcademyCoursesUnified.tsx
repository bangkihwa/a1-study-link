import React, { useState } from 'react';
import AcademyManagement from './AcademyManagement';
import AdminCourseManagement from './CourseManagement';

type TabKey = 'academy' | 'courses';

const AcademyCoursesUnified: React.FC = () => {
  const [active, setActive] = useState<TabKey>('academy');

  const TabButton: React.FC<{ tab: TabKey; label: string }> = ({ tab, label }) => (
    <button
      type="button"
      onClick={() => setActive(tab)}
      className={`px-4 py-2 text-sm font-medium rounded-md border ${
        active === tab
          ? 'bg-blue-600 text-white border-blue-600'
          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">학원/강의 통합 관리</h1>
        <p className="text-gray-600">과목·반과 강의 관리를 하나의 페이지에서 처리합니다.</p>
      </header>

      <div className="flex items-center gap-2">
        <TabButton tab="academy" label="과목/반" />
        <TabButton tab="courses" label="강의" />
      </div>

      <section className="mt-2">
        {active === 'academy' ? (
          <AcademyManagement />
        ) : (
          <AdminCourseManagement />
        )}
      </section>
    </div>
  );
};

export default AcademyCoursesUnified;
