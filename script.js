document.addEventListener('DOMContentLoaded', () => {
    // --- Countdown Logic ---
    const targetDate = new Date('November 27, 2026 15:00:00 EST').getTime();

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
    const API_URL = 'api/dishes'; // Relative path to handle subdirectories/proxies

    function renderDishes(dishes) {
        dishesList.innerHTML = '';
        if (dishes.length === 0) {
            dishesList.innerHTML = '<li class="dish-item" style="text-align: center; opacity: 0.5;">No dishes yet. Be the first!</li>';
            return;
        }

        // Sort by newest first
        dishes.sort((a, b) => b.id - a.id).forEach(item => {
            const li = document.createElement('li');
            li.className = 'dish-item';
            li.innerHTML = `
                <div class="dish-name">${escapeHtml(item.name)}</div>
                <div class="dish-desc">is bringing ${escapeHtml(item.dish)}</div>
            `;
            dishesList.appendChild(li);
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

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('name');
        const dishInput = document.getElementById('dish');
        const submitBtn = form.querySelector('button');

        const originalBtnText = submitBtn.innerText;
        submitBtn.innerText = 'Adding...';
        submitBtn.disabled = true;

        const newDish = {
            name: nameInput.value,
            dish: dishInput.value
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
});

