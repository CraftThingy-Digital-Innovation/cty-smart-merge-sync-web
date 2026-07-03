# @craftthingy-digital-innovation/cty-smart-merge-sync-web

Bilingual documentation: [Bahasa Indonesia](#bahasa-indonesia) | [English](#english)

---

## Bahasa Indonesia

Library client-side Javascript untuk menangani kolaborasi sinkronisasi data real-time multi-user. Menggunakan algoritma **Smart Merge** untuk menyinkronkan data perubahan server tanpa merusak kursor ketik aktif pengguna (`document.activeElement`) dan tanpa menimpa perubahan lokal yang sedang mengantre di outbox.

Sangat cocok untuk merancang UI kolaboratif seperti Google Sheets, dashboard multi-user, atau sistem input data bersama.

### Instalasi
```bash
npm install @craftthingy-digital-innovation/cty-smart-merge-sync-web
```

### Cara Penggunaan
```javascript
import { SmartSyncEngine } from '@craftthingy-digital-innovation/cty-smart-merge-sync-web';

const syncEngine = new SmartSyncEngine({
  interval: 4000, // Ambil data dari server setiap 4 detik
  fetchData: async () => {
    const res = await fetch('/api/entries');
    const result = await res.json();
    return result.data; // Mengembalikan array data terbaru
  },
  isPendingLocal: (uuid, field) => {
    // Return true jika baris/kolom ini sedang memiliki antrean simpan offline
    return myOfflineQueue.hasPending(uuid, field);
  },
  fields: ['no_paspor', 'nama_pemohon', 'tempat_lahir'] // Kolom yang disinkronkan
});

// Jalankan polling sinkronisasi
syncEngine.start();

syncEngine.on('sync', (remoteList) => {
  // Gabungkan data remote ke state lokal & perbarui DOM secara aman
  syncEngine.merge(localEntries, remoteList, {
    onAdd: (newItem) => {
      // Tambahkan baris baru ke tabel DOM Anda
      appendRowToTableDOM(newItem);
    },
    onDelete: (uuid) => {
      // Hapus baris dari tabel DOM Anda
      removeRowFromTableDOM(uuid);
    },
    onUpdateField: (uuid, field, val) => {
      // Perbarui nilai input kolom spesifik di DOM
      const input = document.querySelector(`tr[data-uuid="${uuid}"] .field-${field}`);
      if (input) input.value = val;
    }
  });
});
```

---

## English

A client-side JavaScript library to coordinate real-time multi-user data synchronization. Employs a **Smart Merge** algorithm to merge database updates without causing cursor jumps, losing user's focus (`document.activeElement`), or overwriting pending local outbox edits.

Perfect for collaborative UIs such as shared spreadsheets, multi-user dashboards, or shared forms.

### Installation
```bash
npm install @craftthingy-digital-innovation/cty-smart-merge-sync-web
```

### Usage
```javascript
import { SmartSyncEngine } from '@craftthingy-digital-innovation/cty-smart-merge-sync-web';

const syncEngine = new SmartSyncEngine({
  interval: 4000, // Poll server every 4 seconds
  fetchData: async () => {
    const res = await fetch('/api/entries');
    const result = await res.json();
    return result.data; // Return latest remote array
  },
  isPendingLocal: (uuid, field) => {
    // Return true if this row/field has pending local saves in your outbox
    return myOfflineQueue.hasPending(uuid, field);
  },
  fields: ['no_paspor', 'nama_pemohon', 'tempat_lahir'] // Fields to merge
});

// Start collaboration polling
syncEngine.start();

syncEngine.on('sync', (remoteList) => {
  // Merge remote data into local state & DOM safely
  syncEngine.merge(localEntries, remoteList, {
    onAdd: (newItem) => {
      // Add new row to your table DOM
      appendRowToTableDOM(newItem);
    },
    onDelete: (uuid) => {
      // Remove row from your table DOM
      removeRowFromTableDOM(uuid);
    },
    onUpdateField: (uuid, field, val) => {
      // Update specific input element value in the DOM
      const input = document.querySelector(`tr[data-uuid="${uuid}"] .field-${field}`);
      if (input) input.value = val;
    }
  });
});
```
