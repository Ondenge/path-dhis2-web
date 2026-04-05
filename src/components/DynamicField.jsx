import React from 'react';
import {
  TextField, Checkbox, FormControlLabel, FormControl, FormLabel,
  RadioGroup, Radio, MenuItem, FormHelperText, Box, Typography, Chip
} from '@mui/material';
import { getInputType } from '../utils/programHelpers';

/**
 * Renders the correct MUI input for any DHIS2 valueType.
 * Works for both program attributes (tracker) and data elements (events).
 */
export default function DynamicField({ field, value, onChange, readOnly = false }) {
  const { id, name, valueType, optionSet, compulsory, mandatory } = field;
  const required = compulsory || mandatory;
  const inputType = getInputType(valueType);

  const handleChange = (val) => onChange(id, val);

  // READ-ONLY DISPLAY
  if (readOnly) {
    let display = value || '—';
    if (optionSet?.options?.length) {
      const opt = optionSet.options.find(o => o.code === value);
      display = opt?.name || value || '—';
    }
    if (valueType === 'BOOLEAN') display = value === 'true' ? 'Yes' : value === 'false' ? 'No' : '—';
    if (valueType === 'TRUE_ONLY') display = value === 'true' ? 'Yes' : '—';
    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5, fontSize: 10 }}>
          {name}
        </Typography>
        <Typography variant="body2" sx={{ mt: .5, color: display === '—' ? 'text.disabled' : 'text.primary' }}>
          {display}
        </Typography>
      </Box>
    );
  }

  // OPTION SET (checkboxes for ≤6, select for more)
  if (optionSet?.options?.length > 0) {
    if (optionSet.options.length <= 6) {
      const selected = value ? value.split(',').map(v => v.trim()).filter(Boolean) : [];
      const toggle = (code) => {
        const next = selected.includes(code) ? selected.filter(c => c !== code) : [...selected, code];
        handleChange(next.join(','));
      };
      return (
        <FormControl component="fieldset" sx={{ mb: 2, width: '100%' }} required={required}>
          <FormLabel sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary', mb: 1 }}>
            {name}
          </FormLabel>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {optionSet.options.map(opt => (
              <Chip
                key={opt.code}
                label={opt.name}
                onClick={() => toggle(opt.code)}
                variant={selected.includes(opt.code) ? 'filled' : 'outlined'}
                color={selected.includes(opt.code) ? 'primary' : 'default'}
                size="small"
                sx={{ cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
              />
            ))}
          </Box>
          {required && !value && <FormHelperText error>Required</FormHelperText>}
        </FormControl>
      );
    }
    return (
      <TextField
        select fullWidth size="small" label={name} value={value || ''} required={required}
        onChange={e => handleChange(e.target.value)} sx={{ mb: 2 }}
        SelectProps={{ MenuProps: { PaperProps: { sx: { maxHeight: 280 } } } }}
      >
        <MenuItem value=""><em>— Select —</em></MenuItem>
        {optionSet.options.map(opt => (
          <MenuItem key={opt.code} value={opt.code}>{opt.name}</MenuItem>
        ))}
      </TextField>
    );
  }

  // BOOLEAN
  if (inputType === 'boolean') {
    return (
      <FormControl component="fieldset" sx={{ mb: 2 }} required={required}>
        <FormLabel sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>{name}</FormLabel>
        <RadioGroup row value={value || ''} onChange={e => handleChange(e.target.value)}>
          <FormControlLabel value="true"  control={<Radio size="small" />} label="Yes" />
          <FormControlLabel value="false" control={<Radio size="small" />} label="No"  />
        </RadioGroup>
      </FormControl>
    );
  }

  // TRUE ONLY
  if (inputType === 'trueonly') {
    return (
      <FormControlLabel sx={{ mb: 1, display: 'block' }}
        control={
          <Checkbox size="small" checked={value === 'true'}
            onChange={e => handleChange(e.target.checked ? 'true' : '')} />
        }
        label={<Typography variant="body2">{name}{required && <span style={{ color: '#d32f2f' }}> *</span>}</Typography>}
      />
    );
  }

  // TEXTAREA
  if (inputType === 'textarea') {
    return (
      <TextField
        fullWidth multiline minRows={3} size="small" label={name}
        value={value || ''} required={required} sx={{ mb: 2 }}
        onChange={e => handleChange(e.target.value)}
      />
    );
  }

  // DEFAULT: text / number / date / email / etc.
  return (
    <TextField
      fullWidth size="small" label={name} type={inputType}
      value={value || ''} required={required} sx={{ mb: 2 }}
      InputLabelProps={inputType === 'date' || inputType === 'datetime-local' ? { shrink: true } : {}}
      onChange={e => handleChange(e.target.value)}
    />
  );
}
