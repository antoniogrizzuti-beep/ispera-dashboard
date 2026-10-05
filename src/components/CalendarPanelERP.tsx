'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Calendar as CalendarIcon, Clock, MapPin, DollarSign, Users, Briefcase } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export interface CalendarEvent {
  id: string;
  title: string;
  event_type: 'INCONTRO_COMMERCIALE' | 'INCASSI' | 'RIUNIONE' | 'SOPRALLUOGO';
  event_date: string;
  start_time: string;
  end_time?: string;
  notes?: string;
  project_id?: string;
  projects?: { title: string };
}

const EVENT_TYPES = [
  { id: 'INCONTRO_COMMERCIALE', label: 'Incontro Commerciale', color: 'bg-[#2B6CB0] text-white', icon: Briefcase },
  { id: 'INCASSI', label: 'Incassi', color: 'bg-[#D69E2E] text-white', icon: DollarSign },
  { id: 'RIUNIONE', label: 'Riunione', color: 'bg-[#2D3748] text-white', icon: Users },
  { id: 'SOPRALLUOGO', label: 'Sopralluogo', color: 'bg-[#38A169] text-white', icon: MapPin },
];

export default function CalendarPanelERP() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<'INCONTRO_COMMERCIALE' | 'INCASSI' | 'RIUNIONE' | 'SOPRALLUOGO'>('INCONTRO_COMMERCIALE');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [notes, setNotes] = useState('');

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*, projects(title)')
      .order('event_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (!error && data) setEvents(data as any);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !eventDate || !startTime) return;

    const { error } = await supabase.from('calendar_events').insert([
      {
        title,
        event_type: eventType,
        event_date: eventDate,
        start_time: startTime,
        end_time: endTime || null,
        notes: notes || null,
      },
    ]);

    if (!error) {
      setShowModal(false);
      resetForm();
      fetchEvents();
    } else {
      alert(`Errore salvataggio impegno: ${error.message}`);
    }
  };

  const resetForm = () => {
    setTitle('');
    setEventType('INCONTRO_COMMERCIALE');
    setEventDate(new Date().toISOString().split('T')[0]);
    setStartTime('09:00');
    setEndTime('10:00');
    setNotes('');
  };

  const renderTypeBadge = (type: string) => {
    const config = EVENT_TYPES.find((t) => t.id === type);
    if (!config) return null;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wider ${config.color}`}>
        <Icon className="w-2.5 h-2.5" /> {config.label}
      </span>
    );
  };

  return (
    <aside className="w-80 bg-white border-l border-[#D9DDE3] flex flex-col shrink-0 min-h-screen text-xs">
      {/* Header Agenda */}
      <div className="p-4 border-b border-[#D9DDE3] flex items-center justify-between bg-[#F8FAFC]">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-[#2B6CB0]" />
          <h3 className="font-bold text-[#1A202C] uppercase tracking-wider text-xs">Agenda & Impegni</h3>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#2B6CB0] hover:bg-[#245992] text-white p-1 rounded shadow-2xs transition-colors"
          title="Nuovo Impegno"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Lista Impegni */}
      <div className="p-4 space-y-3 overflow-y-auto flex-1">
        {events.length === 0 ? (
          <p className="text-center text-[#718096] italic py-8 text-[11px]">Nessun impegno in programma.</p>
        ) : (
          events.map((ev) => (
            <div key={ev.id} className="p-3 border border-[#D9DDE3] bg-[#F8FAFC] space-y-1.5 hover:border-[#2B6CB0] transition-colors">
              <div className="flex items-center justify-between">
                {renderTypeBadge(ev.event_type)}
                <div className="flex items-center gap-1 text-[#718096] font-mono text-[10px]">
                  <Clock className="w-3 h-3" />
                  <span>{ev.start_time.slice(0, 5)} {ev.end_time ? `- ${ev.end_time.slice(0, 5)}` : ''}</span>
                </div>
              </div>

              <h4 className="font-bold text-[#1A202C] text-xs">{ev.title}</h4>

              <div className="text-[10px] text-[#718096] flex items-center justify-between font-mono pt-1 border-t border-[#E2E8F0]">
                <span>{new Date(ev.event_date).toLocaleDateString('it-IT')}</span>
                {ev.projects?.title && (
                  <span className="truncate max-w-[120px] font-semibold text-[#2B6CB0]">{ev.projects.title}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODALE NUOVO IMPEGNO */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#D9DDE3] w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-[#2D3748] text-white px-4 py-2.5 flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider">Nuovo Impegno in Agenda</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateEvent} className="p-4 space-y-3 bg-[#F0F2F5]">
              <div>
                <label className="block font-bold text-[#1A202C] uppercase text-[10px] tracking-wider mb-1">
                  Titolo / Oggetto *
                </label>
                <input
                  type="text"
                  placeholder="es. Sopralluogo cantiere Cond. Roma 15"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#D9DDE3] p-2 text-xs focus:outline-none focus:bg-white focus:border-[#2B6CB0]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#1A202C] uppercase text-[10px] tracking-wider mb-1">
                  Tipologia Impegno *
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as any)}
                  className="w-full bg-[#F8FAFC] border border-[#D9DDE3] p-2 text-xs focus:outline-none focus:bg-white focus:border-[#2B6CB0]"
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-[#718096] uppercase text-[10px] tracking-wider mb-1">
                    Data *
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#D9DDE3] p-1.5 text-xs focus:outline-none focus:bg-white focus:border-[#2B6CB0]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#718096] uppercase text-[10px] tracking-wider mb-1">
                    Ora Inizio *
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#D9DDE3] p-1.5 text-xs focus:outline-none focus:bg-white focus:border-[#2B6CB0]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#718096] uppercase text-[10px] tracking-wider mb-1">
                    Ora Fine
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#D9DDE3] p-1.5 text-xs focus:outline-none focus:bg-white focus:border-[#2B6CB0]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#718096] uppercase text-[10px] tracking-wider mb-1">
                  Note / Dettagli
                </label>
                <textarea
                  placeholder="Dettagli appuntamento..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-[#F8FAFC] border border-[#D9DDE3] p-2 text-xs focus:outline-none focus:bg-white focus:border-[#2B6CB0]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#D9DDE3]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 text-xs font-bold text-[#718096] bg-white border border-[#D9DDE3] uppercase"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs bg-[#2B6CB0] text-white font-bold uppercase shadow-2xs"
                >
                  Salva Impegno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}