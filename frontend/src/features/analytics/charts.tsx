import { useId, useState, type ReactNode } from 'react';
import { Box, Button, Card, CardContent, Stack, Tooltip, Typography } from '@mui/material';

/**
 * Chart colour roles. The app itself is light-only (no OS-driven dark theme), so the dark values apply only when
 * the page is explicitly stamped data-theme="dark"; following the OS alone would put light text on a light page.
 * Single-series charts use one hue (series-1), validated for the light and dark surface with
 * the dataviz palette validator. Text always wears the text tokens, never the series colour.
 */
export const VIZ_STYLES = `
.viz-root {
  color-scheme: light;
  --viz-surface: #fcfcfb;
  --viz-text: #0b0b0b;
  --viz-text-2: #52514e;
  --viz-grid: #e4e3df;
  --viz-series-1: #2a78d6;
}
:root[data-theme="dark"] .viz-root {
  color-scheme: dark;
  --viz-surface: #1a1a19;
  --viz-text: #f0efec;
  --viz-text-2: #c3c2b7;
  --viz-grid: #3a3a37;
  --viz-series-1: #3987e5;
}
`;

export function humanize(label: string): string {
  const text = label.toLowerCase().replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export interface Datum {
  label: string;
  value: number;
}

/** A titled card with a chart/table switch, so every chart has an accessible table view. */
export function ChartCard({
  title,
  subtitle,
  data,
  valueHeader,
  children,
}: {
  title: string;
  subtitle?: string;
  data: Datum[];
  valueHeader: string;
  children: ReactNode;
}) {
  const [asTable, setAsTable] = useState(false);
  return (
    <Card variant="outlined" sx={{ bgcolor: 'var(--viz-surface)' }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} sx={{ color: 'var(--viz-text)' }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" sx={{ color: 'var(--viz-text-2)' }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Button size="small" aria-pressed={asTable} onClick={() => setAsTable((v) => !v)}>
            {asTable ? 'View chart' : 'View table'}
          </Button>
        </Stack>
        {asTable ? (
          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', color: 'var(--viz-text)', fontSize: 14 }}>
            <thead>
              <tr>
                <Box component="th" sx={{ textAlign: 'left', pb: 0.5, color: 'var(--viz-text-2)', fontWeight: 600 }}>
                  Item
                </Box>
                <Box component="th" sx={{ textAlign: 'right', pb: 0.5, color: 'var(--viz-text-2)', fontWeight: 600 }}>
                  {valueHeader}
                </Box>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.label}>
                  <Box component="td" sx={{ py: 0.4, borderTop: '1px solid var(--viz-grid)' }}>
                    {d.label}
                  </Box>
                  <Box component="td" sx={{ py: 0.4, textAlign: 'right', borderTop: '1px solid var(--viz-grid)' }}>
                    {d.value.toLocaleString()}
                  </Box>
                </tr>
              ))}
            </tbody>
          </Box>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

/** Ranked horizontal bars, one hue; the value sits at the end of each bar. Rows keep the order they are given. */
export function BarList({ data, emptyText = 'No data yet.' }: { data: Datum[]; emptyText?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    return (
      <Typography variant="body2" sx={{ color: 'var(--viz-text-2)' }}>
        {emptyText}
      </Typography>
    );
  }
  return (
    <Stack spacing={1} role="list">
      {data.map((d) => {
        const share = Math.round((d.value / total) * 100);
        return (
          <Tooltip key={d.label} title={`${d.label}: ${d.value.toLocaleString()} (${share}%)`} placement="top" arrow>
            <Box role="listitem" aria-label={`${d.label}: ${d.value}`} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '40% 1fr' }, columnGap: 1.5, rowGap: 0.25, alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: 'var(--viz-text)', lineHeight: 1.3 }}>
                {d.label}
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box
                  sx={{
                    height: 12,
                    width: `${Math.max((d.value / max) * 100, d.value > 0 ? 2 : 0)}%`,
                    bgcolor: 'var(--viz-series-1)',
                    borderRadius: '0 4px 4px 0',
                  }}
                />
                <Typography variant="body2" fontWeight={600} sx={{ color: 'var(--viz-text)', minWidth: 24 }}>
                  {d.value.toLocaleString()}
                </Typography>
              </Stack>
            </Box>
          </Tooltip>
        );
      })}
    </Stack>
  );
}

/** Columns for a time series: baseline + one max gridline, 4px rounded tops, only the peak value is labelled. */
export function ColumnChart({
  data,
  xLabel,
  format = (n: number) => n.toLocaleString(),
  label,
}: {
  data: { key: string; label: string; value: number }[];
  xLabel: (index: number, d: { key: string; label: string }) => string;
  format?: (n: number) => string;
  label: string;
}) {
  const id = useId();
  const W = 560;
  const H = 180;
  const left = 8;
  const right = 8;
  const top = 22;
  const bottom = 24;
  const innerW = W - left - right;
  const innerH = H - top - bottom;
  const max = Math.max(1, ...data.map((d) => d.value));
  const slot = innerW / Math.max(1, data.length);
  const barW = Math.min(36, slot - 6);
  const peak = data.reduce((best, d, i) => (d.value > data[best].value ? i : best), 0);

  return (
    <Box
      component="svg"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={label}
      sx={{ width: '100%', height: 'auto', display: 'block' }}
    >
      <title id={id}>{label}</title>
      <line x1={left} x2={W - right} y1={top} y2={top} stroke="var(--viz-grid)" strokeWidth={1} />
      <text x={left} y={top - 6} fontSize={11} fill="var(--viz-text-2)">
        {format(max)}
      </text>
      <line x1={left} x2={W - right} y1={top + innerH} y2={top + innerH} stroke="var(--viz-text-2)" strokeWidth={1} />
      {data.map((d, i) => {
        const h = (d.value / max) * innerH;
        const x = left + i * slot + (slot - barW) / 2;
        const y = top + innerH - h;
        const r = Math.min(4, h, barW / 2);
        const path = `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + barW - r} Q${x + barW},${y} ${x + barW},${y + r} V${y + h} Z`;
        const text = xLabel(i, d);
        return (
          <g key={d.key}>
            <Tooltip title={`${d.label}: ${format(d.value)}`} placement="top" arrow>
              <g data-testid="column">
                {/* wide invisible hit target, larger than the mark */}
                <rect x={left + i * slot} y={top} width={slot} height={innerH} fill="transparent" />
                {h > 0 && <path d={path} fill="var(--viz-series-1)" />}
              </g>
            </Tooltip>
            {i === peak && d.value > 0 && (
              <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--viz-text)">
                {format(d.value)}
              </text>
            )}
            {text && (
              <text x={x + barW / 2} y={H - 6} textAnchor="middle" fontSize={11} fill="var(--viz-text-2)">
                {text}
              </text>
            )}
          </g>
        );
      })}
    </Box>
  );
}

export function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card variant="outlined" sx={{ bgcolor: 'var(--viz-surface)' }}>
      <CardContent>
        <Typography variant="caption" sx={{ color: 'var(--viz-text-2)', textTransform: 'uppercase', letterSpacing: 0.6 }}>
          {label}
        </Typography>
        <Typography variant="h4" fontWeight={700} sx={{ color: 'var(--viz-text)', lineHeight: 1.2 }}>
          {value}
        </Typography>
        {hint && (
          <Typography variant="caption" sx={{ color: 'var(--viz-text-2)' }}>
            {hint}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
