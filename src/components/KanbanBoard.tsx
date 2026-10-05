'use client';

import React, { useState, useEffect } from 'react';
import { Plus, FileText, AlertTriangle, RefreshCw, Pencil, Trash2, LayoutGrid, List, Wrench, PackageCheck } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { generateDynamicTitle } from '@/lib/formatTitle';

interface Project {
  id: string;
  title: string;
  department: string;
  status: 'IN_PROGRESS' | 'WON' | 'COMPLETED' | 'DRAFT' | 'RINEGO' | 'CONV' | 'CANCELLED';
  service_type?: 'NUOVO_CONTRATTO' | 'RINEGOZIAZIONE' | 'DISDETTA';
  mod_type?: 'PARTIAL_MOD' | 'FRB_EBULI';
  fast_offer_code?: string;
  sales_order_code?: string;
  mod_products?: string[];
  bill_to?: string;
  sold_to?: string;
  annual_value?: number;
  num_elevators?: number;
  contract_code?: string;
  negotiation_status?: string;
  notes?: string;
  client_id?: string;
  clients?: {
    id?: string;
    name: string;
    account_code?: string;
    is_censito: boolean;
  };
}

interface KanbanBoardProps {
  department: 'SERVICE' | 'MOD' | 'FIUME_SANTO' | 'CARBOTERMO';
}

const COLUMNS = [
  { 
    id: 'IN_PROGRESS', 
    title: 'Da Fare', 
    color: 'border-t-4 border-t-[#2B6CB0] bg-[#EBF8FF]/40 border-x border-b border-[#BEE3F8]' 
  },
  { 
    id: 'WON', 
    title: 'Preso in Carico', 
    color: 'border-t-4 border-t-[#D69E2E] bg-[#FEFCBF]/30 border-x border-b border-[#FAF089]' 
  },
  { 
    id: 'COMPLETED', 
    title: 'Completato', 
    color: 'border-t-4 border-t-[#38A169] bg-[#F0FFF4]/50 border-x border-b border-[#C6F6D5]' 
  },
];

const SUB_STATUSES = {
  IN_PROGRESS: [
    'Non iniziata',
  ],
  WON: [
    'In attesa di Check-List',
    'Pianificato',
    'Offerta - Pronta per invio',
    'In attesa / Sospeso',
    'In lavorazione',
  ],
  COMPLETED: [
    'Offerta Inviata',
    'Offerta Accettata',
    'Ordine Ricevuto',
    'Ordine di Vendita Creato',
    'Offerta Rifiutata',
  ]
};

const MOD_PRODUCT_OPTIONS = [
  { id: 'resolve_100_dx', label: 'ReSolve 100 DX' },
  { id: 'resolve_200_dx', label: 'ReSolve 200 DX' },
  { id: 'resolve_400_dx', label: 'ReSolve 400 DX' },
  { id: 'resolve_mrl_dx', label: 'ReSolve MRL DX' },
  { id: 'regenerate', label: 'ReGenerate' },
];

