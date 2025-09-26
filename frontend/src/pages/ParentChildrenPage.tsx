import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { ParentChildSummary } from '../types';

const ParentChildrenPage: React.FC = () => {
  const [children, setChildren] = useState<ParentChildSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadChildren = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getParentChildren();
      if (!response.success) {
        throw new Error(response.message || '자녀 정보를 불러오지 못했습니다.');
      }
      setChildren(response.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || '자녀 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChildren();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">자녀 학습 현황</h1>
        <p className="text-sm text-gray-600">연동된 자녀의 학습 진도와 최근 활동을 확인하세요.</p>
      </header>

      {loading ? (
        <div className="min-h-[200px] flex items-center justify-center text-gray-600">자녀 정보를 불러오는 중...</div>
      ) : error ? (
        <div className="min-h-[200px] flex flex-col items-center justify-center space-y-3 text-gray-600">
          <p>{error}</p>
          <button
            type="button"
            onClick={loadChildren}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
          >
            다시 시도
          </button>
        </div>
      ) : children.length === 0 ? (
        <div className="min-h-[200px] flex flex-col items-center justify-center space-y-3 text-gray-600">
          <p>연동된 자녀 계정이 없습니다.</p>
          <p className="text-sm">학생 고유번호로 자녀 계정을 연동하면 학습 현황을 확인할 수 있습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {children.map((child) => (
            <section key={child.studentId} className="bg-white rounded-lg shadow p-5 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{child.studentName}</h2>
                  <p className="text-sm text-gray-600">학생번호: {child.studentNumber}</p>
                  <p className="text-xs text-gray-400">연동일: {new Date(child.linkedAt).toLocaleDateString()}</p>
                </div>
                <div className="flex flex-col md:items-end text-sm text-gray-600">
                  <span>관계: {child.relationship === 'guardian' ? '보호자' : child.relationship === 'father' ? '부' : '모'}</span>
                  <span>학년: {child.grade ?? '-'}</span>
                  <span>반: {child.className ?? '-'}</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">담당 과목: </span>
                  <span>{child.subjectName ?? '미정'}</span>
                </div>
                <Link
                  to={`/parent/reports?studentId=${child.studentId}`}
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md border border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  학습 리포트 보기
                </Link>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default ParentChildrenPage;
