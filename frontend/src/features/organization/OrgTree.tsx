import { useMemo, useState } from 'react';
import {
  Box,
  Chip,
  Collapse,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SchoolIcon from '@mui/icons-material/School';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ApartmentIcon from '@mui/icons-material/Apartment';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ArchiveIcon from '@mui/icons-material/Archive';
import type { OrgUnit } from './types';

const TYPE_ICON: Record<OrgUnit['type'], React.ReactNode> = {
  COLLEGE: <SchoolIcon fontSize="small" />,
  FACULTY: <AccountBalanceIcon fontSize="small" />,
  DEPARTMENT: <ApartmentIcon fontSize="small" />,
  UNIT: <GroupWorkIcon fontSize="small" />,
};

interface OrgTreeNode extends OrgUnit {
  children: OrgTreeNode[];
}

function buildTree(units: OrgUnit[]): OrgTreeNode[] {
  const nodes = new Map<number, OrgTreeNode>();
  units.forEach((u) => nodes.set(u.id, { ...u, children: [] }));

  const roots: OrgTreeNode[] = [];
  nodes.forEach((node) => {
    if (node.parentId != null && nodes.has(node.parentId)) {
      nodes.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

interface OrgTreeProps {
  units: OrgUnit[];
  canWrite: boolean;
  onPropose: (mode: 'create-child' | 'update' | 'archive', unit?: OrgUnit) => void;
  onProposeRoot: () => void;
}

export function OrgTree({ units, canWrite, onPropose, onProposeRoot }: OrgTreeProps) {
  const tree = useMemo(() => buildTree(units), [units]);
  const [expanded, setExpanded] = useState<Set<number>>(new Set(tree.map((n) => n.id)));

  function toggle(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function renderNode(node: OrgTreeNode, depth: number) {
    const isExpanded = expanded.has(node.id);
    const archived = node.status === 'ARCHIVED';

    return (
      <Box key={node.id}>
        <ListItemButton sx={{ pl: 2 + depth * 3 }} onClick={() => node.children.length > 0 && toggle(node.id)}>
          <ListItemIcon sx={{ minWidth: 32 }}>
            {node.children.length > 0 ? (isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />) : TYPE_ICON[node.type]}
          </ListItemIcon>
          <ListItemText
            primary={
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography sx={{ opacity: archived ? 0.6 : 1 }}>{node.name}</Typography>
                <Chip label={node.code} size="small" variant="outlined" />
                <Chip label={node.type} size="small" color="primary" variant="outlined" />
                {archived && <Chip label="Archived" size="small" />}
              </Stack>
            }
            secondary={node.headName ? `Head: ${node.headName}` : undefined}
          />
          {canWrite && !archived && (
            <Stack direction="row" spacing={0.5}>
              {node.type !== 'UNIT' && (
                <Tooltip title="Add child unit">
                  <IconButton
                    size="small"
                    aria-label={`Add child unit to ${node.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onPropose('create-child', node);
                    }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Propose edit">
                <IconButton
                  size="small"
                  aria-label={`Propose edit to ${node.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPropose('update', node);
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Propose archive">
                <IconButton
                  size="small"
                  aria-label={`Propose archive of ${node.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPropose('archive', node);
                  }}
                >
                  <ArchiveIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          )}
        </ListItemButton>
        {node.children.length > 0 && (
          <Collapse in={isExpanded} unmountOnExit>
            <List disablePadding>{node.children.map((child) => renderNode(child, depth + 1))}</List>
          </Collapse>
        )}
      </Box>
    );
  }

  return (
    <Box>
      {canWrite && (
        <Box sx={{ mb: 1 }}>
          <Tooltip title="Propose a new college">
            <IconButton onClick={onProposeRoot} color="primary" size="small" aria-label="Propose new college">
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            Propose new college
          </Typography>
        </Box>
      )}
      {tree.length === 0 ? (
        <Typography color="text.secondary">No organization units yet.</Typography>
      ) : (
        <List disablePadding>{tree.map((node) => renderNode(node, 0))}</List>
      )}
    </Box>
  );
}
