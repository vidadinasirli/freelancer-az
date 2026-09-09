# Freelancer.az (klon layihə)

Bu layihə, ayrı-ayrı göndərdiyiniz 8 səhifə komponentini (Ana səhifə, Giriş/Qeydiyyat,
Layihələr, Klub, Mesajlar, Profil, Tapşırıqlar/Freelancerlər) tək bir **Vite + React +
React Router + Tailwind CSS** tətbiqində birləşdirir.

## Quraşdırma (Visual Studio Code)

1. Qovluğu açın: `File > Open Folder...` → bu qovluğu seçin.
2. Terminalı açın (`` Ctrl+` ``) və asağıdakı əmrləri işə salın:

```bash
npm install
npm run dev
```

3. Brauzerdə açılan linki (default: `http://localhost:5173`) izləyin.

## Layihə strukturu

```
src/
  main.jsx              → React tətbiqinin giriş nöqtəsi
  App.jsx                → Bütün route-ların (səhifələrin) siyahısı
  index.css              → Tailwind bağlantısı + qlobal stillər
  context/
    AuthContext.jsx       → Sadələşdirilmiş "mock" giriş/çıxış sistemi (aşağıya bax)
  components/
    Layout.jsx             → Navbar + Footer ilə ümumi səhifə çərçivəsi
    Navbar.jsx              → Bütün səhifələrə keçid menyusu
    Footer.jsx               → Alt hissə
    Effects.jsx                → Animasiya köməkçiləri (AnimatedCounter, TiltCard və s.)
  pages/
    AnaSayfa.jsx     → "/"              (freelancer_az_ana_sayfa.tsx əsasında)
    Giris.jsx        → "/giris"         (freelancer_az_platformas.tsx-in giriş/qeydiyyat hissəsi)
    Layiheler.jsx    → "/layiheler"     (layiheler_sayfasi.tsx)
    Klub.jsx         → "/klub"          (klub_sayfasi.tsx)
    Mesajlar.jsx     → "/mesajlar"      (mesajlar.tsx)
    Profil.jsx       → "/profil"        (profil.tsx)
    Tapsiriqlar.jsx  → "/tapsiriqlar" və "/frilanserler" (tasks__1_.tsx)
```

## Vacib qeydlər

- **Firebase silindi:** `freelancer_az_platformas.tsx` faylında Firebase Auth/Firestore
  istifadə olunurdu, amma konfiqurasiya (API key və s.) verilmədiyi üçün bu, layihəni
  dərhal `npm run dev` ilə işə salmağı əngəlləyəcəkdi. Onun yerinə
  `src/context/AuthContext.jsx` faylında sadə, `localStorage` əsaslı bir "mock" giriş
  sistemi qoyulub — "Daxil ol" / "Qeydiyyat" formasını doldurub göndərdikdə istifadəçi
  giriş etmiş sayılır və Profil səhifəsinə yönləndirilir. Real backend (Firebase, öz
  API-niz və s.) qoşmaq istəsəniz, bu faylı əvəz etməyiniz kifayətdir — digər
  komponentlər `useAuth()` hook-u üzərindən işləyir və dəyişməyə ehtiyac yoxdur.
- **`tasks.tsx` istifadə olunmadı:** Göndərdiyiniz `tasks.tsx` (513 sətir) və
  `tasks__1_.tsx` (945 sətir) demək olar ki eyni məzmuna (MOCK_TASKS, MOCK_CLIENT,
  MOCK_CLUB_POSTS) sahib idi, sadəcə `tasks__1_.tsx` daha tam idi (üstəlik
  freelancer siyahısı və detalları da var idi). Ona görə "Tapşırıqlar" və
  "Freelancerlər" səhifələri üçün `tasks__1_.tsx` əsas götürüldü. Əgər əslində
  `tasks.tsx` fərqli/ayrı bir səhifə olmalı idisə, mənə bildirin, ayrıca route kimi
  əlavə edərəm.
- Bütün mock data (tapşırıqlar, freelancerlər, layihələr, klub yazıları və s.) hələ
  də statik JS massivləri şəklindədir — real backend qoşulana qədər dəyişməz qalacaq.
- Hər səhifə öz daxili state-i ilə işləyir (məsələn seçilmiş tapşırıq, klub yazısı və
  s.) — dərin linkləmə (`/tapsiriqlar/:id` kimi) hələ qurulmayıb, sadəcə səhifə
  daxilində keçid var.

## Növbəti addımlar (tövsiyə)

- Real backend/API qoşulması (Firebase, Supabase, öz REST API-niz və s.)
- Tapşırıq/Freelancer/Klub detalları üçün ayrı URL-lər (React Router dinamik
  parametrləri: `/tapsiriqlar/:id`)
- Formların həqiqi validasiyası və xəta mesajları
