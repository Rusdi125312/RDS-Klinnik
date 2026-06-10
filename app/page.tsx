'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';

export default function DashboardUtama() {
  const [stats, setStats] = useState({
    totalPasien: 0,
    totalDokter: 0,
    pemeriksaanHariIni: 0,
    pendapatan: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      // 1. Hitung Total Pasien
      const { count: pasienCount } = await supabase
        .from('pasien')
        .select('*', { count: 'exact', head: true });

      // 2. Hitung Total Dokter
      const { count: dokterCount } = await supabase
        .from('dokter')
        .select('*', { count: 'exact', head: true });

      // 3. Hitung Transaksi Pemeriksaan
      const { data: pemeriksaanData } = await supabase
        .from('pemeriksaan')
        .select('total_bayar, status_pembayaran');

      // Hitung akumulasi statistik finansial sederhana
      let totalPendapatan = 0;
      if (pemeriksaanData) {
        totalPendapatan = pemeriksaanData
          .filter((item) => item.status_pembayaran === 'Lunas')
          .reduce((sum, item) => sum + (Number(item.total_bayar) || 0), 0);
      }

      setStats({
        totalPasien: pasienCount || 0,
        totalDokter: dokterCount || 0,
        pemeriksaanHariIni: pemeriksaanData?.length || 0,
        pendapatan: totalPendapatan,
      });
    } catch (error) {
      console.error('Gagal memuat statistik dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 rounded-2xl text-white shadow-md">
        <h1 className="text-2xl font-black font-mono tracking-tight">// CONTROL_CENTER: RSD MEDICA</h1>
        <p className="text-xs text-blue-100 mt-1.5 max-w-md">
          Selamat datang di sistem manajemen informasi klinik terintegrasi. Pantau data master dan transaksi secara real-time.
        </p>
      </div>

      {/* Grid Statistik Angka */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Total Pasien</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">
            {loading ? '...' : `${stats.totalPasien} Jiwa`}
          </div>
        </div>
        {/* Card 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Tenaga Medis</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">
            {loading ? '...' : `${stats.totalDokter} Aktif`}
          </div>
        </div>
        {/* Card 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Log Pemeriksaan</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">
            {loading ? '...' : `${stats.pemeriksaanHariIni} Kasus`}
          </div>
        </div>
        {/* Card 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-mono font-bold text-emerald-600 uppercase tracking-wider">Kas Keuangan</div>
          <div className="text-2xl font-bold text-emerald-700 font-mono mt-1">
            {loading ? '...' : `Rp ${stats.pendapatan.toLocaleString('id-ID')}`}
          </div>
        </div>
      </div>

      {/* Cepat Akses Modul Form */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold font-mono uppercase text-slate-400 tracking-wider">// Navigasi Cepat Alur Kerja</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/pasien" className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-blue-500 hover:text-blue-600 transition-all text-xs font-bold flex justify-between items-center">
            <span>👥 1. Registrasi Pasien Baru</span>
            <span>➔</span>
          </Link>
          <Link href="/dokter" className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-blue-500 hover:text-blue-600 transition-all text-xs font-bold flex justify-between items-center">
            <span>🩺 2. Atur Jadwal & Dokter</span>
            <span>➔</span>
          </Link>
          <Link href="/pemeriksaan" className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-500 hover:text-indigo-600 transition-all text-xs font-bold flex justify-between items-center">
            <span>📝 3. Periksa & Resep Obat</span>
            <span>➔</span>
          </Link>
          <Link href="/pembayaran" className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-emerald-500 hover:text-emerald-600 transition-all text-xs font-bold flex justify-between items-center">
            <span>💳 4. Kasir Selesaikan Pembayaran</span>
            <span>➔</span>
          </Link>
        </div>
      </div>
    </div>
  );
}