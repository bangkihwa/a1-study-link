#!/usr/bin/env python3
"""Sample account creation script for A-One Study LMS.

이 스크립트는 기본 관리자 계정(admin/admin)으로 로그인한 뒤,
관리자 API를 이용해 교사와 학생 계정을 생성합니다.
서버가 http://localhost:3001 에서 실행 중이어야 합니다.

usage:
    python scripts/create_sample_accounts.py
"""
import os
import sys
from dataclasses import dataclass
from typing import List

import requests

BASE_URL = os.getenv('AONE_API_BASE', 'http://localhost:3001/api')
ADMIN_USERNAME = os.getenv('AONE_ADMIN_USERNAME', 'admin')
ADMIN_PASSWORD = os.getenv('AONE_ADMIN_PASSWORD', 'admin')


@dataclass
class Account:
    role: str
    name: str
    username: str
    password: str


TEACHER_ACCOUNTS: List[Account] = [
    Account(role='teacher', name='선생_1', username='teacher_1', password='teacher_1'),
    Account(role='teacher', name='선생_2', username='teacher_2', password='teacher_2'),
    Account(role='teacher', name='선생_3', username='teacher_3', password='teacher_3'),
]

STUDENT_ACCOUNTS: List[Account] = [
    Account(role='student', name='학생_1', username='student_1', password='student_1'),
    Account(role='student', name='학생_2', username='student_2', password='student_2'),
    Account(role='student', name='학생_3', username='student_3', password='student_3'),
]


def login_admin(session: requests.Session) -> None:
    resp = session.post(
        f"{BASE_URL}/auth/login",
        json={'username': ADMIN_USERNAME, 'password': ADMIN_PASSWORD},
        timeout=10
    )
    resp.raise_for_status()
    data = resp.json()
    if not data.get('success'):  # pragma: no cover - defensive
        raise RuntimeError(f"Admin login failed: {data.get('message')}")
    token = data.get('data', {}).get('token')
    if not token:
        raise RuntimeError('Admin login response missing token')
    session.headers.update({'Authorization': f'Bearer {token}'})


def create_account(session: requests.Session, account: Account) -> None:
    payload = {
        'username': account.username,
        'password': account.password,
        'name': account.name,
        'role': account.role,
        'isApproved': True,
    }

    if account.role == 'parent':  # pragma: no cover - not used but kept for completeness
        raise NotImplementedError('Parent account creation is not supported in this script.')

    resp = session.post(f"{BASE_URL}/admin/users", json=payload, timeout=10)
    if resp.status_code == 409:
        print(f"[SKIP] {account.username} already exists")
        return
    resp.raise_for_status()
    data = resp.json()
    if data.get('success'):
        print(f"[OK] Created {account.role} account: {account.username}")
    else:  # pragma: no cover - defensive
        raise RuntimeError(f"Failed to create {account.username}: {data.get('message')}")


def main() -> None:
    session = requests.Session()
    try:
        login_admin(session)
    except Exception as exc:  # pragma: no cover - script entry point
        print(f"Admin login failed: {exc}")
        sys.exit(1)

    for account in TEACHER_ACCOUNTS + STUDENT_ACCOUNTS:
        try:
            create_account(session, account)
        except requests.HTTPError as http_err:
            print(f"[ERROR] {account.username}: HTTP {http_err.response.status_code} {http_err.response.text}")
        except Exception as exc:  # pragma: no cover - runtime errors
            print(f"[ERROR] {account.username}: {exc}")


if __name__ == '__main__':  # pragma: no cover
    main()
