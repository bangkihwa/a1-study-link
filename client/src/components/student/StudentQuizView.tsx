import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface Quiz {
    id: number;
    lecture_id: number;
    title: string;
}

interface Question {
    id: number;
    question_text: string;
    choices: Choice[];
}
  
interface Choice {
    id: number;
    choice_text: string;
}

interface StudentQuizViewProps {
  quiz: Quiz;
  studentId: number;
  onBack: () => void;
}

const StudentQuizView: React.FC<StudentQuizViewProps> = ({ quiz, studentId, onBack }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [result, setResult] = useState<{ score: number, correct: number, total: number } | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  useEffect(() => {
    startTimeRef.current = new Date();
    const fetchQuizDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/quizzes/${quiz.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setQuestions(response.data.quiz.questions);
      } catch (error) {
        console.error("Failed to fetch quiz details:", error);
      }
    };
    fetchQuizDetails();

    return () => {
        if (startTimeRef.current && !result) {
            logQuizActivity('quiz_leave');
        }
    }
  }, [quiz.id]);

  const logQuizActivity = (activityType: 'quiz_start' | 'quiz_submit' | 'quiz_leave') => {
    if (!startTimeRef.current) return;
    const duration_seconds = Math.round((new Date().getTime() - startTimeRef.current.getTime()) / 1000);
    
    // API call to log activity
    const activityData = {
        lecture_id: quiz.lecture_id,
        content_id: quiz.id, // Assuming quiz can be treated as a content block
        activity_type: activityType,
        duration_seconds: duration_seconds,
        details: { title: quiz.title, score: result?.score }
    };

    const studentActivities = JSON.parse(localStorage.getItem('student_activities') || '[]');
    studentActivities.push({
      student_id: studentId,
      ...activityData,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('student_activities', JSON.stringify(studentActivities));
    console.log(`Logged quiz activity: ${activityType} for ${duration_seconds}s`);
  };
  
  const handleAnswerChange = (questionId: number, choiceId: number) => {
    setAnswers(prev => ({...prev, [questionId]: choiceId}));
  };
  
  const handleSubmit = async () => {
    try {
        const token = localStorage.getItem('token');
        const submission = {
            answers: Object.entries(answers).map(([question_id, chosen_choice_id]) => ({
                question_id: parseInt(question_id),
                chosen_choice_id
            }))
        };
        const response = await axios.post(`/api/quizzes/${quiz.id}/submit`, submission, {
            headers: { Authorization: `Bearer ${token}` }
        });
        alert(`제출 완료! 점수: ${response.data.score.toFixed(2)}점`);
        setResult({
            score: response.data.score,
            correct: (response.data.score/100) * questions.length,
            total: questions.length,
        });
        logQuizActivity('quiz_submit');
    } catch (error) {
        console.error("Failed to submit quiz:", error);
        alert('퀴즈 제출에 실패했습니다.');
    }
  };

  if (result) {
    return (
        <div className="card">
            <div className="card-header"><h2 className="card-title">퀴즈 결과: {quiz.title}</h2></div>
            <div className="card-body text-center">
                <p className="text-2xl">총 {result.total}문제 중 <span className="font-bold text-blue-600">{result.correct}</span>문제를 맞혔습니다.</p>
                <p className="text-4xl font-bold mt-4">점수: {result.score.toFixed(2)}점</p>
                <button onClick={onBack} className="btn btn-primary mt-6">돌아가기</button>
            </div>
        </div>
    )
  }

  return (
    <div>
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button onClick={onBack} className="btn btn-secondary">← 뒤로</button>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>{quiz.title}</h2>
            </div>
        </div>
        <div className="card">
            <div className="card-body">
                {questions.map((q, index) => (
                    <div key={q.id} className="mb-6 pb-6 border-b">
                        <p className="font-semibold">{index + 1}. {q.question_text}</p>
                        <div className="mt-2 space-y-2">
                            {q.choices.map(c => (
                                <label key={c.id} className="flex items-center p-2 rounded hover:bg-gray-100">
                                    <input 
                                        type="radio"
                                        name={`question_${q.id}`}
                                        value={c.id}
                                        onChange={() => handleAnswerChange(q.id, c.id)}
                                        className="mr-2"
                                    />
                                    {c.choice_text}
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
                <button onClick={handleSubmit} className="btn btn-primary w-full">제출하기</button>
            </div>
        </div>
    </div>
  );
};

export default StudentQuizView;
