import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { 
  loadQuizzes, saveQuizzes,
  loadQuestions, saveQuestions,
  loadChoices, saveChoices,
  loadLectures,
  generateId,
  Quiz,
  Question,
  Choice,
  StudentQuizAttempt,
  saveStudentQuizAttempts,
  loadStudentQuizAttempts,
  StudentAnswer,
  saveStudentAnswers,
  loadStudentAnswers
} from '../utils/dataStorage';
import { db } from '../database/memoryDb';

export const createQuiz = async (req: AuthRequest, res: Response) => {
  const { lecture_id, title, quiz_type, questions } = req.body;

  if (!lecture_id || !title || !quiz_type || !questions || !Array.isArray(questions)) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const lectures = loadLectures();
  if (!lectures.find(l => l.id === lecture_id)) {
    return res.status(404).json({ error: 'Lecture not found' });
  }

  const quizzes = loadQuizzes();
  const newQuiz: Quiz = {
    id: generateId(),
    lecture_id,
    title,
    quiz_type,
    created_at: new Date().toISOString()
  };
  quizzes.push(newQuiz);
  saveQuizzes(quizzes);

  const allQuestions = loadQuestions();
  const allChoices = loadChoices();

  questions.forEach((q: any, index: number) => {
    const newQuestion: Question = {
      id: generateId(),
      quiz_id: newQuiz.id,
      question_text: q.question_text,
      question_type: q.question_type,
      order_index: index
    };
    allQuestions.push(newQuestion);

    if (q.choices && Array.isArray(q.choices)) {
      q.choices.forEach((c: any) => {
        const newChoice: Choice = {
          id: generateId(),
          question_id: newQuestion.id,
          choice_text: c.choice_text,
          is_correct: c.is_correct
        };
        allChoices.push(newChoice);
      });
    }
  });

  saveQuestions(allQuestions);
  saveChoices(allChoices);

  res.status(201).json({ message: 'Quiz created successfully', quiz: newQuiz });
};

export const getLectureQuizzes = async (req: AuthRequest, res: Response) => {
  const { lectureId } = req.params;
  const quizzes = loadQuizzes();
  const lectureQuizzes = quizzes.filter(q => q.lecture_id === parseInt(lectureId, 10));
  res.json({ quizzes: lectureQuizzes });
};

export const getQuiz = async (req: AuthRequest, res: Response) => {
  const { quizId } = req.params;
  const quizzes = loadQuizzes();
  const quiz = quizzes.find(q => q.id === parseInt(quizId, 10));

  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  const allQuestions = loadQuestions();
  const quizQuestions = allQuestions.filter(q => q.quiz_id === quiz.id);

  const allChoices = loadChoices();
  const questionsWithChoices = quizQuestions.map(q => {
    const choices = allChoices.filter(c => c.question_id === q.id);
    // For students, don't send is_correct
    if (req.user?.role === 'student') {
      return { ...q, choices: choices.map(({ is_correct, ...rest }) => rest) };
    }
    return { ...q, choices };
  });

  res.json({ quiz: { ...quiz, questions: questionsWithChoices } });
};

export const updateQuiz = async (req: AuthRequest, res: Response) => {
  const { quizId } = req.params;
  const { title, questions } = req.body;
  const quizzes = loadQuizzes();
  const quizIndex = quizzes.findIndex(q => q.id === parseInt(quizId, 10));

  if (quizIndex === -1) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  // Update quiz title
  quizzes[quizIndex].title = title || quizzes[quizIndex].title;
  saveQuizzes(quizzes);

  // Clear existing questions and choices for this quiz
  let allQuestions = loadQuestions();
  let allChoices = loadChoices();
  const questionsToDelete = allQuestions.filter(q => q.quiz_id === parseInt(quizId, 10));
  const questionIdsToDelete = questionsToDelete.map(q => q.id);
  allQuestions = allQuestions.filter(q => q.quiz_id !== parseInt(quizId, 10));
  allChoices = allChoices.filter(c => !questionIdsToDelete.includes(c.question_id));

  // Add new questions and choices
  if (questions && Array.isArray(questions)) {
    questions.forEach((q: any, index: number) => {
      const newQuestion: Question = {
        id: generateId(),
        quiz_id: parseInt(quizId, 10),
        question_text: q.question_text,
        question_type: q.question_type,
        order_index: index
      };
      allQuestions.push(newQuestion);

      if (q.choices && Array.isArray(q.choices)) {
        q.choices.forEach((c: any) => {
          const newChoice: Choice = {
            id: generateId(),
            question_id: newQuestion.id,
            choice_text: c.choice_text,
            is_correct: c.is_correct
          };
          allChoices.push(newChoice);
        });
      }
    });
  }

  saveQuestions(allQuestions);
  saveChoices(allChoices);

  res.json({ message: 'Quiz updated successfully', quiz: quizzes[quizIndex] });
};

