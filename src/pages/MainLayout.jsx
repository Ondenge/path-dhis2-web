import React, { useState, useMemo } from 'react';
import {
  Box, AppBar, Toolbar, Typography, IconButton, Drawer,
  List, ListItemButton, ListItemText, ListItemIcon, Divider,
  Avatar, Menu, MenuItem, Tooltip, Chip, CircularProgress,
  Collapse, Badge, Alert
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import LogoutIcon from '@mui/icons-material/Logout';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonIcon from '@mui/icons-material/Person';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useAuth } from '../context/AuthContext';
import { usePrograms, useUserOrgUnitRoots } from '../hooks/usePrograms';
import { isTracker } from '../utils/programHelpers';
import OrgUnitTree from '../components/OrgUnitTree';
import EventCapturePage from './EventCapturePage';
import TrackerCapturePage from './TrackerCapturePage';

const DRAWER_WIDTH = 260;

// PATH brand
const PATH = {
  red: '#E8332A',
  teal: '#007B83',
  navy: '#1A2B4A',
  navy2: '#223158',
  light: '#F5F7FA',
  muted: 'rgba(255,255,255,.55)',
  border: 'rgba(255,255,255,.1)',
};

function PathLogoMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="5" fill={PATH.red} />
      <path d="M14 28V12" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>

      {/* Top loop of P */}
      <path d="M14 12H22C25 12 27 14 27 17C27 20 25 22 22 22H14" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function PermDot({ ok }) {
  return <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: ok ? '#2DD4BF' : 'rgba(255,255,255,.2)', flexShrink: 0 }} />;
}

