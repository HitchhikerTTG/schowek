# Schowek

Osobisty schowek webowy. Wklej tekst na jednym urządzeniu, skopiuj na drugim.

## Wymagania

- Node.js ≥ 18 (shared hosting z cPanel: opcja „Setup Node.js App")
- MySQL / MariaDB (standardowy cPanel)

---

## Deployment na cPanel (krok po kroku)

### 1. Baza danych — cPanel → MySQL Databases

1. **Create New Database** → podaj nazwę np. `schowek`
2. **MySQL Users** → stwórz użytkownika z hasłem
3. **Add User to Database** → zaznacz „All Privileges"
4. Zanotuj: `DB_HOST` (zwykle `localhost`), `DB_USER`, `DB_PASS`, `DB_NAME`

> Tabela `clips` zostanie utworzona automatycznie przy pierwszym starcie.

### 2. Node.js App — cPanel → Setup Node.js App

1. **Create Application**
   - Node.js version: wybierz najnowszą dostępną (≥ 18)
   - Application mode: `Production`
   - Application root: np. `schowek` (katalog w home)
   - Application URL: domena lub subdomena
   - Application startup file: `server.js`
2. Skopiuj pliki projektu do katalogu aplikacji (FTP / File Manager)
3. W panelu kliknij **Run NPM Install** — zainstaluje zależności na serwerze

### 3. Plik .env

W katalogu aplikacji utwórz plik `.env` na podstawie `.env.example`:

```
DB_HOST=localhost
DB_USER=uzytkownik_bazy
DB_PASS=haslo_bazy
DB_NAME=nazwa_bazy
PIN=opcjonalny_pin
```

> `.env` nie jest w repozytorium (jest w `.gitignore`) — utwórz go ręcznie przez File Manager lub FTP.

### 4. Restart

W panelu „Setup Node.js App" kliknij **Restart** — aplikacja jest gotowa.

---

## Uruchomienie lokalne

```bash
cp .env.example .env   # uzupełnij dane DB
npm install
npm start              # http://localhost:3000
```

---

## Zmienne środowiskowe

| Zmienna   | Domyślnie   | Opis                                  |
|-----------|-------------|---------------------------------------|
| `DB_HOST` | `localhost` | Adres serwera MySQL                   |
| `DB_PORT` | `3306`      | Port MySQL                            |
| `DB_USER` | —           | Użytkownik bazy                       |
| `DB_PASS` | —           | Hasło bazy                            |
| `DB_NAME` | —           | Nazwa bazy                            |
| `PIN`     | *(brak)*    | Opcjonalny PIN dostępu (cyfry/tekst)  |
| `PORT`    | `3000`      | Port HTTP (Passenger ignoruje to)     |

---

## API

| Metoda | Ścieżka             | Opis                    |
|--------|---------------------|-------------------------|
| GET    | `/api/clips`        | Lista wpisów (preview)  |
| GET    | `/api/clips/latest` | Ostatni wpis (pełny)    |
| GET    | `/api/clips/:id`    | Pełny wpis              |
| POST   | `/api/clips`        | Dodaj wpis              |
| DELETE | `/api/clips/:id`    | Usuń wpis               |
| DELETE | `/api/clips/all`    | Wyczyść wszystko        |

Jeśli `PIN` jest ustawiony, dodaj nagłówek `X-Pin: <twój-pin>` do każdego żądania.

## Skróty klawiszowe

- `Ctrl+Enter` / `Cmd+Enter` — wrzuć tekst
