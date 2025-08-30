import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface ParentDashboardProps {
  user: {
    id: number;
    name: string;
    role: 'parent';
  };
}

const ParentDashboard: React.FC<ParentDashboardProps> = ({ user }) => {
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<any | null>(null);
  const [childData, setChildData] = useState<any | null>(null);

  useEffect(() => {
    const fetchMyChildren = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/parent/my-children', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setChildren(response.data.children);
        if (response.data.children.length > 0) {
          setSelectedChild(response.data.children[0]);
        }
      } catch (error) {
        console.error("Failed to fetch children data:", error);
      }
    };
    fetchMyChildren();
  }, [user.id]);

  useEffect(() => {
    if (selectedChild) {
      const fetchChildData = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(`/api/parent/dashboard/${selectedChild.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setChildData(response.data);
        } catch (error) {
          console.error("Failed to fetch child dashboard data:", error);
        }
      };
      fetchChildData();
    }
  }, [selectedChild]);


  return (
    <div>
      <h1 className="text-2xl font-bold">학부모 대시보드</h1>
      <p>자녀의 학습 현황을 확인하세요, {user.name}님.</p>

      {children.length > 0 ? (
        <select onChange={(e) => setSelectedChild(children.find(c => c.id === parseInt(e.target.value)))}>
          {children.map(child => <option key={child.id} value={child.id}>{child.name}</option>)}
        </select>
      ) : <p>연결된 자녀가 없습니다.</p>}

      {selectedChild && childData && (
        <div className="mt-4">
          <h2 className="text-xl font-bold">{selectedChild.name} 학생 현황</h2>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="card">
                <div className="card-body">
                    <h3 className="card-title">이번 주 학습 시간</h3>
                    <p className="text-2xl font-bold">{childData.summary.weekly_study_time}분</p>
                </div>
            </div>
            <div className="card">
                <div className="card-body">
                    <h3 className="card-title">완료한 강의</h3>
                    <p className="text-2xl font-bold">{childData.summary.completed_lectures} / {childData.summary.total_lectures}</p>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentDashboard;
