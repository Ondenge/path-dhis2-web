import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/dhis2';

export function usePrograms() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['programs'],
    queryFn: () => api.fetchPrograms(session.token),
    staleTime: 5 * 60 * 1000,
    enabled: !!session,
  });
}

export function useUserOrgUnitRoots() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['orgUnitRoots'],
    queryFn: () => api.fetchUserOrgUnitRoots(session.token),
    staleTime: 10 * 60 * 1000,
    enabled: !!session,
  });
}

export function useOrgUnitChildren(parentId) {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['orgUnitChildren', parentId],
    queryFn: () => api.fetchOrgUnitChildren(session.token, parentId),
    enabled: !!session && !!parentId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useOrgUnitSearch(query) {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['orgUnitSearch', query],
    queryFn: () => api.searchOrgUnits(session.token, query),
    enabled: !!session && query?.length >= 2,
    staleTime: 30 * 1000,
  });
}

export function useTEIs({ programId, orgUnitId, page, pageSize }) {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['teis', programId, orgUnitId, page, pageSize],
    queryFn: () => api.fetchTEIs(session.token, { programId, orgUnitId, page, pageSize }),
    enabled: !!session && !!programId,
    keepPreviousData: true,
  });
}

export function useTEI(teiId) {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['tei', teiId],
    queryFn: () => api.fetchTEI(session.token, teiId),
    enabled: !!session && !!teiId,
  });
}

export function useCreateTEI() {
  const { session } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.createTEI(session.token, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teis'] }),
  });
}

export function useUpdateTEI() {
  const { session } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ teiId, payload }) => api.updateTEI(session.token, teiId, payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['teis'] });
      qc.invalidateQueries({ queryKey: ['tei', vars.teiId] });
    },
  });
}

export function useDeleteTEI() {
  const { session } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (teiId) => api.deleteTEI(session.token, teiId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teis'] }),
  });
}

export function useCreateEnrollment() {
  const { session } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.createEnrollment(session.token, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teis'] });
      qc.invalidateQueries({ queryKey: ['tei'] });
    },
  });
}

export function useEvents({ programId, orgUnitId, page, pageSize }) {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['events', programId, orgUnitId, page, pageSize],
    queryFn: () => api.fetchEvents(session.token, { programId, orgUnitId, page, pageSize }),
    enabled: !!session && !!programId,
    keepPreviousData: true,
  });
}

export function useCreateEvent() {
  const { session } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.createEvent(session.token, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}

export function useUpdateEvent() {
  const { session } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, payload }) => api.updateEvent(session.token, eventId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}

export function useDeleteEvent() {
  const { session } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (eventId) => api.deleteEvent(session.token, eventId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}
