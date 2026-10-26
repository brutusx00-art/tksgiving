document.addEventListener('DOMContentLoaded', () => {
    // --- Countdown Logic ---
    const targetDate = new Date('November 26, 2026 15:00:00 EST').getTime();

    function updateCountdown() {
        const now = new Date().getTime();
        const distance = targetDate - now;

        if (distance < 0) {
            document.getElementById('countdown').innerHTML = '<div class="time-value" style="width:100%">Happy Thanksgiving!</div>';
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        document.getElementById('days').innerText = String(days).padStart(2, '0');
        document.getElementById('hours').innerText = String(hours).padStart(2, '0');
        document.getElementById('minutes').innerText = String(minutes).padStart(2, '0');
        document.getElementById('seconds').innerText = String(seconds).padStart(2, '0');
    }

    setInterval(updateCountdown, 1000);
    updateCountdown();

    // --- Potluck API Logic ---
    const form = document.getElementById('potluckForm');
    const dishesList = document.getElementById('dishesList');
    const API_URL = 'api/dishes';

    const categoryLabels = {
        turkey: '🦃 Turkey & Mains',
        sides: '🥔 Sides',
        desserts: '🥧 Desserts',
        drinks: '🍻 Drinks',
        other: '📦 Other'
    };

    const categoryOrder = ['turkey', 'sides', 'desserts', 'drinks', 'other'];

    function renderDishes(dishes) {
        dishesList.innerHTML = '';
        if (dishes.length === 0) {
            dishesList.innerHTML = '<li class="dish-item" style="text-align: center; opacity: 0.5;">No dishes yet. Be the first!</li>';
            return;
        }

        // Group by category
        const grouped = {};
        dishes.forEach(dish => {
            const cat = dish.category || 'other';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(dish);
        });

        // Render each category
        categoryOrder.forEach(cat => {
            if (!grouped[cat] || grouped[cat].length === 0) return;

            const categoryHeader = document.createElement('li');
            categoryHeader.className = 'category-header';
            categoryHeader.innerHTML = `<span class="category-label">${categoryLabels[cat]}</span>`;
            dishesList.appendChild(categoryHeader);

            // Sort by newest first within category
            grouped[cat].sort((a, b) => b.id - a.id).forEach(item => {
                const li = document.createElement('li');
                li.className = 'dish-item';
                li.innerHTML = `
                    <div class="dish-name">${escapeHtml(item.name)}</div>
                    <div class="dish-desc">is bringing ${escapeHtml(item.dish)}</div>
                    <button class="remove-btn" data-id="${item.id}" title="Remove this dish">✕</button>
                `;
                dishesList.appendChild(li);
            });
        });

        // Add remove button listeners
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.dataset.id;
                if (confirm('Remove this dish?')) {
                    await removeDish(id);
                }
            });
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async function fetchDishes() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error(`Status: ${response.status} (${response.statusText})`);
            const dishes = await response.json();
            renderDishes(dishes);
        } catch (error) {
            console.error('Error fetching dishes:', error);
            dishesList.innerHTML = `<li class="dish-item" style="color: #ff6b6b; text-align: center;">
                Failed to load dishes.<br>
                <small>${error.message}</small>
            </li>`;
        }
    }

    async function removeDish(id) {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to remove dish');
            await fetchDishes();
        } catch (error) {
            console.error('Error removing dish:', error);
            alert('Failed to remove dish. Please try again.');
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('name');
        const dishInput = document.getElementById('dish');
        const categoryInput = document.getElementById('category');
        const submitBtn = form.querySelector('button');

        const originalBtnText = submitBtn.innerText;
        submitBtn.innerText = 'Adding...';
        submitBtn.disabled = true;

        const newDish = {
            name: nameInput.value,
            dish: dishInput.value,
            category: categoryInput.value
        };

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newDish),
            });

            if (!response.ok) throw new Error('Failed to add dish');

            // Clear form
            nameInput.value = '';
            dishInput.value = '';
            categoryInput.value = '';

            // Refresh list
            await fetchDishes();

        } catch (error) {
            console.error('Error adding dish:', error);
            alert('Failed to add your dish. Please try again.');
        } finally {
            submitBtn.innerText = originalBtnText;
            submitBtn.disabled = false;
        }
    });

    // Initial load
    fetchDishes();

    // --- Cocktail Suggestion Logic ---
    const cocktailForm = document.getElementById('cocktailForm');
    const cocktailsList = document.getElementById('cocktailsList');
    const COCKTAIL_API_URL = 'api/cocktails';

    function renderCocktails(cocktails) {
        cocktailsList.innerHTML = '';
        if (cocktails.length === 0) {
            cocktailsList.innerHTML = '<div class="cocktail-empty">No suggestions yet. Be the first!</div>';
            return;
        }

        cocktails.sort((a, b) => b.id - a.id).forEach(item => {
            const card = document.createElement('div');
            card.className = 'cocktail-card cocktail-suggested';
            card.innerHTML = `
                <span class="cocktail-icon">🍹</span>
                <div class="cocktail-body">
                    <div class="cocktail-name">${escapeHtml(item.cocktailName)}</div>
                    <div class="cocktail-ingredients">${escapeHtml(item.ingredients)}</div>
                    <div class="cocktail-suggested-by">Suggested by ${escapeHtml(item.name)}</div>
                </div>
                <button class="remove-btn" data-id="${item.id}" title="Remove this suggestion">✕</button>
            `;
            cocktailsList.appendChild(card);
        });

        document.querySelectorAll('#cocktailsList .remove-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                if (confirm('Remove this cocktail suggestion?')) {
                    await removeCocktail(id);
                }
            });
        });
    }

    async function fetchCocktails() {
        try {
            const response = await fetch(COCKTAIL_API_URL);
            if (!response.ok) throw new Error(`Status: ${response.status}`);
            const cocktails = await response.json();
            renderCocktails(cocktails);
        } catch (error) {
            console.error('Error fetching cocktails:', error);
        }
    }

    async function removeCocktail(id) {
        try {
            const response = await fetch(`${COCKTAIL_API_URL}/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to remove cocktail');
            await fetchCocktails();
        } catch (error) {
            console.error('Error removing cocktail:', error);
            alert('Failed to remove cocktail. Please try again.');
        }
    }

    cocktailForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const suggesterInput = document.getElementById('cocktailSuggester');
        const nameInput = document.getElementById('cocktailNameInput');
        const ingInput = document.getElementById('cocktailIngredients');
        const submitBtn = cocktailForm.querySelector('button');

        const originalBtnText = submitBtn.innerText;
        submitBtn.innerText = 'Adding...';
        submitBtn.disabled = true;

        const newCocktail = {
            name: suggesterInput.value,
            cocktailName: nameInput.value,
            ingredients: ingInput.value
        };

        try {
            const response = await fetch(COCKTAIL_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCocktail),
            });

            if (!response.ok) throw new Error('Failed to add cocktail');

            suggesterInput.value = '';
            nameInput.value = '';
            ingInput.value = '';

            await fetchCocktails();
        } catch (error) {
            console.error('Error adding cocktail:', error);
            alert('Failed to add your cocktail. Please try again.');
        } finally {
            submitBtn.innerText = originalBtnText;
            submitBtn.disabled = false;
        }
    });

    fetchCocktails();

    // --- Turkey Hot Tub Video Mute/Unmute ---
    const turkeyVideo = document.getElementById('turkeyVideo');
    const unmuteBtn = document.getElementById('videoUnmuteBtn');

    unmuteBtn.addEventListener('click', () => {
        turkeyVideo.muted = !turkeyVideo.muted;
        unmuteBtn.textContent = turkeyVideo.muted ? '🔇' : '🔊';
        unmuteBtn.setAttribute('aria-label', turkeyVideo.muted ? 'Unmute video' : 'Mute video');
    });
});