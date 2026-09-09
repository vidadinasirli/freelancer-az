# Freelancer.az Backend

Sadə, real (mock olmayan) backend: Node.js + Express + SQLite (better-sqlite3).

## Xüsusiyyətlər
- JWT ilə qeydiyyat/giriş, 2 hesab növü: `freelancer` və `musteri` (sifarişçi)
- Profil (haqqımda, status, təcrübə, saatlıq qiymət və s.) — DB-də saxlanılır
- Tapşırıqlar (sifarişlər): yaratmaq (yalnız sifarişçi), siyahı, detal, müraciət (yalnız frilanser), müraciəti qəbul etmək
- Mesajlaşma: istifadəçilər arası real-time olmayan, sadə DB-based mesajlaşma
- Frilanserlərin ictimai siyahısı

## İşə salmaq
```bash
cd server
npm install
npm start
```
Server `http://localhost:4000` ünvanında işə düşəcək, `server/data/freelancer.db` faylında SQLite bazası avtomatik yaradılacaq və nümunə istifadəçi/tapşırıqlarla doldurulacaq.

Nümunə demo hesablar (şifrə hamısı üçün: `parol123`):
- `elgun@nümune.az` — frilanser
- `fidan@nümune.az` — frilanser
- `ahmed@nümune.az` — sifarişçi

## Environment
İstəsəniz `.env` faylında `JWT_SECRET` və `PORT` təyin edə bilərsiniz.
