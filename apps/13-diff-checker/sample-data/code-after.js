// ユーザー認証処理（リファクタリング後）
import { pool } from './database.js'
import bcrypt from 'bcrypt'
import { SignJWT } from 'jose'
import { AuthenticationError, InactiveUserError } from './errors.js'

/** @typedef {{ id: number, username: string, email: string, role: string }} UserPayload */

/**
 * ユーザー名とパスワードで認証し、JWTトークンを発行する
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{ token: string, user: UserPayload }>}
 */
export async function authenticateUser(username, password) {
  if (!username?.trim() || !password) {
    throw new AuthenticationError('ユーザー名とパスワードは必須です')
  }

  const [rows] = await pool.execute(
    'SELECT id, username, email, role, password_hash, is_active FROM users WHERE username = ?',
    [username]
  )

  if (rows.length === 0) {
    throw new AuthenticationError('ユーザー名またはパスワードが正しくありません')
  }

  const user = rows[0]

  const isPasswordValid = await bcrypt.compare(password, user.password_hash)
  if (!isPasswordValid) {
    throw new AuthenticationError('ユーザー名またはパスワードが正しくありません')
  }

  if (!user.is_active) {
    throw new InactiveUserError('このアカウントは無効化されています')
  }

  await pool.execute(
    'UPDATE users SET last_login = NOW() WHERE id = ?',
    [user.id]
  )

  const token = await new SignJWT({ sub: user.id, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(process.env.JWT_SECRET))

  const userPayload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  }

  return { token, user: userPayload }
}
