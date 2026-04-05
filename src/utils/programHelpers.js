// PROGRAM TYPE
export const PROGRAM_TYPES = {
  WITH_REGISTRATION: 'Tracker',       // TEI + Enrollment + Events
  WITHOUT_REGISTRATION: 'Event',      // Anonymous events only
};

export function isTracker(program) {
  return program?.programType === 'WITH_REGISTRATION';
}

// ATTRIBUTES / DATA ELEMENTS
export function getTrackerAttributes(program) {
  return (program?.programTrackedEntityAttributes || []).map(ptea => ({
    ...ptea.trackedEntityAttribute,
    mandatory: ptea.mandatory,
    searchable: ptea.searchable,
  }));
}

export function getStageDataElements(stage) {
  return (stage?.programStageDataElements || []).map(psde => ({
    ...psde.dataElement,
    compulsory: psde.compulsory,
  }));
}

// VALUE DISPLAY
export function getDisplayValue(field, rawValue) {
  if (rawValue === undefined || rawValue === null || rawValue === '') return '—';
  if (field?.optionSet?.options?.length) {
    const opt = field.optionSet.options.find(o => o.code === rawValue);
    return opt?.name || rawValue;
  }
  if (field?.valueType === 'BOOLEAN') return rawValue === 'true' ? 'Yes' : rawValue === 'false' ? 'No' : rawValue;
  if (field?.valueType === 'DATE') {
    try { return new Date(rawValue).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' }); } catch { return rawValue; }
  }
  return rawValue;
}

// INPUT TYPE
export function getInputType(valueType) {
  switch (valueType) {
    case 'NUMBER': case 'INTEGER': case 'INTEGER_POSITIVE':
    case 'INTEGER_ZERO_OR_POSITIVE': case 'INTEGER_NEGATIVE': return 'number';
    case 'DATE': return 'date';
    case 'DATETIME': return 'datetime-local';
    case 'BOOLEAN': return 'boolean';
    case 'TRUE_ONLY': return 'trueonly';
    case 'LONG_TEXT': return 'textarea';
    case 'EMAIL': return 'email';
    case 'PHONE_NUMBER': return 'tel';
    default: return 'text';
  }
}

// ORG UNIT HELPERS
export function filterOrgUnitsForProgram(program, userSubtree) {
  if (!program?.organisationUnits?.length) return userSubtree;
  const ids = new Set(program.organisationUnits.map(o => o.id));
  return userSubtree.filter(o => ids.has(o.id));
}

export function buildOrgUnitTree(flatList) {
  const map = {};
  flatList.forEach(ou => { map[ou.id] = { ...ou, children: [] }; });
  const roots = [];
  flatList.forEach(ou => {
    if (ou.parent?.id && map[ou.parent.id]) {
      map[ou.parent.id].children.push(map[ou.id]);
    } else {
      roots.push(map[ou.id]);
    }
  });
  const sort = nodes => nodes.sort((a, b) => a.name.localeCompare(b.name)).map(n => ({ ...n, children: sort(n.children) }));
  return sort(roots);
}

// DATE UTILS
export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function fmtDate(str) {
  if (!str) return '—';
  try { return new Date(str).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' }); } catch { return str; }
}
