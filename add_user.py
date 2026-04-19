#!/usr/bin/env python3
import sqlite3
import sys
from pathlib import Path

import bcrypt

DB_PATH = Path('/root/LicitIA/server/data/licitia.db')

SCHEMA = '''
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  name          TEXT,
  is_admin      INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);
'''


def main() -> int:
    if len(sys.argv) < 3 or len(sys.argv) > 5:
        print('Uso: python3 add_user.py email@ejemplo.com contraseña [nombre] [--admin]')
        return 1

    email = sys.argv[1].strip()
    password = sys.argv[2]
    extra = sys.argv[3:]

    is_admin = '--admin' in extra
    extra = [x for x in extra if x != '--admin']
    name = extra[0].strip() if extra else None

    if '@' not in email:
        print('Error: email inválido')
        return 1

    if len(password) < 6:
        print('Error: la contraseña debe tener al menos 6 caracteres')
        return 1

    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute('PRAGMA foreign_keys = ON')
    conn.executescript(SCHEMA)

    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    existing = conn.execute('SELECT id, is_admin FROM users WHERE email = ?', (email,)).fetchone()
    if existing:
        conn.execute(
            'UPDATE users SET password_hash = ?, name = COALESCE(?, name), is_admin = ? WHERE email = ?',
            (password_hash, name, 1 if is_admin else existing[1], email),
        )
        conn.commit()
        conn.close()
        print(f'Usuario actualizado: {email} | admin={"sí" if (is_admin or existing[1]) else "no"}')
        return 0

    conn.execute(
        'INSERT INTO users (email, password_hash, name, is_admin) VALUES (?, ?, ?, ?)',
        (email, password_hash, name, 1 if is_admin else 0),
    )
    conn.commit()
    conn.close()
    print(f'Usuario creado: {email} | admin={"sí" if is_admin else "no"}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
