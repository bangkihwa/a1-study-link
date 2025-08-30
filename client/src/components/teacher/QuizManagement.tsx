import React, { useState, useEffect } from 'react';
import { loadLectures, saveQuizzes, loadQuizzes, Question, Choice, Quiz } from '../../utils/dataStorage';
import axios from 'axios';

interface QuizManagementProps {
  teacherId: number;
  onBack: () => void;
}

const QuizManagement: React.FC<QuizManagementProps> = ({ teacherId, onBack }) => {
  const [lectures, setLectures] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedLecture, setSelectedLecture] = useState<any | null>(null);
  const [showCreateQuizModal, setShowCreateQuizModal] = useState(false);
  const [newQuiz, setNewQuiz] = useState({
    title: '',
    quiz_type: 'multiple_choice',
    questions: [{ question_text: '', question_type: 'multiple_choice', choices: [{ choice_text: '', is_correct: true }, { choice_text: '', is_correct: false }] }]
  });

  useEffect(() => {
    const allLectures = loadLectures();
    const myLectures = allLectures.filter(l => l.teacherId === teacherId);
    setLectures(myLectures);
  }, [teacherId]);

  useEffect(() => {
    if (selectedLecture) {
      const allQuizzes = loadQuizzes();
      setQuizzes(allQuizzes.filter(q => q.lecture_id === selectedLecture.id));
    } else {
      setQuizzes([]);
    }
  }, [selectedLecture]);

  const handleCreateQuiz = async () => {
    if (!selectedLecture || !newQuiz.title) {
      alert('강의를 선택하고 퀴즈 제목을 입력해주세요.');
      return;
    }

    const quizData = {
      lecture_id: selectedLecture.id,
      title: newQuiz.title,
      quiz_type: newQuiz.quiz_type,
      questions: newQuiz.questions.map(q => ({
        ...q,
        choices: q.choices.map(c => ({...c}))
      }))
    };
    
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post('/api/quizzes', quizData, {
            headers: { Authorization: `Bearer ${token}` }
        });

        alert(response.data.message);
        setQuizzes([...quizzes, response.data.quiz]);
        setShowCreateQuizModal(false);
        setNewQuiz({
            title: '',
            quiz_type: 'multiple_choice',
            questions: [{ question_text: '', question_type: 'multiple_choice', choices: [{ choice_text: '', is_correct: true }, { choice_text: '', is_correct: false }] }]
        });
    } catch(error) {
        console.error("Quiz creation failed:", error);
        alert('퀴즈 생성에 실패했습니다.')
    }

  };
  
  const handleAddQuestion = () => {
    setNewQuiz(prev => ({
      ...prev,
      questions: [...prev.questions, { question_text: '', question_type: 'multiple_choice', choices: [{ choice_text: '', is_correct: true }, { choice_text: '', is_correct: false }] }]
    }));
  };

  const handleRemoveQuestion = (qIndex: number) => {
    setNewQuiz(prev => ({
      ...prev,
      questions: prev.questions.filter((_, index) => index !== qIndex)
    }));
  };

  const handleAddChoice = (questionIndex: number) => {
    const updatedQuestions = [...newQuiz.questions];
    updatedQuestions[questionIndex].choices.push({ choice_text: '', is_correct: false });
    setNewQuiz({ ...newQuiz, questions: updatedQuestions });
  };

  const handleRemoveChoice = (questionIndex: number, choiceIndex: number) => {
    const updatedQuestions = [...newQuiz.questions];
    updatedQuestions[questionIndex].choices = updatedQuestions[questionIndex].choices.filter((_, index) => index !== choiceIndex);
    setNewQuiz({ ...newQuiz, questions: updatedQuestions });
  };


  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={onBack} className="btn btn-secondary">← 뒤로</button>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>퀴즈 관리</h2>
        </div>
        {selectedLecture && (
            <button onClick={() => setShowCreateQuizModal(true)} className="btn btn-primary">
                + 새 퀴즈 만들기
            </button>
        )}
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-body">
              <label htmlFor="lecture-select" className="block text-sm font-medium text-gray-700 mb-2">강의 선택:</label>
              <select 
                id="lecture-select"
                value={selectedLecture?.id || ''}
                onChange={e => {
                    const lecture = lectures.find(l => l.id === parseInt(e.target.value));
                    setSelectedLecture(lecture || null);
                }}
                className="input-field w-full"
              >
                  <option value="">강의를 선택하세요</option>
                  {lectures.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
              </select>
          </div>
      </div>
      
      {selectedLecture && (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">{selectedLecture.title} 퀴즈 목록</h3>
            </div>
            <div className="card-body">
                {quizzes.length > 0 ? quizzes.map(quiz => (
                    <div key={quiz.id} className="flex justify-between items-center p-2 border-b">
                        <span>{quiz.title} ({quiz.quiz_type})</span>
                        <div>
                            <button className="btn btn-secondary btn-sm">수정</button>
                            <button className="btn btn-danger btn-sm ml-2">삭제</button>
                        </div>
                    </div>
                )) : <p>이 강의에는 퀴즈가 없습니다.</p>}
            </div>
        </div>
      )}

      {showCreateQuizModal && selectedLecture && (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(0,0,0,0.5)', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div className="card" style={{width: '800px', maxHeight: '90vh', overflowY: 'auto'}}>
                <div className="card-header">
                  <h3 className="card-title">새 퀴즈 만들기: {selectedLecture.title}</h3>
                </div>
                <div className="card-body">
                    <div className="space-y-4">
                      <input 
                          type="text" 
                          placeholder="퀴즈 제목" 
                          value={newQuiz.title}
                          onChange={e => setNewQuiz({...newQuiz, title: e.target.value})}
                          className="input-field w-full"
                      />
                      {newQuiz.questions.map((q, qIndex) => (
                          <div key={qIndex} className="border rounded-lg p-4 space-y-3">
                              <div className="flex justify-between items-center">
                                <label className="font-medium">질문 {qIndex + 1}</label>
                                {newQuiz.questions.length > 1 && <button onClick={() => handleRemoveQuestion(qIndex)} className="btn btn-danger btn-sm">질문 삭제</button>}
                              </div>
                              <textarea 
                                  placeholder={`질문 내용`}
                                  value={q.question_text}
                                  onChange={e => {
                                      const updated = [...newQuiz.questions];
                                      updated[qIndex].question_text = e.target.value;
                                      setNewQuiz({...newQuiz, questions: updated});
                                  }}
                                  className="input-field w-full"
                                  rows={2}
                              />
                              {q.choices.map((c, cIndex) => (
                                  <div key={cIndex} className="flex items-center gap-2">
                                      <input type="radio" name={`correct_${qIndex}`} checked={c.is_correct} onChange={() => {
                                          const updated = [...newQuiz.questions];
                                          updated[qIndex].choices.forEach((choice, i) => choice.is_correct = i === cIndex);
                                          setNewQuiz({...newQuiz, questions: updated});
                                      }}/>
                                      <input 
                                          type="text"
                                          placeholder={`선택지 ${cIndex + 1}`}
                                          value={c.choice_text}
                                          onChange={e => {
                                              const updated = [...newQuiz.questions];
                                              updated[qIndex].choices[cIndex].choice_text = e.target.value;
                                              setNewQuiz({...newQuiz, questions: updated});
                                          }}
                                          className="input-field flex-1"
                                      />
                                      {q.choices.length > 2 && <button onClick={() => handleRemoveChoice(qIndex, cIndex)} className="btn btn-danger btn-sm">X</button>}
                                  </div>
                              ))}
                              <button onClick={() => handleAddChoice(qIndex)} className="btn btn-secondary btn-sm">+ 선택지 추가</button>
                          </div>
                      ))}
                      <button onClick={handleAddQuestion} className="btn btn-secondary w-full">+ 질문 추가</button>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <button onClick={handleCreateQuiz} className="btn btn-primary">생성</button>
                      <button onClick={() => setShowCreateQuizModal(false)} className="btn btn-secondary">취소</button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default QuizManagement;
