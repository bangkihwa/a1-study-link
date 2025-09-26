import React, { useMemo, useState } from 'react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { ClassStudent } from '../../types';

interface ClassAssignmentPanelProps {
  students: ClassStudent[];
  selectedStudentIds: number[];
  selectedClassId: number | null;
  disabled?: boolean;
  loading?: boolean;
  onSelectionChange: (nextSelectedIds: number[]) => void;
}

type AssignmentFilter = 'all' | 'current' | 'other' | 'unassigned';

type ClassLookup = {
  id: number;
  name: string;
};

const useStudentLookup = (students: ClassStudent[]): ClassLookup[] => {
  return useMemo(() => {
    const map = new Map<number, string>();
    students.forEach((student) => {
      const ids = student.classIds ?? (student.classId != null ? [student.classId] : []);
      const names = student.classNames ?? (student.className ? [student.className] : []);
      ids.forEach((id, index) => {
        if (!map.has(id)) {
          const label = names[index] ?? names[0] ?? `반 #${id}`;
          map.set(id, label);
        }
      });
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  }, [students]);
};

const filterStudents = (
  students: ClassStudent[],
  filters: {
    assignment: AssignmentFilter;
    classFilter: string;
    search: string;
    selectedClassId: number | null;
    selectedSet: Set<number>;
  }
) => {
  const searchLower = filters.search.trim().toLowerCase();

  return students.filter((student) => {
    const memberships = new Set(
      (student.classIds ?? (student.classId != null ? [student.classId] : []))
        .filter((id): id is number => typeof id === 'number')
    );
    const hasMemberships = memberships.size > 0;
    const inSelection = filters.selectedSet.has(student.id);

    switch (filters.assignment) {
      case 'current':
        if (!inSelection) {
          return false;
        }
        break;
      case 'other':
        if (!hasMemberships) {
          return false;
        }
        if (filters.selectedClassId != null && memberships.has(filters.selectedClassId)) {
          return false;
        }
        break;
      case 'unassigned':
        if (hasMemberships) {
          return false;
        }
        break;
      default:
        break;
    }

    if (filters.classFilter !== 'all') {
      const targetClassId = Number(filters.classFilter);
      if (!Number.isNaN(targetClassId)) {
        if (!memberships.has(targetClassId)) {
          return false;
        }
      }
    }

    if (searchLower) {
      const name = student.name.toLowerCase();
      const email = (student.email ?? '').toLowerCase();
      if (!name.includes(searchLower) && !email.includes(searchLower)) {
        return false;
      }
    }

    return true;
  });
};

export const ClassAssignmentPanel: React.FC<ClassAssignmentPanelProps> = ({
  students,
  selectedStudentIds,
  selectedClassId,
  disabled = false,
  loading = false,
  onSelectionChange
}) => {
  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentFilter>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  const selectedSet = useMemo(() => new Set(selectedStudentIds), [selectedStudentIds]);
  const classLookups = useStudentLookup(students);

  const filteredStudents = useMemo(() => filterStudents(students, {
    assignment: assignmentFilter,
    classFilter,
    search,
    selectedClassId: selectedClassId ?? null,
    selectedSet
  }), [students, assignmentFilter, classFilter, search, selectedClassId, selectedSet]);

  const totalCount = students.length;
  const filteredCount = filteredStudents.length;
  const selectedCount = selectedStudentIds.length;

  const handleToggle = (studentId: number) => {
    if (disabled) {
      return;
    }
    if (selectedSet.has(studentId)) {
      onSelectionChange(selectedStudentIds.filter((id) => id !== studentId));
    } else {
      onSelectionChange([...selectedStudentIds, studentId]);
    }
  };

  const handleSelectFiltered = () => {
    if (disabled) {
      return;
    }
    const next = new Set(selectedSet);
    filteredStudents.forEach((student) => next.add(student.id));
    onSelectionChange(Array.from(next));
  };

  const handleClearSelection = () => {
    if (disabled) {
      return;
    }
    onSelectionChange([]);
  };

  const renderRow = ({ index, style }: ListChildComponentProps) => {
    const student = filteredStudents[index];
    const memberships = student.classNames ?? [];
    const isSelected = selectedSet.has(student.id);

    return (
      <div
        style={style}
        className={`flex items-center gap-3 px-2 border-b border-gray-100 ${isSelected ? 'bg-blue-50' : 'bg-white'}`}
        key={student.id}
      >
        <input
          type="checkbox"
          checked={isSelected}
          disabled={disabled}
          onChange={() => handleToggle(student.id)}
          className="h-4 w-4"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{student.name}</p>
          <p className="text-xs text-gray-500 truncate">
            {student.email || '이메일 없음'}
            {memberships.length > 0 && (
              <span className="ml-2 text-[11px] text-gray-400">{memberships.join(', ')}</span>
            )}
          </p>
        </div>
      </div>
    );
  };

  const disabledMessage = disabled
    ? '활성 과목을 먼저 생성하고 반을 선택하면 학생을 배정할 수 있습니다.'
    : null;

  return (
    <section className="bg-white rounded-lg shadow p-4 md:p-6 flex flex-col h-full">
      <header className="space-y-2 mb-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold">학생 배정 관리</h3>
            <p className="text-sm text-gray-500">필터와 검색을 활용해 빠르게 학생을 배정하세요.</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">선택: {selectedCount}명</p>
            <p className="text-xs text-gray-400">필터: {filteredCount}명 · 전체: {totalCount}명</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex rounded-md shadow-sm border border-gray-200 overflow-hidden">
            {(
              [
                { key: 'all', label: '전체' },
                { key: 'current', label: '이 반' },
                { key: 'other', label: '다른 반' },
                { key: 'unassigned', label: '미배정' }
              ] as Array<{ key: AssignmentFilter; label: string }>
            ).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setAssignmentFilter(key)}
                className={`px-3 py-1 text-xs font-medium ${assignmentFilter === key ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-1 text-xs border border-gray-200 rounded-md"
          >
            <option value="all">전체 반</option>
            {classLookups.map((cls) => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이름 또는 이메일 검색"
            className="flex-1 min-w-[160px] px-3 py-1 text-sm border border-gray-200 rounded-md"
          />
        </div>
      </header>

      <div className="flex-1 min-h-[240px] relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">
            학생 목록을 불러오는 중...
          </div>
        ) : disabledMessage ? (
          <div className="absolute inset-0 flex items-center justify-center text-center text-sm text-gray-500 px-6">
            {disabledMessage}
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">
            조건에 맞는 학생이 없습니다.
          </div>
        ) : (
          <AutoSizer>
            {({ height, width }: { height: number; width: number }) => (
              <List
                height={Math.max(height, 200)}
                itemCount={filteredStudents.length}
                itemSize={64}
                width={width}
                className="border border-gray-100 rounded-md overflow-hidden"
              >
                {renderRow}
              </List>
            )}
          </AutoSizer>
        )}
      </div>

      <footer className="mt-4 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={handleSelectFiltered}
          disabled={disabled || loading || filteredCount === 0}
          className="px-3 py-2 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50"
        >
          필터 결과 전체 선택
        </button>
        <button
          type="button"
          onClick={handleClearSelection}
          disabled={disabled || loading || selectedCount === 0}
          className="px-3 py-2 text-xs border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          전체 해제
        </button>
      </footer>
    </section>
  );
};

export default ClassAssignmentPanel;
