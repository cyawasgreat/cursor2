document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.getElementById("hamburger");
    const mobileMenu = document.getElementById("mobileMenu");
    const overlay = document.getElementById("overlay");

    function toggleMenu() {
        const isActive = hamburger.classList.toggle("active");
        if (isActive) {
            // Animate hamburger
            hamburger.children[0].style.transform = "rotate(45deg) translateY(9px)";
            hamburger.children[1].style.opacity = "0";
            hamburger.children[2].style.transform = "rotate(-45deg) translateY(-9px)";
            // Show menu
            mobileMenu.style.right = "0";
            overlay.classList.add("opacity-100", "visible");
            overlay.classList.remove("opacity-0", "invisible");
        } else {
            hamburger.children[0].style.transform = "";
            hamburger.children[1].style.opacity = "";
            hamburger.children[2].style.transform = "";
            mobileMenu.style.right = "-100%";
            overlay.classList.remove("opacity-100", "visible");
            overlay.classList.add("opacity-0", "invisible");
        }
    }

    function closeMenu() {
        if (hamburger.classList.contains('active')) {
            hamburger.classList.remove("active");
            hamburger.children[0].style.transform = "";
            hamburger.children[1].style.opacity = "";
            hamburger.children[2].style.transform = "";
            mobileMenu.style.right = "-100%";
            overlay.classList.remove("opacity-100", "visible");
            overlay.classList.add("opacity-0", "invisible");
        }
    }

    if (hamburger && mobileMenu && overlay) {
        hamburger.addEventListener('click', toggleMenu);
        overlay.addEventListener('click', closeMenu);
    }


    document.querySelectorAll(".mobile-menu-item").forEach((item) => {
        item.addEventListener("click", closeMenu);
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", function (e) {
            const targetId = this.getAttribute("href");
            if (targetId.length > 1) { // check if it's not just "#"
                const target = document.querySelector(targetId);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: "smooth" });
                }
            }
        });
    });
});