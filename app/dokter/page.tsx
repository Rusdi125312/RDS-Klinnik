'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// INTERFACES (SESUAI SCHEMA SQL KAMU)
interface Dokter {
  id_dokter: number;
  nama_dokter: string;
  spesialisasi: string;
  no_telp: string;
}

interface JadwalDokter {
  id_jadwal: number;
  id_dokter: number;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  dokter?: Dokter | null;
}

export default function HalamanDokter() {
  // Master List States
  const [listDokter, setListDokter] = useState<Dokter[]>([]);
  const [listJadwal, setListJadwal] = useState<JadwalDokter[]>([]);
  const [loadingDokter, setLoadingDokter] = useState<boolean>(true);
  const [loadingJadwal, setLoadingJadwal] = useState<boolean>(true);

  // Form State - Dokter
  const [namaDokter, setNamaDokter] = useState<string>('');
  const [spesialisasi, setSpesialisasi] = useState<string>('');
  const [telpDokter, setTelpDokter] = useState<string>('');
  const [isEditingDokter, setIsEditingDokter] = useState<boolean>(false);
  const [editDokterId, setEditDokterId] = useState<number | null>(null);

  // Form State - Jadwal Dokter
  const [selectedIdDokter, setSelectedIdDokter] = useState<string>('');
  const [hari, setHari] = useState<string>('Senin');
  const [jamMulai, setJamMulai] = useState<string>('');
  const [jamSelesai, setJamSelesai] = useState<string>('');
  const [isEditingJadwal, setIsEditingJadwal] = useState<boolean>(false);
  const [editJadwalId, setEditJadwalId] = useState<number | null>(null);

  // FETCH DATA
  const fetchDokter = async () => {
    setLoadingDokter(true);
    const { data } = await supabase.from('dokter').select('*').order('id_dokter', { ascending: false });
    if (data) setListDokter(data);
    setLoadingDokter(false);
  };

  const fetchJadwal = async () => {
    setLoadingJadwal(true);
    const { data } = await supabase
      .from('jadwal_dokter')
      .select('id_jadwal, id_dokter, hari, jam_mulai, jam_selesai, dokter(nama_dokter, spesialisasi)')
      .order('id_jadwal', { ascending: false });
    if (data) setListJadwal(data as any);
    setLoadingJadwal(false);
  };

  useEffect(() => {
    fetchDokter();
    fetchJadwal();
  }, []);

  // ==========================================
  // HANDLER CRUD DOKTER
  // ==========================================
  const handleDokterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditingDokter && editDokterId !== null) {
      const { error } = await supabase
        .from('dokter')
        .update({ nama_dokter: namaDokter, spesialisasi, no_telp: telpDokter })
        .eq('id_dokter', editDokterId);

      if (!error) {
        alert('Data dokter berhasil diperbarui!');
        resetFormDokter();
        fetchDokter();
        fetchJadwal(); // Refresh info dokter di tabel jadwal
      }
    } else {
      const { error } = await supabase
        .from('dokter')
        .insert([{ nama_dokter: namaDokter, spesialisasi, no_telp: telpDokter }]);

      if (!error) {
        alert('Dokter baru berhasil didaftarkan!');
        resetFormDokter();
        fetchDokter();
      }
    }
  };

  const handleHapusDokter = async (id: number, nama: string) => {
    if (confirm(`Hapus dokter "${nama}"? Semua jadwal terkait akan ikut terhapus otomatis (CASCADE).`)) {
      const { error } = await supabase.from('dokter').delete().eq('id_dokter', id);
      if (!error) {
        alert('Data dokter terhapus.');
        fetchDokter();
        fetchJadwal();
      } else {
        alert('Gagal menghapus: Kemungkinan dokter masih terikat rekam medis.');
      }
    }
  };

  const resetFormDokter = () => {
    setNamaDokter('');
    setSpesialisasi('');
    setTelpDokter('');
    setIsEditingDokter(false);
    setEditDokterId(null);
  };

  // ==========================================
  // HANDLER CRUD JADWAL
  // ==========================================
  const handleJadwalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIdDokter) return alert('Pilih dokter terlebih dahulu!');

    const payload = {
      id_dokter: parseInt(selectedIdDokter),
      hari,
      jam_mulai: jamMulai.length === 5 ? `${jamMulai}:00` : jamMulai,
      jam_selesai: jamSelesai.length === 5 ? `${jamSelesai}:00` : jamSelesai,
    };

    if (isEditingJadwal && editJadwalId !== null) {
      const { error } = await supabase.from('jadwal_dokter').update(payload).eq('id_jadwal', editJadwalId);
      if (!error) {
        alert('Jadwal praktek berhasil diubah!');
        resetFormJadwal();
        fetchJadwal();
      }
    } else {
      const { error } = await supabase.from('jadwal_dokter').insert([payload]);
      if (!error) {
        alert('Jadwal praktek baru berhasil ditambahkan!');
        resetFormJadwal();
        fetchJadwal();
      }
    }
  };

  const handleHapusJadwal = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus slot jadwal ini?')) {
      const { error } = await supabase.from('jadwal_dokter').delete().eq('id_jadwal', id);
      if (!error) {
        alert('Jadwal berhasil dihapus.');
        fetchJadwal();
      }
    }
  };

  const resetFormJadwal = () => {
    setSelectedIdDokter('');
    setHari('Senin');
    setJamMulai('');
    setJamSelesai('');
    setIsEditingJadwal(false);
    setEditJadwalId(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-12">
      
      {/* SECTION 1: KELOLA DATA MASTER DOKTER */}
      <div className="space-y-4">
        <div className="border-b border-slate-200 pb-2">
          <h1 className="text-xl font-black text-blue-600 font-mono tracking-tight">// MASTER DATA TENAGA MEDIS (DOKTER)</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleDokterSubmit} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-fit space-y-4">
            <h3 className="text-xs font-bold font-mono uppercase text-indigo-600">{isEditingDokter ? '✏️ Edit Dokter' : '➕ Tambah Dokter'}</h3>
            <div>
              <label className="block text-xs font-mono text-slate-500 mb-1">Nama Dokter</label>
              <input type="text" value={namaDokter} onChange={(e) => setNamaDokter(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-blue-500" placeholder="Contoh: dr. Setiawan" />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-500 mb-1">Spesialisasi</label>
              <input type="text" value={spesialisasi} onChange={(e) => setSpesialisasi(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-blue-500" placeholder="Contoh: Umum / Anak / Dalam" />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-500 mb-1">No. Telepon</label>
              <input type="text" value={telpDokter} onChange={(e) => setTelpDokter(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-blue-500" placeholder="08xxxxxxxxxx" />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-xl text-xs font-mono uppercase">Simpan</button>
              {isEditingDokter && <button type="button" onClick={resetFormDokter} className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 px-4 rounded-xl text-xs font-mono uppercase">Batal</button>}
            </div>
          </form>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-mono border-b border-slate-200">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Nama Dokter</th>
                    <th className="p-3">Spesialisasi</th>
                    <th className="p-3">No. Telp</th>
                    <th className="p-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingDokter ? (
                    <tr><td colSpan={5} className="p-4 text-center font-mono">LOADING...</td></tr>
                  ) : listDokter.length === 0 ? (
                    <tr><td colSpan={5} className="p-4 text-center text-slate-400 font-mono">[KOSONG]</td></tr>
                  ) : (
                    listDokter.map((d) => (
                      <tr key={d.id_dokter}>
                        <td className="p-3 font-mono font-bold text-blue-600">#DOC-{d.id_dokter}</td>
                        <td className="p-3 font-semibold text-slate-800">{d.nama_dokter}</td>
                        <td className="p-3"><span className="bg-slate-100 border px-2 py-0.5 rounded text-slate-700">{d.spesialisasi}</span></td>
                        <td className="p-3 font-mono">{d.no_telp || '-'}</td>
                        <td className="p-3 flex justify-center space-x-1">
                          <button onClick={() => { setIsEditingDokter(true); setEditDokterId(d.id_dokter); setNamaDokter(d.nama_dokter); setSpesialisasi(d.spesialisasi); setTelpDokter(d.no_telp || ''); }} className="px-2 py-1 border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-md font-semibold">✏️</button>
                          <button onClick={() => handleHapusDokter(d.id_dokter, d.nama_dokter)} className="px-2 py-1 border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md font-semibold">🗑️</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: KELOLA JADWAL PRAKTEK DOKTER */}
      <div className="space-y-4">
        <div className="border-b border-slate-200 pb-2">
          <h1 className="text-xl font-black text-indigo-600 font-mono tracking-tight">// AGENDA / JADWAL PRAKTEK</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleJadwalSubmit} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-fit space-y-4">
            <h3 className="text-xs font-bold font-mono uppercase text-indigo-600">{isEditingJadwal ? '✏️ Edit Jadwal' : '➕ Atur Shift Hari'}</h3>
            <div>
              <label className="block text-xs font-mono text-slate-500 mb-1">Pilih Dokter</label>
              <select value={selectedIdDokter} onChange={(e) => setSelectedIdDokter(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none">
                <option value="">-- Hubungkan Dokter --</option>
                {listDokter.map((d) => <option key={d.id_dokter} value={d.id_dokter}>{d.nama_dokter} ({d.spesialisasi})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-500 mb-1">Hari Kerja</label>
              <select value={hari} onChange={(e) => setHari(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none">
                {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-mono text-slate-500 mb-1">Jam Mulai</label>
                <input type="time" value={jamMulai} onChange={(e) => setJamMulai(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-500 mb-1">Jam Selesai</label>
                <input type="time" value={jamSelesai} onChange={(e) => setJamSelesai(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-xl text-xs font-mono uppercase">Simpan Slot</button>
              {isEditingJadwal && <button type="button" onClick={resetFormJadwal} className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 px-4 rounded-xl text-xs font-mono uppercase">Batal</button>}
            </div>
          </form>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-mono border-b border-slate-200">
                  <tr>
                    <th className="p-3">Nama Dokter</th>
                    <th className="p-3">Spesialisasi</th>
                    <th className="p-3">Hari Kerja</th>
                    <th className="p-3">Shift Waktu</th>
                    <th className="p-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingJadwal ? (
                    <tr><td colSpan={5} className="p-4 text-center font-mono">LOADING...</td></tr>
                  ) : listJadwal.length === 0 ? (
                    <tr><td colSpan={5} className="p-4 text-center text-slate-400 font-mono">[KOSONG]</td></tr>
                  ) : (
                    listJadwal.map((j) => (
                      <tr key={j.id_jadwal}>
                        <td className="p-3 font-semibold text-slate-800">{j.dokter?.nama_dokter || 'N/A'}</td>
                        <td className="p-3 text-slate-500">{j.dokter?.spesialisasi || 'N/A'}</td>
                        <td className="p-3 font-mono font-bold text-slate-700">{j.hari}</td>
                        <td className="p-3 font-mono font-semibold text-indigo-600">⏱️ {j.jam_mulai.slice(0, 5)} - {j.jam_selesai.slice(0, 5)} WIB</td>
                        <td className="p-3 flex justify-center space-x-1">
                          <button onClick={() => { setIsEditingJadwal(true); setEditJadwalId(j.id_jadwal); setSelectedIdDokter(j.id_dokter.toString()); setHari(j.hari); setJamMulai(j.jam_mulai.slice(0, 5)); setJamSelesai(j.jam_selesai.slice(0, 5)); }} className="px-2 py-1 border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-md font-semibold">✏️</button>
                          <button onClick={() => handleHapusJadwal(j.id_jadwal)} className="px-2 py-1 border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md font-semibold">🗑️</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}