# Tugasku

Dashboard pencatat tugas harian (HTML, CSS, JavaScript) dengan tampilan mirip Edlink.

## Fitur
- Buat, ubah, hapus, dan tandai selesai tugas
- Jadwal minggu ini (klik tanggal untuk melihat tugas hari itu)
- Daftar "Perlu Dikerjakan" dan bar progres
- Notifikasi: pengingat sebelum deadline, peringatan terlambat, dan notifikasi browser
- Data tersimpan otomatis di browser (localStorage)

## Cara pakai
Buka `index.html` di browser. Tidak perlu instalasi.

## Upload ke GitHub
```bash
cd dashboard-tugasku
git init
git add .
git commit -m "Tugasku: dashboard tugas harian"
git branch -M main
git remote add origin https://github.com/USERNAME/dashboard-tugasku.git
git push -u origin main
```

## Tampilkan online (GitHub Pages)
Repo → Settings → Pages → Source: `main` / root → Save.

## Ubah mata kuliah
Edit array `COURSES` di bagian atas `js/app.js`.

Catatan: data tersimpan per browser dan per perangkat.
