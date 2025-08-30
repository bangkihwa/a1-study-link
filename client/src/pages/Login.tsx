import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // 서버 API 호출
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error) {
          setError(data.error);
        } else {
          setError('로그인에 실패했습니다.');
        }
        return;
      }

      // 로그인 성공
      if (data.token && data.user) {
        // 토큰과 사용자 정보 저장
        localStorage.setItem('token', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        localStorage.setItem('isLoggedIn', 'true');
        
        // 역할별 대시보드로 이동
        if (data.user.role === 'admin') {
          navigate('/admin');
        } else if (data.user.role === 'teacher') {
          navigate('/teacher');
        } else if (data.user.role === 'student') {
          navigate('/student');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

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
            fontSize: '2rem',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem'
          }}>
            A1 과학학원
          </h1>
          
          <p style={{
            color: '#6b7280',
            fontSize: '1rem',
            fontWeight: '500'
          }}>
            스터디링크 시스템
          </p>
        </div>

        {/* 로그인 폼 */}
        <form onSubmit={handleSubmit} style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              아이디
            </label>
            <input
              name="username"
              type="text"
              required
              placeholder="아이디를 입력하세요"
              value={formData.username}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
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

          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              비밀번호
            </label>
            <input
              name="password"
              type="password"
              required
              placeholder="비밀번호를 입력하세요"
              value={formData.password}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
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

          {error && (
            <div style={{
              background: '#fee2e2',
              color: '#dc2626',
              padding: '0.75rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
              textAlign: 'center',
              marginBottom: '1.5rem',
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
              marginBottom: '1.5rem'
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
            {isLoading ? '로그인 중...' : '로그인'}
          </button>

          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              계정이 없으시나요?{' '}
              <Link 
                to="/register" 
                style={{
                  color: '#667eea',
                  textDecoration: 'none',
                  fontWeight: '600',
                  transition: 'color 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#764ba2'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#667eea'}
              >
                회원가입
              </Link>
            </p>
          </div>
        </form>


        {/* 하단 정보 */}
        <div style={{
          marginTop: '1.5rem',
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

        {/* 테스트 계정 정보 */}
        <div style={{
          marginTop: '1rem',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
            borderRadius: '8px',
            padding: '1rem',
            border: '1px solid #fde68a'
          }}>
            <p style={{
              fontSize: '0.875rem',
              color: '#92400e',
              fontWeight: '600',
              marginBottom: '0.5rem'
            }}>
              📚 테스트 계정 정보
            </p>
            <div style={{
              fontSize: '0.75rem',
              color: '#78350f',
              lineHeight: '1.6',
              textAlign: 'left'
            }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>🔑 관리자</strong><br/>
                admin / password123
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>👨‍🏫 교사</strong><br/>
                teacher_kim / password123 (물리/통합과학)<br/>
                teacher_lee / password123 (화학/생명과학)<br/>
                teacher_park / password123 (지구과학/통합과학)
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>📖 학생</strong><br/>
                student_hong / password123 (고1)<br/>
                student_kim / password123 (고2)<br/>
                student_park / password123 (중3)
              </div>
              <div>
                <strong>👨‍👩‍👧 학부모</strong><br/>
                parent_hong / password123<br/>
                parent_kim / password123
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;