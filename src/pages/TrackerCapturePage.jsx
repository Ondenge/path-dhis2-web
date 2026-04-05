import React, { useState, useCallback } from 'react';
import {
  Box, Button, Typography, Alert, Paper, Tabs, Tab,
  CircularProgress, Chip, Tooltip, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, Stepper,
  Step, StepLabel, Accordion, AccordionSummary, AccordionDetails,
  Divider, Badge
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EventNoteIcon from '@mui/icons-material/EventNote';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAuth } from '../context/AuthContext';
import {
  useTEIs, useTEI, useCreateTEI, useUpdateTEI, useDeleteTEI, useCreateEnrollment,
  useCreateEvent, useUpdateEvent
} from '../hooks/usePrograms';
import DynamicField from '../components/DynamicField';
import { getTrackerAttributes, getStageDataElements, today, fmtDate, getDisplayValue } from '../utils/programHelpers';

// TEI CREATE / EDIT FORM
function TEIForm({ program, orgUnit, editTEI, onSuccess, onCancel }) {
  const { session } = useAuth();
  const attributes = getTrackerAttributes(program);

  const initVals = () => {
    if (!editTEI) return {};
    return Object.fromEntries((editTEI.attributes || []).map(a => [a.attribute, a.value]));
  };

  const [vals, setVals] = useState(initVals);
  const [enrollmentDate, setEnrollmentDate] = useState(today());
  const [error, setError] = useState('');

  const createTEI = useCreateTEI();
  const updateTEI = useUpdateTEI();
  const createEnr = useCreateEnrollment();
  const isEdit = !!editTEI;
  const isLoading = createTEI.isPending || updateTEI.isPending;

  const handleChange = useCallback((id, v) => setVals(p => ({ ...p, [id]: v })), []);

  async function handleSubmit(e) {
    e.preventDefault(); setError('');
    try {
      const attrPayload = Object.entries(vals)
        .filter(([, v]) => v !== '' && v != null)
        .map(([attribute, value]) => ({ attribute, value: String(value) }));

      if (isEdit) {
        await updateTEI.mutateAsync({
          teiId: editTEI.trackedEntityInstance,
          payload: { ...editTEI, attributes: attrPayload },
        });
        onSuccess('Record updated.', editTEI.trackedEntityInstance);
      } else {
        const res = await createTEI.mutateAsync({
          trackedEntityType: program.trackedEntityType?.id || 'nEenWmSyUEp',
          orgUnit: orgUnit.id,
          attributes: attrPayload,
        });
        const teiId = res?.response?.importSummaries?.[0]?.reference || res?.trackedEntityInstance;
        // Auto-enroll
        if (teiId) {
          await createEnr.mutateAsync({
            trackedEntityInstance: teiId,
            program: program.id,
            orgUnit: orgUnit.id,
            enrollmentDate,
            incidentDate: enrollmentDate,
            status: 'ACTIVE',
          });
        }
        onSuccess('Record created and enrolled.', teiId);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!isEdit && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, color: '#64748B', textTransform: 'uppercase', letterSpacing: .5, fontSize: 11 }}>
            Enrollment
          </Typography>
          <DynamicField
            field={{ id: '__enrollDate', name: 'Enrollment Date', valueType: 'DATE', compulsory: true }}
            value={enrollmentDate} onChange={(_, v) => setEnrollmentDate(v)}
          />
        </Box>
      )}

      <Typography variant="subtitle2" sx={{ mb: 1.5, color: '#64748B', textTransform: 'uppercase', letterSpacing: .5, fontSize: 11 }}>
        Attributes
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
        {attributes.map(attr => (
          <DynamicField key={attr.id} field={attr} value={vals[attr.id] || ''} onChange={handleChange} />
        ))}
      </Box>

      <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button variant="outlined" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={isLoading}
          sx={{ bgcolor: '#028090', '&:hover': { bgcolor: '#026B79' } }}>
          {isLoading ? <CircularProgress size={18} color="inherit" /> : isEdit ? 'Save Changes' : 'Register & Enroll'}
        </Button>
      </Box>
    </Box>
  );
}

