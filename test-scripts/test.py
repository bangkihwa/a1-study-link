#!/usr/bin/env python3
"""샘플 계정 생성 스크립트.

학원 LMS 백엔드가 http://localhost:3001 에서 실행 중이라는 가정 하에
교사/학생/학부모 계정을 순서대로 생성합니다.
학부모 가입은 학생에게 발급된 고유번호(8자리)와 연동 코드(6자리)가
필요하므로, 먼저 학생 계정을 만든 뒤 응답에서 값을 추출해 사용합니다.

사용법:
    python test-scripts/test.py

환경 변수:
    AONE_API_BASE  기본값 'http://localhost:3001/api'
    REQUEST_TIMEOUT 기본값 10 (초)
"""
from __future__ import annotations

import os
import sys
from typing import Any, Dict

import requests


BASE_URL = os.getenv('AONE_API_BASE', 'http://localhost:3001/api')
TIMEOUT = float(os.getenv('REQUEST_TIMEOUT', '10'))


def register(endpoint: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """공통 POST 헬퍼."""
    url = f"{BASE_URL}{endpoint}"
    response = requests.post(url, json=payload, timeout=TIMEOUT)

    if response.status_code == 409:
        raise RuntimeError(f"이미 존재하는 계정입니다: {payload.get('username')}")

    response.raise_for_status()
    data = response.json()
    if not data.get('success'):
        raise RuntimeError(data.get('message') or '요청이 실패했습니다.')
    return data


def create_teacher() -> None:
    print('[1/3] 교사 계정 생성 중...')
    payload = {
        'username': 'teacher',
        'password': 'teacher',
        'name': '선생',
        'email': 'teacher@example.com',
        'phone': '010-0000-0000'
    }
    data = register('/auth/register/teacher', payload)
    status = data.get('data', {}).get('status', 'pending')
    print(f"  → 완료 (승인 상태: {status})")


def create_student() -> Dict[str, Any]:
    print('[2/3] 학생 계정 생성 중...')
    payload = {
        'username': 'student',
        'password': 'student',
        'name': '학생',
        'email': 'student@example.com',
        'phone': '010-1111-1111'
    }
    data = register('/auth/register/student', payload)
    student_info = data.get('data', {})
    student_number = student_info.get('studentNumber')
    if not student_number:
        raise RuntimeError('학생 고유번호를 응답에서 찾을 수 없습니다.')
    print(f"  → 완료 (학생 고유번호: {student_number})")
    return student_info


def resolve_student_code(student_info: Dict[str, Any]) -> str:
    # API에서 연동 코드가 내려오는 경우 그대로 사용
    if student_info.get('studentCode'):
        return str(student_info['studentCode']).strip()

    student_number = student_info.get('studentNumber')
    if not student_number:
        raise RuntimeError('학생 고유번호를 찾을 수 없습니다.')

    # 정책 변경: 연동 코드는 학생 고유번호와 동일
    return student_number.strip()


def create_parent(student_info: Dict[str, Any]) -> None:
    print('[3/3] 학부모 계정 생성 중...')
    student_number = student_info['studentNumber']
    student_code = resolve_student_code(student_info)

    payload = {
        'username': 'parent',
        'password': 'parent',
        'name': '부모',
        'email': 'parent@example.com',
        'phone': '010-2222-2222',
        'studentNumber': student_number,
        'relationship': 'guardian'
    }

    data = register('/auth/register/parent', payload)
    linked = data.get('data', {}).get('linkedStudentNumber')
    print(f"  → 완료 (연동 학생: {linked}, 사용 코드: {student_code})")


def main() -> None:
    try:
        create_teacher()
        student_info = create_student()
        create_parent(student_info)
    except Exception as exc:
        print(f"[오류] {exc}")
        sys.exit(1)

    print('\n모든 계정 생성이 성공적으로 마무리되었습니다.')


if __name__ == '__main__':
    main()
