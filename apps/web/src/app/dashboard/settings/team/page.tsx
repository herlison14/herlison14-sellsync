'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  useTeamMembers, useInvitations,
  useInviteMember, useCancelInvitation,
  useUpdateMemberRole, useRemoveMember,
} from '@/hooks/use-team'

const ROLE_LABEL: Record<string, string> = {
  OWNER: 'Proprietário', ADMIN: 'Administrador', OPERATOR: 'Operador',
}

const ROLE_COLOR: Record<string, string> = {
  OWNER: 'bg-purple-100 text-purple-700',
  ADMIN: 'bg-blue-100 text-blue-700',
  OPERATOR: 'bg-gray-100 text-gray-600',
}

export default function TeamPage() {
  const { data: members, isLoading: loadingMembers } = useTeamMembers()
  const { data: invitations, isLoading: loadingInvitations } = useInvitations()
  const invite = useInviteMember()
  const cancelInvitation = useCancelInvitation()
  const updateRole = useUpdateMemberRole()
  const removeMember = useRemoveMember()

  const [inviteForm, setInviteForm] = useState({ email: '', role: 'OPERATOR' as 'ADMIN' | 'OPERATOR' })
  const [inviteError, setInviteError] = useState('')
  const [inviteUrl, setInviteUrl] = useState('')

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviteError('')
    setInviteUrl('')
    try {
      const res = await invite.mutateAsync(inviteForm)
      setInviteUrl(res.inviteUrl)
      setInviteForm({ email: '', role: 'OPERATOR' })
    } catch (err: any) {
      setInviteError(err?.response?.data?.error ?? 'Erro ao enviar convite')
    }
  }

  return (
    <div className="space-y-6 p-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/settings" className="text-sm text-gray-400 hover:text-gray-600">← Configurações</Link>
        <h1 className="text-2xl font-bold">Equipe</h1>
      </div>

      {/* Members list */}
      <div className="rounded-lg border bg-white overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-700">Membros ativos</h2>
        </div>
        {loadingMembers ? (
          <div className="p-5 text-sm text-gray-400 animate-pulse">Carregando...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Nome', 'E-mail', 'Perfil', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(members ?? []).filter((m) => m.isActive).map((m) => (
                <tr key={m.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{m.name}</td>
                  <td className="px-4 py-3 text-gray-500">{m.email}</td>
                  <td className="px-4 py-3">
                    {m.role === 'OWNER' ? (
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ROLE_COLOR[m.role]}`}>
                        {ROLE_LABEL[m.role]}
                      </span>
                    ) : (
                      <select
                        value={m.role}
                        onChange={(e) => updateRole.mutate({ id: m.id, role: e.target.value })}
                        className="rounded border text-xs px-2 py-1 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
                      >
                        <option value="ADMIN">Administrador</option>
                        <option value="OPERATOR">Operador</option>
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {m.role !== 'OWNER' && (
                      <button
                        onClick={() => { if (confirm(`Remover ${m.name} da equipe?`)) removeMember.mutate(m.id) }}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Remover
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pending invitations */}
      {(invitations ?? []).length > 0 && (
        <div className="rounded-lg border bg-white overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="font-semibold text-gray-700">Convites pendentes</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['E-mail', 'Perfil', 'Expira em', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(invitations ?? []).map((inv) => {
                const expiresIn = Math.ceil((new Date(inv.expiresAt).getTime() - Date.now()) / 86_400_000)
                return (
                  <tr key={inv.id} className="border-b last:border-0">
                    <td className="px-4 py-3 text-gray-600">{inv.email}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ROLE_COLOR[inv.role]}`}>
                        {ROLE_LABEL[inv.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{expiresIn}d</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => cancelInvitation.mutate(inv.id)}
                        className="text-xs text-gray-400 hover:text-red-500"
                      >
                        Cancelar
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite form */}
      <div className="rounded-lg border bg-white p-5 space-y-4">
        <h2 className="font-semibold text-gray-700">Convidar membro</h2>
        <p className="text-sm text-gray-500">
          O convidado receberá um link para criar sua conta. O link expira em 7 dias.
        </p>

        <form onSubmit={handleInvite} className="flex gap-3 flex-wrap items-end">
          <div className="flex-1 min-w-48">
            <label className="mb-1 block text-xs font-medium text-gray-600">E-mail</label>
            <input
              type="email" required
              value={inviteForm.email}
              onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="colega@empresa.com"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Perfil</label>
            <select
              value={inviteForm.role}
              onChange={(e) => setInviteForm((f) => ({ ...f, role: e.target.value as 'ADMIN' | 'OPERATOR' }))}
              className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ADMIN">Administrador</option>
              <option value="OPERATOR">Operador</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={invite.isPending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {invite.isPending ? 'Enviando...' : 'Enviar convite'}
          </button>
        </form>

        {inviteError && (
          <p className="text-sm text-red-600">{inviteError}</p>
        )}

        {inviteUrl && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-3 space-y-1">
            <p className="text-sm font-semibold text-green-700">Convite criado!</p>
            <p className="text-xs text-green-600">
              Compartilhe este link com o convidado (válido por 7 dias):
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-white border border-green-200 px-2 py-1 text-xs break-all">
                {inviteUrl}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(inviteUrl)}
                className="text-xs text-green-700 font-semibold hover:underline whitespace-nowrap"
              >
                Copiar
              </button>
            </div>
          </div>
        )}

        {/* Role descriptions */}
        <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500 space-y-1 border">
          <p><strong>Proprietário:</strong> Acesso total, não pode ser removido.</p>
          <p><strong>Administrador:</strong> Pode gerenciar produtos, pedidos, estoque, integrações e convidar membros.</p>
          <p><strong>Operador:</strong> Pode gerenciar produtos, pedidos e estoque. Não pode alterar integrações ou configurações.</p>
        </div>
      </div>
    </div>
  )
}
