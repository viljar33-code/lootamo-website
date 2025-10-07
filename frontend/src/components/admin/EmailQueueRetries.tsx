import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Typography, 
  Box, 
  CircularProgress, 
  Chip, 
  Tooltip,
  IconButton,
  TablePagination
} from '@mui/material';
import { Refresh } from '@mui/icons-material';
import { format } from 'date-fns';
import api from '../../services/api';

interface EmailQueueItem {
  id: number;
  to_email: string;
  subject: string;
  status: 'pending' | 'sending' | 'sent' | 'failed';
  attempts: number;
  max_retries: number;
  last_error: string | null;
  next_retry_at: string | null;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  email_type: string | null;
  order_id: string | null;
}

interface EmailQueueStats {
  pending: number;
  sending: number;
  sent: number;
  failed: number;
  overdue: number;
  total: number;
}

const EmailQueueRetries: React.FC = () => {
  const [retries, setRetries] = useState<EmailQueueItem[]>([]);
  const [stats, setStats] = useState<EmailQueueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const statsResponse = await api.get('/api/v1/email-queue/stats');
      setStats(statsResponse.data);
      
      const response = await api.get('/api/v1/email-queue/retries', {
        params: {
          limit: rowsPerPage,
          offset: page * rowsPerPage,
          status: 'failed,pending'
        }
      });
      
      setRetries(response.data);
    } catch (error) {
      console.error('Error fetching email queue data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, rowsPerPage]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'success';
      case 'failed':
        return 'error';
      case 'sending':
        return 'info';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM d, yyyy HH:mm:ss');
  };

  if (loading && !stats) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 2, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" component="h2">
          Email Queue Status
        </Typography>
        <Box>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchData} size="small">
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {stats && (
        <Box display="flex" gap={2} mb={3} flexWrap="wrap">
          <Chip 
            label={`Total: ${stats.total}`} 
            variant="outlined" 
            color="default"
          />
          <Chip 
            label={`Pending: ${stats.pending}`} 
            variant="outlined" 
            color="warning"
          />
          <Chip 
            label={`Sending: ${stats.sending}`} 
            variant="outlined" 
            color="info"
          />
          <Chip 
            label={`Sent: ${stats.sent}`} 
            variant="outlined" 
            color="success"
          />
          <Chip 
            label={`Failed: ${stats.failed}`} 
            variant="outlined" 
            color="error"
          />
          <Chip 
            label={`Overdue: ${stats.overdue}`} 
            variant="outlined" 
            color="warning"
          />
        </Box>
      )}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>To</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Attempts</TableCell>
              <TableCell>Last Error</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Next Retry</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : retries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  No email retries found
                </TableCell>
              </TableRow>
            ) : (
              retries.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>{item.to_email}</TableCell>
                  <TableCell>
                    <Tooltip title={item.subject}>
                      <Box sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.subject}
                      </Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{item.email_type || '-'}</TableCell>
                  <TableCell>
                    <Chip 
                      label={item.status} 
                      size="small" 
                      color={getStatusColor(item.status) as any}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {item.attempts} / {item.max_retries}
                  </TableCell>
                  <TableCell>
                    <Tooltip title={item.last_error || 'No error'}>
                      <Box sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.last_error || '-'}
                      </Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{formatDateTime(item.created_at)}</TableCell>
                  <TableCell>
                    {item.next_retry_at ? formatDateTime(item.next_retry_at) : 'N/A'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={stats?.total || 0}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

export default EmailQueueRetries;
