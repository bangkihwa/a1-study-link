export function debugEnrollment() {
  console.log('=== DEBUGGING ENROLLMENT ===');
  
  // Check classes
  const classesData = localStorage.getItem('classes') || localStorage.getItem('studylink_classes');
  const classes = classesData ? JSON.parse(classesData) : [];
  console.log('Classes:', classes);
  
  // Check students
  const studentsData = localStorage.getItem('students') || localStorage.getItem('studylink_students');
  const students = studentsData ? JSON.parse(studentsData) : [];
  console.log('Students:', students);
  
  // Check current user
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  console.log('Current User:', currentUser);
  
  // Find student by current user
  const currentStudent = students.find((s: any) => 
    s.id === currentUser.id || s.username === currentUser.username || s.name === currentUser.name
  );
  console.log('Found Student:', currentStudent);
  
  // Check if student has classIds
  if (currentStudent) {
    console.log('Student classIds:', currentStudent.classIds);
    
    if (currentStudent.classIds && currentStudent.classIds.length > 0) {
      const enrolledClasses = classes.filter((c: any) => 
        currentStudent.classIds.includes(c.id)
      );
      console.log('Enrolled Classes (by classIds):', enrolledClasses);
    }
    
    // Also check by class studentIds
    const classesByStudentIds = classes.filter((c: any) => {
      const hasStudent = c.studentIds && c.studentIds.includes(currentStudent.id);
      const hasInStudents = c.students && c.students.some((s: any) => s.id === currentStudent.id);
      return hasStudent || hasInStudents;
    });
    console.log('Classes containing student (by studentIds or students array):', classesByStudentIds);
  }
}