import React, { useState, useEffect } from 'react';

const DataDebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const loadDebugInfo = () => {
      const info: any = {};
      
      // Users
      const users = JSON.parse(localStorage.getItem('users') || localStorage.getItem('studylink_users') || '[]');
      info.totalUsers = users.length;
      info.studentUsers = users.filter((u: any) => u.role === 'student').length;
      info.teacherUsers = users.filter((u: any) => u.role === 'teacher').length;
      info.adminUsers = users.filter((u: any) => u.role === 'admin').length;
      
      // Students (legacy)
      const studentsData = localStorage.getItem('students') || localStorage.getItem('studylink_students');
      if (studentsData) {
        info.studentsArrayCount = JSON.parse(studentsData).length;
      }
      
      // Classes
      const classes = JSON.parse(localStorage.getItem('classes') || localStorage.getItem('studylink_classes') || '[]');
      info.totalClasses = classes.length;
      
      // Count students in classes
      let studentsInClasses = new Set();
      classes.forEach((cls: any) => {
        if (cls.students) {
          cls.students.forEach((s: any) => {
            studentsInClasses.add(typeof s === 'object' ? s.id : s);
          });
        }
        if (cls.studentIds) {
          cls.studentIds.forEach((id: any) => studentsInClasses.add(id));
        }
      });
      info.studentsEnrolledInClasses = studentsInClasses.size;
      
      // Lectures
      const lectures = JSON.parse(localStorage.getItem('lectures') || localStorage.getItem('studylink_lectures') || '[]');
      info.totalLectures = lectures.length;
      info.publishedLectures = lectures.filter((l: any) => l.status === 'published' || l.isPublished === true).length;
      info.draftLectures = lectures.filter((l: any) => l.status === 'draft').length;
      
      // Questions
      const questions = JSON.parse(localStorage.getItem('teacherQuestions') || '[]');
      info.totalQuestions = questions.length;
      info.answeredQuestions = questions.filter((q: any) => q.isAnswered).length;
      info.pendingQuestions = questions.filter((q: any) => !q.isAnswered).length;
      
      // Current user
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      info.currentUser = {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
        username: currentUser.username
      };
      
      setDebugInfo(info);
    };
    
    loadDebugInfo();
    const interval = setInterval(loadDebugInfo, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      fontSize: '12px',
      maxWidth: '300px',
      zIndex: 9999
    }}>
      <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', borderBottom: '1px solid #666', paddingBottom: '5px' }}>
        📊 Debug Info
      </h4>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Current User:</strong>
        <div style={{ paddingLeft: '10px', color: '#90EE90' }}>
          {debugInfo.currentUser?.name} ({debugInfo.currentUser?.role})
        </div>
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Users:</strong>
        <div style={{ paddingLeft: '10px' }}>
          Total: {debugInfo.totalUsers}<br/>
          Students: {debugInfo.studentUsers}<br/>
          Teachers: {debugInfo.teacherUsers}<br/>
          Admins: {debugInfo.adminUsers}
        </div>
      </div>
      
      {debugInfo.studentsArrayCount !== undefined && (
        <div style={{ marginBottom: '8px' }}>
          <strong>Legacy Students Array:</strong> {debugInfo.studentsArrayCount}
        </div>
      )}
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Classes:</strong>
        <div style={{ paddingLeft: '10px' }}>
          Total: {debugInfo.totalClasses}<br/>
          Enrolled Students: {debugInfo.studentsEnrolledInClasses}
        </div>
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Lectures:</strong>
        <div style={{ paddingLeft: '10px' }}>
          Total: {debugInfo.totalLectures}<br/>
          Published: {debugInfo.publishedLectures}<br/>
          Draft: {debugInfo.draftLectures || 0}
        </div>
      </div>
      
      <div>
        <strong>Questions:</strong>
        <div style={{ paddingLeft: '10px' }}>
          Total: {debugInfo.totalQuestions}<br/>
          Answered: {debugInfo.answeredQuestions}<br/>
          Pending: {debugInfo.pendingQuestions}
        </div>
      </div>
    </div>
  );
};

export default DataDebugger;