export default function MainLayout() {
  const { session, logout } = useAuth();
  const perms = session?.perms || {};
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedOrgUnit, setSelectedOrgUnit] = useState(null);
  const [ouPanelOpen, setOuPanelOpen] = useState(true);

  const { data: programs = [], isLoading: programsLoading } = usePrograms();
  const { data: orgUnitRoots = [], isLoading: rootsLoading } = useUserOrgUnitRoots();

  // Program org unit IDs (for tree highlighting)
  const programOuIds = selectedProgram?.organisationUnits?.length
    ? selectedProgram.organisationUnits.map(o => o.id)
    : null; // null = no filter, all selectable

  const initials = (session?.me?.displayName || session?.me?.username || '?')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  function handleProgramSelect(prog) {
    setSelectedProgram(prog);
    setSelectedOrgUnit(null); // reset org unit when program changes
  }

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: PATH.navy, overflowX: 'hidden' }}>

      {/* ── LOGO ── */}
      <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${PATH.border}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <PathLogoMark size={32} />
          <Box>
            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 15, fontFamily: 'DM Sans, sans-serif', lineHeight: 1.1 }}>
              PATH
            </Typography>
            <Typography sx={{ color: PATH.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: .7 }}>
              DHIS2 Tracker App
            </Typography>
          </Box>
        </Box>
        <Typography sx={{ color: 'rgba(255,255,255,.3)', fontSize: 10, mt: .5 }}>
          {session?.baseUrl?.replace(/^https?:\/\//, '')}
        </Typography>
      </Box>

      {/* ── PROGRAMS ── */}
      <Box sx={{ flex: 1, overflowY: 'auto', pb: 1 }}>
        <Typography sx={{ px: 2, pt: 1.5, pb: .75, fontSize: 10, color: PATH.muted, textTransform: 'uppercase', letterSpacing: .8, fontWeight: 600 }}>
          Programs
        </Typography>

        {programsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={18} sx={{ color: PATH.teal }} />
          </Box>
        ) : programs.length === 0 ? (
          <Typography sx={{ px: 2, fontSize: 12, color: PATH.muted }}>No programs available</Typography>
        ) : (
          <List dense disablePadding sx={{ px: 1 }}>
            {programs.map(prog => {
              const active = selectedProgram?.id === prog.id;
              const tracker = isTracker(prog);
              return (
                <ListItemButton
                  key={prog.id}
                  selected={active}
                  onClick={() => handleProgramSelect(prog)}
                  sx={{
                    borderRadius: 1.5, mb: .3, px: 1.25,
                    color: active ? '#fff' : PATH.muted,
                    bgcolor: active ? 'rgba(232,51,42,.18)' : 'transparent',
                    borderLeft: active ? `3px solid ${PATH.red}` : '3px solid transparent',
                    '&:hover': { bgcolor: active ? 'rgba(232,51,42,.22)' : 'rgba(255,255,255,.06)', color: '#fff' },
                    '&.Mui-selected': { bgcolor: 'rgba(232,51,42,.18)' },
                    transition: 'all .12s',
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 28, color: active ? PATH.red : PATH.teal }}>
                    {tracker
                      ? <PersonIcon sx={{ fontSize: 16 }} />
                      : <AssignmentIcon sx={{ fontSize: 16 }} />
                    }
                  </ListItemIcon>
                  <ListItemText
                    primary={prog.name}
                    secondary={tracker ? 'Tracker' : 'Event'}
                    primaryTypographyProps={{ fontSize: 13, fontWeight: active ? 600 : 400, noWrap: true }}
                    secondaryTypographyProps={{ fontSize: 10, color: active ? 'rgba(255,255,255,.5)' : 'rgba(255,255,255,.3)' }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        )}

        <Divider sx={{ borderColor: PATH.border, my: 1 }} />

        {/* ── ORG UNIT TREE ── */}
        <Box sx={{ px: 1 }}>
          <ListItemButton
            onClick={() => setOuPanelOpen(o => !o)}
            sx={{ borderRadius: 1.5, px: 1.25, py: .6, color: PATH.muted, '&:hover': { bgcolor: 'rgba(255,255,255,.06)', color: '#fff' } }}
          >
            <AccountTreeIcon sx={{ fontSize: 15, mr: 1 }} />
            <Typography sx={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: .8, fontWeight: 600, flex: 1 }}>
              Organisation Unit
            </Typography>
            {ouPanelOpen ? <KeyboardArrowUpIcon sx={{ fontSize: 15 }} /> : <KeyboardArrowDownIcon sx={{ fontSize: 15 }} />}
          </ListItemButton>

          <Collapse in={ouPanelOpen}>
            <Box sx={{ mt: .75, mb: .5 }}>
              <OrgUnitTree
                roots={orgUnitRoots}
                selectedId={selectedOrgUnit?.id}
                selectedName={selectedOrgUnit?.name}
                onSelect={setSelectedOrgUnit}
                programOuIds={programOuIds}
                maxHeight={250}
              />
            </Box>
          </Collapse>
        </Box>
      </Box>

      {/* ── ACCESS + USER ── */}
      <Box sx={{ borderTop: `1px solid ${PATH.border}`, px: 2, py: 1.5 }}>
        <Typography sx={{ fontSize: 9, color: PATH.muted, textTransform: 'uppercase', letterSpacing: .8, mb: .75, fontWeight: 600 }}>
          Access
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25, mb: 1.5 }}>
          {[['Add', perms.canAdd], ['View', perms.canView], ['Edit', perms.canEdit], ['Delete', perms.canDelete]].map(([label, ok]) => (
            <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: .6 }}>
              <PermDot ok={ok} />
              <Typography sx={{ fontSize: 11, color: ok ? 'rgba(255,255,255,.75)' : 'rgba(255,255,255,.3)' }}>{label}</Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 26, height: 26, bgcolor: PATH.teal, fontSize: 10, fontWeight: 700 }}>
            {initials}
          </Avatar>
          <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,.8)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {session?.me?.displayName || session?.me?.username}
          </Typography>
          <Tooltip title="Sign out">
            <IconButton size="small" onClick={logout} sx={{ color: 'rgba(255,255,255,.4)', '&:hover': { color: PATH.red } }}>
              <LogoutIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F5F7FA' }}>
      {/* Sidebar */}
      <Drawer
        variant="persistent" open={drawerOpen}
        sx={{
          width: drawerOpen ? DRAWER_WIDTH : 0,
          flexShrink: 0,
          transition: 'width .2s',
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH, boxSizing: 'border-box',
            border: 'none', boxShadow: '2px 0 16px rgba(26,43,74,.18)',
            transition: 'width .2s',
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Main */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* ── TOP BAR ── */}
        <AppBar position="sticky" elevation={0} sx={{
          bgcolor: '#fff', borderBottom: '1px solid #E8EDF5',
          color: PATH.navy,
        }}>
          <Toolbar sx={{ minHeight: '54px !important', px: 2, gap: 1 }}>
            <IconButton size="small" onClick={() => setDrawerOpen(o => !o)} sx={{ color: '#64748B', mr: .5 }}>
              {drawerOpen ? <MenuOpenIcon /> : <MenuIcon />}
            </IconButton>

            {/* PATH wordmark */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
              <PathLogoMark size={24} />
              <Typography sx={{ fontWeight: 700, fontSize: 14, color: PATH.navy, fontFamily: 'DM Sans, sans-serif', letterSpacing: -.2 }}>
                PATH
              </Typography>
            </Box>

            {/* Breadcrumb */}
            {selectedProgram && (
              <>
                <Chip
                  label={isTracker(selectedProgram) ? 'Tracker' : 'Event'}
                  size="small"
                  sx={{
                    bgcolor: isTracker(selectedProgram) ? 'rgba(0,123,131,.1)' : 'rgba(232,51,42,.1)',
                    color: isTracker(selectedProgram) ? PATH.teal : PATH.red,
                    fontWeight: 600, fontSize: 11,
                  }}
                />
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: PATH.navy, ml: .5 }}>
                  {selectedProgram.name}
                </Typography>
              </>
            )}
            {selectedOrgUnit && (
              <Chip
                label={selectedOrgUnit.name}
                size="small" variant="outlined"
                sx={{ ml: .5, borderColor: PATH.teal, color: PATH.teal, fontSize: 12 }}
              />
            )}

            <Box sx={{ flex: 1 }} />

            {/* User avatar */}
            <Avatar
              sx={{ width: 32, height: 32, bgcolor: PATH.navy, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              onClick={e => setUserMenuAnchor(e.currentTarget)}
            >
              {initials}
            </Avatar>
            <Menu
              anchorEl={userMenuAnchor} open={Boolean(userMenuAnchor)}
              onClose={() => setUserMenuAnchor(null)}
              PaperProps={{ sx: { minWidth: 210, borderRadius: 2, mt: .5, boxShadow: '0 8px 24px rgba(0,0,0,.12)' } }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{session?.me?.displayName}</Typography>
                <Typography sx={{ fontSize: 12, color: '#64748B' }}>@{session?.me?.username}</Typography>
              </Box>
              <Divider />
              {(session?.me?.userRoles || []).map(r => (
                <MenuItem key={r.id} disabled sx={{ fontSize: 12, color: '#94A3B8', py: .5 }}>{r.name}</MenuItem>
              ))}
              <Divider />
              <MenuItem onClick={logout} sx={{ color: PATH.red, fontSize: 13, gap: 1 }}>
                <LogoutIcon fontSize="small" /> Sign out
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* ── PAGE CONTENT ── */}
        <Box sx={{ flex: 1, p: 3 }}>
          {!selectedProgram ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '65vh', gap: 1.5 }}>
              <Box sx={{ width: 56, height: 56, borderRadius: 3, bgcolor: '#EEF1F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FolderOpenIcon sx={{ fontSize: 28, color: '#C4CDD6' }} />
              </Box>
              <Typography sx={{ fontWeight: 600, fontSize: 17, color: '#94A3B8', fontFamily: 'DM Sans, sans-serif' }}>
                Select a program
              </Typography>
              <Typography sx={{ fontSize: 13, color: '#B0BAC5', textAlign: 'center', maxWidth: 300 }}>
                Choose a program from the sidebar to start capturing data.
                {programs.length > 0 && ` ${programs.length} program${programs.length !== 1 ? 's' : ''} available.`}
              </Typography>
            </Box>
          ) : !selectedOrgUnit ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '65vh', gap: 1.5 }}>
              <Box sx={{ width: 56, height: 56, borderRadius: 3, bgcolor: '#EEF1F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AccountTreeIcon sx={{ fontSize: 28, color: '#C4CDD6' }} />
              </Box>
              <Typography sx={{ fontWeight: 600, fontSize: 17, color: '#94A3B8', fontFamily: 'DM Sans, sans-serif' }}>
                Select an organisation unit
              </Typography>
              <Typography sx={{ fontSize: 13, color: '#B0BAC5', textAlign: 'center', maxWidth: 320 }}>
                Expand the tree in the sidebar to find and select your facility or org unit.
              </Typography>
              {selectedProgram?.organisationUnits?.length === 0 && (
                <Alert severity="warning" sx={{ mt: 1, maxWidth: 380 }}>
                  This program has no org unit assignments — contact your DHIS2 administrator.
                </Alert>
              )}
            </Box>
          ) : isTracker(selectedProgram) ? (
            <TrackerCapturePage program={selectedProgram} orgUnit={selectedOrgUnit} />
          ) : (
            <EventCapturePage program={selectedProgram} orgUnit={selectedOrgUnit} />
          )}
        </Box>
      </Box>
    </Box>
  );
}