export const deleteQuiz = async (req: AuthRequest, res: Response) => {
  const { quizId } = req.params;
  const quizzes = loadQuizzes();
  const quizIndex = quizzes.findIndex(q => q.id === parseInt(quizId, 10));

  if (quizIndex === -1) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  // Remove quiz
  quizzes.splice(quizIndex, 1);
  saveQuizzes(quizzes);
  
  // Remove associated questions and choices
  let allQuestions = loadQuestions();
  let allChoices = loadChoices();
  const questionsToDelete = allQuestions.filter(q => q.quiz_id === parseInt(quizId, 10));
  const questionIdsToDelete = questionsToDelete.map(q => q.id);
  allQuestions = allQuestions.filter(q => q.quiz_id !== parseInt(quizId, 10));
  allChoices = allChoices.filter(c => !questionIdsToDelete.includes(c.question_id));

  saveQuestions(allQuestions);
  saveChoices(allChoices);

  // TODO: Also delete student attempts and answers related to this quiz

  res.status(200).json({ message: 'Quiz deleted successfully' });
};

export const submitQuiz = async (req: AuthRequest, res: Response) => {
  const { quizId } = req.params;
  const studentId = req.user?.userId;
  const { answers } = req.body; // answers: [{ question_id: number, chosen_choice_id: number }]

  if (!studentId || !answers || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const quizzes = loadQuizzes();
  const quiz = quizzes.find(q => q.id === parseInt(quizId, 10));
  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  const allQuestions = loadQuestions();
  const quizQuestions = allQuestions.filter(q => q.quiz_id === quiz.id);

  const allChoices = loadChoices();
  let correctAnswers = 0;

  const attempts = loadStudentQuizAttempts();
  const newAttempt: StudentQuizAttempt = {
    id: generateId(),
    student_id: studentId,
    quiz_id: quiz.id,
    score: null,
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString()
  };
  
  const studentAnswers: StudentAnswer[] = [];

  answers.forEach((ans: { question_id: number, chosen_choice_id: number }) => {
    const question = quizQuestions.find(q => q.id === ans.question_id);
    if (!question) return;

    const choice = allChoices.find(c => c.id === ans.chosen_choice_id);
    if (!choice || choice.question_id !== question.id) return;

    const isCorrect = choice.is_correct;
    if (isCorrect) {
      correctAnswers++;
    }

    studentAnswers.push({
      id: generateId(),
      attempt_id: newAttempt.id,
      question_id: question.id,
      chosen_choice_id: choice.id,
      is_correct: isCorrect
    });
  });

  newAttempt.score = (correctAnswers / quizQuestions.length) * 100;
  
  attempts.push(newAttempt);
  saveStudentQuizAttempts(attempts);

  const allStudentAnswers = loadStudentAnswers();
  saveStudentAnswers([...allStudentAnswers, ...studentAnswers]);

  res.status(200).json({ message: 'Quiz submitted successfully', attemptId: newAttempt.id, score: newAttempt.score });
};

export const getQuizResult = async (req: AuthRequest, res: Response) => {
  const { attemptId } = req.params;
  const attempts = loadStudentQuizAttempts();
  const attempt = attempts.find(a => a.id === parseInt(attemptId, 10));

  if (!attempt) {
    return res.status(404).json({ error: 'Attempt not found' });
  }

  // Security check: only student who took it, or a teacher/admin can see it.
  const user = req.user;
  if (user?.role === 'student' && user.userId !== attempt.student_id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const allAnswers = loadStudentAnswers();
  const attemptAnswers = allAnswers.filter(a => a.attempt_id === attempt.id);

  res.json({ attempt, answers: attemptAnswers });
};

// New function to get users from DB
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await db.query('SELECT id, username, email, name, role, is_approved, created_at FROM users');
    res.json({ users: users });
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};
