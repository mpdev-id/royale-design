# Royale Gym & Cafe — Aplikasi Demo Terpadu

Gabungan 6 mockup Stitch menjadi **1 aplikasi tunggal** (SPA) tanpa mengubah tampilan aslinya.

## Yang digabung

| View | Sumber mockup |
|---|---|
| Login Kasir Gym | `login_kasir_gym_royale_gym_cafe` |
| Login Kasir Cafe | `login_kasir_terpadu_gym_or_cafe_royale_gym_cafe` |
| Dashboard Absensi Wajah | `dashboard_informasi_absensi_wajah_royale_gym_cafe` |
| Data Member | `data_member_royale_gym_cafe` |
| POS Gym | `pos_gym_royale_gym_cafe` |
| Laporan | `laporan_royale_gym_cafe` |

## Cara menjalankan

**Online (GitHub Pages):** langsung buka URL setelah Pages aktif.

**Lokal:** server statik diperlukan karena view dimuat via `fetch()`:

```bash
# dari folder ini
python -m http.server 5555
# atau
npx serve -p 5555
```

Lalu buka `http://localhost:5555/`. (Membuka `index.html` langsung via `file://` tidak berfungsi.)

## Alur demo

1. **Splash** → **Login Kasir Gym**
2. Pilih kasir → ketik PIN 6 digit (atau klik tombol) → **Dashboard**
3. Sidebar kiri: **Dashboard / Data Member / POS Gym / Laporan**
4. Tombol **Keluar** (topbar kanan) → kembali ke login
5. Tab **GYM / CAFE** di halaman login pindah outlet
6. `Alt + ←/→` untuk pindah view (shortcut demo)
7. Deep-link: `#/dashboard`, `#/pos`, `#/laporan`, dll.

## Responsive & tab friendly

Aplikasi beradaptasi dari tablet 11" sampai handphone:

| Lebar layar | Perilaku |
|---|---|
| ≥ 1024px | Sidebar statik 240px di kiri (seperti mockup asli) |
| 1024 – 861px | Sidebar disembunyikan, dibuka via tombol **≡** (drawer + scrim), KPI 2 kolom |
| 860 – 621px | Konten utama menumpuk vertikal (grid 12-col → 1-col) |
| ≤ 620px | KPI 1 kolom, header footer dirapikan, target sentuh diperbesar |
| ≤ 480px | Elemen non-esensial disembunyikan (nama kasir, dll) |

Detail touch-friendly:
- Target sentuh minimal 44–48px pada nav, tombol, dan numpad
- Drawer bisa ditutup dengan tap scrim, tombol **✕**, atau tombol `Esc`
- `touch-action: manipulation` (tanpa delay 300ms) di semua elemen interaktif
- Navigasi keyboard: `Tab`, `Alt + ←/→`, `Esc`

## Struktur

```
app/
├── index.html          # shell: tailwind config + font + view host
├── router.js           # SPA router, sidebar/topbar terpadu, jam, toast
└── views/
    ├── login-gym.html
    ├── login-cafe.html
    ├── dashboard.html
    ├── member.html
    ├── pos.html
    └── laporan.html
```

Markup tiap view diambil apa adanya dari `code.html` asli. Hanya shell-nya
(sidebar, topbar, footer) yang dibungkus seragam agar nav antar-view nyambung.
