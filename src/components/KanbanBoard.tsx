'use client';

import React, { useState, useEffect } from 'react';
import { Plus, FileText, AlertTriangle, RefreshCw, Pencil, Trash2, LayoutGrid, List, Wrench, PackageCheck, Calendar as CalendarIcon, Clock, PlusCircle } from 'lucide-react';
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
  calendar_events?: Array<{
    id: string;
    title: string;
    event_type: string;
    event_date: string;
    start_time: string;
  }>;
}

interface KanbanBoardProps {
  department: 'SERVICE' | 'MOD' | 'FIUME_SANTO' | 'CARBOTERMO';
}

const COLUMNS = [
  { id: 'IN_PROGRESS', title: 'Da Fare', badgeColor: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'WON', title: 'Preso in Carico', badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { id: 'COMPLETED', title: 'Completato', badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
];

const SUB_STATUSES = {
  IN_PROGRESS: ['Non iniziata'],
  WON: ['In attesa di Check-List', 'Pianificato', 'Offerta - Pronta per invio', 'In attesa / Sospeso', 'In lavorazione'],
  COMPLETED: ['Offerta Inviata', 'Offerta Accettata', 'Ordine Ricevuto', 'Ordine di Vendita Creato', 'Offerta Rifiutata']
};

export default function KanbanBoard({ department }: KanbanBoardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  // Form States
  const [clientName, setClientName] = useState('');
  const [negotiationStatus, setNegotiationStatus] = useState('Non iniziata');
  const [taskEvents, setTaskEvents] = useState<any[]>([]);
  const [showNewEventForm, setShowNewEventForm] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState('SOPRALLUOGO');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*, clients(*), calendar_events(*)')
      .eq('department', department);

    if (!error && data) setProjects(data as any);
  };

  useEffect(() => {
    setProjects([]);
    fetchProjects();
  }, [department]);

  const openEditModal = (proj: Project) => {
    setEditingProjectId(proj.id);
    setClientName(proj.clients?.name || proj.title || '');
    setNegotiationStatus(proj.negotiation_status || 'Non iniziata');
    setTaskEvents(proj.calendar_events || []);
    setShowNewEventForm(false);
    setEventTitle(`Sopralluogo ${proj.clients?.name || proj.title}`);
    setShowModal(true);
  };

  const handleAddDirectEvent = async () => {
    if (!editingProjectId || !eventTitle) return;
    const { data, error } = await supabase.from('calendar_events').insert([
      { title: eventTitle, event_type: eventType, event_date: eventDate, start_time: startTime, project_id: editingProjectId }
    ]).select().single();

    if (!error && data) {
      setTaskEvents((prev) => [...prev, data]);
      setShowNewEventForm(false);
      fetchProjects();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Toolbar Responsive */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Dipartimento {department}</h2>
          <p className="text-xs text-slate-500 font-medium">Gestione commesse, avanzamento e appuntamenti</p>
        </div>

        <button
          onClick={() => { setEditingProjectId(null); setClientName(''); setShowModal(true); }}
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> Nuova Pratica
        </button>
      </div>

      {/* Kanban responsive con Scroll orizzontale su iPad */}
      <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin">
        {COLUMNS.map((col) => {
          const colProjects = projects.filter((p) => {
            if (col.id === 'IN_PROGRESS') return p.status === 'IN_PROGRESS';
            if (col.id === 'WON') return p.status === 'WON';
            if (col.id === 'COMPLETED') return p.status === 'COMPLETED';
            return false;
          });

          return (
            <div key={col.id} className="min-w-[300px] sm:min-w-[340px] flex-1 bg-slate-100/70 p-4 rounded-2xl border border-slate-200/80 flex flex-col snap-center">
              <div className="flex items-center justify-between mb-4 px-1">
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${col.badgeColor}`}>
                  {col.title}
                </span>
                <span className="text-xs font-bold text-slate-500 bg-white px-2.5 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                  {colProjects.length}
                </span>
              </div>

              <div className="space-y-3 flex-1">
                {colProjects.map((proj) => (
                  <div key={proj.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {proj.department}
                      </span>
                      <button onClick={() => openEditModal(proj)} className="text-slate-400 hover:text-indigo-600 p-1">
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>

                    <h4 className="font-bold text-slate-800 text-sm">{proj.title}</h4>

                    {proj.calendar_events && proj.calendar_events.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        <span>{proj.calendar_events.length} Attività in Agenda</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modale Responsive per iPad e Mobile */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-6">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">{editingProjectId ? 'Dettaglio Pratica & Attività' : 'Nuova Pratica'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-lg font-bold">✕</button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Cliente / Oggetto Pratica</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
                  placeholder="Inserisci nome o condominio..."
                />
              </div>

              {/* Sezione Attività all'interno del Task */}
              {editingProjectId && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <CalendarIcon className="w-4 h-4 text-indigo-600" /> Attività in Agenda
                    </span>
                    <button
                      onClick={() => setShowNewEventForm(!showNewEventForm)}
                      className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      <PlusCircle className="w-4 h-4" /> Aggiungi
                    </button>
                  </div>

                  {taskEvents.map((ev) => (
                    <div key={ev.id} className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                      <span className="font-bold text-slate-800 block">{ev.title}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{ev.event_date} alle {ev.start_time?.slice(0, 5)}</span>
                    </div>
                  ))}

                  {showNewEventForm && (
                    <div className="bg-white p-3 rounded-xl border border-indigo-200 space-y-2 mt-2 shadow-xs">
                      <input
                        type="text"
                        placeholder="Titolo attività"
                        value={eventTitle}
                        onChange={(e) => setEventTitle(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs" />
                        <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs" />
                      </div>
                      <button onClick={handleAddDirectEvent} className="w-full bg-indigo-600 text-white rounded-lg py-2 font-bold text-xs">
                        Salva in Agenda
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-xs font-bold text-slate-600 bg-white rounded-xl border border-slate-200">Chiudi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}