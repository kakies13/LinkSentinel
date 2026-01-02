/**
 * LinkSentinel Website Logic
 * Handles interactive elements, button simulations, and animations.
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- "Add to Chrome" Simulation ---
    const installButtons = document.querySelectorAll('.btn-primary');

    installButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();

            // If already "installed", ignore
            if (btn.classList.contains('installed')) return;

            // 1. Loading State
            const originalText = btn.innerHTML;
            const width = btn.offsetWidth;

            btn.style.width = `${width}px`; // Lock width
            btn.innerHTML = `<span class="spinner"></span> Adding...`;
            btn.style.cursor = 'wait';

            // 2. Simulate Network Delay (1.5s)
            setTimeout(() => {
                // 3. Success State
                btn.innerHTML = `✓ Added to Chrome`;
                btn.style.background = '#10B981'; // Ensure green
                btn.style.borderColor = '#10B981';
                btn.classList.add('installed');
                btn.style.cursor = 'default';

                // Show floating toast
                showToast("LinkSentinel has been added to Chrome successfully!");

                // Fire confetti or visual cue if we had a library, 
                // but for vanilla, the button change is good.
            }, 1200);
        });
    });

    // --- Smooth Scroll for Anchors ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

});

// --- Toast System ---
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;

    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Remove after 3s
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
