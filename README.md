# Schowek

Osobisty schowek webowy. Wklej tekst na jednym urządzeniu, skopiuj na drugim.

## Uruchomienie

```bash
npm install
npm start          # http://localhost:3000
```

## Opcje środowiskowe

| Zmienna  | Domyślnie       | Opis                              |
|----------|-----------------|-----------------------------------|
| `PORT`   | `3000`          | Port HTTP                         |
| `PIN`    | *(brak)*        | Opcjonalny PIN dostępu (cyfry)    |
| `DB_PATH`| `schowek.db`    | Ścieżka do pliku SQLite           |

Przykład z PINem:
```bash
PIN=1234 npm start
```

## API

| Metoda   | Ścieżka              | Opis                    |
|----------|----------------------|-------------------------|
| GET      | `/api/clips`         | Lista wpisów (preview)  |
| GET      | `/api/clips/latest`  | Ostatni wpis (pełny)    |
| GET      | `/api/clips/:id`     | Pełny wpis              |
| POST     | `/api/clips`         | Dodaj wpis              |
| DELETE   | `/api/clips/:id`     | Usuń wpis               |
| DELETE   | `/api/clips/all`     | Wyczyść wszystko        |

Jeśli `PIN` jest ustawiony, dodaj nagłówek `X-Pin: <twój-pin>` do każdego requesta.

## Skróty klawiszowe

- `Ctrl+Enter` / `Cmd+Enter` – wrzuć tekst
