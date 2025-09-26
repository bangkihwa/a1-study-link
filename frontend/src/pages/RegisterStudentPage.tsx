import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';

interface StudentFormState {
  username: string;
  password: string;
  confirmPassword: string;
  name: string;
  email: string;
  phone: string;
}

const defaultForm: StudentFormState = {
  username: '',
  password: '',
  confirmPassword: '',
  name: '',
  email: '',
  phone: ''
};

const RegisterStudentPage: React.FC = () => {
  const [form, setForm] = useState<StudentFormState>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // 설정은 성공 메시지 안내에만 사용(제출 차단 없음)
  const [allowRegistrations, setAllowRegistrations] = useState<boolean | null>(null);
  useEffect(() => {
    apiService.getPublicSettings()
      .then((res) => setAllowRegistrations(Boolean(res.data?.allowRegistrations)))
      .catch(() => setAllowRegistrations(null));
  }, []);

  const handleChange = (key: keyof StudentFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (form.password !== form.confirmPassword) {
      setError('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.registerStudent({
        username: form.username.trim(),
        password: form.password,
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined
      });

      if (response.success) {
        const studentNumber = response.data?.studentNumber;
        const approved = Boolean(response.data?.isApproved);
        if (studentNumber) {
          setSuccess(
            approved
              ? `회원가입이 완료되었습니다. 학생 고유번호는 ${studentNumber}입니다. 바로 로그인하여 이용할 수 있습니다.`
              : `회원가입이 완료되었습니다. 학생 고유번호는 ${studentNumber}이며 학부모 회원가입 시 사용됩니다. 관리자 승인 후 이용 가능합니다.`
          );
        } else {
          setSuccess(
            approved
              ? '회원가입이 완료되었습니다. 바로 로그인할 수 있습니다.'
              : '회원가입이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다.'
          );
        }
        setForm(defaultForm);
      } else {
        setError(response.message || '회원가입에 실패했습니다.');
      }
    } catch (err: any) {
      const message = err?.response?.data?.message;
      setError(message || '회원가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-gray-900">학생 회원가입</h2>
          <p className="text-sm text-gray-600">필수 정보를 입력하면 즉시 계정이 생성됩니다.</p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">{success}</div>}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">아이디</label>
            <input
              type="text"
              required
              value={form.username}
              onChange={(e) => handleChange('username', e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="아이디"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="6자 이상"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 확인</label>
              <input
                type="password"
                required
                value={form.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="비밀번호 확인"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="이름"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이메일 (선택)</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="example@domain.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">연락처 (선택)</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="010-0000-0000"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {loading ? '가입 중...' : '회원가입' }
            </button>
          </div>
        </form>

        <div className="text-center text-sm text-gray-600">
          이미 계정이 있으신가요? <Link to="/login" className="text-primary-600 hover:text-primary-500">로그인 하기</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterStudentPage;
