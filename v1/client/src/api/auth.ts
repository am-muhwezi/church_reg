import { del, get, post } from './client'
import type { Admin, TokenResponse } from './types'

export async function loginAdmin(email: string, password: string): Promise<TokenResponse> {
  return post<TokenResponse>('/auth/login', { email, password })
}

export async function setupInitialAdmin(data: {
  name: string
  email: string
  password: string
}): Promise<TokenResponse> {
  return post<TokenResponse>('/auth/setup', data)
}

export async function listAdmins(): Promise<Admin[]> {
  return get<Admin[]>('/auth/admins')
}

export async function createAdmin(data: {
  name: string
  email: string
  password: string
  is_super_admin: boolean
}): Promise<Admin> {
  return post<Admin>('/auth/admins', data)
}

export async function deleteAdmin(id: string): Promise<void> {
  return del(`/auth/admins/${id}`)
}
