import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface TeamMember {
  id: string
  name: string
  email: string
  role: 'OWNER' | 'ADMIN' | 'OPERATOR'
  isActive: boolean
  createdAt: string
}

export interface Invitation {
  id: string
  email: string
  role: 'ADMIN' | 'OPERATOR'
  status: string
  expiresAt: string
  createdAt: string
}

export function useTeamMembers() {
  return useQuery<TeamMember[]>({
    queryKey: ['team', 'members'],
    queryFn: async () => (await api.get('/team/members')).data,
  })
}

export function useInvitations() {
  return useQuery<Invitation[]>({
    queryKey: ['team', 'invitations'],
    queryFn: async () => (await api.get('/team/invitations')).data,
  })
}

export function useInviteMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { email: string; role: 'ADMIN' | 'OPERATOR' }) =>
      (await api.post('/team/invitations', data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team'] }),
  })
}

export function useCancelInvitation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/team/invitations/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team', 'invitations'] }),
  })
}

export function useUpdateMemberRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) =>
      (await api.patch(`/team/members/${id}`, { role })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team', 'members'] }),
  })
}

export function useRemoveMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/team/members/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team', 'members'] }),
  })
}
