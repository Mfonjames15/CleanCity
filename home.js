// --- MODALS FOR RECYCLING CARDS ---
document.querySelectorAll(".recycling-card").forEach(card => {
    card.style.cursor = "pointer";
    const modalId = card.getAttribute("data-modal");
    const modalEl = document.getElementById(modalId);

    if (modalEl) {
        const modal = new bootstrap.Modal(modalEl);

        card.addEventListener("click", () => {
            modal.show();
        });

        // Optional: hide modal on mouse leave
        // card.addEventListener("mouseleave", () => {
        //   modal.hide();
        // });
    }
});

// --- SMOOTH SCROLL AND ACTIVE NAV BUTTONS ---
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const navbarHeight = document.querySelector('.navbar').offsetHeight;
        const sectionTop = section.offsetTop - navbarHeight;
        window.scrollTo({
            top: sectionTop,
            behavior: 'smooth'
        });
        setActiveButton(sectionId);
    }
}


function setActiveButton(activeId) {
    const buttons = document.querySelectorAll('.nav-btn-wrapper button');
    buttons.forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`${activeId}-btn`);
    if (activeBtn) activeBtn.classList.add('active');
}

// Optional: highlight button while scrolling
window.addEventListener('scroll', () => {
    const sections = ['about', 'features', 'benefits'];
    const scrollPos = window.scrollY + window.innerHeight / 3;

    for (let id of sections) {
        const section = document.getElementById(id);
        if (section.offsetTop <= scrollPos && (section.offsetTop + section.offsetHeight) > scrollPos) {
            setActiveButton(id);
        }
    }
});
