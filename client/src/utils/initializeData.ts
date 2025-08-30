import { hashPassword } from './password';
import axios from 'axios';

export const initializeSystemData = async () => {
  // Check if data already exists to avoid overwriting
  if (localStorage.getItem('studylink_initialized')) {
    return;
  }
  
  try {
    const response = await axios.get('/api/auth/users');
    if(response.data && response.data.users) {
      localStorage.setItem('users', JSON.stringify(response.data.users));
    }
  } catch (error) {
    console.error("Could not fetch initial users, using fallback.", error);
    // Fallback to minimal local data if API is not available
    const users = [
        { id: 1, username: 'admin', name: '관리자', email: 'admin@a1academy.com', role: 'admin', is_approved: true },
        { id: 2, username: 'teacher_kim', name: '김인후', email: 'kim@a1academy.com', role: 'teacher', is_approved: true, subjects: ['물리', '통합과학'] },
        { id: 5, username: 'student_hong', name: '홍길동', email: 'hong@example.com', role: 'student', is_approved: true, grade: '고1' },
    ];
    localStorage.setItem('users', JSON.stringify(users));
  }
  
  // Other initial data...
  const existingStudents = localStorage.getItem('students');
  if (!existingStudents) {
    const initialStudents = localStorage.getItem('users')
      ? JSON.parse(localStorage.getItem('users') || '[]')
      .filter(u => u.role === 'student')
      .map(u => ({
          id: u.id,
          name: u.name,
          username: u.username,
          email: u.email,
          phone: u.phone,
          classIds: [], // This should be populated based on enrollments.json
          classNames: [],
          createdAt: u.created_at,
          status: 'active'
      }))
      : []; // Fallback to empty array if users data is not available
    localStorage.setItem('students', JSON.stringify(initialStudents));
  }
  
  localStorage.setItem('studylink_initialized', 'true');
};