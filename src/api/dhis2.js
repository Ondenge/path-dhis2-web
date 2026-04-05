// URL BUILDER
export function d2url(path, params = {}) {
  const qs = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return qs ? `${path}?${qs}` : path;
}

// BASE FETCH
export async function d2fetch(path, token, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      Authorization: `Basic ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (res.status === 401) throw new Error('Session expired. Please sign in again.');
  if (res.status === 403) throw new Error('You do not have permission for this action.');
  if (!res.ok) {
    let msg = `DHIS2 error ${res.status}`;
    try { const j = await res.json(); msg = j.message || j.httpStatusCode || msg; } catch {}
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
}

// AUTH
export async function fetchMe(token) {
  return d2fetch(
    d2url('/api/me.json', {
      fields: 'id,username,displayName,email,organisationUnits[id,name,level,path],userRoles[id,name],authorities',
    }),
    token
  );
}

// PROGRAMS
export async function fetchPrograms(token) {
  const data = await d2fetch(
    d2url('/api/programs.json', {
      fields: [
        'id,name,shortName,programType,displayName',
        'organisationUnits[id]',
        'trackedEntityType[id]',
        'programTrackedEntityAttributes[mandatory,searchable,trackedEntityAttribute[id,name,valueType,unique,optionSet[options[code,name]]]]',
        'programStages[id,name,sortOrder,repeatable,programStageDataElements[compulsory,dataElement[id,name,valueType,optionSet[options[code,name]]]]]',
      ].join(','),
      paging: 'false',
    }),
    token
  );
  return data.programs || [];
}

// ORG UNITS
export async function fetchUserOrgUnitRoots(token) {
  // Returns the user's assigned root org units
  const me = await d2fetch(
    d2url('/api/me.json', { fields: 'organisationUnits[id,name,level,path]' }),
    token
  );
  const roots = me.organisationUnits || [];

  // Fetch child count for each root
  const withChildInfo = await Promise.all(roots.map(async (ou) => {
    const data = await d2fetch(
      d2url('/api/organisationUnits.json', {
        filter: `parent.id:eq:${ou.id}`,
        fields: 'id',
        pageSize: '1',
      }),
      token
    );
    return { ...ou, hasChildren: (data.organisationUnits?.length || 0) > 0 };
  }));

  return withChildInfo;
}

export async function fetchOrgUnitChildren(token, parentId) {
  if (!parentId) return [];
  const data = await d2fetch(
    d2url('/api/organisationUnits.json', {
      filter: `parent.id:eq:${parentId}`,
      fields: 'id,name,level,path,parent[id]',
      order: 'name:asc',
      paging: 'false',
    }),
    token
  );
  // mark each child with hasChildren by checking for grandchildren
  const children = data.organisationUnits || [];
  if (children.length === 0) return [];

  const withChildInfo = await Promise.all(children.map(async (ou) => {
    const gc = await d2fetch(
      d2url('/api/organisationUnits.json', {
        filter: `parent.id:eq:${ou.id}`,
        fields: 'id',
        pageSize: '1',
      }),
      token
    );
    return { ...ou, hasChildren: (gc.organisationUnits?.length || 0) > 0 };
  }));

  return withChildInfo;
}

// Search org units by name within the user's permissions
export async function searchOrgUnits(token, query) {
  if (!query || query.length < 2) return [];
  const data = await d2fetch(
    d2url('/api/organisationUnits.json', {
      filter: `name:ilike:${query}`,
      fields: 'id,name,level,path,parent[id,name]',
      pageSize: '20',
      withinUserHierarchy: 'true',
    }),
    token
  );
  return data.organisationUnits || [];
}

// TEI (TRACKER)
export async function fetchTEIs(token, { programId, orgUnitId, page = 1, pageSize = 20 }) {
  const params = new URLSearchParams({
    program: programId,
    ouMode: orgUnitId ? 'DESCENDANTS' : 'ACCESSIBLE',
    fields: 'trackedEntityInstance,trackedEntityType,orgUnit,orgUnitName,inactive,created,lastUpdated,attributes[attribute,value],enrollments[enrollment,program,status,enrollmentDate,events[event,programStage,eventDate,status,dataValues[dataElement,value]]]',
    page,
    pageSize,
    order: 'created:desc',
    totalPages: 'true',
  });
  if (orgUnitId) params.set('ou', orgUnitId);
  const data = await d2fetch(`/api/trackedEntityInstances.json?${params}`, token);
  return {
    teis: data.trackedEntityInstances || [],
    total: data.pager?.total || 0,
    pageCount: data.pager?.pageCount || 1,
  };
}

export async function fetchTEI(token, teiId) {
  return d2fetch(
    d2url(`/api/trackedEntityInstances/${teiId}.json`, {
      fields: 'trackedEntityInstance,trackedEntityType,orgUnit,inactive,attributes[attribute,value],enrollments[enrollment,program,status,enrollmentDate,incidentDate,events[event,programStage,eventDate,status,dataValues[dataElement,value]]]',
    }),
    token
  );
}

export async function createTEI(token, payload) {
  return d2fetch('/api/trackedEntityInstances', token, { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateTEI(token, teiId, payload) {
  return d2fetch(`/api/trackedEntityInstances/${teiId}`, token, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function deleteTEI(token, teiId) {
  return d2fetch(`/api/trackedEntityInstances/${teiId}`, token, { method: 'DELETE' });
}

// ENROLLMENTS
export async function createEnrollment(token, payload) {
  return d2fetch('/api/enrollments', token, { method: 'POST', body: JSON.stringify(payload) });
}

// EVENTS
export async function fetchEvents(token, { programId, orgUnitId, page = 1, pageSize = 20 }) {
  const params = new URLSearchParams({
    program: programId,
    fields: 'event,orgUnit,orgUnitName,eventDate,status,storedBy,lastUpdated,dataValues[dataElement,value]',
    pageSize,
    page,
    order: 'created:desc',
    totalPages: 'true',
  });
  if (orgUnitId) {
    params.set('orgUnit', orgUnitId);
    params.set('ouMode', 'DESCENDANTS');
  } else {
    params.set('ouMode', 'ACCESSIBLE');
  }
  const data = await d2fetch(`/api/events.json?${params}`, token);
  return {
    events: data.events || [],
    total: data.pager?.total || 0,
    pageCount: data.pager?.pageCount || 1,
  };
}

export async function createEvent(token, payload) {
  return d2fetch('/api/events', token, { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateEvent(token, eventId, payload) {
  return d2fetch(`/api/events/${eventId}`, token, { method: 'PUT', body: JSON.stringify({ ...payload, event: eventId }) });
}

export async function deleteEvent(token, eventId) {
  return d2fetch(`/api/events/${eventId}`, token, { method: 'DELETE' });
}
