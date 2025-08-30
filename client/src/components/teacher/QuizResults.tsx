import React, { useState, useEffect } from 'react';
import { loadLectures, loadQuizzes, loadStudentQuizAttempts, loadUsers } from '../../utils/dataStorage';

interface QuizResultsProps {
  teacherId: number;
  onBack: () => void;
}

interface Attempt {
    id: number;
    student_id: number;
    studentName?: string;
    quiz_id: number;
    quizTitle?: string;
    score: number | null;
    completed_at: string | null;
}

const QuizResults: React.FC<QuizResultsProps> = ({ teacherId, onBack }) => {
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [lectures, setLectures] = useState<any[]>([]);
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);

    useEffect(() => {
        const allLectures = loadLectures().filter(l => l.teacherId === teacherId);
        const allQuizzes = loadQuizzes().filter(q => allLectures.some(l => l.id === q.lecture_id));
        const allAttempts = loadStudentQuizAttempts().filter(a => allQuizzes.some(q => q.id === a.quiz_id));
        const allUsers = loadUsers();
        
        setLectures(allLectures);
        setQuizzes(allQuizzes);
        setUsers(allUsers);

        const populatedAttempts = allAttempts.map(attempt => {
            const student = allUsers.find(u => u.id === attempt.student_id);
            const quiz = allQuizzes.find(q => q.id === attempt.quiz_id);
            return {
                ...attempt,
                studentName: student?.name,
                quizTitle: quiz?.title
            }
        });
        setAttempts(populatedAttempts);
    }, [teacherId]);

    return (
        <div>
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={onBack} className="btn btn-secondary">← 뒤로</button>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>퀴즈 결과 보기</h2>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">학생 퀴즈 응시 기록</h3>
                </div>
                <div className="card-body">
                    <table className="table w-full">
                        <thead>
                            <tr>
                                <th>학생명</th>
                                <th>퀴즈 제목</th>
                                <th>점수</th>
                                <th>제출일</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attempts.map(attempt => (
                                <tr key={attempt.id}>
                                    <td>{attempt.studentName}</td>
                                    <td>{attempt.quizTitle}</td>
                                    <td>{attempt.score?.toFixed(2) ?? 'N/A'}</td>
                                    <td>{attempt.completed_at ? new Date(attempt.completed_at).toLocaleString() : 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default QuizResults;
