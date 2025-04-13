document.addEventListener("DOMContentLoaded", function () {
  // Elementy DOM
  const teethWorkspace = document.getElementById("teeth-workspace");
  const resetBtn = document.getElementById("reset-btn");
  const saveBtn = document.getElementById("save-btn");
  const loadBtn = document.getElementById("load-btn");
  const teethList = document.querySelector(".teeth-list");
  const zoomInBtn = document.getElementById("zoom-in-btn");
  const zoomOutBtn = document.getElementById("zoom-out-btn");
  const zoomLevelDisplay = document.getElementById("zoom-level");

  // Zmienne globalne
  let draggedTooth = null;
  let offsetX = 0;
  let offsetY = 0;
  let currentZIndex = 1;
  let currentZoom = 1; // 100%
  let stateHistory = []; // Historia stanów (ostatnie 10)
  const MAX_HISTORY = 10; // Maksymalna liczba stanów w historii
  
  // Zmienne do obsługi zaznaczania wielu zębów
  let isSelecting = false;
  let selectionStartX = 0;
  let selectionStartY = 0;
  let selectionBox = null;
  let selectedTeeth = [];
  let isMovingSelection = false;
  let selectionOffsetX = 0;
  let selectionOffsetY = 0;
  let availableTeeth = {
    "blue-1": true,
    "blue-2": true,
    "blue-3": true,
    "blue-4": true,
    "blue-5": true,
    "blue-6": true,
    "blue-7": true,
    "red-1": true,
    "red-2": true,
    "red-3": true,
    "red-4": true,
    "red-5": true,
    "red-6": true,
    "red-7": true,
    "red-8": true,
    "green-1": true,
    "green-2": true,
    "green-3": true,
    "green-4": true,
    "green-5": true,
    "green-6": true,
    "green-7": true,
    "green-8": true,
    "yellow-1": true,
    "yellow-2": true,
    "yellow-3": true,
    "yellow-4": true,
    "yellow-5": true,
    "yellow-6": true,
    "yellow-7": true,
    "yellow-8": true,
  };

  // Nazwy zębów
  const toothNames = {
    "blue-1": "11",
    "blue-2": "12",
    "blue-4": "14",
    "blue-3": "13",
    "blue-6": "16",
    "blue-5": "15",
    "blue-7": "17",
    "red-1": "21",
    "red-2": "22",
    "red-3": "23",
    "red-4": "24",
    "red-5": "25",
    "red-6": "26",
    "red-7": "27",
    "green-1": "31",
    "green-2": "32",
    "green-3": "33",
    "green-4": "34",
    "green-5": "35",
    "green-6": "36",
    "green-7": "37",
    "yellow-1": "41",
    "yellow-2": "42",
    "yellow-3": "43",
    "yellow-4": "44",
    "yellow-5": "45",
    "yellow-6": "46",
    "yellow-7": "47",
  };

  // Inicjalizacja
  initDragAndDrop();
  initButtons();
  initZoomControls();
  addToothNames();

  // Funkcja inicjalizująca obsługę przeciągania i upuszczania
  function initDragAndDrop() {
    // Obsługa zdarzeń dla zębów w palecie
    const teeth = document.querySelectorAll(".tooth");
    teeth.forEach((tooth) => {
      tooth.addEventListener("dragstart", handleDragStart);
    });

    // Obsługa zdarzeń dla obszaru roboczego
    teethWorkspace.addEventListener("dragover", handleDragOver);
    teethWorkspace.addEventListener("drop", handleDrop);

    // Obsługa kliknięcia w obszar roboczy (do zaznaczania zębów)
    teethWorkspace.addEventListener("mousedown", handleWorkspaceMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }

  // Funkcja inicjalizująca przyciski
  function initButtons() {
    resetBtn.addEventListener("click", resetWorkspace);
    saveBtn.addEventListener("click", saveArrangement);
    loadBtn.addEventListener("click", loadArrangement);
    document.getElementById("add-all-btn").addEventListener("click", addAllTeeth);
    document.getElementById("undo-btn").addEventListener("click", restoreState);
  }

  // Funkcja inicjalizująca kontrolki zoom
  function initZoomControls() {
    zoomInBtn.addEventListener("click", zoomIn);
    zoomOutBtn.addEventListener("click", zoomOut);
  }

  // Funkcja powiększająca obszar roboczy
  function zoomIn() {
    if (currentZoom < 2) {
      // Maksymalny zoom: 200%
      currentZoom += 0.1;
      updateZoom();
    }
  }

  // Funkcja zmniejszająca obszar roboczy
  function zoomOut() {
    if (currentZoom > 0.5) {
      // Minimalny zoom: 50%
      currentZoom -= 0.1;
      updateZoom();
    }
  }

  // Funkcja aktualizująca zoom
  function updateZoom() {
    teethWorkspace.style.transform = `scale(${currentZoom})`;
    teethWorkspace.style.width = `${100 / currentZoom}%`;
    teethWorkspace.style.height = `${500 / currentZoom}px`;
    zoomLevelDisplay.textContent = `${Math.round(currentZoom * 100)}%`;
  }

  // Funkcja dodająca nazwy zębów
  function addToothNames() {
    const teeth = document.querySelectorAll(".tooth");
    teeth.forEach((tooth) => {
      const toothType = tooth.getAttribute("data-tooth-type");
      const nameElement = document.createElement("div");
      nameElement.className = "tooth-name";
      nameElement.textContent = toothNames[toothType] || toothType;
      tooth.appendChild(nameElement);
    });
  }

  // Obsługa rozpoczęcia przeciągania
  function handleDragStart(e) {
    draggedTooth = this;

    // Zapisz dane o typie zęba
    e.dataTransfer.setData("text/plain", this.getAttribute("data-tooth-type"));

    // Ustaw efekt przeciągania
    e.dataTransfer.effectAllowed = "copy";
  }

  // Obsługa przeciągania nad obszarem roboczym
  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }

  // Obsługa upuszczenia zęba
  function handleDrop(e) {
    e.preventDefault();

    // Pobierz dane o typie zęba
    const toothType = e.dataTransfer.getData("text/plain");

    // Sprawdź, czy ząb jest dostępny
    if (!availableTeeth[toothType]) return;
    
    // Zapisz aktualny stan przed dodaniem zęba
    saveState();

    // Utwórz nowy element zęba
    const newTooth = document.createElement("div");
    if (toothType.startsWith("blue")) {
      newTooth.className = `tooth ${"blue"}`;
    }
    if (toothType.startsWith("red")) {
      newTooth.className = `tooth ${"red"}`;
    }
    if (toothType.startsWith("yellow")) {
      newTooth.className = `tooth ${"yellow"}`;
    }
    if (toothType.startsWith("green")) {
      newTooth.className = `tooth ${"green"}`;
    }
    newTooth.setAttribute("data-tooth-type", toothType);

    // Ustaw pozycję zęba w obszarze roboczym
    const rect = teethWorkspace.getBoundingClientRect();
    const x = (e.clientX - rect.left) / currentZoom - 25; // 25 to połowa szerokości zęba
    const y = (e.clientY - rect.top) / currentZoom - 40; // 40 to połowa wysokości zęba

    newTooth.style.left = `${x}px`;
    newTooth.style.top = `${y}px`;
    newTooth.style.zIndex = currentZIndex++;

    // Dodaj nazwę zęba
    const nameElement = document.createElement("div");
    nameElement.className = "tooth-name";
    nameElement.textContent = toothNames[toothType] || toothType;
    newTooth.appendChild(nameElement);

    // Dodaj przycisk usuwania
    const removeButton = document.createElement("div");
    removeButton.className = "tooth-remove";
    removeButton.innerHTML = "&times;";
    removeButton.addEventListener("click", function (e) {
      e.stopPropagation();
      removeTooth(newTooth);
    });
    newTooth.appendChild(removeButton);

    // Dodaj ząb do obszaru roboczego
    teethWorkspace.appendChild(newTooth);

    // Dodaj obsługę kliknięcia dla nowego zęba
    newTooth.addEventListener("mousedown", handleToothMouseDown);

    // Zastosuj obraz zęba
    const toothImages = getToothImages();
    if (toothImages[toothType]) {
      newTooth.style.backgroundImage = `url('${toothImages[toothType]}')`;
      newTooth.style.backgroundColor = "transparent";
    }

    // Usuń ząb z palety
    availableTeeth[toothType] = false;
    updateTeethPalette();

    // Resetuj zmienną draggedTooth, aby zakończyć operację przeciągania
    draggedTooth = null;
  }

  // Funkcja usuwająca ząb z obszaru roboczego
  function removeTooth(tooth) {
    // Zapisz aktualny stan przed usunięciem zęba
    saveState();
    
    const toothType = tooth.getAttribute("data-tooth-type");

    // Przywróć ząb do palety
    availableTeeth[toothType] = true;
    updateTeethPalette();

    // Usuń ząb z obszaru roboczego
    tooth.remove();
  }

  // Obsługa kliknięcia na ząb w obszarze roboczym
  function handleToothMouseDown(e) {
    e.stopPropagation();

    // Zapisz aktualny stan przed rozpoczęciem przeciągania
    saveState();

    const clickedTooth = this;
    
    // Sprawdź, czy kliknięty ząb jest już zaznaczony
    if (clickedTooth.classList.contains("selected")) {
      // Jeśli ząb jest zaznaczony i są inne zaznaczone zęby, rozpocznij przesuwanie wszystkich zaznaczonych zębów
      if (selectedTeeth.length > 1) {
        isMovingSelection = true;
        
        // Zapisz pozycję kursora
        const rect = teethWorkspace.getBoundingClientRect();
        selectionOffsetX = (e.clientX - rect.left) / currentZoom;
        selectionOffsetY = (e.clientY - rect.top) / currentZoom;
        
        // Zapisz oryginalne pozycje zaznaczonych zębów
        selectedTeeth.forEach(tooth => {
          tooth.dataset.originalX = parseFloat(tooth.style.left);
          tooth.dataset.originalY = parseFloat(tooth.style.top);
        });
        
        return;
      }
    } else {
      // Jeśli ząb nie jest zaznaczony i nie jest wciśnięty klawisz Shift, odznacz wszystkie zęby
      if (!e.shiftKey) {
        clearSelection();
      }
      
      // Dodaj ząb do zaznaczenia
      clickedTooth.classList.add("selected");
      
      // Dodaj ząb do tablicy zaznaczonych zębów
      if (!selectedTeeth.includes(clickedTooth)) {
        selectedTeeth.push(clickedTooth);
      }
      
      // Dodaj obsługę klawisza Delete
      document.addEventListener("keydown", handleKeyDown);
    }

    // Zaznacz aktualny ząb
    clickedTooth.style.zIndex = currentZIndex++;

    // Oblicz przesunięcie względem pozycji kursora
    const rect = clickedTooth.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    // Ustaw zmienną globalną dla funkcji obsługi ruchu
    draggedTooth = clickedTooth;
  }

  // Obsługa kliknięcia w obszar roboczy
  function handleWorkspaceMouseDown(e) {
    // Sprawdź, czy kliknięcie było bezpośrednio na obszarze roboczym (nie na zębie)
    if (e.target === teethWorkspace) {
      // Odznacz wszystkie zęby
      clearSelection();
      
      // Rozpocznij zaznaczanie
      isSelecting = true;
      
      // Zapisz pozycję początkową zaznaczenia
      const rect = teethWorkspace.getBoundingClientRect();
      selectionStartX = (e.clientX - rect.left) / currentZoom;
      selectionStartY = (e.clientY - rect.top) / currentZoom;
      
      // Utwórz element zaznaczenia
      selectionBox = document.createElement("div");
      selectionBox.className = "selection-box";
      selectionBox.style.left = `${selectionStartX}px`;
      selectionBox.style.top = `${selectionStartY}px`;
      selectionBox.style.width = "0";
      selectionBox.style.height = "0";
      
      // Dodaj element zaznaczenia do obszaru roboczego
      teethWorkspace.appendChild(selectionBox);
    }
    
    // Resetuj zmienną draggedTooth
    draggedTooth = null;
  }

  // Obsługa ruchu myszą
  function handleMouseMove(e) {
    const rect = teethWorkspace.getBoundingClientRect();
    
    // Obsługa przeciągania zęba
    if (draggedTooth) {
      // Oblicz nową pozycję
      const x = (e.clientX - rect.left) / currentZoom - offsetX;
      const y = (e.clientY - rect.top) / currentZoom - offsetY;

      // Ogranicz pozycję do obszaru roboczego
      const maxX = rect.width / currentZoom - draggedTooth.offsetWidth;
      const maxY = rect.height / currentZoom - draggedTooth.offsetHeight;

      const newX = Math.max(0, Math.min(x, maxX));
      const newY = Math.max(0, Math.min(y, maxY));

      // Ustaw nową pozycję
      draggedTooth.style.left = `${newX}px`;
      draggedTooth.style.top = `${newY}px`;
      
      return;
    }
    
    // Obsługa przeciągania zaznaczonych zębów
    if (isMovingSelection && selectedTeeth.length > 0) {
      // Oblicz nową pozycję
      const currentX = (e.clientX - rect.left) / currentZoom;
      const currentY = (e.clientY - rect.top) / currentZoom;
      
      // Oblicz przesunięcie
      const deltaX = currentX - selectionOffsetX;
      const deltaY = currentY - selectionOffsetY;
      
      // Aktualizuj pozycję zaznaczonych zębów
      selectedTeeth.forEach(tooth => {
        const originalX = parseFloat(tooth.dataset.originalX);
        const originalY = parseFloat(tooth.dataset.originalY);
        
        // Ogranicz pozycję do obszaru roboczego
        const maxX = rect.width / currentZoom - tooth.offsetWidth;
        const maxY = rect.height / currentZoom - tooth.offsetHeight;
        
        const newX = Math.max(0, Math.min(originalX + deltaX, maxX));
        const newY = Math.max(0, Math.min(originalY + deltaY, maxY));
        
        // Ustaw nową pozycję
        tooth.style.left = `${newX}px`;
        tooth.style.top = `${newY}px`;
      });
      
      return;
    }
    
    // Obsługa zaznaczania obszaru
    if (isSelecting && selectionBox) {
      // Oblicz aktualną pozycję kursora
      const currentX = (e.clientX - rect.left) / currentZoom;
      const currentY = (e.clientY - rect.top) / currentZoom;
      
      // Oblicz szerokość i wysokość zaznaczenia
      const width = Math.abs(currentX - selectionStartX);
      const height = Math.abs(currentY - selectionStartY);
      
      // Oblicz lewy górny róg zaznaczenia
      const left = Math.min(currentX, selectionStartX);
      const top = Math.min(currentY, selectionStartY);
      
      // Aktualizuj pozycję i rozmiar zaznaczenia
      selectionBox.style.left = `${left}px`;
      selectionBox.style.top = `${top}px`;
      selectionBox.style.width = `${width}px`;
      selectionBox.style.height = `${height}px`;
    }
  }

  // Obsługa puszczenia przycisku myszy
  function handleMouseUp(e) {
    // Jeśli był przeciągany ząb, zapisz stan po zakończeniu przeciągania
    if (draggedTooth) {
      saveState();
      draggedTooth = null;
      return;
    }
    
    // Jeśli były przeciągane zaznaczone zęby, zapisz stan po zakończeniu przeciągania
    if (isMovingSelection) {
      saveState();
      isMovingSelection = false;
      
      // Wyczyść oryginalne pozycje
      selectedTeeth.forEach(tooth => {
        delete tooth.dataset.originalX;
        delete tooth.dataset.originalY;
      });
      
      return;
    }
    
    // Jeśli było zaznaczanie obszaru
    if (isSelecting && selectionBox) {
      // Pobierz współrzędne zaznaczenia
      const left = parseFloat(selectionBox.style.left);
      const top = parseFloat(selectionBox.style.top);
      const right = left + parseFloat(selectionBox.style.width);
      const bottom = top + parseFloat(selectionBox.style.height);
      
      // Sprawdź, czy zaznaczenie ma minimalny rozmiar
      if (Math.abs(right - left) > 5 && Math.abs(bottom - top) > 5) {
        // Zaznacz zęby, które znajdują się w obszarze zaznaczenia
        const teeth = teethWorkspace.querySelectorAll(".tooth");
        teeth.forEach(tooth => {
          const toothRect = tooth.getBoundingClientRect();
          const workspaceRect = teethWorkspace.getBoundingClientRect();
          
          // Przelicz pozycję zęba względem obszaru roboczego
          const toothLeft = (toothRect.left - workspaceRect.left) / currentZoom;
          const toothTop = (toothRect.top - workspaceRect.top) / currentZoom;
          const toothRight = toothLeft + tooth.offsetWidth;
          const toothBottom = toothTop + tooth.offsetHeight;
          
          // Sprawdź, czy ząb znajduje się w obszarze zaznaczenia
          if (toothLeft < right && toothRight > left && toothTop < bottom && toothBottom > top) {
            // Dodaj klasę zaznaczenia
            tooth.classList.add("selected");
            
            // Dodaj ząb do tablicy zaznaczonych zębów
            if (!selectedTeeth.includes(tooth)) {
              selectedTeeth.push(tooth);
            }
          }
        });
        
        // Jeśli zaznaczono zęby, dodaj obsługę klawisza Delete
        if (selectedTeeth.length > 0) {
          document.addEventListener("keydown", handleKeyDown);
        }
      }
      
      // Usuń element zaznaczenia
      selectionBox.remove();
      selectionBox = null;
      isSelecting = false;
    }
  }
  
  // Obsługa klawiszy
  function handleKeyDown(e) {
    // Obsługa klawisza Delete
    if (e.key === "Delete" && selectedTeeth.length > 0) {
      // Zapisz aktualny stan przed usunięciem zębów
      saveState();
      
      // Usuń zaznaczone zęby
      selectedTeeth.forEach(tooth => {
        const toothType = tooth.getAttribute("data-tooth-type");
        
        // Przywróć ząb do palety
        availableTeeth[toothType] = true;
        
        // Usuń ząb z obszaru roboczego
        tooth.remove();
      });
      
      // Wyczyść tablicę zaznaczonych zębów
      selectedTeeth = [];
      
      // Aktualizuj paletę zębów
      updateTeethPalette();
      
      // Usuń obsługę klawisza Delete
      document.removeEventListener("keydown", handleKeyDown);
    }
  }
  
  // Funkcja czyszcząca zaznaczenie
  function clearSelection() {
    // Usuń klasę zaznaczenia ze wszystkich zębów
    const teeth = teethWorkspace.querySelectorAll(".tooth.selected");
    teeth.forEach(tooth => {
      tooth.classList.remove("selected");
    });
    
    // Wyczyść tablicę zaznaczonych zębów
    selectedTeeth = [];
    
    // Usuń obsługę klawisza Delete
    document.removeEventListener("keydown", handleKeyDown);
  }

  // Funkcja resetująca obszar roboczy
  function resetWorkspace() {
    if (confirm("Czy na pewno chcesz zresetować układ zębów?")) {
      teethWorkspace.innerHTML = "";
      currentZIndex = 1;

      // Przywróć wszystkie zęby do palety
      Object.keys(availableTeeth).forEach((key) => {
        availableTeeth[key] = true;
      });

      // Odśwież paletę zębów
      updateTeethPalette();
    }
  }

  // Funkcja aktualizująca paletę zębów
  function updateTeethPalette() {
    // Wyczyść paletę
    teethList.innerHTML = `
      <div class="upper-jaw"></div>
      <div class="lower-jaw"></div>
    `;

    const upperJaw = teethList.querySelector(".upper-jaw");
    const lowerJaw = teethList.querySelector(".lower-jaw");

    // Stałe pozycje dla wszystkich zębów
    // Górna szczęka
    createFixedTeethRow(upperJaw, [
      { type: "blue-7", color: "blue" },
      { type: "blue-6", color: "blue" },
      { type: "blue-5", color: "blue" },
      { type: "blue-4", color: "blue" },
      { type: "blue-3", color: "blue" },
      { type: "blue-2", color: "blue" },
      { type: "blue-1", color: "blue" },
      { type: "red-1", color: "red" },
      { type: "red-2", color: "red" },
      { type: "red-3", color: "red" },
      { type: "red-4", color: "red" },
      { type: "red-5", color: "red" },
      { type: "red-6", color: "red" },
      { type: "red-7", color: "red" }
    ]);

    // Dolna szczęka
    createFixedTeethRow(lowerJaw, [
      { type: "green-7", color: "green" },
      { type: "green-6", color: "green" },
      { type: "green-5", color: "green" },
      { type: "green-4", color: "green" },
      { type: "green-3", color: "green" },
      { type: "green-2", color: "green" },
      { type: "green-1", color: "green" },
      { type: "yellow-1", color: "yellow" },
      { type: "yellow-2", color: "yellow" },
      { type: "yellow-3", color: "yellow" },
      { type: "yellow-4", color: "yellow" },
      { type: "yellow-5", color: "yellow" },
      { type: "yellow-6", color: "yellow" },
      { type: "yellow-7", color: "yellow" }
    ]);

    // Zastosuj obrazy zębów
    loadToothImages();

    // Dodaj nazwy zębów
    addToothNames();
  }

  // Funkcja tworząca stały rząd zębów
  function createFixedTeethRow(container, teethConfig) {
    teethConfig.forEach(config => {
      const cell = document.createElement("div");
      cell.className = "tooth-cell";
      
      // Sprawdź, czy ząb jest dostępny
      if (availableTeeth[config.type]) {
        // Jeśli dostępny, dodaj ząb
        const tooth = document.createElement("div");
        tooth.className = `tooth ${config.color}`;
        tooth.setAttribute("data-tooth-type", config.type);
        tooth.draggable = true;
        tooth.addEventListener("dragstart", handleDragStart);
        cell.appendChild(tooth);
      } else {
        // Jeśli niedostępny, dodaj pusty placeholder
        const placeholder = document.createElement("div");
        placeholder.className = "tooth-placeholder";
        cell.appendChild(placeholder);
      }
      
      container.appendChild(cell);
    });
  }

  // Funkcja dodająca ząb do palety
  function addToothToPalette(toothType, colorClass, container) {
    const tooth = document.createElement("div");
    tooth.className = `tooth ${colorClass}`;
    tooth.setAttribute("data-tooth-type", toothType);
    tooth.draggable = true;
    tooth.addEventListener("dragstart", handleDragStart);
    container.appendChild(tooth);
  }

  // Funkcja zapisująca układ zębów
  function saveArrangement() {
    // Pobierz nazwę układu od użytkownika
    const arrangementName = prompt("Podaj nazwę dla zapisywanego układu zębów:", "Układ " + new Date().toLocaleString());
    
    // Jeśli użytkownik anulował, przerwij
    if (arrangementName === null) return;
    
    const teeth = teethWorkspace.querySelectorAll(".tooth");
    const arrangement = [];

    teeth.forEach((tooth) => {
      arrangement.push({
        type: tooth.getAttribute("data-tooth-type"),
        left: tooth.style.left,
        top: tooth.style.top,
        zIndex: tooth.style.zIndex,
      });
    });

    // Pobierz istniejące układy
    let savedArrangements = {};
    try {
      const savedArrangementsJSON = localStorage.getItem("teethArrangements");
      if (savedArrangementsJSON) {
        savedArrangements = JSON.parse(savedArrangementsJSON);
      }
    } catch (e) {
      console.error("Błąd podczas odczytu zapisanych układów:", e);
      savedArrangements = {};
    }

    // Dodaj nowy układ
    savedArrangements[arrangementName] = {
      teeth: arrangement,
      availableTeeth: availableTeeth,
      zoomLevel: currentZoom,
      date: new Date().toISOString()
    };

    // Ogranicz liczbę zapisanych układów do 5
    const arrangementNames = Object.keys(savedArrangements);
    if (arrangementNames.length > 5) {
      // Znajdź najstarszy układ
      let oldestName = arrangementNames[0];
      let oldestDate = new Date(savedArrangements[oldestName].date);
      
      for (let i = 1; i < arrangementNames.length; i++) {
        const currentDate = new Date(savedArrangements[arrangementNames[i]].date);
        if (currentDate < oldestDate) {
          oldestDate = currentDate;
          oldestName = arrangementNames[i];
        }
      }
      
      // Usuń najstarszy układ
      delete savedArrangements[oldestName];
    }

    // Zapisz do localStorage
    localStorage.setItem("teethArrangements", JSON.stringify(savedArrangements));
    alert(`Układ zębów "${arrangementName}" został zapisany!`);
  }

  // Funkcja wczytująca układ zębów
  function loadArrangement() {
    // Pobierz zapisane układy
    let savedArrangements = {};
    try {
      const savedArrangementsJSON = localStorage.getItem("teethArrangements");
      if (savedArrangementsJSON) {
        savedArrangements = JSON.parse(savedArrangementsJSON);
      }
    } catch (e) {
      console.error("Błąd podczas odczytu zapisanych układów:", e);
      savedArrangements = {};
    }

    const arrangementNames = Object.keys(savedArrangements);
    if (arrangementNames.length === 0) {
      alert("Brak zapisanych układów zębów!");
      return;
    }

    // Stwórz listę układów do wyboru
    let options = "";
    arrangementNames.forEach((name, index) => {
      options += `${index + 1}. ${name}\n`;
    });

    // Poproś użytkownika o wybór układu
    const selectedIndex = prompt(`Wybierz układ do wczytania (1-${arrangementNames.length}):\n${options}`);
    
    // Jeśli użytkownik anulował, przerwij
    if (selectedIndex === null) return;
    
    // Sprawdź, czy wybór jest poprawny
    const index = parseInt(selectedIndex) - 1;
    if (isNaN(index) || index < 0 || index >= arrangementNames.length) {
      alert("Nieprawidłowy wybór!");
      return;
    }

    const selectedName = arrangementNames[index];
    const selectedArrangement = savedArrangements[selectedName];

    // Wyczyść obszar roboczy
    teethWorkspace.innerHTML = "";

    // Wczytaj zapisany układ
    const arrangement = selectedArrangement.teeth;
    let maxZIndex = 1;

    // Wczytaj dostępne zęby
    if (selectedArrangement.availableTeeth) {
      availableTeeth = JSON.parse(JSON.stringify(selectedArrangement.availableTeeth));
    } else {
      // Jeśli brak zapisanych dostępnych zębów, oznacz wszystkie użyte zęby jako niedostępne
      Object.keys(availableTeeth).forEach((key) => {
        availableTeeth[key] = true;
      });

      arrangement.forEach((item) => {
        availableTeeth[item.type] = false;
      });
    }

    // Wczytaj poziom zoom
    if (selectedArrangement.zoomLevel) {
      currentZoom = parseFloat(selectedArrangement.zoomLevel);
      updateZoom();
    }

    arrangement.forEach((item) => {
      const tooth = document.createElement("div");
      if (item.type.startsWith("blue")) {
        tooth.className = "tooth blue";
      } else if (item.type.startsWith("red")) {
        tooth.className = "tooth red";
      } else if (item.type.startsWith("yellow")) {
        tooth.className = "tooth yellow";
      } else if (item.type.startsWith("green")) {
        tooth.className = "tooth green";
      }
      tooth.setAttribute("data-tooth-type", item.type);
      tooth.style.left = item.left;
      tooth.style.top = item.top;
      tooth.style.zIndex = item.zIndex;

      // Aktualizuj maksymalny zIndex
      maxZIndex = Math.max(maxZIndex, parseInt(item.zIndex || 1));

      // Dodaj nazwę zęba
      const nameElement = document.createElement("div");
      nameElement.className = "tooth-name";
      nameElement.textContent = toothNames[item.type] || item.type;
      tooth.appendChild(nameElement);

      // Dodaj przycisk usuwania
      const removeButton = document.createElement("div");
      removeButton.className = "tooth-remove";
      removeButton.innerHTML = "&times;";
      removeButton.addEventListener("click", function (e) {
        e.stopPropagation();
        removeTooth(tooth);
      });
      tooth.appendChild(removeButton);

      // Dodaj ząb do obszaru roboczego
      teethWorkspace.appendChild(tooth);

      // Dodaj obsługę kliknięcia
      tooth.addEventListener("mousedown", handleToothMouseDown);
    });

    // Aktualizuj globalny zIndex
    currentZIndex = maxZIndex + 1;

    // Zastosuj obrazy zębów do wczytanych zębów
    loadToothImages();

    // Aktualizuj paletę zębów
    updateTeethPalette();

    alert(`Układ zębów "${selectedName}" został wczytany!`);
  }

  // Funkcja zwracająca mapowanie typów zębów na obrazy
  function getToothImages() {
    return {
      "blue-1": "images/blue-1-1.png",
      "blue-2": "images/blue-1-2.png",
      "blue-3": "images/blue-1-3.png",
      "blue-4": "images/blue-1-4.png",
      "blue-5": "images/blue-1-5.png",
      "blue-6": "images/blue-1-6.png",
      "blue-7": "images/blue-1-7.png",
      "red-1": "images/red-2-1.png",
      "red-2": "images/red-2-2.png",
      "red-3": "images/red-2-3.png",
      "red-4": "images/red-2-4.png",
      "red-5": "images/red-2-5.png",
      "red-6": "images/red-2-6.png",
      "red-7": "images/red-2-7.png",
      "green-1": "images/green-3-1.png",
      "green-2": "images/green-3-2.png",
      "green-3": "images/green-3-3.png",
      "green-4": "images/green-3-4.png",
      "green-5": "images/green-3-5.png",
      "green-6": "images/green-3-6.png",
      "green-7": "images/green-3-7.png",
      "yellow-1": "images/yellow-4-1.png",
      "yellow-2": "images/yellow-4-2.png",
      "yellow-3": "images/yellow-4-3.png",
      "yellow-4": "images/yellow-4-4.png",
      "yellow-5": "images/yellow-4-5.png",
      "yellow-6": "images/yellow-4-6.png",
      "yellow-7": "images/yellow-4-7.png",
    };
  }

  // Funkcja do wykorzystania rzeczywistych obrazów zębów
  function loadToothImages() {
    // Mapowanie typów zębów na obrazy
    const toothImages = getToothImages();

    // Zastosuj obrazy do zębów w palecie
    const teeth = document.querySelectorAll(".teeth-list .tooth");
    teeth.forEach((tooth) => {
      const toothType = tooth.getAttribute("data-tooth-type");
      if (toothImages[toothType]) {
        tooth.style.backgroundImage = `url('${toothImages[toothType]}')`;
        tooth.style.backgroundColor = "transparent"; // Usuń kolor tła
      }
    });

    // Zastosuj obrazy do zębów w obszarze roboczym
    const workspaceTeeth = document.querySelectorAll(".teeth-workspace .tooth");
    workspaceTeeth.forEach((tooth) => {
      const toothType = tooth.getAttribute("data-tooth-type");
      if (toothImages[toothType]) {
        tooth.style.backgroundImage = `url('${toothImages[toothType]}')`;
        tooth.style.backgroundColor = "transparent"; // Usuń kolor tła
      }
    });
  }

  // Funkcja dodająca wszystkie dostępne zęby do obszaru roboczego
  function addAllTeeth() {
    // Oblicz szerokość obszaru roboczego
    const workspaceWidth = teethWorkspace.clientWidth;
    
    // Oblicz szerokość układu zębów (14 zębów * 50px szerokości + odstępy)
    const teethLayoutWidth = 14 * 50 + 13 * 10; // 14 zębów po 50px + 13 odstępów po 10px
    
    // Oblicz przesunięcie w poziomie, aby wyśrodkować układ zębów
    const offsetX = (workspaceWidth - teethLayoutWidth) / 2;
    
    // Konfiguracja zębów w górnej szczęce
    const upperTeethConfig = [
      { type: "blue-7", color: "blue", x: offsetX + 0, y: 50 },
      { type: "blue-6", color: "blue", x: offsetX + 60, y: 50 },
      { type: "blue-5", color: "blue", x: offsetX + 120, y: 50 },
      { type: "blue-4", color: "blue", x: offsetX + 180, y: 50 },
      { type: "blue-3", color: "blue", x: offsetX + 240, y: 50 },
      { type: "blue-2", color: "blue", x: offsetX + 300, y: 50 },
      { type: "blue-1", color: "blue", x: offsetX + 360, y: 50 },
      { type: "red-1", color: "red", x: offsetX + 420, y: 50 },
      { type: "red-2", color: "red", x: offsetX + 480, y: 50 },
      { type: "red-3", color: "red", x: offsetX + 540, y: 50 },
      { type: "red-4", color: "red", x: offsetX + 600, y: 50 },
      { type: "red-5", color: "red", x: offsetX + 660, y: 50 },
      { type: "red-6", color: "red", x: offsetX + 720, y: 50 },
      { type: "red-7", color: "red", x: offsetX + 780, y: 50 }
    ];

    // Konfiguracja zębów w dolnej szczęce
    const lowerTeethConfig = [
      { type: "green-7", color: "green", x: offsetX + 0, y: 150 },
      { type: "green-6", color: "green", x: offsetX + 60, y: 150 },
      { type: "green-5", color: "green", x: offsetX + 120, y: 150 },
      { type: "green-4", color: "green", x: offsetX + 180, y: 150 },
      { type: "green-3", color: "green", x: offsetX + 240, y: 150 },
      { type: "green-2", color: "green", x: offsetX + 300, y: 150 },
      { type: "green-1", color: "green", x: offsetX + 360, y: 150 },
      { type: "yellow-1", color: "yellow", x: offsetX + 420, y: 150 },
      { type: "yellow-2", color: "yellow", x: offsetX + 480, y: 150 },
      { type: "yellow-3", color: "yellow", x: offsetX + 540, y: 150 },
      { type: "yellow-4", color: "yellow", x: offsetX + 600, y: 150 },
      { type: "yellow-5", color: "yellow", x: offsetX + 660, y: 150 },
      { type: "yellow-6", color: "yellow", x: offsetX + 720, y: 150 },
      { type: "yellow-7", color: "yellow", x: offsetX + 780, y: 150 }
    ];

    // Zapisz aktualny stan przed dodaniem zębów
    saveState();

    // Dodaj zęby z górnej szczęki
    upperTeethConfig.forEach(config => {
      if (availableTeeth[config.type]) {
        addToothToWorkspace(config.type, config.color, config.x, config.y);
      }
    });

    // Dodaj zęby z dolnej szczęki
    lowerTeethConfig.forEach(config => {
      if (availableTeeth[config.type]) {
        addToothToWorkspace(config.type, config.color, config.x, config.y);
      }
    });

    // Aktualizuj paletę zębów
    updateTeethPalette();
  }

  // Funkcja zapisująca aktualny stan
  function saveState() {
    // Pobierz aktualny stan obszaru roboczego
    const teeth = teethWorkspace.querySelectorAll(".tooth");
    const state = {
      teeth: [],
      availableTeeth: JSON.parse(JSON.stringify(availableTeeth)),
      currentZIndex: currentZIndex
    };

    // Zapisz informacje o każdym zębie
    teeth.forEach(tooth => {
      state.teeth.push({
        type: tooth.getAttribute("data-tooth-type"),
        left: tooth.style.left,
        top: tooth.style.top,
        zIndex: tooth.style.zIndex,
        color: tooth.className.includes("blue") ? "blue" : 
               tooth.className.includes("red") ? "red" : 
               tooth.className.includes("green") ? "green" : "yellow"
      });
    });

    // Dodaj stan do historii
    stateHistory.push(state);
    
    // Ogranicz historię do MAX_HISTORY stanów
    if (stateHistory.length > MAX_HISTORY) {
      stateHistory.shift(); // Usuń najstarszy stan
    }
    
    // Aktualizuj przycisk cofania
    updateUndoButton();
  }

  // Funkcja przywracająca poprzedni stan
  function restoreState() {
    // Sprawdź, czy jest jakiś stan do przywrócenia
    if (stateHistory.length === 0) return;
    
    // Pobierz ostatni stan
    const state = stateHistory.pop();
    
    // Wyczyść obszar roboczy
    teethWorkspace.innerHTML = "";
    
    // Przywróć dostępne zęby
    availableTeeth = JSON.parse(JSON.stringify(state.availableTeeth));
    
    // Przywróć zIndex
    currentZIndex = state.currentZIndex;
    
    // Przywróć zęby
    state.teeth.forEach(item => {
      addToothToWorkspace(item.type, item.color, parseFloat(item.left), parseFloat(item.top));
    });
    
    // Aktualizuj paletę zębów
    updateTeethPalette();
    
    // Aktualizuj przycisk cofania
    updateUndoButton();
  }

  // Funkcja aktualizująca przycisk cofania
  function updateUndoButton() {
    const undoBtn = document.getElementById("undo-btn");
    if (undoBtn) {
      undoBtn.disabled = stateHistory.length === 0;
    }
  }

  // Funkcja dodająca ząb do obszaru roboczego na określonej pozycji
  function addToothToWorkspace(toothType, colorClass, x, y) {
    // Utwórz nowy element zęba
    const newTooth = document.createElement("div");
    newTooth.className = `tooth ${colorClass}`;
    newTooth.setAttribute("data-tooth-type", toothType);

    // Ustaw pozycję zęba w obszarze roboczym
    newTooth.style.left = `${x}px`;
    newTooth.style.top = `${y}px`;
    newTooth.style.zIndex = currentZIndex++;

    // Dodaj nazwę zęba
    const nameElement = document.createElement("div");
    nameElement.className = "tooth-name";
    nameElement.textContent = toothNames[toothType] || toothType;
    newTooth.appendChild(nameElement);

    // Dodaj przycisk usuwania
    const removeButton = document.createElement("div");
    removeButton.className = "tooth-remove";
    removeButton.innerHTML = "&times;";
    removeButton.addEventListener("click", function (e) {
      e.stopPropagation();
      removeTooth(newTooth);
    });
    newTooth.appendChild(removeButton);

    // Dodaj ząb do obszaru roboczego
    teethWorkspace.appendChild(newTooth);

    // Dodaj obsługę kliknięcia dla nowego zęba
    newTooth.addEventListener("mousedown", handleToothMouseDown);

    // Zastosuj obraz zęba
    const toothImages = getToothImages();
    if (toothImages[toothType]) {
      newTooth.style.backgroundImage = `url('${toothImages[toothType]}')`;
      newTooth.style.backgroundColor = "transparent";
    }

    // Usuń ząb z palety
    availableTeeth[toothType] = false;
  }

  // Wywołaj funkcję ładowania obrazów po załadowaniu strony
  loadToothImages();
});
