// Variable Utama Aplikasi
let glossaryData = [];
let activeLetter = '';

// Elemen DOM Halaman Utama
const grid = document.getElementById('glossaryGrid');
const searchInput = document.getElementById('searchInput');
const searchColumnSelect = document.getElementById('searchColumnSelect');
const darkModeToggle = document.getElementById('darkModeToggle');
const alphabetContainer = document.getElementById('alphabetFilter');
const resultCount = document.getElementById('resultCount');
const resetBtn = document.getElementById('resetFilter');
const printBtn = document.getElementById('printBtn');

// Elemen DOM Pop-up Modal Detail
const modal = document.getElementById('detailModal');
const modalTerm = document.getElementById('modalTerm');
const modalTranslation = document.getElementById('modalTranslation');
const modalCategory = document.getElementById('modalCategory');
const modalDefinition = document.getElementById('modalDefinition');
const closeModal = document.getElementById('closeModal');

// 1. Inisialisasi Mode Gelap
function initDarkMode() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

if (darkModeToggle) {
  darkModeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });
}

// 2. Memuat dan Memproses Data dari File glosarium.csv
function loadCSVData() {
  Papa.parse('glosarium.csv', {
    download: true,
    header: true,
    delimiter: ";", // Pemisah titik koma CSV
    skipEmptyLines: true,
    complete: function(results) {
      glossaryData = results.data
        .map(item => {
          const termEng = item.Term_English ? item.Term_English.trim() : '';
          const transInd = item.Istilah_Indonesia ? item.Istilah_Indonesia.trim() : '';
          const defInd = item.Definisi ? item.Definisi.trim() : '';
          const firstChar = termEng.charAt(0).toUpperCase();

          let categoryName = `Abjad ${firstChar}`;
          if (!isNaN(firstChar) && firstChar !== '') {
            categoryName = 'Angka / Simbol';
          }

          return {
            term: termEng,
            translation: transInd,
            category: categoryName,
            def: defInd
          };
        })
        .filter(item => item.term !== '');

      renderAlphabet();
      filterData();
    },
    error: function(err) {
      console.error("Gagal membaca file CSV:", err);
      if (resultCount) {
        resultCount.textContent = "Gagal memuat data CSV. Pastikan file 'glosarium.csv' tersedia.";
      }
    }
  });
}

// 3. Render Tombol Abjad A-Z
function renderAlphabet() {
  const letters = ['ALL', '3E', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];
  
  alphabetContainer.innerHTML = letters.map(letter => {
    const isAll = letter === 'ALL';
    const isActive = (isAll && activeLetter === '') || activeLetter === letter;
    const filterValue = isAll ? '' : letter;
    
    return `
      <button 
        type="button"
        onclick="filterByLetter('${filterValue}', '${letter}')" 
        class="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 ${
          isActive
            ? 'bg-teal-700 dark:bg-teal-600 text-white shadow-sm scale-105' 
            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
        }"
      >
        ${letter}
      </button>
    `;
  }).join('');
}

// 4. Render Kartu Glosarium ke Grid
function renderCards(data) {
  resultCount.textContent = `Menampilkan ${data.length} istilah`;
  
  if (data.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-12 text-slate-400 dark:text-slate-500">
        <p class="text-lg font-medium">Istilah tidak ditemukan.</p>
        <p class="text-xs mt-1">Coba kata kunci lain atau reset filter pencarian Anda.</p>
      </div>`;
    return;
  }

  grid.innerHTML = data.map(item => `
    <div 
      onclick="openModal('${encodeURIComponent(item.term)}')" 
      class="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-teal-300 dark:hover:border-teal-500 transition duration-200 cursor-pointer flex flex-col justify-between group"
    >
      <div>
        <div class="flex justify-between items-start gap-2 mb-2">
          <h3 class="font-bold text-slate-900 dark:text-white text-lg group-hover:text-teal-700 dark:group-hover:text-teal-400 transition">${item.term}</h3>
          <span class="text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/80 border border-teal-100 dark:border-teal-800 px-2 py-0.5 rounded-full shrink-0">
            ${item.category}
          </span>
        </div>
        <p class="text-xs italic text-teal-600 dark:text-teal-400 font-medium mb-3">${item.translation}</p>
        <p class="text-slate-600 dark:text-slate-300 text-sm line-clamp-3 leading-relaxed">${item.def}</p>
      </div>
      <span class="text-xs text-teal-600 dark:text-teal-400 font-semibold mt-4 inline-block group-hover:translate-x-1 transition-transform">
        Detail Lengkap &rarr;
      </span>
    </div>
  `).join('');
}

// 5. Logika Pencarian dan Pemfilteran Kolom
function filterData() {
  const query = searchInput.value.toLowerCase().trim();
  const selectedColumn = searchColumnSelect.value;
  
  const filtered = glossaryData.filter(item => {
    let matchesQuery = false;

    if (selectedColumn === 'term') {
      matchesQuery = item.term.toLowerCase().includes(query);
    } else if (selectedColumn === 'translation') {
      matchesQuery = item.translation.toLowerCase().includes(query);
    } else if (selectedColumn === 'def') {
      matchesQuery = item.def.toLowerCase().includes(query);
    } else {
      matchesQuery = item.term.toLowerCase().includes(query) || 
                     item.translation.toLowerCase().includes(query) ||
                     item.def.toLowerCase().includes(query);
    }
    
    let matchesLetter = false;
    if (activeLetter === '') {
      matchesLetter = true;
    } else if (activeLetter === '3E') {
      matchesLetter = /^\d/.test(item.term) || item.term.toUpperCase().startsWith('3E');
    } else {
      matchesLetter = item.term.toUpperCase().startsWith(activeLetter);
    }
    
    return matchesQuery && matchesLetter;
  });

  resetBtn.classList.toggle('hidden', query === '' && activeLetter === '' && selectedColumn === 'all');
  renderCards(filtered);
}

// Handler Pilihan Alfabet
function filterByLetter(filterValue, displayLetter) {
  activeLetter = displayLetter === 'ALL' ? '' : displayLetter;
  renderAlphabet();
  filterData();
}

// 6. Kontrol Pop-up Modal Detail
function openModal(encodedTerm) {
  const termName = decodeURIComponent(encodedTerm);
  const item = glossaryData.find(d => d.term === termName);
  if (!item) return;

  modalTerm.textContent = item.term;
  modalTranslation.textContent = item.translation;
  modalCategory.textContent = item.category;
  modalDefinition.textContent = item.def;

  modal.classList.remove('hidden');
}

closeModal.addEventListener('click', () => modal.classList.add('hidden'));

modal.addEventListener('click', (e) => {
  if (e.target === modal) modal.classList.add('hidden');
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
    modal.classList.add('hidden');
  }
});

// Listener Input Pencarian & Dropdown Kolom
searchInput.addEventListener('input', filterData);
searchColumnSelect.addEventListener('change', filterData);

// Listener Tombol Reset Filter
resetBtn.addEventListener('click', () => {
  searchInput.value = '';
  searchColumnSelect.value = 'all';
  activeLetter = '';
  renderAlphabet();
  filterData();
});

// Listener Tombol Cetak / PDF
if (printBtn) {
  printBtn.addEventListener('click', () => {
    window.print();
  });
}

// Inisialisasi Aplikasi
initDarkMode();
loadCSVData();
