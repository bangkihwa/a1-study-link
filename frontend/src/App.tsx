import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/common/Layout';
import LoginPage from './pages/LoginPage';
import RegisterStudentPage from './pages/RegisterStudentPage';
import RegisterParentPage from './pages/RegisterParentPage';
import RegisterTeacherPage from './pages/RegisterTeacherPage';
import AdminDashboard from './components/admin/Dashboard';
import AdminUserManagement from './components/admin/UserManagement';
import AcademyCoursesUnified from './components/admin/AcademyCoursesUnified';
import AdminReports from './components/admin/Reports';
import AdminSettings from './components/admin/Settings';
import TeacherDashboard from './components/teacher/Dashboard';
import StudentDashboard from './components/student/Dashboard';
import ParentDashboard from './components/parent/Dashboard';
import StudentVideoPage from './pages/StudentVideoPage';
import CourseLearningPage from './pages/CourseLearningPage';
import StudentActivityPage from './pages/StudentActivityPage';
import StudentReportsPage from './pages/StudentReportsPage';
import StudentNotificationsPage from './pages/StudentNotificationsPage';
import TeacherVideoProgressPage from './pages/TeacherVideoProgressPage';
import TeacherTestsPage from './pages/TeacherTestsPage';
import TeacherTestBuilderPage from './pages/TeacherTestBuilderPage';
import TeacherTestSubmissionsPage from './pages/TeacherTestSubmissionsPage';
import AdminActivityLogPage from './components/admin/ActivityLogPage';
import StudentTestsPage from './pages/StudentTestsPage';
import StudentTestAttemptPage from './pages/StudentTestAttemptPage';
import StudentTestResultPage from './pages/StudentTestResultPage';
import CourseQnaPage from './pages/CourseQnaPage';
import TeacherQnaPage from './pages/TeacherQnaPage';
import StudentQnaPage from './pages/StudentQnaPage';
import StudentCoursesPage from './pages/StudentCoursesPage';
import TeacherCoursesPage from './pages/TeacherCoursesPage';
import TeacherStudentsPage from './pages/TeacherStudentsPage';
import TeacherReportsPage from './pages/TeacherReportsPage';
import ParentChildrenPage from './pages/ParentChildrenPage';
import ParentReportsPage from './pages/ParentReportsPage';
import ParentNotificationsPage from './pages/ParentNotificationsPage';
import TeacherCalendarPage from './pages/TeacherCalendarPage';
import StudentCalendarPage from './pages/StudentCalendarPage';
import ParentCalendarPage from './pages/ParentCalendarPage';
import MaintenancePage from './pages/MaintenancePage';
import TeacherCourseEditorPage from './pages/TeacherCourseEditorPage';
import TeacherCourseManagePage from './pages/TeacherCourseManagePage';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register/student" element={<RegisterStudentPage />} />
          <Route path="/register/parent" element={<RegisterParentPage />} />
          <Route path="/register/teacher" element={<RegisterTeacherPage />} />
          <Route path="/maintenance" element={<MaintenancePage />} />
          <Route path="/student/course/:courseId/block/:blockId" element={<StudentVideoPage />} />
          <Route
            path="/student/courses/:courseId"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <CourseLearningPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/course/:courseId/qna"
            element={
              <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
                <CourseQnaPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/calendar"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentCalendarPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminUserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/activity-log"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminActivityLogPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/academy-courses"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AcademyCoursesUnified />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/academy"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Navigate to="/admin/academy-courses" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/courses"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Navigate to="/admin/academy-courses" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminSettings />
              </ProtectedRoute>
            }
          />

          {/* Teacher Routes */}
          <Route
            path="/teacher/dashboard"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/tests"
            element={
              <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                <TeacherTestsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/tests/create"
            element={
              <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                <TeacherTestBuilderPage isCreate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/tests/:testId"
            element={
              <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                <TeacherTestBuilderPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/tests/:testId/submissions"
            element={
              <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                <TeacherTestSubmissionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/students"
            element={
              <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                <TeacherStudentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/reports"
            element={
              <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                <TeacherReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/calendar"
            element={
              <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                <TeacherCalendarPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/qna"
            element={
              <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                <TeacherQnaPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/courses/:courseId/video-progress"
            element={
              <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                <TeacherVideoProgressPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/courses/:courseId/edit"
            element={
              <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                <TeacherCourseEditorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/courses/:courseId/view"
            element={
              <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                <CourseLearningPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/courses/:courseId/manage"
            element={
              <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                <TeacherCourseManagePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/courses/new"
            element={
              <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                <TeacherCourseEditorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/courses"
            element={
              <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                <TeacherCoursesPage />
              </ProtectedRoute>
            }
          />

          {/* Student Routes */}
          <Route
            path="/student/tests"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentTestsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/tests/:testId/attempt"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentTestAttemptPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/tests/:testId/result"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentTestResultPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/reports"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/notifications"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentNotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/courses"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentCoursesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/qna"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentQnaPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/activity"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentActivityPage />
              </ProtectedRoute>
            }
          />

          {/* Parent Routes */}
          <Route
            path="/parent/dashboard"
            element={
              <ProtectedRoute allowedRoles={['parent']}>
                <ParentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/children"
            element={
              <ProtectedRoute allowedRoles={['parent']}>
                <ParentChildrenPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/reports"
            element={
              <ProtectedRoute allowedRoles={['parent']}>
                <ParentReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/notifications"
            element={
              <ProtectedRoute allowedRoles={['parent']}>
                <ParentNotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/calendar"
            element={
              <ProtectedRoute allowedRoles={['parent']}>
                <ParentCalendarPage />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
