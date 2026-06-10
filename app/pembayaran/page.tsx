'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface PembayaranView {
  id_pemeriksaan: number;
  tanggal_periksa: string;
  biaya_dokter: number;
  total_bayar: number;
  status_pembayaran: string;
  diagnosa: string;
  pasien: { nama_pasien: string } | null;
  dokter: { nama_dokter: string } | null;
}

export default function HalamanPembayaran() {
  const [loading, setLoading] = useState<boolean>(true);
  const [antreanBayar, setAntreanBayar] = useState<PembayaranView[]>([]);
  const [selectedTransaksi, setSelectedTransaksi] = useState<PembayaranView | null>(null);

  // Ambil data pemeriksaan yang BELUM LUNAS
  const fetchAntreanPembayaran = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pemeriksaan')
      .select('id_pemeriksaan, tanggal_periksa, biaya_dokter, total_bayar, status_pembayaran, diagnosa, pasien(nama_pasien), dokter(nama_dokter)')
      .eq('status_pembayaran', 'Belum Lunas')
      .order('id_pemeriksaan', { ascending: true });

    if (error) {
      console.error('Gagal memuat antrean kasir:', error.message);
    } else {
      setAntreanBayar(data as any);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAntreanPembayaran();
  }, []);

  // Proses Update Status menjadi LUNAS
  const handleKonfirmasiLunas = async (id: number) => {
    const konfirmasi = confirm(`Konfirmasi pembayaran untuk nota #NOTA-${id}?`);
    if (!konfirmasi) return;

    const { error } = await supabase
      .from('pemeriksaan')
      .update({ status_pembayaran: 'Lunas' })
      .eq('id_pemeriksaan', id);

    if (error) {
      alert(`Gagal memproses pembayaran: ${error.message}`);
    } else {
      alert('Pembayaran Berhasil! Status diperbarui menjadi LUNAS.');
      setSelectedTransaksi(null); // Tutup detail nota
      fetchAntreanPembayaran();    // Refresh antrean kasir
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header Halaman */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-black text-emerald-600 font-mono tracking-tight">// KASIR & TERMINAL PEMBAYARAN</h1>
        <p className="text-xs text-slate-500 mt-1">Selesaikan billing tagihan pemeriksaan dokter dan akumulasi resep obat pasien.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* TABEL ANTREAN BILLING (2 Kolom lebar) */}
        <section className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <span className="text-xs font-bold font-mono uppercase text-slate-500 tracking-wider">// Antrean Tagihan Belum Bayar</span>
            <button onClick={fetchAntreanPembayaran} className="text-xs border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1.5 rounded-lg font-mono">🔄 Refresh</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-mono border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="p-3">No. Nota</th>
                  <th className="p-3">Nama Pasien</th>
                  <th className="p-3">Dokter PJ</th>
                  <th className="p-3">Total Tagihan</th>
                  <th className="p-3 text-center">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={5} className="p-8 text-center font-mono text-emerald-600 animate-pulse">LOADING_BILLING_QUEUES...</td></tr>
                ) : antreanBayar.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-400 font-mono">[SEMUA_TAGIHAN_LUNAS_AMAN]</td></tr>
                ) : (
                  antreanBayar.map((t) => {
                    const namaP = t.pasien ? (Array.isArray(t.pasien) ? t.pasien[0]?.nama_pasien : t.pasien.nama_pasien) : 'N/A';
                    const namaD = t.dokter ? (Array.isArray(t.dokter) ? t.dokter[0]?.nama_dokter : t.dokter.nama_dokter) : 'N/A';
                    
                    return (
                      <tr key={t.id_pemeriksaan} className={`hover:bg-slate-50/50 ${selectedTransaksi?.id_pemeriksaan === t.id_pemeriksaan ? 'bg-emerald-50/40' : ''}`}>
                        <td className="p-3 font-mono font-bold text-slate-700">#NOTA-0{t.id_pemeriksaan}</td>
                        <td className="p-3 font-semibold text-slate-800">{namaP}</td>
                        <td className="p-3 text-slate-500">{namaD}</td>
                        <td className="p-3 font-mono font-bold text-slate-900">Rp {Number(t.total_bayar).toLocaleString('id-ID')}</td>
                        <td className="p-3 text-center">
                          <button 
                            onClick={() => setSelectedTransaksi(t)}
                            className="px-3 py-1.5 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-sm transition-all font-mono uppercase"
                          >
                            🔎 Buka Nota
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* INTERFACE STRIP RAK ALAT CETAK NOTA / KUITANSI (1 Kolom samping) */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit space-y-5">
          <div className="border-b pb-2">
            <h3 className="text-xs font-bold font-mono uppercase text-slate-400">// Rincian Komponen Kuitansi</h3>
          </div>

          {selectedTransaksi ? (
            <div className="space-y-4">
              {/* Struktur Tampilan Lembar Nota */}
              <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-3 text-xs font-mono">
                <div className="text-center border-b border-slate-200 pb-2">
                  <p className="font-bold text-sm tracking-tight text-slate-800">RSD MEDICA CLINIC</p>
                  <p className="text-[10px] text-slate-400">Sukabumi, Jawa Barat</p>
                </div>

                <div className="space-y-1 text-[11px]">
                  <p><span className="text-slate-400">Nota  :</span> #NOTA-0{selectedTransaksi.id_pemeriksaan}</p>
                  <p><span className="text-slate-400">Pasien:</span> {selectedTransaksi.pasien ? (Array.isArray(selectedTransaksi.pasien) ? selectedTransaksi.pasien[0]?.nama_pasien : selectedTransaksi.pasien.nama_pasien) : 'N/A'}</p>
                  <p><span className="text-slate-400">Dokter:</span> {selectedTransaksi.dokter ? (Array.isArray(selectedTransaksi.dokter) ? selectedTransaksi.dokter[0]?.nama_dokter : selectedTransaksi.dokter.nama_dokter) : 'N/A'}</p>
                  <p className="italic text-slate-500">Diag  : {selectedTransaksi.diagnosa}</p>
                </div>

                <div className="border-t border-slate-200 pt-2 space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span>Jasa Medis Dokter</span>
                    <span>Rp {Number(selectedTransaksi.biaya_dokter).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Akumulasi Farmasi/Obat</span>
                    <span>Rp {Number(selectedTransaksi.total_bayar - selectedTransaksi.biaya_dokter).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-slate-200 pt-1.5 text-slate-800 text-xs">
                    <span>TOTAL BILLING</span>
                    <span>Rp {Number(selectedTransaksi.total_bayar).toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                  Status: <span className="text-amber-600 font-bold uppercase">{selectedTransaksi.status_pembayaran}</span>
                </div>
              </div>

              {/* Tombol Eksekusi Finansial */}
              <button
                onClick={() => handleKonfirmasiLunas(selectedTransaksi.id_pemeriksaan)}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-3 px-4 rounded-xl shadow-md hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] text-xs font-mono uppercase tracking-wider transition-all"
              >
                💵 Terima Uang & Cetak Lunas
              </button>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 border border-dashed rounded-xl font-mono text-xs">
              [PILIH_NOTA_UNTUK_MELIHAT_RINCIAN]
            </div>
          )}
        </section>

      </div>
    </div>
  );
}