import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Tab,
  Tabs,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Payment as PaymentIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  AttachMoney as MoneyIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { MissionReimbursement, ReimbursementRate, Mission, User } from '../types';
import { reimbursementService, REIMBURSEMENT_RATES } from '../services/reimbursementService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`reimbursement-tabpanel-${index}`}
      aria-labelledby={`reimbursement-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Remboursements: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [reimbursements, setReimbursements] = useState<MissionReimbursement[]>([]);
  const [filteredReimbursements, setFilteredReimbursements] = useState<MissionReimbursement[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterDialog, setFilterDialog] = useState(false);
  const [detailDialog, setDetailDialog] = useState<{open: boolean, reimbursement: MissionReimbursement | null}>({
    open: false,
    reimbursement: null
  });
  
  // Filtres
  const [filters, setFilters] = useState({
    status: '',
    grade: '',
    userId: '',
    missionId: ''
  });

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    paid: 0,
    rejected: 0,
    totalAmount: 0,
    pendingAmount: 0
  });

  useEffect(() => {
    loadReimbursements();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reimbursements, filters]);

  const loadReimbursements = async () => {
    setLoading(true);
    try {
      const fetchedReimbursements = await reimbursementService.getReimbursements();
      setReimbursements(fetchedReimbursements);
      calculateStats(fetchedReimbursements);
    } catch (error) {
      console.error('Erreur lors du chargement des remboursements:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (reimbursementsList: MissionReimbursement[]) => {
    const stats = {
      total: reimbursementsList.length,
      pending: reimbursementsList.filter(r => r.status === 'pending').length,
      approved: reimbursementsList.filter(r => r.status === 'approved').length,
      paid: reimbursementsList.filter(r => r.status === 'paid').length,
      rejected: reimbursementsList.filter(r => r.status === 'rejected').length,
      totalAmount: reimbursementsList.reduce((sum, r) => sum + r.total_amount, 0),
      pendingAmount: reimbursementsList
        .filter(r => r.status === 'pending')
        .reduce((sum, r) => sum + r.total_amount, 0)
    };
    setStats(stats);
  };

  const applyFilters = () => {
    let filtered = [...reimbursements];

    if (filters.status) {
      filtered = filtered.filter(r => r.status === filters.status);
    }
    if (filters.grade) {
      filtered = filtered.filter(r => r.grade === filters.grade);
    }
    if (filters.userId) {
      filtered = filtered.filter(r => r.user_id === parseInt(filters.userId));
    }
    if (filters.missionId) {
      filtered = filtered.filter(r => r.mission_id === parseInt(filters.missionId));
    }

    setFilteredReimbursements(filtered);
    setPage(0);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleApprove = async (reimbursementId: number) => {
    try {
      await reimbursementService.approveReimbursement(reimbursementId);
      loadReimbursements();
    } catch (error) {
      console.error('Erreur lors de l\'approbation:', error);
    }
  };

  const handleReject = async (reimbursementId: number) => {
    try {
      await reimbursementService.rejectReimbursement(reimbursementId, 'Rejeté par l\'administrateur');
      loadReimbursements();
    } catch (error) {
      console.error('Erreur lors du rejet:', error);
    }
  };

  const handleMarkAsPaid = async (reimbursementId: number) => {
    try {
      await reimbursementService.markAsPaid(reimbursementId);
      loadReimbursements();
    } catch (error) {
      console.error('Erreur lors du marquage comme payé:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'info';
      case 'paid': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'approved': return 'Approuvé';
      case 'paid': return 'Payé';
      case 'rejected': return 'Rejeté';
      default: return status;
    }
  };

  const getGradeLabel = (grade: string) => {
    switch (grade) {
      case 'agent_execution': return 'Agent d\'Exécution';
      case 'agent_maitrise': return 'Agent de Maîtrise';
      case 'agent_commandement': return 'Agent de Commandement';
      case 'haut_cadre': return 'Haut Cadre';
      default: return grade;
    }
  };

  const formatAmount = (amount: number) => {
    return `${amount.toFixed(2)} MAD`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Gestion des Remboursements ONEEP
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setFilterDialog(true)}
          >
            Filtrer
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadReimbursements}
          >
            Actualiser
          </Button>
        </Box>
      </Box>

      {/* Statistiques */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Remboursements
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                En Attente
              </Typography>
              <Typography variant="h4" color="warning.main">{stats.pending}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Montant Total
              </Typography>
              <Typography variant="h5" color="primary.main">
                {formatAmount(stats.totalAmount)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                En Attente (Montant)
              </Typography>
              <Typography variant="h5" color="warning.main">
                {formatAmount(stats.pendingAmount)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Onglets */}
      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Remboursements" />
            <Tab label="Tarifs par Grade" />
            <Tab label="Statistiques" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {/* Table des remboursements */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Mission</TableCell>
                  <TableCell>Utilisateur</TableCell>
                  <TableCell>Grade</TableCell>
                  <TableCell>Jours</TableCell>
                  <TableCell>Déjeuner</TableCell>
                  <TableCell>Dîner</TableCell>
                  <TableCell>Hébergement</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredReimbursements
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((reimbursement) => (
                    <TableRow key={reimbursement.id}>
                      <TableCell>#{reimbursement.mission_id}</TableCell>
                      <TableCell>#{reimbursement.user_id}</TableCell>
                      <TableCell>{getGradeLabel(reimbursement.grade)}</TableCell>
                      <TableCell>{reimbursement.days_count}</TableCell>
                      <TableCell>{formatAmount(reimbursement.dejeuner_amount)}</TableCell>
                      <TableCell>{formatAmount(reimbursement.dinner_amount)}</TableCell>
                      <TableCell>{formatAmount(reimbursement.hebergement_amount)}</TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" color="primary">
                          {formatAmount(reimbursement.total_amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(reimbursement.status)}
                          color={getStatusColor(reimbursement.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {reimbursement.status === 'pending' && (
                            <>
                              <Tooltip title="Approuver">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleApprove(reimbursement.id)}
                                >
                                  <CheckIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Rejeter">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleReject(reimbursement.id)}
                                >
                                  <CloseIcon />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                          {reimbursement.status === 'approved' && (
                            <Tooltip title="Marquer comme payé">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleMarkAsPaid(reimbursement.id)}
                              >
                                <PaymentIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Voir détails">
                            <IconButton
                              size="small"
                              onClick={() => setDetailDialog({ open: true, reimbursement })}
                            >
                              <InfoIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredReimbursements.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Tarifs par grade */}
          <Typography variant="h6" gutterBottom>
            Tarifs de Remboursement par Grade (MAD)
          </Typography>
          <Grid container spacing={3}>
            {REIMBURSEMENT_RATES.map((rate) => (
              <Grid item xs={12} sm={6} md={3} key={rate.grade}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {getGradeLabel(rate.grade)}
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Déjeuner:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {formatAmount(rate.dejeuner)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Dîner:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {formatAmount(rate.dinner)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Hébergement:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {formatAmount(rate.hebergement)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* Statistiques détaillées */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Répartition par Statut
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>En attente:</Typography>
                      <Chip label={stats.pending} color="warning" size="small" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>Approuvés:</Typography>
                      <Chip label={stats.approved} color="info" size="small" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>Payés:</Typography>
                      <Chip label={stats.paid} color="success" size="small" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>Rejetés:</Typography>
                      <Chip label={stats.rejected} color="error" size="small" />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Montants
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>Total général:</Typography>
                      <Typography variant="h6" color="primary">
                        {formatAmount(stats.totalAmount)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>En attente:</Typography>
                      <Typography variant="h6" color="warning.main">
                        {formatAmount(stats.pendingAmount)}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* Dialog de filtres */}
      <Dialog open={filterDialog} onClose={() => setFilterDialog(false)}>
        <DialogTitle>Filtres</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Statut</InputLabel>
                <Select
                  value={filters.status}
                  label="Statut"
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                >
                  <MenuItem value="">Tous</MenuItem>
                  <MenuItem value="pending">En attente</MenuItem>
                  <MenuItem value="approved">Approuvé</MenuItem>
                  <MenuItem value="paid">Payé</MenuItem>
                  <MenuItem value="rejected">Rejeté</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Grade</InputLabel>
                <Select
                  value={filters.grade}
                  label="Grade"
                  onChange={(e) => setFilters({...filters, grade: e.target.value})}
                >
                  <MenuItem value="">Tous</MenuItem>
                  <MenuItem value="agent_execution">Agent d'Exécution</MenuItem>
                  <MenuItem value="agent_maitrise">Agent de Maîtrise</MenuItem>
                  <MenuItem value="agent_commandement">Agent de Commandement</MenuItem>
                  <MenuItem value="haut_cadre">Haut Cadre</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFilters({ status: '', grade: '', userId: '', missionId: '' })}>
            Réinitialiser
          </Button>
          <Button onClick={() => setFilterDialog(false)} variant="contained">
            Appliquer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de détails */}
      <Dialog
        open={detailDialog.open}
        onClose={() => setDetailDialog({ open: false, reimbursement: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Détails du Remboursement</DialogTitle>
        <DialogContent>
          {detailDialog.reimbursement && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Mission:</Typography>
                <Typography>#{detailDialog.reimbursement.mission_id}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Utilisateur:</Typography>
                <Typography>#{detailDialog.reimbursement.user_id}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Grade:</Typography>
                <Typography>{getGradeLabel(detailDialog.reimbursement.grade)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Nombre de jours:</Typography>
                <Typography>{detailDialog.reimbursement.days_count}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Déjeuner:</Typography>
                <Typography>{formatAmount(detailDialog.reimbursement.dejeuner_amount)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Dîner:</Typography>
                <Typography>{formatAmount(detailDialog.reimbursement.dinner_amount)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Hébergement:</Typography>
                <Typography>{formatAmount(detailDialog.reimbursement.hebergement_amount)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Total:</Typography>
                <Typography variant="h6" color="primary">
                  {formatAmount(detailDialog.reimbursement.total_amount)}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Statut:</Typography>
                <Chip
                  label={getStatusLabel(detailDialog.reimbursement.status)}
                  color={getStatusColor(detailDialog.reimbursement.status) as any}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog({ open: false, reimbursement: null })}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Remboursements;