export default function KanbanBoard({ department }: KanbanBoardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [showModal, setShowModal] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  // Form states
  const [clientName, setClientName] = useState('');
  const [billTo, setBillTo] = useState('');
  const [soldTo, setSoldTo] = useState('');
  const [sameAsBillTo, setSameAsBillTo] = useState(false);
  const [accountCode, setAccountCode] = useState('');
  const [contractCode, setContractCode] = useState('');
  const [isCensito, setIsCensito] = useState(false);
  const [serviceType, setServiceType] = useState<'NUOVO_CONTRATTO' | 'RINEGOZIAZIONE' | 'DISDETTA'>('NUOVO_CONTRATTO');
  const [modType, setModType] = useState<'PARTIAL_MOD' | 'FRB_EBULI'>('PARTIAL_MOD');
  const [fastOfferCode, setFastOfferCode] = useState('');
  const [salesOrderCode, setSalesOrderCode] = useState('');
  const [selectedModProducts, setSelectedModProducts] = useState<string[]>([]);
  const [annualValue, setAnnualValue] = useState('');
  const [numElevators, setNumElevators] = useState('1');
  const [negotiationStatus, setNegotiationStatus] = useState('Non iniziata');
  const [notes, setNotes] = useState('');

  const isModStyleDepartment = ['MOD', 'FIUME_SANTO', 'CARBOTERMO'].includes(department);

  const handleBillToChange = (val: string) => {
    setBillTo(val);
    if (sameAsBillTo) setSoldTo(val);
  };

  const handleSameAsBillToToggle = (checked: boolean) => {
    setSameAsBillTo(checked);
    if (checked) setSoldTo(billTo);
  };

  const handleServiceTypeChange = (type: 'NUOVO_CONTRATTO' | 'RINEGOZIAZIONE' | 'DISDETTA') => {
    setServiceType(type);
    if (type === 'RINEGOZIAZIONE' || type === 'DISDETTA') setIsCensito(true);
  };

  const handleCensitoToggle = (checked: boolean) => {
    setIsCensito(checked);
    if (!checked) setAccountCode('');
  };

  const toggleModProduct = (productId: string) => {
    setSelectedModProducts((prev) =>
      prev.includes(productId) ? prev.filter((p) => p !== productId) : [...prev, productId]
    );
  };

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*, clients(*)')
      .eq('department', department);

    if (!error && data) {
      setProjects(data as any);
    }
  };

  // Svuota i progetti e ricarica immediatamente quando cambia il reparto
  useEffect(() => {
    setProjects([]); // Pulizia immediata per evitare sovrapposizioni visive
    fetchProjects();
  }, [department]);

  const getMacroStatusFromSubStatus = (subStatus: string): Project['status'] => {
    if (SUB_STATUSES.IN_PROGRESS.includes(subStatus)) return 'IN_PROGRESS';
    if (SUB_STATUSES.WON.includes(subStatus)) return 'WON';
    if (SUB_STATUSES.COMPLETED.includes(subStatus)) return 'COMPLETED';
    return 'IN_PROGRESS';
  };

  const handleSubStatusChange = async (projectId: string, newSubStatus: string) => {
    const newMacroStatus = getMacroStatusFromSubStatus(newSubStatus);
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, negotiation_status: newSubStatus, status: newMacroStatus } : p))
    );
    const { error } = await supabase
      .from('projects')
      .update({ negotiation_status: newSubStatus, status: newMacroStatus })
      .eq('id', projectId);
    if (error) fetchProjects();
  };

  const openEditModal = (proj: Project) => {
    setEditingProjectId(proj.id);
    setClientName(proj.clients?.name || proj.title || '');
    setBillTo(proj.bill_to || '');
    setSoldTo(proj.sold_to || '');
    setSameAsBillTo(proj.bill_to === proj.sold_to && !!proj.bill_to);
    setAccountCode(proj.clients?.account_code || '');
    setContractCode(proj.contract_code || '');
    setIsCensito(proj.clients?.is_censito || false);
    setServiceType(proj.service_type || 'NUOVO_CONTRATTO');
    setModType(proj.mod_type || 'PARTIAL_MOD');
    setFastOfferCode(proj.fast_offer_code || '');
    setSalesOrderCode(proj.sales_order_code || '');
    setSelectedModProducts(proj.mod_products || []);
    setAnnualValue(proj.annual_value ? proj.annual_value.toString() : '');
    setNumElevators(proj.num_elevators ? proj.num_elevators.toString() : '1');
    setNegotiationStatus(proj.negotiation_status || 'Non iniziata');
    setNotes(proj.notes || '');
    setShowModal(true);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa pratica?')) return;

    const { error } = await supabase.from('projects').delete().eq('id', projectId);
    if (!error) {
      fetchProjects();
    } else {
      alert(`Errore durante l'eliminazione: ${error.message}`);
    }
  };

  const handleCreateOrUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName) return;

    const computedMacroStatus = getMacroStatusFromSubStatus(negotiationStatus);

    try {
      if (editingProjectId) {
        const projToUpdate = projects.find((p) => p.id === editingProjectId);
        if (projToUpdate?.clients?.id) {
          await supabase
            .from('clients')
            .update({
              name: clientName,
              account_code: isCensito ? accountCode || null : null,
              is_censito: isCensito,
            })
            .eq('id', projToUpdate.clients.id);
        }

        const { error: projErr } = await supabase
          .from('projects')
          .update({
            title: clientName,
            status: computedMacroStatus,
            service_type: department === 'SERVICE' ? serviceType : null,
            mod_type: isModStyleDepartment ? modType : null,
            fast_offer_code: fastOfferCode || null,
            sales_order_code: salesOrderCode || null,
            mod_products: selectedModProducts,
            bill_to: billTo || null,
            sold_to: sameAsBillTo ? billTo : soldTo || null,
            annual_value: annualValue ? parseFloat(annualValue) : null,
            num_elevators: parseInt(numElevators, 10) || 1,
            contract_code: contractCode || null,
            negotiation_status: negotiationStatus,
            notes: notes || null,
          })
          .eq('id', editingProjectId);

        if (projErr) {
          alert(`Errore modifica Commessa: ${projErr.message}`);
          return;
        }
      } else {
        const { data: clientData, error: clientErr } = await supabase
          .from('clients')
          .insert([{ name: clientName, account_code: isCensito ? accountCode || null : null, is_censito: isCensito }])
          .select()
          .single();

        if (clientErr) {
          alert(`Errore salvataggio Cliente: ${clientErr.message}`);
          return;
        }

        const { error: projErr } = await supabase.from('projects').insert([
          {
            title: clientName,
            client_id: clientData.id,
            department,
            status: computedMacroStatus,
            service_type: department === 'SERVICE' ? serviceType : null,
            mod_type: isModStyleDepartment ? modType : null,
            fast_offer_code: fastOfferCode || null,
            sales_order_code: salesOrderCode || null,
            mod_products: selectedModProducts,
            bill_to: billTo || null,
            sold_to: sameAsBillTo ? billTo : soldTo || null,
            annual_value: annualValue ? parseFloat(annualValue) : null,
            num_elevators: parseInt(numElevators, 10) || 1,
            contract_code: contractCode || null,
            negotiation_status: negotiationStatus,
            notes: notes || null,
          },
        ]);

        if (projErr) {
          alert(`Errore salvataggio Commessa: ${projErr.message}`);
          return;
        }
      }

      setShowModal(false);
      resetForm();
      fetchProjects();
    } catch (err: any) {
      alert(`Errore imprevisto: ${err.message}`);
    }
  };

  const resetForm = () => {
    setEditingProjectId(null);
    setClientName('');
    setBillTo('');
    setSoldTo('');
    setSameAsBillTo(false);
    setAccountCode('');
    setContractCode('');
    setIsCensito(false);
    setServiceType('NUOVO_CONTRATTO');
    setModType('PARTIAL_MOD');
    setFastOfferCode('');
    setSalesOrderCode('');
    setSelectedModProducts([]);
    setAnnualValue('');
    setNumElevators('1');
    setNegotiationStatus('Non iniziata');
    setNotes('');
  };

  const renderBadge = (proj: Project) => {
    if (department === 'SERVICE') {
      switch (proj.service_type) {
        case 'NUOVO_CONTRATTO':
          return (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-[#2B6CB0] px-1.5 py-0.5 uppercase tracking-wider">
              <FileText className="w-3 h-3" /> WON
            </span>
          );
        case 'RINEGOZIAZIONE':
          return (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-[#2D3748] px-1.5 py-0.5 uppercase tracking-wider">
              <RefreshCw className="w-3 h-3" /> RINEGO
            </span>
          );
        case 'DISDETTA':
          return (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-[#C53030] px-1.5 py-0.5 uppercase tracking-wider">
              <AlertTriangle className="w-3 h-3" /> RISK
            </span>
          );
        default:
          return null;
      }
    }

    if (isModStyleDepartment) {
      switch (proj.mod_type) {
        case 'PARTIAL_MOD':
          return (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-[#2B6CB0] px-1.5 py-0.5 uppercase tracking-wider">
              <Wrench className="w-3 h-3" /> PARTIAL MOD
            </span>
          );
        case 'FRB_EBULI':
          return (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-[#2D3748] px-1.5 py-0.5 uppercase tracking-wider">
              <PackageCheck className="w-3 h-3" /> FRB / EBULI
            </span>
          );
        default:
          return null;
      }
    }

    return null;
  };

  const isCensitoLocked = serviceType === 'RINEGOZIAZIONE' || serviceType === 'DISDETTA';

  const getProjectsForColumn = (colId: string) => {
    return projects.filter((p) => {
      if (colId === 'IN_PROGRESS') {
        return p.status === 'IN_PROGRESS' || p.status === 'DRAFT' || p.status === 'RINEGO' || p.status === 'CONV';
      }
      if (colId === 'WON') {
        return p.status === 'WON';
      }
      if (colId === 'COMPLETED') {
        return p.status === 'COMPLETED';
      }
      return false;
    });
  };

  return (
    <div className="space-y-4">
      {/* Header Gestione e Toolbar */}
      <div className="flex items-center justify-between bg-white p-4 border border-[#D9DDE3] shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-[#1A202C] uppercase tracking-wide">Gestione {department}</h2>
          <p className="text-xs text-[#718096]">Registro commesse e trattative aziendali</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex border border-[#D9DDE3] bg-[#F8FAFC]">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${
                viewMode === 'kanban' ? 'bg-[#2D3748] text-white' : 'text-[#718096] hover:text-[#1A202C]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Schede
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${
                viewMode === 'table' ? 'bg-[#2D3748] text-white' : 'text-[#718096] hover:text-[#1A202C]'
              }`}
            >
              <List className="w-3.5 h-3.5" /> Tabella
            </button>
          </div>

          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-[#2B6CB0] hover:bg-[#245992] text-white px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-2xs"
          >
            <Plus className="w-4 h-4" /> Nuova Pratica
          </button>
        </div>
      </div>

      {/* VISTA SCHEDE */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-3 gap-4">
          {COLUMNS.map((col) => {
            const colProjects = getProjectsForColumn(col.id);

            return (
              <div
                key={col.id}
                className={`p-3 border border-[#D9DDE3] ${col.color} min-h-[500px] flex flex-col`}
              >
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#D9DDE3]">
                  <h3 className="text-xs font-bold text-[#1A202C] uppercase tracking-wider">{col.title}</h3>
                  <span className="bg-[#2D3748] text-white text-[10px] px-2 py-0.5 font-mono font-bold">
                    {colProjects.length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1">
                  {colProjects.map((proj) => {
                    const dynamicTitle = generateDynamicTitle({
                      status: proj.status,
                      isCensito: proj.clients?.is_censito || false,
                      accountCode: proj.clients?.account_code,
                      contractCode: proj.contract_code,
                      clientName: proj.clients?.name || proj.title,
                    });

                    return (
                      <div
                        key={proj.id}
                        className="bg-[#F8FAFC] border border-[#D9DDE3] p-3 space-y-2.5 hover:border-[#2B6CB0] transition-shadow shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {renderBadge(proj)}
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono text-[#718096] bg-white px-1.5 py-0.5 border border-[#D9DDE3]">
                              {proj.num_elevators || 1} imp.
                            </span>
                            <button
                              onClick={() => openEditModal(proj)}
                              className="text-[#718096] hover:text-[#2B6CB0] p-1 rounded"
                              title="Modifica pratica"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProject(proj.id)}
                              className="text-[#718096] hover:text-[#C53030] p-1 rounded"
                              title="Elimina pratica"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <h4 className="text-xs font-bold text-[#1A202C]">{dynamicTitle}</h4>

                        <div className="text-[11px] text-[#718096] space-y-0.5 font-mono">
                          {proj.fast_offer_code && <div><strong className="text-[#1A202C]">FAST:</strong> {proj.fast_offer_code}</div>}
                          {proj.sales_order_code && <div><strong className="text-[#1A202C]">SO:</strong> {proj.sales_order_code}</div>}
                          {proj.sold_to && <div><strong className="text-[#1A202C]">Sold-To:</strong> {proj.sold_to}</div>}
                        </div>

                        {/* Tag Categorie di Vendita MOD */}
                        {isModStyleDepartment && proj.mod_products && proj.mod_products.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {proj.mod_products.map((p) => {
                              const label = MOD_PRODUCT_OPTIONS.find((opt) => opt.id === p)?.label || p;
                              return (
                                <span key={p} className="bg-[#E2E8F0] text-[#2D3748] text-[9px] font-bold px-1.5 py-0.5 rounded-none">
                                  {label}
                                </span>
                              );
                            })}
                          </div>
                        )}

                        <div className="pt-2 border-t border-[#D9DDE3] flex items-center justify-between gap-2">
                          <select
                            value={proj.negotiation_status || 'Non iniziata'}
                            onChange={(e) => handleSubStatusChange(proj.id, e.target.value)}
                            className="w-full bg-white border border-[#D9DDE3] text-[10px] p-1 font-semibold text-[#2D3748] focus:outline-none focus:border-[#2B6CB0] cursor-pointer"
                          >
                            <optgroup label="DA FARE">
                              {SUB_STATUSES.IN_PROGRESS.map((st) => (
                                <option key={st} value={st}>{st}</option>
                              ))}
                            </optgroup>
                            <optgroup label="PRESO IN CARICO">
                              {SUB_STATUSES.WON.map((st) => (
                                <option key={st} value={st}>{st}</option>
                              ))}
                            </optgroup>
                            <optgroup label="COMPLETATO">
                              {SUB_STATUSES.COMPLETED.map((st) => (
                                <option key={st} value={st}>{st}</option>
                              ))}
                            </optgroup>
                          </select>
                          <span className="font-mono text-xs font-bold text-[#1A202C] shrink-0">
                            {proj.annual_value ? `€ ${proj.annual_value.toLocaleString('it-IT')}` : '-'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VISTA TABELLA */}
      {viewMode === 'table' && (
        <div className="bg-white border border-[#D9DDE3] overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#2D3748] text-white font-bold uppercase tracking-wider text-[11px]">
                <th className="p-2.5 border-r border-[#4A5568]">Tipo</th>
                <th className="p-2.5 border-r border-[#4A5568]">Titolo / Cliente</th>
                <th className="p-2.5 border-r border-[#4A5568]">FAST / SO</th>
                <th className="p-2.5 border-r border-[#4A5568]">Sold-To</th>
                <th className="p-2.5 border-r border-[#4A5568] text-center">Imp.</th>
                <th className="p-2.5 border-r border-[#4A5568]">Valore Annuo</th>
                <th className="p-2.5 border-r border-[#4A5568]">Stato Trattativa</th>
                <th className="p-2.5 text-center">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9DDE3] font-mono text-[11px]">
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-[#718096] italic font-sans">
                    Nessuna pratica registrata in questo reparto.
                  </td>
                </tr>
              ) : (
                projects.map((proj) => {
                  const dynamicTitle = generateDynamicTitle({
                    status: proj.status,
                    isCensito: proj.clients?.is_censito || false,
                    accountCode: proj.clients?.account_code,
                    contractCode: proj.contract_code,
                    clientName: proj.clients?.name || proj.title,
                  });

                  return (
                    <tr key={proj.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="p-2.5 border-r border-[#D9DDE3]">{renderBadge(proj)}</td>
                      <td className="p-2.5 border-r border-[#D9DDE3] font-sans font-bold text-[#1A202C]">{dynamicTitle}</td>
                      <td className="p-2.5 border-r border-[#D9DDE3] font-mono">
                        {proj.fast_offer_code && <div>FAST: {proj.fast_offer_code}</div>}
                        {proj.sales_order_code && <div className="text-[#2B6CB0]">SO: {proj.sales_order_code}</div>}
                        {!proj.fast_offer_code && !proj.sales_order_code && '-'}
                      </td>
                      <td className="p-2.5 border-r border-[#D9DDE3] font-sans">{proj.sold_to || '-'}</td>
                      <td className="p-2.5 border-r border-[#D9DDE3] text-center font-bold">{proj.num_elevators || 1}</td>
                      <td className="p-2.5 border-r border-[#D9DDE3] font-bold">
                        {proj.annual_value ? `€ ${proj.annual_value.toLocaleString('it-IT')}` : '-'}
                      </td>
                      <td className="p-2.5 border-r border-[#D9DDE3] font-sans">
                        <select
                          value={proj.negotiation_status || 'Non iniziata'}
                          onChange={(e) => handleSubStatusChange(proj.id, e.target.value)}
                          className="bg-white border border-[#D9DDE3] text-[11px] p-1 focus:outline-none"
                        >
                          <optgroup label="DA FARE">
                            {SUB_STATUSES.IN_PROGRESS.map((st) => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </optgroup>
                          <optgroup label="PRESO IN CARICO">
                            {SUB_STATUSES.WON.map((st) => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </optgroup>
                          <optgroup label="COMPLETATO">
                            {SUB_STATUSES.COMPLETED.map((st) => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </optgroup>
                        </select>
                      </td>
                      <td className="p-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEditModal(proj)}
                            className="p-1 text-[#718096] hover:text-[#2B6CB0] rounded"
                            title="Modifica"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProject(proj.id)}
                            className="p-1 text-[#718096] hover:text-[#C53030] rounded"
                            title="Elimina"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* FORM MODALE STILE ERP */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#D9DDE3] w-full max-w-xl shadow-2xl overflow-hidden text-xs max-h-[90vh] flex flex-col">
            <div className="bg-[#2D3748] text-white px-5 py-3 flex items-center justify-between border-b border-[#1A202C] shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-4 bg-[#2B6CB0]"></div>
                <h3 className="font-bold text-xs uppercase tracking-wider">
                  {editingProjectId ? 'Modifica Pratica' : `Nuova Pratica ${department}`}
                </h3>
              </div>
              <button 
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }} 
                className="text-slate-400 hover:text-white font-bold px-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdateProject} className="p-5 space-y-4 bg-[#F0F2F5] overflow-y-auto flex-1">
              {/* TIPO PER SERVICE */}
              {department === 'SERVICE' && (
                <div className="bg-white p-3 border border-[#D9DDE3] space-y-1.5">
                  <label className="block font-bold text-[#1A202C] uppercase text-[10px] tracking-wider">
                    Tipo Contratto
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['NUOVO_CONTRATTO', 'RINEGOZIAZIONE', 'DISDETTA'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleServiceTypeChange(type)}
                        className={`py-2 px-1 text-center font-bold text-xs uppercase transition-colors border ${
                          serviceType === type
                            ? 'bg-[#2B6CB0] text-white border-[#2B6CB0]'
                            : 'bg-[#F8FAFC] text-[#718096] border-[#D9DDE3] hover:bg-white hover:text-[#1A202C]'
                        }`}
                      >
                        {type === 'NUOVO_CONTRATTO' ? 'WON' : type === 'RINEGOZIAZIONE' ? 'Rinego' : 'Risk'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TIPO PER MOD E REPARTI SPECIALI */}
              {isModStyleDepartment && (
                <div className="bg-white p-3 border border-[#D9DDE3] space-y-1.5">
                  <label className="block font-bold text-[#1A202C] uppercase text-[10px] tracking-wider">
                    Tipologia Modernizzazione
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['PARTIAL_MOD', 'FRB_EBULI'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setModType(type)}
                        className={`py-2 px-1 text-center font-bold text-xs uppercase transition-colors border ${
                          modType === type
                            ? 'bg-[#2B6CB0] text-white border-[#2B6CB0]'
                            : 'bg-[#F8FAFC] text-[#718096] border-[#D9DDE3] hover:bg-white hover:text-[#1A202C]'
                        }`}
                      >
                        {type === 'PARTIAL_MOD' ? 'Partial MOD' : 'FRB / EBULI'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white p-3 border border-[#D9DDE3] space-y-3">
                <div>
                  <label className="block font-bold text-[#1A202C] uppercase text-[10px] tracking-wider mb-1">
                    Titolo / Riferimento Pratica *
                  </label>
                  <input
                    type="text"
                    placeholder="es. Condominio Roma 15"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#D9DDE3] p-2 text-xs focus:outline-none focus:bg-white focus:border-[#2B6CB0]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#718096] uppercase text-[10px] tracking-wider mb-1">
                      N° Offerta FAST
                    </label>
                    <input
                      type="text"
                      placeholder="es. FST-2026-99"
                      value={fastOfferCode}
                      onChange={(e) => setFastOfferCode(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#D9DDE3] p-2 text-xs focus:outline-none focus:bg-white focus:border-[#2B6CB0]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#718096] uppercase text-[10px] tracking-wider mb-1">
                      Sales Order (SO)
                    </label>
                    <input
                      type="text"
                      placeholder="es. SO-410088"
                      value={salesOrderCode}
                      onChange={(e) => setSalesOrderCode(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#D9DDE3] p-2 text-xs focus:outline-none focus:bg-white focus:border-[#2B6CB0]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#718096] uppercase text-[10px] tracking-wider mb-1">
                      Bill-To (Fatturazione)
                    </label>
                    <input
                      type="text"
                      placeholder="Studio Amm. Rossi"
                      value={billTo}
                      onChange={(e) => handleBillToChange(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#D9DDE3] p-2 text-xs focus:outline-none focus:bg-white focus:border-[#2B6CB0]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#718096] uppercase text-[10px] tracking-wider mb-1">
                      Sold-To (Impianto)
                    </label>
                    <input
                      type="text"
                      placeholder="Condominio Roma 15"
                      value={sameAsBillTo ? billTo : soldTo}
                      disabled={sameAsBillTo}
                      onChange={(e) => setSoldTo(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#D9DDE3] p-2 text-xs focus:outline-none focus:bg-white focus:border-[#2B6CB0] disabled:bg-[#E2E8F0] disabled:text-[#718096]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  <input
                    type="checkbox"
                    id="sameAsBillTo"
                    checked={sameAsBillTo}
                    onChange={(e) => handleSameAsBillToToggle(e.target.checked)}
                    className="rounded-none border-[#D9DDE3] text-[#2B6CB0] focus:ring-0"
                  />
                  <label htmlFor="sameAsBillTo" className="text-[11px] font-semibold text-[#718096] cursor-pointer">
                    Sold-To coincide con Bill-To
                  </label>
                </div>
              </div>

              {/* SEZIONE CATEGORIE DI VENDITA PRODOTTI */}
              {isModStyleDepartment && (
                <div className="bg-white p-3 border border-[#D9DDE3] space-y-2">
                  <label className="block font-bold text-[#1A202C] uppercase text-[10px] tracking-wider">
                    Tipologia di Vendita / Prodotti
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {MOD_PRODUCT_OPTIONS.map((prod) => (
                      <label
                        key={prod.id}
                        className={`flex items-center gap-2 p-2 border cursor-pointer text-xs font-semibold ${
                          selectedModProducts.includes(prod.id)
                            ? 'bg-[#EBF8FF] border-[#2B6CB0] text-[#2B6CB0]'
                            : 'bg-[#F8FAFC] border-[#D9DDE3] text-[#4A5568]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedModProducts.includes(prod.id)}
                          onChange={() => toggleModProduct(prod.id)}
                          className="rounded-none text-[#2B6CB0] focus:ring-0"
                        />
                        {prod.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white p-3 border border-[#D9DDE3] space-y-3">
                <div className="flex items-center gap-2 bg-[#F8FAFC] p-2 border border-[#D9DDE3]">
                  <input
                    type="checkbox"
                    id="censito"
                    checked={isCensito}
                    disabled={isCensitoLocked}
                    onChange={(e) => handleCensitoToggle(e.target.checked)}
                    className="rounded-none border-[#D9DDE3] text-[#2B6CB0] focus:ring-0"
                  />
                  <label htmlFor="censito" className="text-xs font-bold text-[#1A202C] cursor-pointer">
                    Già cliente nel Parco Impianti {isCensitoLocked && <span className="font-normal italic text-[#718096]">(Bloccato)</span>}
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#718096] uppercase text-[10px] tracking-wider mb-1">
                      Codice Account (Bill-To)
                    </label>
                    <input
                      type="text"
                      placeholder={isCensito ? "41489069" : "Non censito"}
                      value={accountCode}
                      disabled={!isCensito}
                      onChange={(e) => setAccountCode(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#D9DDE3] p-2 text-xs focus:outline-none focus:bg-white focus:border-[#2B6CB0] disabled:bg-[#E2E8F0]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#718096] uppercase text-[10px] tracking-wider mb-1">
                      Codice Contratto / Impianto
                    </label>
                    <input
                      type="text"
                      placeholder="10161874"
                      value={contractCode}
                      onChange={(e) => setContractCode(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#D9DDE3] p-2 text-xs focus:outline-none focus:bg-white focus:border-[#2B6CB0]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-[#718096] uppercase text-[10px] tracking-wider mb-1">
                      N° Imp.
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={numElevators}
                      onChange={(e) => setNumElevators(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#D9DDE3] p-2 text-xs focus:outline-none focus:bg-white focus:border-[#2B6CB0]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#718096] uppercase text-[10px] tracking-wider mb-1">
                      Valore (€)
                    </label>
                    <input
                      type="number"
                      placeholder="1200"
                      value={annualValue}
                      onChange={(e) => setAnnualValue(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#D9DDE3] p-2 text-xs focus:outline-none focus:bg-white focus:border-[#2B6CB0]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#718096] uppercase text-[10px] tracking-wider mb-1">
                      Stato Trattativa
                    </label>
                    <select
                      value={negotiationStatus}
                      onChange={(e) => setNegotiationStatus(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#D9DDE3] p-2 text-xs focus:outline-none focus:bg-white focus:border-[#2B6CB0]"
                    >
                      <optgroup label="DA FARE">
                        {SUB_STATUSES.IN_PROGRESS.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </optgroup>
                      <optgroup label="PRESO IN CARICO">
                        {SUB_STATUSES.WON.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </optgroup>
                      <optgroup label="COMPLETATO">
                        {SUB_STATUSES.COMPLETED.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white p-3 border border-[#D9DDE3]">
                <label className="block font-bold text-[#718096] uppercase text-[10px] tracking-wider mb-1">
                  Note / Dettagli Trattativa
                </label>
                <textarea
                  placeholder="Dettagli aggiuntivi..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-[#F8FAFC] border border-[#D9DDE3] p-2 text-xs focus:outline-none focus:bg-white focus:border-[#2B6CB0]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#D9DDE3]">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-xs font-bold text-[#718096] hover:text-[#1A202C] bg-white border border-[#D9DDE3] uppercase tracking-wider"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs bg-[#2B6CB0] hover:bg-[#245992] text-white font-bold uppercase tracking-wider shadow-2xs"
                >
                  {editingProjectId ? 'Aggiorna Pratica' : 'Salva Pratica'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}