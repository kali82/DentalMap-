# MaroDent - Interaktywny Układ Zębów

Aplikacja webowa umożliwiająca wyświetlanie i dowolne układanie reprezentacji zębów.

## Zawartość projektu

- `index.html` - Główna aplikacja do układania zębów
- `styles.css` - Style CSS dla aplikacji
- `script.js` - Funkcjonalność JavaScript dla aplikacji
- `image-processor.html` - Narzędzie do wycinania pojedynczych zębów z obrazu
- `tooth.jpg` - Oryginalny obraz zębów
- `images/` - Katalog na wycinki pojedynczych zębów

## Instrukcja użycia

### Krok 1: Przygotowanie obrazów zębów

1. Otwórz plik `image-processor.html` w przeglądarce.
2. Użyj narzędzia do zaznaczania i wycinania poszczególnych zębów z obrazu.
3. Dla każdego wyciętego zęba nadaj odpowiednią nazwę (np. "blue-1", "red-2").
4. Zapisz wycięte obrazy w folderze `images/` z odpowiednimi nazwami.

### Krok 2: Konfiguracja aplikacji

1. Po przygotowaniu wszystkich obrazów zębów, otwórz plik `script.js`.
2. Odkomentuj linię `// loadToothImages();` na końcu pliku, aby aplikacja używała rzeczywistych obrazów zębów.

### Krok 3: Korzystanie z aplikacji

1. Otwórz plik `index.html` w przeglądarce.
2. Przeciągaj zęby z palety do obszaru roboczego.
3. Układaj zęby w dowolny sposób w obszarze roboczym.
4. Możesz zapisać układ zębów za pomocą przycisku "Zapisz układ".
5. Możesz wczytać zapisany wcześniej układ za pomocą przycisku "Wczytaj układ".
6. Możesz zresetować obszar roboczy za pomocą przycisku "Resetuj układ".

## Funkcje aplikacji

- **Przeciąganie i upuszczanie** - Przeciągaj zęby z palety do obszaru roboczego.
- **Przesuwanie zębów** - Kliknij i przeciągnij ząb w obszarze roboczym, aby zmienić jego pozycję.
- **Zapisywanie układu** - Zapisz aktualny układ zębów w pamięci przeglądarki.
- **Wczytywanie układu** - Wczytaj zapisany wcześniej układ zębów.
- **Resetowanie układu** - Wyczyść obszar roboczy.

## Dostosowanie aplikacji

Jeśli chcesz dostosować aplikację, możesz:

1. Zmodyfikować style w pliku `styles.css`, aby zmienić wygląd aplikacji.
2. Dodać nowe funkcje w pliku `script.js`, np. obracanie zębów, zmianę rozmiaru, itp.
3. Dodać nowe elementy interfejsu w pliku `index.html`.

## Wymagania techniczne

Aplikacja działa w nowoczesnych przeglądarkach internetowych obsługujących:

- HTML5
- CSS3
- JavaScript ES6
- API Drag and Drop
- LocalStorage

Nie wymaga żadnych dodatkowych bibliotek ani frameworków.
