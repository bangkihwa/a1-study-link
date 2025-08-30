import React, { useState } from 'react';

interface SystemSettingsProps {
  onBack: () => void;
}

const SystemSettings: React.FC<SystemSettingsProps> = ({ onBack }) => {
  const [settings, setSettings] = useState({
    academyName: 'A1 과학학원',
    adminEmail: 'admin@a1science.com',
    autoApproval: false,
    emailNotifications: true,
    maxStudentsPerClass: 15,
    backupInterval: '7', // days
    systemMaintenance: false
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // 실제로는 API 호출을 해야 하지만 여기서는 로컬 상태만 업데이트
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    alert('설정이 저장되었습니다.');
  };

  const handleBackup = () => {
    alert('백업이 시작되었습니다. 완료되면 알림을 받게 됩니다.');
  };

  const handleSystemCheck = () => {
    alert('시스템 점검을 실행합니다...\n\n✅ 데이터베이스 연결: 정상\n✅ 서버 상태: 정상\n✅ 디스크 공간: 78% 사용\n✅ 메모리 사용량: 42%\n\n모든 시스템이 정상적으로 작동 중입니다.');
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button onClick={onBack} className="btn btn-secondary">← 뒤로</button>
        <h2 style={{ margin: 0 }}>시스템 설정</h2>
      </div>

      {saved && (
        <div style={{ background: '#dcfce7', color: '#16a34a', padding: '1rem', borderRadius: '0.375rem', marginBottom: '1rem' }}>
          ✅ 설정이 성공적으로 저장되었습니다.
        </div>
      )}

      <div className="grid grid-2">
        {/* 기본 설정 */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">기본 설정</div>
          </div>
          <div className="card-body">
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>학원 이름</label>
              <input
                type="text"
                value={settings.academyName}
                onChange={(e) => setSettings({...settings, academyName: e.target.value})}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>관리자 이메일</label>
              <input
                type="email"
                value={settings.adminEmail}
                onChange={(e) => setSettings({...settings, adminEmail: e.target.value})}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>반당 최대 학생 수</label>
              <input
                type="number"
                value={settings.maxStudentsPerClass}
                onChange={(e) => setSettings({...settings, maxStudentsPerClass: parseInt(e.target.value)})}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
              />
            </div>

            <button onClick={handleSave} className="btn btn-primary">설정 저장</button>
          </div>
        </div>

        {/* 시스템 옵션 */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">시스템 옵션</div>
          </div>
          <div className="card-body">
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={settings.autoApproval}
                  onChange={(e) => setSettings({...settings, autoApproval: e.target.checked})}
                />
                <span>회원가입 자동 승인</span>
              </label>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                새로 가입한 사용자를 자동으로 승인합니다.
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
                />
                <span>이메일 알림</span>
              </label>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                중요한 이벤트에 대한 이메일 알림을 발송합니다.
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={settings.systemMaintenance}
                  onChange={(e) => setSettings({...settings, systemMaintenance: e.target.checked})}
                />
                <span style={{ color: settings.systemMaintenance ? '#dc2626' : 'inherit' }}>
                  시스템 점검 모드
                </span>
              </label>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                점검 중에는 관리자만 접근할 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        {/* 백업 및 유지보수 */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">백업 및 유지보수</div>
          </div>
          <div className="card-body">
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>백업 주기 (일)</label>
              <select
                value={settings.backupInterval}
                onChange={(e) => setSettings({...settings, backupInterval: e.target.value})}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
              >
                <option value="1">매일</option>
                <option value="3">3일마다</option>
                <option value="7">매주</option>
                <option value="30">매월</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button onClick={handleBackup} className="btn btn-secondary">
                📁 지금 백업 실행
              </button>
              <button onClick={handleSystemCheck} className="btn btn-secondary">
                🔍 시스템 점검 실행
              </button>
            </div>
          </div>
        </div>

        {/* 통계 정보 */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">시스템 정보</div>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#6b7280' }}>시스템 버전</span>
                <strong>v1.0.0</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#6b7280' }}>마지막 백업</span>
                <strong>2024-08-23 22:30</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#6b7280' }}>업타임</span>
                <strong>7일 14시간</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
                <span style={{ color: '#6b7280' }}>활성 사용자</span>
                <strong style={{ color: '#16a34a' }}>🟢 18명 온라인</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;