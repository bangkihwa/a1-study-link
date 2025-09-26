import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import { AdminSettings } from '../../types';

const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiService.getAdminSettings();
        if (response.success) {
          setSettings(response.data);
        } else {
          setError(response.message || '시스템 설정을 불러오지 못했습니다.');
        }
      } catch (err) {
        console.error(err);
        setError('시스템 설정을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (key: keyof AdminSettings, value: boolean | string | number) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!settings) return;
    setSaving(true);
    setError(null);
    setFeedback(null);

    try {
      const response = await apiService.updateAdminSettings(settings);
      if (response.success) {
        setSettings(response.data);
        setFeedback('설정이 성공적으로 저장되었습니다.');
      } else {
        setError(response.message || '설정을 저장하는 데 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      setError('설정을 저장하는 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow p-6 text-center text-sm text-gray-500">
          설정을 불러오는 중...
        </div>
      </div>
    );
  }

  if (error && !settings) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">시스템 설정</h1>
        <p className="text-gray-600">서비스 운영에 필요한 기본 정책을 관리합니다.</p>
      </header>

      {feedback && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {feedback}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {settings && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">접근 및 서비스 정책</h2>

            <ToggleField
              label="회원가입 자동 승인"
              description="활성화 시 학생·학부모·강사 회원가입이 관리자 승인 없이 즉시 활성화됩니다. 비활성화 시 가입은 가능하나 관리자 승인 전까지 로그인/이용이 제한됩니다."
              checked={settings.allowRegistrations}
              onChange={(value) => handleChange('allowRegistrations', value)}
            />

            <ToggleField
              label="점검 모드"
              description="서비스를 일시 중지하고 점검 중 배너를 노출합니다."
              checked={settings.maintenanceMode}
              onChange={(value) => handleChange('maintenanceMode', value)}
            />
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold">지원 정보</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">지원 이메일</label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => handleChange('supportEmail', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="support@a1studylink.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API 요청 제한 (분당)</label>
              <input
                type="number"
                min={1}
                value={settings.apiRateLimit}
                onChange={(e) => handleChange('apiRateLimit', Number(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </section>

          <div className="flex justify-end gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={saving}
            >
              {saving ? '저장 중...' : '저장' }
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

interface ToggleFieldProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

const ToggleField: React.FC<ToggleFieldProps> = ({ label, description, checked, onChange }) => (
  <div className="flex items-start justify-between border border-gray-100 rounded-md px-4 py-3">
    <div>
      <p className="font-medium text-gray-900">{label}</p>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
    <label className="inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span
        className={`relative inline-block w-12 h-6 transition-colors duration-200 ease-in-out rounded-full ${
          checked ? 'bg-blue-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`absolute left-1 top-1 h-4 w-4 bg-white rounded-full transition-transform duration-200 ${
            checked ? 'transform translate-x-6' : ''
          }`}
        />
      </span>
    </label>
  </div>
);

export default AdminSettingsPage;
