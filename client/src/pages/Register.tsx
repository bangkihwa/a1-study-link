import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  UserPlusIcon, 
  BookOpenIcon, 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  LockClosedIcon,
  IdentificationIcon,
  AcademicCapIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    role: 'student',
    parentPassword: '',
    confirmParentPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showParentPassword, setShowParentPassword] = useState(false);
  const [showConfirmParentPassword, setShowConfirmParentPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // 비밀번호 확인
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setIsLoading(false);
      return;
    }

    // 비밀번호 길이 체크
    if (formData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      setIsLoading(false);
      return;
    }
    
    // 학생인 경우 학부모 비밀번호 확인
    if (formData.role === 'student') {
      if (formData.parentPassword && formData.parentPassword !== formData.confirmParentPassword) {
        setError('학부모 비밀번호가 일치하지 않습니다.');
        setIsLoading(false);
        return;
      }
      if (formData.parentPassword && formData.parentPassword.length < 4) {
        setError('학부모 비밀번호는 최소 4자 이상이어야 합니다.');
        setIsLoading(false);
        return;
      }
    }

    try {
      // 서버 API 호출
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone || '',
          role: formData.role
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // 서버에서 반환한 에러 처리
        if (data.errors && Array.isArray(data.errors)) {
          // validation 에러 처리
          const errorMessages = data.errors.map((err: any) => err.msg).join(', ');
          setError(errorMessages);
        } else if (data.error) {
          // 일반 에러 처리 (중복 체크 포함)
          setError(data.error);
        } else {
          setError('회원가입 중 오류가 발생했습니다.');
        }
        setIsLoading(false);
        return;
      }

      // 성공 처리
      setSuccess(data.message || '회원가입이 완료되었습니다! 관리자 승인 후 로그인하실 수 있습니다.');
      
      // 3초 후 로그인 페이지로 이동
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Registration error:', err);
      setError('서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
          padding: '3rem 2.5rem',
          width: '100%',
          maxWidth: '420px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* 배경 장식 */}
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '150px',
            height: '150px',
            background: 'linear-gradient(45deg, #10b981, #059669)',
            borderRadius: '50%',
            opacity: '0.1'
          }}></div>
          
          <div style={{
            position: 'absolute',
            bottom: '-30px',
            left: '-30px',
            width: '100px',
            height: '100px',
            background: 'linear-gradient(45deg, #059669, #10b981)',
            borderRadius: '50%',
            opacity: '0.1'
          }}></div>

          {/* 성공 아이콘 */}
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            borderRadius: '50%',
            margin: '0 auto 2rem auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)',
            position: 'relative',
            zIndex: 1
          }}>
            <UserPlusIcon style={{ width: '40px', height: '40px', color: 'white' }} />
          </div>

          <h2 style={{
            fontSize: '2rem',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '1.5rem',
            position: 'relative',
            zIndex: 1
          }}>
            회원가입 완료!
          </h2>

          <div style={{
            background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
            borderRadius: '12px',
            padding: '1.25rem',
            border: '1px solid #a7f3d0',
            marginBottom: '1.5rem',
            position: 'relative',
            zIndex: 1
          }}>
            <p style={{
              color: '#065f46',
              fontWeight: '600',
              fontSize: '1rem',
              lineHeight: '1.6'
            }}>
              {success}
            </p>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
            borderRadius: '8px',
            padding: '1rem',
            border: '1px solid #fde68a',
            position: 'relative',
            zIndex: 1,
            animation: 'pulse 2s infinite'
          }}>
            <p style={{
              color: '#92400e',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              잠시 후 로그인 페이지로 이동합니다...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
        padding: '3rem 2.5rem',
        width: '100%',
        maxWidth: '480px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* 배경 장식 */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '150px',
          height: '150px',
          background: 'linear-gradient(45deg, #667eea, #764ba2)',
          borderRadius: '50%',
          opacity: '0.1'
        }}></div>
        
        <div style={{
          position: 'absolute',
          bottom: '-30px',
          left: '-30px',
          width: '100px',
          height: '100px',
          background: 'linear-gradient(45deg, #764ba2, #667eea)',
          borderRadius: '50%',
          opacity: '0.1'
        }}></div>

        {/* 로고 및 제목 */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem', position: 'relative', zIndex: 1 }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            borderRadius: '50%',
            margin: '0 auto 1.5rem auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
          }}>
            <span style={{
              fontSize: '2rem',
              color: 'white'
            }}>🔬</span>
          </div>
          
          <h1 style={{
            fontSize: '1.875rem',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem'
          }}>
            A1 과학학원 회원가입
          </h1>
          
          <p style={{
            color: '#6b7280',
            fontSize: '1rem',
            fontWeight: '500'
          }}>
            스터디링크 시스템에 참여하세요
          </p>
        </div>

        {/* 회원가입 폼 */}
        <form onSubmit={handleSubmit} style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            {/* 아이디 */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                아이디 *
              </label>
              <div style={{ position: 'relative' }}>
                <IdentificationIcon style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '20px',
                  height: '20px',
                  color: '#9ca3af',
                  zIndex: 1
                }} />
                <input
                  name="username"
                  type="text"
                  required
                  minLength={3}
                  maxLength={50}
                  placeholder="아이디를 입력하세요 (3-50자)"
                  value={formData.username}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    paddingLeft: '2.5rem',
                    paddingRight: '1rem',
                    paddingTop: '0.875rem',
                    paddingBottom: '0.875rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    background: '#fafafa'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.background = 'white';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.background = '#fafafa';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* 구분 */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                구분 *
              </label>
              <div style={{ position: 'relative' }}>
                <AcademicCapIcon style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '20px',
                  height: '20px',
                  color: '#9ca3af',
                  zIndex: 1
                }} />
                <select
                  name="role"
                  required
                  value={formData.role}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    paddingLeft: '2.5rem',
                    paddingRight: '1rem',
                    paddingTop: '0.875rem',
                    paddingBottom: '0.875rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    background: '#fafafa',
                    appearance: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.background = 'white';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.background = '#fafafa';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <option value="student">학생</option>
                  <option value="teacher">교사</option>
                  <option value="parent">학부모</option>
                </select>
              </div>
            </div>

            {/* 이름 */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                이름 *
              </label>
              <div style={{ position: 'relative' }}>
                <UserIcon style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '20px',
                  height: '20px',
                  color: '#9ca3af',
                  zIndex: 1
                }} />
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="이름을 입력하세요"
                  value={formData.name}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    paddingLeft: '2.5rem',
                    paddingRight: '1rem',
                    paddingTop: '0.875rem',
                    paddingBottom: '0.875rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    background: '#fafafa'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.background = 'white';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.background = '#fafafa';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* 이메일 */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                이메일 *
              </label>
              <div style={{ position: 'relative' }}>
                <EnvelopeIcon style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '20px',
                  height: '20px',
                  color: '#9ca3af',
                  zIndex: 1
                }} />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="이메일을 입력하세요"
                  value={formData.email}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    paddingLeft: '2.5rem',
                    paddingRight: '1rem',
                    paddingTop: '0.875rem',
                    paddingBottom: '0.875rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    background: '#fafafa'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.background = 'white';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.background = '#fafafa';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* 전화번호 */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                전화번호
              </label>
              <div style={{ position: 'relative' }}>
                <PhoneIcon style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '20px',
                  height: '20px',
                  color: '#9ca3af',
                  zIndex: 1
                }} />
                <input
                  name="phone"
                  type="tel"
                  placeholder="010-1234-5678"
                  value={formData.phone}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    paddingLeft: '2.5rem',
                    paddingRight: '1rem',
                    paddingTop: '0.875rem',
                    paddingBottom: '0.875rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    background: '#fafafa'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.background = 'white';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.background = '#fafafa';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* 비밀번호 */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                비밀번호 *
              </label>
              <div style={{ position: 'relative' }}>
                <LockClosedIcon style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '20px',
                  height: '20px',
                  color: '#9ca3af',
                  zIndex: 1
                }} />
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="비밀번호를 입력하세요 (최소 6자)"
                  value={formData.password}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    paddingLeft: '2.5rem',
                    paddingRight: '2.5rem',
                    paddingTop: '0.875rem',
                    paddingBottom: '0.875rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    background: '#fafafa'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.background = 'white';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.background = '#fafafa';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    borderRadius: '4px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {showPassword ? (
                    <EyeSlashIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                  ) : (
                    <EyeIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                  )}
                </button>
              </div>
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                비밀번호 확인 *
              </label>
              <div style={{ position: 'relative' }}>
                <LockClosedIcon style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '20px',
                  height: '20px',
                  color: '#9ca3af',
                  zIndex: 1
                }} />
                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="비밀번호를 다시 입력하세요"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    paddingLeft: '2.5rem',
                    paddingRight: '2.5rem',
                    paddingTop: '0.875rem',
                    paddingBottom: '0.875rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    background: '#fafafa'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.background = 'white';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.background = '#fafafa';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    borderRadius: '4px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                  ) : (
                    <EyeIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                  )}
                </button>
              </div>
            </div>

            {/* 학부모 비밀번호 (학생만) */}
            {formData.role === 'student' && (
              <>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    학부모 비밀번호 (선택)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <LockClosedIcon style={{
                      position: 'absolute',
                      left: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '20px',
                      height: '20px',
                      color: '#9ca3af',
                      zIndex: 1
                    }} />
                    <input
                      name="parentPassword"
                      type={showParentPassword ? 'text' : 'password'}
                      minLength={4}
                      placeholder="학부모 확인용 비밀번호 (선택사항)"
                      value={formData.parentPassword}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        paddingLeft: '2.5rem',
                        paddingRight: '2.5rem',
                        paddingTop: '0.875rem',
                        paddingBottom: '0.875rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        fontSize: '1rem',
                        transition: 'all 0.3s ease',
                        background: '#fafafa'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#667eea';
                        e.target.style.background = 'white';
                        e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.background = '#fafafa';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowParentPassword(!showParentPassword)}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        borderRadius: '4px',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {showParentPassword ? (
                        <EyeSlashIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                      ) : (
                        <EyeIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                      )}
                    </button>
                  </div>
                  <p style={{
                    marginTop: '0.25rem',
                    fontSize: '0.75rem',
                    color: '#6b7280'
                  }}>
                    * 주간 학습 확인 시 학부모 인증에 사용됩니다
                  </p>
                </div>

                {/* 학부모 비밀번호 확인 */}
                {formData.parentPassword && (
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      학부모 비밀번호 확인
                    </label>
                    <div style={{ position: 'relative' }}>
                      <LockClosedIcon style={{
                        position: 'absolute',
                        left: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '20px',
                        height: '20px',
                        color: '#9ca3af',
                        zIndex: 1
                      }} />
                      <input
                        name="confirmParentPassword"
                        type={showConfirmParentPassword ? 'text' : 'password'}
                        minLength={4}
                        placeholder="학부모 비밀번호를 다시 입력하세요"
                        value={formData.confirmParentPassword}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          paddingLeft: '2.5rem',
                          paddingRight: '2.5rem',
                          paddingTop: '0.875rem',
                          paddingBottom: '0.875rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '12px',
                          fontSize: '1rem',
                          transition: 'all 0.3s ease',
                          background: '#fafafa'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#667eea';
                          e.target.style.background = 'white';
                          e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#e5e7eb';
                          e.target.style.background = '#fafafa';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmParentPassword(!showConfirmParentPassword)}
                        style={{
                          position: 'absolute',
                          right: '0.75rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0.25rem',
                          borderRadius: '4px',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        {showConfirmParentPassword ? (
                          <EyeSlashIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                        ) : (
                          <EyeIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {error && (
            <div style={{
              background: '#fee2e2',
              color: '#dc2626',
              padding: '0.75rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
              textAlign: 'center',
              marginTop: '1.5rem',
              border: '1px solid #fecaca'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '1rem',
              background: isLoading ? '#9ca3af' : 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
              marginTop: '1.5rem'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
              }
            }}
          >
            {isLoading ? '가입 중...' : '회원가입'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              이미 계정이 있으시나요?{' '}
              <Link 
                to="/login" 
                style={{
                  color: '#667eea',
                  textDecoration: 'none',
                  fontWeight: '600',
                  transition: 'color 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#764ba2'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#667eea'}
              >
                로그인
              </Link>
            </p>
          </div>
        </form>

        {/* 하단 정보 */}
        <div style={{
          marginTop: '2rem',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
            borderRadius: '12px',
            padding: '1rem',
            border: '1px solid #e2e8f0'
          }}>
            <p style={{
              fontSize: '0.75rem',
              color: '#667eea',
              fontWeight: '600',
              marginBottom: '0.25rem'
            }}>
              🔬 과학의 즐거움을 발견하는 곳
            </p>
            <p style={{
              fontSize: '0.625rem',
              color: '#6b7280',
              lineHeight: '1.4'
            }}>
              중선 • 중등1-3 • 통합과학<br/>
              물리 • 화학 • 생명 • 지구과학
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;