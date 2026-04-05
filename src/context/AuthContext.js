import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function derivePermissions(authorities = []) {
  const has = (...auths) => authorities.includes('ALL') || auths.some(a => authorities.includes(a));
  return {
    canAdd:    has('F_PROGRAM_ENROLLMENT', 'F_TRACKED_ENTITY_INSTANCE_ADD'),
    canView:   has('F_VIEW_EVENT_ANALYTICS', 'F_PROGRAM_ENROLLMENT', 'F_EVENT_MAINTENANCE_ALL', 'F_TRACKED_ENTITY_INSTANCE_SEARCH'),
    canEdit:   has('F_EDIT_MY_DATAVALUES', 'F_EVENT_MAINTENANCE_ALL', 'F_UNCOMPLETE_EVENT', 'F_TRACKED_ENTITY_INSTANCE_CHANGE'),
    canDelete: has('F_DELETE_EVENT', 'F_EVENT_MAINTENANCE_ALL', 'F_TRACKED_ENTITY_INSTANCE_DELETE'),
    canEnroll: has('F_PROGRAM_ENROLLMENT'),
    isSuper:   authorities.includes('ALL'),
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);

  const login = (baseUrl, token, me) => {
    const perms = derivePermissions(me.authorities || []);
    setSession({ baseUrl, token, me, perms });
  };

  const logout = () => setSession(null);

  return (
    <AuthContext.Provider value={{ session, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
