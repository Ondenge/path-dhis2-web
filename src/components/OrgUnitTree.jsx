import React, { useState, useRef } from 'react';
import {
  Box, Typography, CircularProgress, IconButton, Collapse, InputBase, Divider
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import BusinessIcon from '@mui/icons-material/Business';
import { useOrgUnitChildren, useOrgUnitSearch } from '../hooks/usePrograms';

const TEAL = '#007B83';

function OrgUnitNode({ ou, selectedId, onSelect, depth = 0, programOuIds }) {
  const [open, setOpen] = useState(false);
  const { data: children = [], isLoading } = useOrgUnitChildren(open ? ou.id : null);
  const isSelected  = selectedId === ou.id;
  const isAllowed   = !programOuIds || programOuIds.has(ou.id);
  const showExpand  = ou.hasChildren || children.length > 0;

  return (
    <Box>
      <Box
        onClick={() => isAllowed && onSelect(ou)}
        sx={{
          display: 'flex', alignItems: 'center',
          pl: `${depth * 14 + 6}px`, pr: 1, py: '5px',
          borderRadius: '6px', mx: '3px',
          cursor: isAllowed ? 'pointer' : 'default',
          bgcolor: isSelected ? TEAL : 'transparent',
          color: isSelected ? '#fff' : isAllowed ? '#1A2B4A' : '#bbb',
          '&:hover': isAllowed && !isSelected ? { bgcolor: 'rgba(0,123,131,.09)' } : {},
          transition: 'background .12s',
        }}
      >
        <Box sx={{ width: 20, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isLoading
            ? <CircularProgress size={11} sx={{ color: isSelected ? '#fff' : TEAL }} />
            : showExpand
              ? <IconButton size="small" onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
                  sx={{ p: 0, color: 'inherit' }}>
                  {open ? <ExpandMoreIcon sx={{ fontSize: 14 }} /> : <ChevronRightIcon sx={{ fontSize: 14 }} />}
                </IconButton>
              : null
          }
        </Box>
        <BusinessIcon sx={{ fontSize: 12, mr: .6, opacity: .55, flexShrink: 0 }} />
        <Typography sx={{
          fontSize: 13, flex: 1, fontWeight: isSelected ? 600 : 400,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {ou.name}
        </Typography>
      </Box>
      <Collapse in={open} unmountOnExit>
        {children.map(c => (
          <OrgUnitNode key={c.id} ou={c} selectedId={selectedId} onSelect={onSelect}
            depth={depth + 1} programOuIds={programOuIds} />
        ))}
      </Collapse>
    </Box>
  );
}

export default function OrgUnitTree({ roots = [], selectedId, selectedName, onSelect, programOuIds, maxHeight = 300 }) {
  const [search, setSearch] = useState('');
  const programIds = programOuIds ? new Set(programOuIds) : null;
  const { data: results = [], isFetching } = useOrgUnitSearch(search.length >= 2 ? search : null);
  const isSearchMode = search.length >= 2;

  return (
    <Box sx={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden', bgcolor: '#fff' }}>
      {/* Search */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: .75, px: 1.25, py: .7, borderBottom: '1px solid #EEF1F6', bgcolor: '#FAFBFC' }}>
        {isFetching
          ? <CircularProgress size={13} sx={{ color: TEAL }} />
          : <SearchIcon sx={{ fontSize: 15, color: '#94A3B8' }} />}
        <InputBase
          placeholder="Search org units…" value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ fontSize: 13, flex: 1, color: '#1A2B4A' }}
        />
        {search && (
          <IconButton size="small" onClick={() => setSearch('')} sx={{ p: .15 }}>
            <ClearIcon sx={{ fontSize: 13, color: '#94A3B8' }} />
          </IconButton>
        )}
      </Box>

      {/* Tree content */}
      <Box sx={{ maxHeight, overflowY: 'auto', py: .4 }}>
        {isSearchMode ? (
          results.length === 0 && !isFetching
            ? <Typography sx={{ fontSize: 12, color: '#94A3B8', p: 2, textAlign: 'center' }}>No results</Typography>
            : results.map(ou => (
                <Box key={ou.id} onClick={() => onSelect(ou)}
                  sx={{
                    px: 1.5, py: .7, cursor: 'pointer', borderRadius: '6px', mx: '3px',
                    bgcolor: selectedId === ou.id ? TEAL : 'transparent',
                    color: selectedId === ou.id ? '#fff' : '#1A2B4A',
                    '&:hover': selectedId !== ou.id ? { bgcolor: 'rgba(0,123,131,.09)' } : {},
                    transition: 'background .12s',
                  }}>
                  <Typography sx={{ fontSize: 13, fontWeight: selectedId === ou.id ? 600 : 400 }}>{ou.name}</Typography>
                  {ou.parent?.name && <Typography sx={{ fontSize: 11, opacity: .55 }}>{ou.parent.name}</Typography>}
                </Box>
              ))
        ) : roots.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}><CircularProgress size={18} sx={{ color: TEAL }} /></Box>
        ) : (
          roots.map(ou => (
            <OrgUnitNode key={ou.id} ou={ou} selectedId={selectedId} onSelect={onSelect}
              depth={0} programOuIds={programIds} />
          ))
        )}
      </Box>

      {/* Selected indicator */}
      {selectedId && (
        <>
          <Divider />
          <Box sx={{ px: 1.25, py: .6, bgcolor: 'rgba(0,123,131,.05)', display: 'flex', alignItems: 'center', gap: .75 }}>
            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: TEAL, flexShrink: 0 }} />
            <Typography sx={{ fontSize: 12, color: TEAL, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedName || selectedId}
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
}
