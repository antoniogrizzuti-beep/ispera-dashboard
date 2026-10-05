'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface ScheduleEvent {
  id: string;
  title: string;
  start_time: string;
}

export default function ScheduleSidebar() {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('09:00');
  const [showModal, setShowModal] = useState(false);

  const currentDate = new Date();
  const dateFormatted = format(currentDate, 'dd MMM yyyy', { locale: it }).toUpperCase();

  const fetchTodayEvents = async () => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('schedule_events')
      .select('*')
      .gte('start_time', startOfDay.toISOString())
      .lte('start_time', endOfDay.toISOString())
      .order('start_time', { ascending: true });

    if (!error && data) {
      setEvents(data);
    }
  };

  useEffect(() => {
    fetchTodayEvents();
  }, []);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const [hours, minutes] = newTime.split(':');
    const eventDate = new Date();
    eventDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

    const { error } = await supabase.from('schedule_events').insert([
      {
        title: newTitle,
        start_time: eventDate.toISOString(),
      },
    ]);

    if (!error) {
      setNewTitle('');
      setShowModal(false);
      fetchTodayEvents();
    }
  };

  return (
    <aside className="w-80 bg-[#EFECE6] text-[#332F2E] p-5 flex flex-col border-r border-[#E2DDD5] min-h-screen shrink-0">
      <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#E2DDD5] mb-6 flex items-center justify-between shadow-sm">
        <div>
          <span className="text-xs text-[#726A66] font-semibold uppercase tracking-wider block">Oggi</span>
          <span className="text-xl font-bold tracking-tight text-[#332F2E]">{dateFormatted}</span>
        </div>
        <CalendarIcon className="w-6 h-6 text-[#7F9AA7]" />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold tracking-wide text-[#332F2E]">Schedule</h2>
        <button
          onClick={() => setShowModal(true)}
          className="p-1.5 bg-[#7F9AA7] hover:bg-[#6C8896] text-white rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
        {events.length === 0 ? (
          <p className="text-xs text-[#726A66] italic text-center py-6">Nessun impegno in programma.</p>
        ) : (
          events.map((evt) => (
            <div
              key={evt.id}
              className="p-3 bg-[#FAF8F5] hover:bg-white rounded-xl border border-[#E2DDD5] flex items-center gap-3 transition-all shadow-sm"
            >
              <div className="flex items-center gap-1 text-xs font-mono text-[#4A6372] bg-[#7F9AA7]/15 px-2 py-1 rounded-lg border border-[#7F9AA7]/20 font-semibold">
                <Clock className="w-3 h-3" />
                {format(new Date(evt.start_time), 'HH:mm')}
              </div>
              <span className="text-xs text-[#332F2E] font-medium flex-1 truncate">{evt.title}</span>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#FAF8F5] border border-[#E2DDD5] p-6 rounded-2xl w-full max-w-md shadow-xl">
            <h3 className="text-base font-bold text-[#332F2E] mb-4">Nuovo Appuntamento</h3>
            <form onSubmit={handleAddEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#726A66] mb-1">Orario</label>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full bg-white border border-[#E2DDD5] text-[#332F2E] rounded-xl p-2.5 text-sm focus:outline-none focus:border-[#7F9AA7]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#726A66] mb-1">Descrizione</label>
                <input
                  type="text"
                  placeholder="Sopralluogo Via Pascoli"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-white border border-[#E2DDD5] text-[#332F2E] rounded-xl p-2.5 text-sm focus:outline-none focus:border-[#7F9AA7]"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#726A66] hover:text-[#332F2E]"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-[#7F9AA7] hover:bg-[#6C8896] text-white rounded-xl font-semibold shadow-sm"
                >
                  Salva Appuntamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}