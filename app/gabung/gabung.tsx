'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// ==========================================
// 1. DEFINISI INTERFACES SESUAI SCHEMA SQL
// ==========================================
interface PasienRelation {
  nama_pasien: string;
}

interface DokterRelation {
  nama_dokter: string;
}

interface PemeriksaanData {
  id_pemeriksaan: number;
  tanggal_periksa: string;
  keluhan: string;
  diagnosa: string;
  biaya_dokter: number;
  total_bayar: number;
  status_pembayaran: 'Belum Lunas' | 'Lunas';
  pasien: PasienRelation[] | PasienRelation | null;
  dokter: DokterRelation[] | DokterRelation | null;
}

interface JadwalDokterData {
  id_jadwal: number;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  dokter: {
    nama_dokter: string;
    spesialisasi: string;
  } | null;
}

interface DokterDropdownData {
  id_dokter: number;
  nama_dokter: string;
  spesialisasi: string;
}

export default function DashboardKlinik() {
  // State Navigasi Tab
  const [activeTab, setActiveTab] = useState<'pemeriksaan' | 'jadwal'>('pemeriksaan');

  // Loading States
  const [loadingPemeriksaan, setLoadingPemeriksaan] = useState<boolean>(true);
  const [loadingJadwal, setLoadingJadwal] = useState<boolean>(true);

  // ==========================================
  // STATE DATA DARI DATABASE
  // ==========================================
  const [listPemeriksaan, setListPemeriksaan] = useState<PemeriksaanData[]>([]);
  const [listJadwal, setListJadwal] = useState<JadwalDokterData[]>([]);
  const [listDokterDropdown, setListDokterDropdown] = useState<DokterDropdownData[]>([]);

  // ==========================================
  // STATE INPUT FORM PASIEN
  // ==========================================
  const [namaPasien, setNamaPasien] = useState<string>('');
  const [tglLahir, setTglLahir] = useState<string>('');
  const [gender, setGender] = useState<'L' | 'P'>('L'); // Sesuai jenis_kelamin_enum kamu
  const [telpPasien, setTelpPasien] = useState<string>('');
  const [alamatPasien, setAlamatPasien] = useState<string>('');

  // ==========================================
  // STATE INPUT FORM JADWAL DOKTER
  // ==========================================
  const [selectedIdDokter, setSelectedIdDokter] = useState<string>('');
  const [hari, setHari] = useState<string>('Senin');
  const [jamMulai, setJamMulai] = useState<string>('');
  const [jamSelesai, setJamSelesai] = useState<string>('');

  // ==========================================
  // 2. FUNGSI FETCH DATA (SUPABASE)
  // ==========================================
  const fetchPemeriksaan = async () => {
    setLoadingPemeriksaan(true);
    const { data, error } = await supabase
      .from('pemeriksaan')
      .select(`
        id_pemeriksaan,
        tanggal_periksa,
        keluhan,
        diagnosa,
        biaya_dokter,
        total_bayar,
        status_pembayaran,
        pasien ( nama_pasien ),
        dokter ( nama_dokter )
      `)
      .order('id_pemeriksaan', { ascending: false });

    if (error) {
      console.error("Gagal mengambil data pemeriksaan:", error.message);
    } else {
      setListPemeriksaan((data as any) || []);
    }
    setLoadingPemeriksaan(false);
  };

  const fetchJadwalDanDokter = async () => {
    setLoadingJadwal(true);
    
    // 1. Ambil list jadwal dokter beserta join ke tabel dokter
    const { data: jadwalData, error: errorJadwal } = await supabase
      .from('jadwal_dokter')
      .select(`
        id_jadwal,
        hari,
        jam_mulai,
        jam_selesai,
        dokter ( nama_dokter, spesialisasi )
      `)
      .order('id_jadwal', { ascending: false });

    if (errorJadwal) {
      console.error("Gagal mengambil jadwal dokter:", errorJadwal.message);
    } else {
      setListJadwal((jadwalData as any) || []);
    }

    // 2. Ambil list dokter murni untuk isi Dropdown di Form Jadwal
    const { data: dokterData, error: errorDokter } = await supabase
      .from('dokter')
      .select('id_dokter, nama_dokter, spesialisasi')
      .order('nama_dokter', { ascending: true });

    if (!errorDokter && dokterData) {
      setListDokterDropdown(dokterData);
    }

    setLoadingJadwal(false);
  };

  useEffect(() => {
    fetchPemeriksaan();
    fetchJadwalDanDokter();
  }, []);

  // ==========================================
  // 3. HANDLER SUBMIT FORM (INSERT DATA)
  // ==========================================
  const handleTambahPasien = async (e: React.FormEvent) => {
    e.preventDefault();
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
      alert(`Gagal menyimpan data pasien: ${error.message}`);
    } else {
      alert(`Berhasil! Data pasien "${namaPasien}" telah disimpan.`);
      setNamaPasien('');
      setTglLahir('');
      setTelpPasien('');
      setAlamatPasien('');
      fetchPemeriksaan();
    }
  };

  const handleTambahJadwal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIdDokter) {
      alert("Silakan pilih dokter terlebih dahulu!");
      return;
    }

    const { error } = await supabase
      .from('jadwal_dokter')
      .insert([
        {
          id_dokter: parseInt(selectedIdDokter),
          hari: hari,
          jam_mulai: jamMulai,
          jam_selesai: jamSelesai
        }
      ]);

    if (error) {
      alert(`Gagal menyimpan jadwal: ${error.message}`);
    } else {
      alert(`Berhasil mengatur jadwal dokter!`);
      setSelectedIdDokter('');
      setJamMulai('');
      setJamSelesai('');
      fetchJadwalDanDokter();
    }
  };

  // ==========================================
  // 4. HELPER DATA PARSING RELASI
  // ==========================================
  const getNamaPasien = (pasien: any) => {
    if (!pasien) return 'N/A';
    if (Array.isArray(pasien)) return pasien[0]?.nama_pasien || 'N/A';
    return pasien.nama_pasien || 'N/A';
  };

  const getNamaDokter = (dokter: any) => {
    if (!dokter) return 'N/A';
    if (Array.isArray(dokter)) return dokter[0]?.nama_dokter || 'N/A';
    return dokter.nama_dokter || 'N/A';
  };

  return (
    <div className="bg-slate-100 text-slate-800 min-h-screen font-sans selection:bg-blue-500 selection:text-white">
      
      {/* Navbar */}
      <nav className="border-b border-slate-200 bg-white p-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
            </span>
            <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              RSD Medica
            </h1>
          </div>
          
          {/* Menu Tab Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button 
              onClick={() => setActiveTab('pemeriksaan')}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${activeTab === 'pemeriksaan' ? 'bg-white text-blue-600 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Monitor Medis & Pasien
            </button>
            <button 
              onClick={() => setActiveTab('jadwal')}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${activeTab === 'jadwal' ? 'bg-white text-blue-600 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Jadwal Praktik Dokter
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto p-6">
        
        {/* =======================================================
            TAB 1: MONITOR MEDIS & PENDAFTARAN PASIEN
           ======================================================= */}
        {activeTab === 'pemeriksaan' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Registrasi Pasien */}
            <section className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-md h-fit">
              <div className="border-b border-slate-100 pb-3 mb-5">
                <h2 className="text-sm font-bold tracking-wider text-blue-600 font-mono uppercase">
                  // Pendaftaran Pasien
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Input data rekam medis pasien baru.</p>
              </div>

              <form onSubmit={handleTambahPasien} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-slate-500 uppercase mb-1.5 tracking-wider">Nama Lengkap</label>
                  <input type="text" value={namaPasien} onChange={(e) => setNamaPasien(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 text-slate-800" placeholder="Contoh: Budi Santoso" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-500 uppercase mb-1.5 tracking-wider">Tgl Lahir</label>
                    <input type="date" value={tglLahir} onChange={(e) => setTglLahir(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 text-slate-800" />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-500 uppercase mb-1.5 tracking-wider">Gender</label>
                    <select value={gender} onChange={(e) => setGender(e.target.value as 'L' | 'P')} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 text-slate-800">
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-500 uppercase mb-1.5 tracking-wider">No. Telepon</label>
                  <input type="text" value={telpPasien} onChange={(e) => setTelpPasien(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 text-slate-800" placeholder="08xxxxxxxxxx" />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-500 uppercase mb-1.5 tracking-wider">Alamat Rumah</label>
                  <textarea value={alamatPasien} onChange={(e) => setAlamatPasien(e.target.value)} rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 text-slate-800" placeholder="Tulis alamat domisili..."></textarea>
                </div>

                <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 px-4 rounded-xl transition duration-300 shadow-lg active:scale-[0.98]">
                  Simpan Pasien ke DB
                </button>
              </form>
            </section>

            {/* Table Monitor Pemeriksaan */}
            <section className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <div>
                    <h2 className="text-sm font-bold tracking-wider text-indigo-600 font-mono uppercase">
                      // Live Stream Monitor Medis
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Log data pemeriksaan dari Supabase.</p>
                  </div>
                  <button onClick={fetchPemeriksaan} className="flex items-center space-x-1.5 text-xs bg-white hover:bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-600 font-mono shadow-sm">
                    <span>⚡</span> <span>Refresh</span>
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="text-xs uppercase font-mono bg-slate-50 text-slate-500 tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-4">ID</th>
                        <th className="p-4">Nama Pasien</th>
                        <th className="p-4">Dokter PJ</th>
                        <th className="p-4">Diagnosa</th>
                        <th className="p-4">Tagihan</th>
                        <th className="p-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {loadingPemeriksaan ? (
                        <tr>
                          <td colSpan={6} className="p-12 text-center font-mono text-xs animate-pulse text-blue-500">
                            LOADING_DATA_STREAM...
                          </td>
                        </tr>
                      ) : listPemeriksaan.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-12 text-center text-xs text-slate-400 font-mono">
                            Tidak ada data rekam medis.
                          </td>
                        </tr>
                      ) : (
                        listPemeriksaan.map((row) => {
                          const isLunas = row.status_pembayaran === 'Lunas';
                          return (
                            <tr key={row.id_pemeriksaan} className="hover:bg-slate-50/80 transition duration-150">
                              <td className="p-4 font-mono text-xs text-blue-600 font-bold">#0{row.id_pemeriksaan}</td>
                              <td className="p-4 font-semibold text-slate-800">{getNamaPasien(row.pasien)}</td>
                              <td className="p-4 text-xs text-slate-600">{getNamaDokter(row.dokter)}</td>
                              <td className="p-4 text-xs italic text-slate-500 max-w-[150px] truncate">{row.diagnosa || row.keluhan || '-'}</td>
                              <td className="p-4 font-mono text-xs font-bold">Rp {Number(row.total_bayar).toLocaleString('id-ID')}</td>
                              <td className="p-4 text-center">
                                <span className={`text-[10px] px-2.5 py-1 rounded-md uppercase font-bold tracking-wider border ${isLunas ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-amber-700 bg-amber-50 border-amber-200'}`}>
                                  {row.status_pembayaran}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* =======================================================
            TAB 2: JADWAL PRAKTIK DOKTER (MENGGUNAKAN RELASI JADWAL)
           ======================================================= */}
        {activeTab === 'jadwal' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Atur Jadwal Dokter */}
            <section className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-md h-fit">
              <div className="border-b border-slate-100 pb-3 mb-5">
                <h2 className="text-sm font-bold tracking-wider text-indigo-600 font-mono uppercase">
                  // Atur Jadwal Kerja
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Alokasikan hari dan jam tugas untuk dokter aktif.</p>
              </div>

              <form onSubmit={handleTambahJadwal} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-slate-500 uppercase mb-1.5 tracking-wider">Pilih Dokter</label>
                  <select 
                    value={selectedIdDokter} 
                    onChange={(e) => setSelectedIdDokter(e.target.value)} 
                    required 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-800"
                  >
                    <option value="">-- Pilih Dokter Terdaftar --</option>
                    {listDokterDropdown.map((doc) => (
                      <option key={doc.id_dokter} value={doc.id_dokter}>
                        {doc.nama_dokter} ({doc.spesialisasi})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-500 uppercase mb-1.5 tracking-wider">Hari Praktik</label>
                  <select value={hari} onChange={(e) => setHari(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-800">
                    <option value="Senin">Senin</option>
                    <option value="Selasa">Selasa</option>
                    <option value="Rabu">Rabu</option>
                    <option value="Kamis">Kamis</option>
                    <option value="Jumat">Jumat</option>
                    <option value="Sabtu">Sabtu</option>
                    <option value="Minggu">Minggu</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-500 uppercase mb-1.5 tracking-wider">Jam Mulai</label>
                    <input type="time" value={jamMulai} onChange={(e) => setJamMulai(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-800" />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-500 uppercase mb-1.5 tracking-wider">Jam Selesai</label>
                    <input type="time" value={jamSelesai} onChange={(e) => setJamSelesai(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-800" />
                  </div>
                </div>

                <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold py-3 px-4 rounded-xl transition duration-300 shadow-lg active:scale-[0.98]">
                  Simpan Slot Jadwal
                </button>
              </form>
            </section>

            {/* Table Monitor Jadwal Dokter */}
            <section className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <div>
                    <h2 className="text-sm font-bold tracking-wider text-blue-600 font-mono uppercase">
                      // Master Agenda Praktik Dokter
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Daftar alokasi waktu kerja yang ditarik dari tabel relasi.</p>
                  </div>
                  <button onClick={fetchJadwalDanDokter} className="flex items-center space-x-1.5 text-xs bg-white hover:bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-600 font-mono shadow-sm">
                    <span>⚡</span> <span>Refresh</span>
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="text-xs uppercase font-mono bg-slate-50 text-slate-500 tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-4">ID Jadwal</th>
                        <th className="p-4">Nama Dokter</th>
                        <th className="p-4">Spesialisasi</th>
                        <th className="p-4">Hari Kerja</th>
                        <th className="p-4">Alokasi Waktu (Shift)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {loadingJadwal ? (
                        <tr>
                          <td colSpan={5} className="p-12 text-center font-mono text-xs animate-pulse text-indigo-500">
                            LOADING_RELATIONAL_SCHEDULES...
                          </td>
                        </tr>
                      ) : listJadwal.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-12 text-center text-xs text-slate-400 font-mono">
                            Belum ada agenda jadwal kerja yang diatur.
                          </td>
                        </tr>
                      ) : (
                        listJadwal.map((jad) => (
                          <tr key={jad.id_jadwal} className="hover:bg-slate-50/80 transition duration-150">
                            <td className="p-4 font-mono text-xs text-indigo-600 font-bold">#JDW_{jad.id_jadwal}</td>
                            <td className="p-4 font-semibold text-slate-800">
                              {jad.dokter ? (Array.isArray(jad.dokter) ? jad.dokter[0]?.nama_dokter : jad.dokter.nama_dokter) : 'N/A'}
                            </td>
                            <td className="p-4 text-xs font-medium">
                              <span className="bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200/60 text-slate-700">
                                {jad.dokter ? (Array.isArray(jad.dokter) ? jad.dokter[0]?.spesialisasi : jad.dokter.spesialisasi) : 'N/A'}
                              </span>
                            </td>
                            <td className="p-4 text-xs font-bold font-mono text-slate-700">{jad.hari}</td>
                            <td className="p-4 text-xs text-indigo-600 font-semibold font-mono">
                              ⏱️ {jad.jam_mulai.slice(0, 5)} - {jad.jam_selesai.slice(0, 5)} WIB
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        )}

      </main>
    </div>
  );
}