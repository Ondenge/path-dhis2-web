import React, { useState, useCallback } from 'react';
import {
  Box, Button, Typography, Alert, Paper, Tabs, Tab,
  CircularProgress, Chip, Tooltip, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useAuth } from '../context/AuthContext';
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from '../hooks/usePrograms';
import DynamicField from '../components/DynamicField';
import { getStageDataElements, today, fmtDate, getDisplayValue } from '../utils/programHelpers';

const STATUS_COLORS = {
  COMPLETED: 'success', ACTIVE: 'primary', SKIPPED: 'warning', SCHEDULE: 'default',
};

// EVENT FORM
function EventForm({ program, orgUnit, editEvent, onSuccess, onCancel, perms }) {
  const stage = program.programStages?.[0];
  const dataElements = getStageDataElements(stage);
  const { session } = useAuth();

  const initVals = () => {
    if (!editEvent) return {};
    return Object.fromEntries((editEvent.dataValues || []).map(dv => [dv.dataElement, dv.value]));
  };

  const [vals, setVals] = useState(initVals);
  const [eventDate, setEventDate] = useState(editEvent?.eventDate?.slice(0, 10) || today());
  const [error, setError] = useState('');

  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();
  const isEdit = !!editEvent;
  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleChange = useCallback((id, v) => setVals(p => ({ ...p, [id]: v })), []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const payload = {
      program: program.id,
      programStage: stage?.id,
      orgUnit: orgUnit.id,
      eventDate,
      status: 'COMPLETED',
      dataValues: Object.entries(vals).filter(([, v]) => v !== '' && v != null).map(([dataElement, value]) => ({ dataElement, value: String(value) })),
    };
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ eventId: editEvent.event, payload });
        onSuccess('Event updated successfully.');
      } else {
        await createMutation.mutateAsync(payload);
        onSuccess('Event submitted successfully.');
      }
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
        <DynamicField
          field={{ id: '__eventDate', name: 'Event Date', valueType: 'DATE', compulsory: true }}
          value={eventDate} onChange={(_, v) => setEventDate(v)}
        />
      </Box>

      {dataElements.length > 0 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
          {dataElements.map(de => (
            <DynamicField key={de.id} field={de} value={vals[de.id] || ''} onChange={handleChange} />
          ))}
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button variant="outlined" onClick={onCancel} disabled={isLoading}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={isLoading || !perms.canAdd}
          sx={{ bgcolor: '#028090', '&:hover': { bgcolor: '#026B79' } }}>
          {isLoading ? <CircularProgress size={18} color="inherit" /> : isEdit ? 'Save Changes' : 'Submit Event'}
        </Button>
      </Box>
    </Box>
  );
}

// MAIN PAGE
export default function EventCapturePage({ program, orgUnit }) {
  const { session } = useAuth();
  const perms = session?.perms || {};
  const [tab, setTab] = useState(perms.canView ? 1 : 0); // 0=new, 1=records
  const [editEvent, setEditEvent] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [page, setPage] = useState(0);
  const [successMsg, setSuccessMsg] = useState('');

  const PAGE_SIZE = 20;
  const { data, isLoading, isError, error } = useEvents({
    programId: program.id,
    orgUnitId: orgUnit?.id,
    page: page + 1,
    pageSize: PAGE_SIZE,
  });

  const deleteMutation = useDeleteEvent();
  const stage = program.programStages?.[0];
  const dataElements = getStageDataElements(stage).slice(0, 3);

  function handleSuccess(msg) {
    setSuccessMsg(msg);
    setTab(1);
    setEditEvent(null);
    setTimeout(() => setSuccessMsg(''), 4000);
  }

  const columns = [
    { field: 'eventDate', headerName: 'Date', width: 110, valueFormatter: ({ value }) => fmtDate(value) },
    { field: 'orgUnitName', headerName: 'Org Unit', flex: 1, minWidth: 140 },
    {
      field: 'status', headerName: 'Status', width: 110,
      renderCell: ({ value }) => <Chip label={value} size="small" color={STATUS_COLORS[value] || 'default'} />
    },
    ...dataElements.map(de => ({
      field: de.id, headerName: de.name, flex: 1, minWidth: 120,
      valueGetter: ({ row }) => {
        const dv = (row.dataValues || []).find(d => d.dataElement === de.id);
        return getDisplayValue(de, dv?.value);
      },
    })),
    { field: 'storedBy', headerName: 'Submitted By', width: 130 },
    {
      field: '_actions', headerName: 'Actions', width: 90, sortable: false,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: .5 }}>
          {perms.canEdit && (
            <Tooltip title="Edit"><IconButton size="small" onClick={() => { setEditEvent(row); setTab(0); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
          )}
          {perms.canDelete && (
            <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteTarget(row.event)}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box>
      {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg}</Alert>}

      <Tabs value={tab} onChange={(_, v) => { setTab(v); setEditEvent(null); }}
        sx={{ mb: 2, '& .MuiTab-root': { fontFamily: 'DM Sans, sans-serif', textTransform: 'none', fontWeight: 600 } }}>
        {perms.canAdd && <Tab label={editEvent ? 'Edit Event' : '+ New Entry'} value={0} />}
        {perms.canView && <Tab label={`Records ${data?.total ? `(${data.total})` : ''}`} value={1} />}
      </Tabs>

      {/* ── NEW / EDIT FORM ── */}
      {tab === 0 && (
        <Paper sx={{ p: 3, borderRadius: 2 }} variant="outlined">
          <Typography variant="h6" sx={{ fontFamily: 'DM Serif Display, serif', mb: 2, color: '#0D1B4B' }}>
            {editEvent ? `Editing Event` : `New ${program.name} Entry`}
          </Typography>
          <EventForm
            program={program} orgUnit={orgUnit}
            editEvent={editEvent} perms={perms}
            onSuccess={handleSuccess}
            onCancel={() => { setEditEvent(null); setTab(perms.canView ? 1 : 0); }}
          />
        </Paper>
      )}

      {/* ── RECORDS TABLE ── */}
      {tab === 1 && (
        <Paper sx={{ borderRadius: 2, overflow: 'hidden' }} variant="outlined">
          {isError && <Alert severity="error" sx={{ m: 2 }}>{error?.message}</Alert>}
          <DataGrid
            rows={(data?.events || []).map(e => ({ ...e, id: e.event }))}
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

      {/* ── DELETE CONFIRM ── */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete Event</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to permanently delete this event? This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={async () => {
            try { await deleteMutation.mutateAsync(deleteTarget); setDeleteTarget(null); }
            catch (err) { setSuccessMsg(''); }
          }}>
            {deleteMutation.isPending ? <CircularProgress size={18} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
