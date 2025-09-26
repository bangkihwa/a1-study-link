import React, { useEffect, useMemo, useState } from 'react';
import { TestQuestion } from '../../types';

type QuestionType = TestQuestion['type'];

type QuestionFormState = {
  id?: number;
  type: QuestionType;
  questionText: string;
  points: number;
  questionData: any;
};

interface TestQuestionFormProps {
  mode: 'create' | 'edit';
  initialValue?: QuestionFormState;
  submitting?: boolean;
  onSubmit: (payload: QuestionFormState) => void;
  onCancel?: () => void;
}

const defaultQuestionData: Record<QuestionType, any> = {
  ox: {
    correctAnswer: 'O',
    explanation: ''
  },
  short_answer: {
    correctAnswer: '',
    acceptableAnswers: []
  },
  multiple_choice: {
    options: ['', '', '', '', ''],
    correctOption: 0,
    explanation: ''
  },
  essay: {
    modelAnswer: '',
    evaluationCriteria: ''
  }
};

const buildInitialForm = (initial?: QuestionFormState): QuestionFormState => {
  const type = initial?.type || 'ox';
  return {
    id: initial?.id,
    type,
    questionText: initial?.questionText || '',
    points: initial?.points ?? 10,
    questionData: {
      ...defaultQuestionData[type],
      ...(initial?.questionData || {})
    }
  };
};

const TestQuestionForm: React.FC<TestQuestionFormProps> = ({ mode, initialValue, submitting, onSubmit, onCancel }) => {
  const [formState, setFormState] = useState<QuestionFormState>(() => buildInitialForm(initialValue));

  useEffect(() => {
    setFormState(buildInitialForm(initialValue));
  }, [initialValue]);

  const handleTypeChange = (nextType: QuestionType) => {
    setFormState((prev) => ({
      ...buildInitialForm({
        ...prev,
        type: nextType,
        questionData: defaultQuestionData[nextType]
      }),
      questionText: prev.questionText,
      points: prev.points
    }));
  };

  const handleOptionChange = (index: number, value: string) => {
    setFormState((prev) => {
      const next = [...(prev.questionData.options || [])];
      next[index] = value;
      return {
        ...prev,
        questionData: {
          ...prev.questionData,
          options: next
        }
      };
    });
  };

  const availableOptions = useMemo<string[]>(() => {
    if (formState.type !== 'multiple_choice') return [];
    const options: string[] = Array.isArray(formState.questionData.options)
      ? formState.questionData.options
      : [];
    if (options.length < 5) {
      const filled = [...options];
      while (filled.length < 5) {
        filled.push('');
      }
      return filled;
    }
    return options;
  }, [formState]);

  const updateQuestionData = (key: string, value: any) => {
    setFormState((prev) => ({
      ...prev,
      questionData: {
        ...prev.questionData,
        [key]: value
      }
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const payload: QuestionFormState = {
      ...formState,
      questionText: formState.questionText.trim(),
      points: Number(formState.points) || 0
    };

    if (!payload.questionText) {
      alert('문제 내용을 입력해 주세요.');
      return;
    }

    if (payload.points <= 0) {
      alert('배점은 1 이상이어야 합니다.');
      return;
    }

    if (payload.type === 'multiple_choice') {
      const options: string[] = (payload.questionData.options || []).map((option: string) => option.trim());
      if (options.some((option) => !option)) {
        alert('모든 선택지를 입력해 주세요.');
        return;
      }
      if (payload.questionData.correctOption === undefined || payload.questionData.correctOption === null) {
        alert('정답 선택지를 지정해 주세요.');
        return;
      }
    }

    if (payload.type === 'short_answer' && !payload.questionData.correctAnswer) {
      alert('정답을 입력해 주세요.');
      return;
    }

    onSubmit(payload);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">문항 유형</label>
        <select
          value={formState.type}
          onChange={(event) => handleTypeChange(event.target.value as QuestionType)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          <option value="ox">O/X 문제</option>
          <option value="multiple_choice">객관식 (5지선다)</option>
          <option value="short_answer">단답형</option>
          <option value="essay">서술형</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">문제 내용</label>
        <textarea
          value={formState.questionText}
          onChange={(event) => setFormState((prev) => ({ ...prev, questionText: event.target.value }))}
          rows={4}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          placeholder="질문을 입력하세요"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">배점</label>
        <input
          type="number"
          min={1}
          value={formState.points}
          onChange={(event) => setFormState((prev) => ({ ...prev, points: Number(event.target.value) }))}
          className="w-32 border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
      </div>

      {formState.type === 'ox' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">정답</label>
            <select
              value={formState.questionData.correctAnswer}
              onChange={(event) => updateQuestionData('correctAnswer', event.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="O">O</option>
              <option value="X">X</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">정답 해설 (선택)</label>
            <input
              type="text"
              value={formState.questionData.explanation || ''}
              onChange={(event) => updateQuestionData('explanation', event.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="해설을 입력하세요"
            />
          </div>
        </div>
      )}

      {formState.type === 'multiple_choice' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableOptions.map((option: string, index: number) => (
              <div key={index}>
                <label className="block text-sm font-medium text-gray-700 mb-1">선택지 {index + 1}</label>
                <input
                  type="text"
                  value={option}
                  onChange={(event) => handleOptionChange(index, event.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  placeholder={`선택지 ${index + 1}`}
                />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">정답 선택지</label>
              <select
                value={formState.questionData.correctOption ?? 0}
                onChange={(event) => updateQuestionData('correctOption', Number(event.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                {availableOptions.map((_, index) => (
                  <option key={index} value={index}>{`선택지 ${index + 1}`}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">정답 해설 (선택)</label>
              <input
                type="text"
                value={formState.questionData.explanation || ''}
                onChange={(event) => updateQuestionData('explanation', event.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="해설을 입력하세요"
              />
            </div>
          </div>
        </div>
      )}

      {formState.type === 'short_answer' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">정답</label>
            <input
              type="text"
              value={formState.questionData.correctAnswer || ''}
              onChange={(event) => updateQuestionData('correctAnswer', event.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="정답을 입력하세요"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">허용 답안 (줄바꿈으로 구분)</label>
            <textarea
              value={(formState.questionData.acceptableAnswers || []).join('\n')}
              onChange={(event) =>
                updateQuestionData(
                  'acceptableAnswers',
                  event.target.value
                    .split('\n')
                    .map((item) => item.trim())
                    .filter(Boolean)
                )
              }
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="추가로 인정할 답안을 줄바꿈으로 구분하여 입력하세요"
            />
          </div>
        </div>
      )}

      {formState.type === 'essay' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">모범 답안 (선택)</label>
            <textarea
              value={formState.questionData.modelAnswer || ''}
              onChange={(event) => updateQuestionData('modelAnswer', event.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="모범 답안을 입력하세요"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">평가 기준 (선택)</label>
            <textarea
              value={formState.questionData.evaluationCriteria || ''}
              onChange={(event) => updateQuestionData('evaluationCriteria', event.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="평가 기준을 입력하세요"
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? '저장 중...' : mode === 'create' ? '문항 추가' : '문항 저장'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50"
          >
            취소
          </button>
        )}
      </div>
    </form>
  );
};

export type { QuestionFormState };
export default TestQuestionForm;
