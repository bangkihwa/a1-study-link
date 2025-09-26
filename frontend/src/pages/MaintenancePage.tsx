import React, { useEffect, useState } from 'react';

const MaintenancePage: React.FC = () => {
  const [message, setMessage] = useState<string>('현재 서비스가 점검 중입니다. 잠시 후 다시 이용해 주세요.');

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('maintenance_message');
      if (stored) {
        setMessage(stored);
      }
    } catch (error) {
      // ignore storage errors (e.g., private mode)
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center space-y-4">
      <div className="max-w-md space-y-3">
        <h1 className="text-2xl font-bold text-gray-900">시스템 점검 안내</h1>
        <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
        <p className="text-xs text-gray-400">관리자 계정은 점검 중에도 접속할 수 있습니다.</p>
      </div>
    </div>
  );
};

export default MaintenancePage;
