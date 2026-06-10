import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RDS Medica - Dashboard Klinik",
  description: "Sistem Informasi Manajemen Klinik Terintegrasi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={`${inter.className} bg-slate-100 text-slate-800 min-h-screen`}>
        <div className="flex flex-col md:flex-row min-h-screen">
          
          {/* SIDEBAR NAVIGASI GLOBAL */}
          <aside className="w-full md:w-64 bg-white border-r border-slate-200 p-5 flex flex-col justify-between shadow-sm shrink-0">
            <div className="space-y-6">
              {/* Logo Brand */}
              <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
                <span className="h-3 w-3 rounded-full bg-blue-600 animate-pulse"></span>
                <h1 className="text-xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
                  RDS Medica
                </h1>
              </div>

              {/* Menu Links */}
              <nav className="space-y-1.5">
                <p className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider mb-2">// Main Menu</p>
                
                <Link href="/" className="flex items-center space-x-3 px-4 py-2.5 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all">
                  <span>📊</span> <span>Dashboard Utama</span>
                </Link>
                
                <Link href="/pasien" className="flex items-center space-x-3 px-4 py-2.5 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all">
                  <span>👥</span> <span>Registrasi Pasien</span>
                </Link>
                
                <Link href="/dokter" className="flex items-center space-x-3 px-4 py-2.5 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all">
                  <span>🩺</span> <span>Jadwal & Dokter</span>
                </Link>

                <p className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider pt-4 mb-2">// Transaksi Medis</p>
                
                <Link href="/pemeriksaan" className="flex items-center space-x-3 px-4 py-2.5 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-all">
                  <span>📝</span> <span>Pemeriksaan (Rekam Medis)</span>
                </Link>
                
                <Link href="/pembayaran" className="flex items-center space-x-3 px-4 py-2.5 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-50 hover:text-emerald-600 transition-all">
                  <span>💳</span> <span>Kasir & Pembayaran</span>
                </Link>
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-100 text-[10px] font-mono text-slate-400">
              Database: Supabase Connected
            </div>
          </aside>

          {/* KONTEN HALAMAN DINAMIS */}
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>

        </div>
      </body>
    </html>
  );
}