import React from 'react';
import { TestQuestion } from '../../types';

interface TestQuestionListProps {
  questions: TestQuestion[];
  onEdit: (question: TestQuestion) => void;
  onDelete: (question: TestQuestion) => void;
  onMove: (question: TestQuestion, direction: 'up' | 'down') => void;
  selectedQuestionId?: number | null;
}

const typeLabels: Record<TestQuestion['type'], string> = {
  ox: 'O/X',
  short_answer: '단답형',
  multiple_choice: '객관식',
  essay: '서술형'
};

const TestQuestionList: React.FC<TestQuestionListProps> = ({ questions, onEdit, onDelete, onMove, selectedQuestionId }) => {
  if (questions.length === 0) {
    return (
      <div className="border border-dashed border-gray-300 rounded-lg p-6 text-sm text-gray-500">
        등록된 문항이 없습니다. 오른쪽 폼을 사용해 첫 번째 문항을 추가해 보세요.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {questions.map((question, index) => (
        <div
          key={question.id}
          className={`border rounded-lg p-4 bg-white shadow-sm ${selectedQuestionId === question.id ? 'ring-2 ring-blue-500' : ''}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-gray-900">[{typeLabels[question.type]}] {question.questionText}</div>
              <div className="text-xs text-gray-500 mt-1">
                배점 {question.points ?? 0}점 · 순서 {question.orderIndex + 1}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onMove(question, 'up')}
                disabled={index === 0}
                className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => onMove(question, 'down')}
                disabled={index === questions.length - 1}
                className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => onEdit(question)}
                className="px-2 py-1 text-xs border border-blue-200 text-blue-600 rounded hover:bg-blue-50"
              >
                수정
              </button>
              <button
                type="button"
                onClick={() => onDelete(question)}
                className="px-2 py-1 text-xs border border-red-200 text-red-600 rounded hover:bg-red-50"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TestQuestionList;
