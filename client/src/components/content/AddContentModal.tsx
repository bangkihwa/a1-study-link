import React, { useState } from 'react';
import { ContentType, CONTENT_TYPE_LABELS } from '../../types';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface AddContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (content: {
    type: ContentType;
    title: string;
    content_url?: string;
    content_data?: any;
    order_index: number;
  }) => void;
}

const AddContentModal: React.FC<AddContentModalProps> = ({
  isOpen,
  onClose,
  onAdd
}) => {
  const [formData, setFormData] = useState({
    type: 'video' as ContentType,
    title: '',
    content_url: '',
    order_index: 0
  });

  const [oxQuestions, setOxQuestions] = useState([
    { question: '', answer: true }
  ]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let content_data = undefined;
    
    if (formData.type === 'ox_test') {
      content_data = {
        questions: oxQuestions.filter(q => q.question.trim())
      };
    }

    onAdd({
      type: formData.type,
      title: formData.title,
      content_url: formData.content_url || undefined,
      content_data,
      order_index: formData.order_index
    });

    // 폼 초기화
    setFormData({
      type: 'video',
      title: '',
      content_url: '',
      order_index: 0
    });
    setOxQuestions([{ question: '', answer: true }]);
    onClose();
  };

  const addOxQuestion = () => {
    setOxQuestions([...oxQuestions, { question: '', answer: true }]);
  };

  const removeOxQuestion = (index: number) => {
    if (oxQuestions.length > 1) {
      setOxQuestions(oxQuestions.filter((_, i) => i !== index));
    }
  };

  const updateOxQuestion = (index: number, field: 'question' | 'answer', value: string | boolean) => {
    const updated = [...oxQuestions];
    updated[index] = { ...updated[index], [field]: value };
    setOxQuestions(updated);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">콘텐츠 추가</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              콘텐츠 유형
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as ContentType })}
              className="input-field w-full"
              required
            >
              {Object.entries(CONTENT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              제목
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-field w-full"
              placeholder="콘텐츠 제목을 입력하세요"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              순서
            </label>
            <input
              type="number"
              value={formData.order_index}
              onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
              className="input-field w-32"
              min="0"
            />
          </div>

          {/* 콘텐츠 타입별 입력 필드 */}
          {formData.type === 'video' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                YouTube URL
              </label>
              <input
                type="url"
                value={formData.content_url}
                onChange={(e) => setFormData({ ...formData, content_url: e.target.value })}
                className="input-field w-full"
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <p className="text-sm text-gray-500 mt-1">
                YouTube 동영상 URL을 입력하세요
              </p>
            </div>
          )}

          {formData.type === 'smo_test' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CodePen URL
              </label>
              <input
                type="url"
                value={formData.content_url}
                onChange={(e) => setFormData({ ...formData, content_url: e.target.value })}
                className="input-field w-full"
                placeholder="https://codepen.io/..."
              />
              <p className="text-sm text-gray-500 mt-1">
                CodePen에서 만든 SMO 테스트 URL을 입력하세요
              </p>
            </div>
          )}

          {formData.type === 'mindmap' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                마인드맵 URL
              </label>
              <input
                type="url"
                value={formData.content_url}
                onChange={(e) => setFormData({ ...formData, content_url: e.target.value })}
                className="input-field w-full"
                placeholder="마인드맵 링크 URL"
              />
              <p className="text-sm text-gray-500 mt-1">
                온라인 마인드맵 도구의 공유 URL을 입력하세요
              </p>
            </div>
          )}

          {formData.type === 'ox_test' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OX 테스트 문제
              </label>
              <div className="space-y-4">
                {oxQuestions.map((q, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start space-x-4">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={q.question}
                          onChange={(e) => updateOxQuestion(index, 'question', e.target.value)}
                          className="input-field w-full mb-2"
                          placeholder={`문제 ${index + 1}`}
                        />
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`answer_${index}`}
                              checked={q.answer === true}
                              onChange={() => updateOxQuestion(index, 'answer', true)}
                              className="mr-2"
                            />
                            O (참)
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`answer_${index}`}
                              checked={q.answer === false}
                              onChange={() => updateOxQuestion(index, 'answer', false)}
                              className="mr-2"
                            />
                            X (거짓)
                          </label>
                        </div>
                      </div>
                      {oxQuestions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeOxQuestion(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addOxQuestion}
                  className="btn-secondary w-full"
                >
                  문제 추가
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              취소
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              추가
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddContentModal;