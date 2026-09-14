// Variable Utama
let glossaryData = [];
let activeLetter = '';

// Elemen DOM Halaman Utama
const grid = document.getElementById('glossaryGrid');
const searchInput = document.getElementById('searchInput');
const alphabetContainer = document.getElementById('alphabetFilter');
const resultCount = document.getElementById('resultCount');
const resetBtn = document.getElementById('resetFilter');

// Elemen DOM Pop-up Modal
const modal = document.getElementById('detailModal');
const modalTerm = document.getElementById('modalTerm');
const modalTranslation = document.getElementById('modalTranslation');
const modalCategory = document.getElementById('modalCategory');
const modalDefinition = document.getElementById('modalDefinition');
const closeModal = document.getElementById('closeModal');

// 1. Memuat & Memproses Data CSV
function loadCSVData() {
  Papa.parse('glosarium.csv', {
    download: true,
    header: true,
    delimiter: ";", // Disesuaikan dengan pemisah titik koma CSV Anda
    skipEmptyLines: true,
    complete: function(results) {
      glossaryData = results.data
        .map(item => {
          const termEng = item.Term_English ? item.Term_English.trim() : '';
          const transInd = item.Istilah_Indonesia ? item.Istilah_Indonesia.trim() : '';
          const defInd = item.Definisi ? item.Definisi.trim() : '';
          const firstChar = termEng.charAt(0).toUpperCase();

          // Penentuan nama kategori abjad
          let categoryName = `Abjad ${firstChar}`;
          if (!isNaN(firstChar) && firstChar !== '') {
            categoryName = 'Kategori Angka / Simbol';
          }

          return {
            term: termEng,
            translation: transInd,
            category: categoryName,
            def: defInd
          };
        })
        .filter(item => item.term !== ''); // Menyaring baris kosong

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

// 2. Render Tombol Filter Alfabet A-Z (Termasuk Opsi Angka/3E)
function renderAlphabet() {
  const letters = ['ALL', '3E', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];
  
  alphabetContainer.innerHTML = letters.map(letter => {
    const isAll = letter === 'ALL';
    const isActive = (isAll && activeLetter === '') || activeLetter === letter;
    const filterValue = isAll ? '' : letter;
    
    return `
      <button 
        onclick="filterByLetter('${filterValue}', '${letter}')" 
        class="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 ${
          isActive
            ? 'bg-teal-700 text-white shadow-sm scale-105' 
            : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
        }"
      >
        ${letter}
      </button>
    `;
  }).join('');
}

// 3. Render Kartu Glosarium ke Grid
function renderCards(data) {
  resultCount.textContent = `Menampilkan ${data.length} istilah`;
  
  if (data.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-12 text-slate-400">
        <p class="text-lg font-medium">Istilah tidak ditemukan.</p>
        <p class="text-xs mt-1">Coba kata kunci lain atau klik 'Reset Filter'.</p>
      </div>`;
    return;
  }

  grid.innerHTML = data.map(item => `
    <div 
      onclick="openModal('${encodeURIComponent(item.term)}')" 
      class="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-teal-300 transition duration-200 cursor-pointer flex flex-col justify-between group"
    >
      <div>
        <div class="flex justify-between items-start gap-2 mb-2">
          <h3 class="font-bold text-slate-900 text-lg group-hover:text-teal-700 transition">${item.term}</h3>
          <span class="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full shrink-0">
            ${item.category}
          </span>
        </div>
        <p class="text-xs italic text-teal-600 font-medium mb-3">${item.translation}</p>
        <p class="text-slate-600 text-sm line-clamp-3 leading-relaxed">${item.def}</p>
      </div>
      <span class="text-xs text-teal-600 font-semibold mt-4 inline-block group-hover:translate-x-1 transition-transform">
        Detail Lengkap &rarr;
      </span>
    </div>
  `).join('');
}

// 4. Logika Pencarian & Pemfilteran Alfabet
function filterData() {
  const query = searchInput.value.toLowerCase().trim();
  
  const filtered = glossaryData.filter(item => {
    // Pencarian berdasarkan istilah Inggris, terjemahan Indonesia, atau isi definisi
    const matchesQuery = item.term.toLowerCase().includes(query) || 
                         item.translation.toLowerCase().includes(query) ||
                         item.def.toLowerCase().includes(query);
    
    // Filter berdasarkan tombol abjad yang dipilih
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

  resetBtn.classList.toggle('hidden', query === '' && activeLetter === '');
  renderCards(filtered);
}

// Handler Pilihan Alfabet
function filterByLetter(filterValue, displayLetter) {
  activeLetter = displayLetter === 'ALL' ? '' : displayLetter;
  renderAlphabet();
  filterData();
}

// 5. Fungsi Kontrol Pop-up Modal Detail
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

// Event Listeners untuk Tutup Modal
closeModal.addEventListener('click', () => modal.classList.add('hidden'));

modal.addEventListener('click', (e) => {
  if (e.target === modal) modal.classList.add('hidden');
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
    modal.classList.add('hidden');
  }
});

// Event Listeners untuk Pencarian & Reset
searchInput.addEventListener('input', filterData);

resetBtn.addEventListener('click', () => {
  searchInput.value = '';
  activeLetter = '';
  renderAlphabet();
  filterData();
});

// Jalankan Pengambilan Data CSV Saat Halaman Dimuat
loadCSVData();