'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Pasien {
  id_pasien: number;
  nama_pasien: string;
}

interface Dokter {
  id_dokter: number;
  nama_dokter: string;
  spesialisasi: string;
}

interface Obat {
  id_obat: number;
  nama_obat: string;
  harga_obat: number;
  stok: number;
}

interface HistoryPeriksa {
  id_pemeriksaan: number;
  tanggal_periksa: string;
  diagnosa: string;
  keluhan: string;
  total_bayar: number;
  status_pembayaran: string;
  pasien: { nama_pasien: string } | null;
  dokter: { nama_dokter: string } | null;
}

export default function HalamanPemeriksaan() {
  const [loading, setLoading] = useState<boolean>(true);
  const [listPasien, setListPasien] = useState<Pasien[]>([]);
  const [listDokter, setListDokter] = useState<Dokter[]>([]);
  const [listObat, setListObat] = useState<Obat[]>([]);
  const [history, setHistory] = useState<HistoryPeriksa[]>([]);

  // Form State Utama
  const [selectedPasien, setSelectedPasien] = useState<string>('');
  const [selectedDokter, setSelectedDokter] = useState<string>('');
  const [tanggalPeriksa, setTanggalPeriksa] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [keluhan, setKeluhan] = useState<string>('');
  const [diagnosa, setDiagnosa] = useState<string>('');
  const [biayaDokter, setBiayaDokter] = useState<string>('');

  // Form State Resep Obat
  const [selectedObat, setSelectedObat] = useState<string>('');
  const [jumlahObat, setJumlahObat] = useState<number>(1);
  const [aturanPakai, setAturanPakai] = useState<string>('');

  const loadDataKlinik = async () => {
    setLoading(true);
    
    const { data: p } = await supabase.from('pasien').select('id_pasien, nama_pasien').order('nama_pasien');
    if (p) setListPasien(p);

    const { data: d } = await supabase.from('dokter').select('id_dokter, nama_dokter, spesialisasi').order('nama_dokter');
    if (d) setListDokter(d);

    const { data: o } = await supabase.from('obat').select('id_obat, nama_obat, harga_obat, stok').order('nama_obat');
    if (o) setListObat(o);

    const { data: h } = await supabase
      .from('pemeriksaan')
      .select('id_pemeriksaan, tanggal_periksa, keluhan, diagnosa, total_bayar, status_pembayaran, pasien(nama_pasien), dokter(nama_dokter)')
      .order('id_pemeriksaan', { ascending: false })
      .limit(8);
    if (h) setHistory(h as any);

    setLoading(false);
  };

  useEffect(() => {
    loadDataKlinik();
  }, []);

  const handleSimpanRekamMedis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPasien || !selectedDokter) {
      alert('Mohon pilih data pasien dan dokter penanggung jawab!');
      return;
    }

    const nominalJasaDokter = parseFloat(biayaDokter) || 0;
    let totalHargaResepObat = 0;
    
    const obatTerpilih = listObat.find((item) => item.id_obat === parseInt(selectedObat));
    if (obatTerpilih) {
      totalHargaResepObat = Number(obatTerpilih.harga_obat) * jumlahObat;
    }
    
    const kalkulasiTotalAkhir = nominalJasaDokter + totalHargaResepObat;

    // 1. INSERT DATA KE TABEL PEMERIKSAAN
    const { data: barisBaru, error: errPeriksa } = await supabase
      .from('pemeriksaan')
      .insert([
        {
          id_pasien: parseInt(selectedPasien),
          id_dokter: parseInt(selectedDokter),
          tanggal_periksa: tanggalPeriksa,
          keluhan: keluhan,
          diagnosa: diagnosa,
          biaya_dokter: nominalJasaDokter,
          total_bayar: kalkulasiTotalAkhir,
          status_pembayaran: 'Belum Lunas'
        }
      ])
      .select();

    if (errPeriksa) {
      alert(`Gagal input rekam medis: ${errPeriksa.message}`);
      return;
    }

    // 2. JIKA ADA OBAT YANG DIINTRESEPKAN -> INSERT KE TABEL RESEP_OBAT
    if (barisBaru && barisBaru[0] && selectedObat) {
      const idPeriksaBaru = barisBaru[0].id_pemeriksaan;

      const { error: errResep } = await supabase
        .from('resep_obat')
        .insert([
          {
            id_pemeriksaan: idPeriksaBaru,
            id_obat: parseInt(selectedObat),
            jumlah: jumlahObat,
            aturan_pakai: aturanPakai
          }
        ]);

      if (errResep) {
        alert(`Rekam medis aman, namun detail resep gagal masuk: ${errResep.message}`);
      }
    }

    alert('Sukses menyimpan rekam medis pasien! Data dikirim ke Kasir.');
    
    // Reset inputs
    setKeluhan('');
    setDiagnosa('');
    setBiayaDokter('');
    setSelectedObat('');
    setJumlahObat(1);
    setAturanPakai('');
    
    loadDataKlinik();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-black text-indigo-600 font-mono tracking-tight">// RUANG PEMERIKSAAN KLINIK</h1>
        <p className="text-xs text-slate-500 mt-1">Pencatatan riwayat anamnesis penyakit pasien beserta pemberian resep obat dokter.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COL 1 & 2: FORM REKAM MEDIS & RESEP */}
        <form onSubmit={handleSimpanRekamMedis} className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          
          {/* Identitas */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-bold font-mono uppercase tracking-wider text-slate-400 border-b pb-1">A. Validasi Kunjungan</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-mono text-slate-500 mb-1">Pasien</label>
                <select value={selectedPasien} onChange={(e) => setSelectedPasien(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500">
                  <option value="">-- Pilih Pasien --</option>
                  {listPasien.map((p) => <option key={p.id_pasien} value={p.id_pasien}>{p.nama_pasien}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-mono text-slate-500 mb-1">Dokter Pemeriksa</label>
                <select value={selectedDokter} onChange={(e) => setSelectedDokter(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500">
                  <option value="">-- Pilih Dokter --</option>
                  {listDokter.map((d) => <option key={d.id_dokter} value={d.id_dokter}>{d.nama_dokter} ({d.spesialisasi})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-mono text-slate-500 mb-1">Tanggal</label>
                <input type="date" value={tanggalPeriksa} onChange={(e) => setTanggalPeriksa(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500" />
              </div>
            </div>
          </div>

          {/* Medis */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-bold font-mono uppercase tracking-wider text-slate-400 border-b pb-1">B. Catatan Hasil Medis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono text-slate-500 mb-1">Keluhan Utama Pasien</label>
                <textarea value={keluhan} onChange={(e) => setKeluhan(e.target.value)} rows={3} required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500" placeholder="Ketik gejala utama..."></textarea>
              </div>
              <div>
                <label className="block text-[11px] font-mono text-slate-500 mb-1">Diagnosa Klinis Dokter</label>
                <textarea value={diagnosa} onChange={(e) => setDiagnosa(e.target.value)} rows={3} required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500" placeholder="Ketik diagnosa penyakit..."></textarea>
              </div>
            </div>
          </div>

          {/* Resep */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-bold font-mono uppercase tracking-wider text-slate-400 border-b pb-1">C. E-Resep (Integrasi Farmasi)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-mono text-slate-500 mb-1">Item Obat</label>
                <select value={selectedObat} onChange={(e) => setSelectedObat(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500">
                  <option value="">-- Tanpa Obat --</option>
                  {listObat.map((o) => (
                    <option key={o.id_obat} value={o.id_obat} disabled={o.stok <= 0}>
                      {o.nama_obat} (Stok: {o.stok} | Rp {Number(o.harga_obat).toLocaleString('id-ID')})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-mono text-slate-500 mb-1">Kuantitas</label>
                <input type="number" min={1} value={jumlahObat} onChange={(e) => setJumlahObat(parseInt(e.target.value) || 1)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-slate-500 mb-1">Aturan Dosis</label>
                <input type="text" value={aturanPakai} onChange={(e) => setAturanPakai(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500" placeholder="Contoh: 3x1 sehari sesudah makan" />
              </div>
            </div>
          </div>

          {/* Finansial */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-bold font-mono uppercase tracking-wider text-slate-400 border-b pb-1">D. Tarif Tindakan</h3>
            <div className="max-w-xs">
              <label className="block text-[11px] font-mono text-slate-500 mb-1">Jasa Pemeriksaan Dokter (Rp)</label>
              <input type="number" value={biayaDokter} onChange={(e) => setBiayaDokter(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-indigo-500" placeholder="Masukkan tarif..." />
            </div>
          </div>

          <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold py-3 px-4 rounded-xl shadow-md hover:from-indigo-500 hover:to-blue-500 transition-all font-mono text-xs uppercase tracking-wider">
            Simpan & Teruskan Ke Kasir
          </button>
        </form>

        {/* COL 3: LOG LATEST ANTREAN */}
        <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-fit space-y-4">
          <div>
            <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">// Log Rekam Medis Terakhir</h2>
          </div>

          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {loading ? (
              <p className="text-xs font-mono text-indigo-500 animate-pulse">STREAMING_DATA...</p>
            ) : history.length === 0 ? (
              <p className="text-xs text-slate-400 font-mono">[KOSONG]</p>
            ) : (
              history.map((h) => {
                const isLunas = h.status_pembayaran === 'Lunas';
                const namaP = h.pasien ? (Array.isArray(h.pasien) ? h.pasien[0]?.nama_pasien : h.pasien.nama_pasien) : 'N/A';
                const namaD = h.dokter ? (Array.isArray(h.dokter) ? h.dokter[0]?.nama_dokter : h.dokter.nama_dokter) : 'N/A';
                
                return (
                  <div key={h.id_pemeriksaan} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[10px] text-indigo-600 font-bold">#RM-{h.id_pemeriksaan}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider border ${isLunas ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                        {h.status_pembayaran}
                      </span>
                    </div>
                    <p className="font-bold text-slate-800">{namaP}</p>
                    <p className="text-[11px] text-slate-500">Dokter: {namaD}</p>
                    <p className="text-[11px] italic text-slate-600 truncate">Diag: {h.diagnosa}</p>
                    <p className="font-mono text-[11px] font-bold text-slate-700 pt-1">Total: Rp {Number(h.total_bayar).toLocaleString('id-ID')}</p>
                  </div>
                );
              })
            )}
          </div>
        </section>

      </div>
    </div>
  );
}