'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Pasien {
  id_pasien: number;
  nama_pasien: string;
  tanggal_lahir: string;
  jenis_kelamin: 'L' | 'P';
  alamat: string;
  no_telp: string;
  tanggal_daftar: string;
}

export default function HalamanPasien() {
  const [listPasien, setListPasien] = useState<Pasien[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Form State
  const [namaPasien, setNamaPasien] = useState<string>('');
  const [tglLahir, setTglLahir] = useState<string>('');
  const [gender, setGender] = useState<'L' | 'P'>('L');
  const [telpPasien, setTelpPasien] = useState<string>('');
  const [alamatPasien, setAlamatPasien] = useState<string>('');

  // Edit State Tracker
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editId, setEditId] = useState<number | null>(null);

  const fetchPasien = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pasien')
      .select('*')
      .order('id_pasien', { ascending: false });

    if (error) {
      console.error('Gagal memuat data pasien:', error.message);
    } else {
      setListPasien(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPasien();
  }, []);

  // Handler Kirim Form (Bisa Tambah Baru atau Update Data)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing && editId !== null) {
      // PROSES UPDATE (EDIT)
      const { error } = await supabase
        .from('pasien')
        .update({
          nama_pasien: namaPasien,
          tanggal_lahir: tglLahir,
          jenis_kelamin: gender,
          no_telp: telpPasien,
          alamat: alamatPasien,
        })
        .eq('id_pasien', editId);

      if (error) {
        alert(`Gagal mengupdate data: ${error.message}`);
      } else {
        alert(`Berhasil memperbarui data pasien!`);
        resetForm();
        fetchPasien();
      }
    } else {
      // PROSES INSERT (TAMBAH BARU)
      const { error } = await supabase
        .from('pasien')
        .insert([
          { 
            nama_pasien: namaPasien, 
            tanggal_lahir: tglLahir, 
            jenis_kelamin: gender, 
            no_telp: telpPasien, 
            alamat: alamatPasien 
          }
        ]);

      if (error) {
        alert(`Gagal menyimpan: ${error.message}`);
      } else {
        alert(`Berhasil mendaftarkan pasien "${namaPasien}"!`);
        resetForm();
        fetchPasien();
      }
    }
  };

  // Memicu Mode Edit & Melempar Data ke Form Input
  const handleEditClick = (pasien: Pasien) => {
    setIsEditing(true);
    setEditId(pasien.id_pasien);
    setNamaPasien(pasien.nama_pasien);
    setTglLahir(pasien.tanggal_lahir);
    setGender(pasien.jenis_kelamin);
    setTelpPasien(pasien.no_telp || '');
    setAlamatPasien(pasien.alamat || '');
  };

  // Handler Hapus Data Pasien
  const handleHapusPasien = async (id: number, nama: string) => {
    const konfirmasi = confirm(`Apakah kamu yakin ingin menghapus data pasien bernama "${nama}"?`);
    
    if (konfirmasi) {
      const { error } = await supabase
        .from('pasien')
        .delete()
        .eq('id_pasien', id);

      if (error) {
        alert(`Gagal menghapus data: ${error.message}\nCatatan: Pasien mungkin sudah memiliki riwayat pemeriksaan.`);
      } else {
        alert(`Data pasien "${nama}" telah dihapus.`);
        if (editId === id) resetForm(); // Reset jika data yang sedang diedit malah dihapus
        fetchPasien();
      }
    }
  };

  // Helper Reset Form State
  const resetForm = () => {
    setIsEditing(false);
    setEditId(null);
    setNamaPasien('');
    setTglLahir('');
    setGender('L');
    setTelpPasien('');
    setAlamatPasien('');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-black text-blue-600 font-mono tracking-tight">// REGISTRASI MASTER PASIEN</h1>
        <p className="text-xs text-slate-500 mt-1">Kelola pendaftaran, pembaruan, dan penghapusan identitas pasien klinik RSD Medica.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FORM INPUT / EDIT PASIEN */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
          <div className="mb-4">
            <h3 className="text-xs font-bold font-mono uppercase text-indigo-600 tracking-wider">
              {isEditing ? `// Mode Edit Pasien: #PAS-${editId}` : '// Input Pasien Baru'}
            </h3>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-500 uppercase mb-1.5 tracking-wider">Nama Lengkap</label>
              <input type="text" value={namaPasien} onChange={(e) => setNamaPasien(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-blue-500 text-slate-800" placeholder="Nama Pasien..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-500 uppercase mb-1.5 tracking-wider">Tgl Lahir</label>
                <input type="date" value={tglLahir} onChange={(e) => setTglLahir(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-blue-500 text-slate-800" />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-500 uppercase mb-1.5 tracking-wider">Gender</label>
                <select value={gender} onChange={(e) => setGender(e.target.value as 'L' | 'P')} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-blue-500 text-slate-800">
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-500 uppercase mb-1.5 tracking-wider">No. Telepon</label>
              <input type="text" value={telpPasien} onChange={(e) => setTelpPasien(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-blue-500 text-slate-800" placeholder="08xxxxxxxxxx" />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-500 uppercase mb-1.5 tracking-wider">Alamat Rumah</label>
              <textarea value={alamatPasien} onChange={(e) => setAlamatPasien(e.target.value)} rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-blue-500 text-slate-800" placeholder="Alamat domisili..."></textarea>
            </div>

            <div className="space-y-2 pt-2">
              <button type="submit" className={`w-full text-white font-bold py-3 px-4 rounded-xl shadow-md active:scale-[0.98] transition-all text-xs uppercase tracking-wider font-mono ${isEditing ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-blue-600 hover:bg-blue-500'}`}>
                {isEditing ? 'Simpan Perubahan' : 'Simpan Pasien'}
              </button>
              
              {isEditing && (
                <button type="button" onClick={resetForm} className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 px-4 rounded-xl text-xs uppercase tracking-wider font-mono transition-all">
                  Batal Edit
                </button>
              )}
            </div>
          </form>
        </section>

        {/* TABEL DATABASE PASIEN */}
        <section className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <span className="text-xs font-bold font-mono uppercase text-slate-500 tracking-wider">// Database Pasien Terdaftar</span>
            <button onClick={fetchPasien} className="text-xs border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1.5 rounded-lg font-mono">🔄 Refresh</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-mono border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Nama Pasien</th>
                  <th className="p-3">Gender</th>
                  <th className="p-3">Kontak</th>
                  <th className="p-3">Alamat</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center font-mono text-blue-500 animate-pulse">FETCHING_PASIEN_DATA...</td></tr>
                ) : listPasien.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-400 font-mono">[NO_DATA_FOUND]</td></tr>
                ) : (
                  listPasien.map((p) => (
                    <tr key={p.id_pasien} className={`hover:bg-slate-50/50 transition-all ${editId === p.id_pasien ? 'bg-indigo-50/60 hover:bg-indigo-50' : ''}`}>
                      <td className="p-3 font-mono text-blue-600 font-bold">#PAS-{p.id_pasien}</td>
                      <td className="p-3 font-semibold text-slate-800">{p.nama_pasien}</td>
                      <td className="p-3 font-mono">{p.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</td>
                      <td className="p-3 font-mono text-slate-500">{p.no_telp || '-'}</td>
                      <td className="p-3 max-w-[120px] truncate text-slate-500">{p.alamat || '-'}</td>
                      <td className="p-3 flex items-center justify-center space-x-2">
                        <button 
                          onClick={() => handleEditClick(p)}
                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-md font-semibold transition-all"
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          onClick={() => handleHapusPasien(p.id_pasien, p.nama_pasien)}
                          className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md font-semibold transition-all"
                        >
                          🗑️ Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}