// EVENT CAPTURE FOR A STAGE
function StageEventForm({ program, stage, enrollment, teiId, orgUnit, editEvent, onSuccess, onCancel }) {
  const { session } = useAuth();
  const des = getStageDataElements(stage);
  const initVals = () => editEvent ? Object.fromEntries((editEvent.dataValues || []).map(d => [d.dataElement, d.value])) : {};
  const [vals, setVals] = useState(initVals);
  const [eventDate, setEventDate] = useState(editEvent?.eventDate?.slice(0, 10) || today());
  const [error, setError] = useState('');
  const createMut = useCreateEvent();
  const updateMut = useUpdateEvent();
  const isEdit = !!editEvent;
  const isLoading = createMut.isPending || updateMut.isPending;
  const handleChange = useCallback((id, v) => setVals(p => ({ ...p, [id]: v })), []);

  async function handleSubmit(e) {
    e.preventDefault(); setError('');
    const payload = {
      program: program.id,
      programStage: stage.id,
      enrollment: enrollment.enrollment,
      orgUnit: orgUnit.id,
      // teiId comes from the parent tei object
      trackedEntityInstance: teiId,
      eventDate,
      status: 'COMPLETED',
      dataValues: Object.entries(vals).filter(([, v]) => v !== '' && v != null).map(([dataElement, value]) => ({ dataElement, value: String(value) })),
    };
    try {
      if (isEdit) { await updateMut.mutateAsync({ eventId: editEvent.event, payload }); onSuccess('Event updated.'); }
      else { await createMut.mutateAsync(payload); onSuccess('Event captured.'); }
    } catch (err) { setError(err.message); }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ pt: 1 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <DynamicField field={{ id: '__ed', name: 'Event Date', valueType: 'DATE', compulsory: true }} value={eventDate} onChange={(_, v) => setEventDate(v)} />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
        {des.map(de => <DynamicField key={de.id} field={de} value={vals[de.id] || ''} onChange={handleChange} />)}
      </Box>
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button variant="outlined" size="small" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="contained" size="small" disabled={isLoading}
          sx={{ bgcolor: '#028090', '&:hover': { bgcolor: '#026B79' } }}>
          {isLoading ? <CircularProgress size={16} color="inherit" /> : isEdit ? 'Save' : 'Capture Event'}
        </Button>
      </Box>
    </Box>
  );
}

// TEI DETAIL VIEW
function TEIDetail({ program, orgUnit, teiId, onBack, perms }) {
  const { data: tei, isLoading } = useTEI(teiId);
  const [activeStageForm, setActiveStageForm] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  if (!tei) return <Alert severity="error">Could not load record.</Alert>;

  const attributes = getTrackerAttributes(program);
  const enrollment = tei.enrollments?.[0];
  const stages = program.programStages || [];

  function getStageEvents(stageId) {
    return (enrollment?.events || []).filter(e => e.programStage === stageId);
  }

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ mb: 2, textTransform: 'none', color: '#028090' }}>
        Back to list
      </Button>

      {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg}</Alert>}

      {/* Attributes */}
      <Paper sx={{ p: 3, borderRadius: 2, mb: 2 }} variant="outlined">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ fontFamily: 'DM Serif Display, serif', color: '#0D1B4B' }}>
            Profile
          </Typography>
          <Chip
            label={enrollment?.status || 'ENROLLED'}
            size="small"
            color={enrollment?.status === 'COMPLETED' ? 'success' : 'primary'}
          />
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 0 }}>
          {attributes.map(attr => {
            const val = (tei.attributes || []).find(a => a.attribute === attr.id)?.value;
            return <DynamicField key={attr.id} field={attr} value={val} onChange={() => { }} readOnly />;
          })}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5, fontSize: 10 }}>
              Enrollment Date
            </Typography>
            <Typography variant="body2" sx={{ mt: .5 }}>{fmtDate(enrollment?.enrollmentDate)}</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Program Stages */}
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: '#0D1B4B' }}>
        Program Stages
      </Typography>
      {stages.map(stage => {
        const events = getStageEvents(stage.id);
        const isCapturing = activeStageForm?.stageId === stage.id && !activeStageForm?.editEvent;
        const editingEvent = activeStageForm?.stageId === stage.id ? activeStageForm?.editEvent : null;

        return (
          <Accordion key={stage.id} defaultExpanded={stages.length === 1} sx={{ mb: 1, borderRadius: '8px !important', '&:before': { display: 'none' } }} variant="outlined">
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <EventNoteIcon sx={{ color: '#028090', fontSize: 20 }} />
                <Typography sx={{ fontWeight: 600, fontFamily: 'DM Sans, sans-serif' }}>{stage.name}</Typography>
                <Badge badgeContent={events.length} color="primary" sx={{ ml: 1 }} />
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              {/* existing events */}
              {events.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  {events.map(ev => (
                    <Paper key={ev.event} sx={{ p: 1.5, mb: 1, borderRadius: 1.5, bgcolor: '#F8FAFF' }} variant="outlined">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CheckCircleIcon sx={{ color: ev.status === 'COMPLETED' ? '#02C39A' : '#94A3B8', fontSize: 16 }} />
                          <Typography variant="body2" fontWeight={600}>{fmtDate(ev.eventDate)}</Typography>
                          <Chip label={ev.status} size="small" sx={{ fontSize: 10 }} />
                        </Box>
                        {perms.canEdit && (
                          <IconButton size="small" onClick={() => setActiveStageForm({ stageId: stage.id, editEvent: ev })}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                      {/* show data values inline */}
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 1 }}>
                        {getStageDataElements(stage).slice(0, 4).map(de => {
                          const dv = (ev.dataValues || []).find(d => d.dataElement === de.id);
                          return dv ? (
                            <Box key={de.id}>
                              <Typography variant="caption" color="text.secondary">{de.name}: </Typography>
                              <Typography variant="caption" fontWeight={600}>{getDisplayValue(de, dv.value)}</Typography>
                            </Box>
                          ) : null;
                        })}
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )}

              {/* capture form */}
              {(isCapturing || editingEvent) ? (
                <StageEventForm
                  program={program} stage={stage}
                  enrollment={enrollment}
                  teiId={tei.trackedEntityInstance}
                  orgUnit={orgUnit}
                  editEvent={editingEvent}
                  onSuccess={(msg) => { setSuccessMsg(msg); setActiveStageForm(null); }}
                  onCancel={() => setActiveStageForm(null)}
                />
              ) : (
                perms.canAdd && (
                  <Button
                    startIcon={<AddIcon />} size="small" variant="outlined"
                    onClick={() => setActiveStageForm({ stageId: stage.id, editEvent: null })}
                    sx={{ textTransform: 'none', borderColor: '#028090', color: '#028090' }}
                  >
                    {stage.repeatable || events.length === 0 ? 'Capture New Event' : 'Re-capture Event'}
                  </Button>
                )
              )}
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
}

// MAIN PAGE
export default function TrackerCapturePage({ program, orgUnit }) {
  const { session } = useAuth();
  const perms = session?.perms || {};
  const [tab, setTab] = useState(0); // 0=list, 1=register, 2=detail
  const [editTEI, setEditTEI] = useState(null);
  const [detailTEIId, setDetailTEIId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [page, setPage] = useState(0);
  const [successMsg, setSuccessMsg] = useState('');

  const PAGE_SIZE = 20;
  const { data, isLoading, isError, error } = useTEIs({
    programId: program.id,
    orgUnitId: orgUnit?.id,
    page: page + 1,
    pageSize: PAGE_SIZE,
  });

  const deleteMutation = useDeleteTEI();
  const attributes = getTrackerAttributes(program).slice(0, 4);

  function handleSuccess(msg) {
    setSuccessMsg(msg);
    setTab(0);
    setEditTEI(null);
    setTimeout(() => setSuccessMsg(''), 4000);
  }

  const columns = [
    ...attributes.map(attr => ({
      field: attr.id, headerName: attr.name, flex: 1, minWidth: 120,
      valueGetter: ({ row }) => {
        const a = (row.attributes || []).find(x => x.attribute === attr.id);
        return getDisplayValue(attr, a?.value);
      },
    })),
    {
      field: 'enrollment', headerName: 'Status', width: 110,
      renderCell: ({ row }) => {
        const enr = row.enrollments?.[0];
        return <Chip label={enr?.status || 'N/A'} size="small" color={enr?.status === 'COMPLETED' ? 'success' : enr?.status === 'ACTIVE' ? 'primary' : 'default'} />;
      },
    },
    {
      field: 'lastUpdated', headerName: 'Last Updated', width: 130,
      valueGetter: ({ row }) => row.lastUpdated || row.created,
      valueFormatter: ({ value }) => fmtDate(value),
    },
    {
      field: '_actions', headerName: '', width: 100, sortable: false,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: .5 }}>
          <Tooltip title="View / Capture"><IconButton size="small" onClick={() => { setDetailTEIId(row.trackedEntityInstance); setTab(2); }}><EventNoteIcon fontSize="small" sx={{ color: '#028090' }} /></IconButton></Tooltip>
          {perms.canEdit && <Tooltip title="Edit Profile"><IconButton size="small" onClick={() => { setEditTEI(row); setTab(1); }}><EditIcon fontSize="small" /></IconButton></Tooltip>}
          {perms.canDelete && <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteTarget(row.trackedEntityInstance)}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>}
        </Box>
      ),
    },
  ];

  // Detail view
  if (tab === 2 && detailTEIId) {
    return (
      <TEIDetail
        program={program} orgUnit={orgUnit} teiId={detailTEIId}
        perms={perms} onBack={() => { setDetailTEIId(null); setTab(0); }}
      />
    );
  }

  return (
    <Box>
      {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg}</Alert>}

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => { setTab(v); setEditTEI(null); }}
          sx={{ '& .MuiTab-root': { fontFamily: 'DM Sans, sans-serif', textTransform: 'none', fontWeight: 600 } }}>
          <Tab label={`All Records ${data?.total ? `(${data.total})` : ''}`} value={0} />
          {perms.canAdd && <Tab label={editTEI ? 'Edit Record' : '+ Register New'} value={1} icon={editTEI ? <EditIcon fontSize="small" /> : <PersonAddIcon fontSize="small" />} iconPosition="start" />}
        </Tabs>
      </Box>

      {/* ── REGISTRATION FORM ── */}
      {tab === 1 && (
        <Paper sx={{ p: 3, borderRadius: 2 }} variant="outlined">
          <Typography variant="h6" sx={{ fontFamily: 'DM Serif Display, serif', mb: 2, color: '#0D1B4B' }}>
            {editTEI ? 'Edit Record' : `Register New — ${program.name}`}
          </Typography>
          <TEIForm
            program={program} orgUnit={orgUnit} editTEI={editTEI}
            onSuccess={handleSuccess}
            onCancel={() => { setEditTEI(null); setTab(0); }}
          />
        </Paper>
      )}

      {/* ── TEI LIST ── */}
      {tab === 0 && (
        <Paper sx={{ borderRadius: 2, overflow: 'hidden' }} variant="outlined">
          {isError && <Alert severity="error" sx={{ m: 2 }}>{error?.message}</Alert>}
          <DataGrid
            rows={(data?.teis || []).map(t => ({ ...t, id: t.trackedEntityInstance }))}
            columns={columns}
            loading={isLoading}
            paginationMode="server"
            rowCount={data?.total || 0}
            pageSizeOptions={[PAGE_SIZE]}
            paginationModel={{ page, pageSize: PAGE_SIZE }}
            onPaginationModelChange={m => setPage(m.page)}
            autoHeight
            disableRowSelectionOnClick
            sx={{
              border: 'none',
              '& .MuiDataGrid-columnHeaders': { bgcolor: '#0D1B4B', color: '#C8D8F0' },
              '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: .5 },
              '& .MuiDataGrid-row:hover': { bgcolor: '#F4F6FB' },
              fontFamily: 'DM Sans, sans-serif',
            }}
          />
        </Paper>
      )}

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete Record</DialogTitle>
        <DialogContent><Typography>Permanently delete this tracked entity instance and all its data? This cannot be undone.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="error" variant="contained" disabled={deleteMutation.isPending} onClick={async () => {
            try { await deleteMutation.mutateAsync(deleteTarget); setDeleteTarget(null); } catch { }
          }}>{deleteMutation.isPending ? <CircularProgress size={18} /> : 'Delete'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
