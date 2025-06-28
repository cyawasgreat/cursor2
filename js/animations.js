document.addEventListener('DOMContentLoaded', () => {
    // Particle animation on logo click
    function createParticles(event) {
        const logo = event.currentTarget;
        const rect = logo.getBoundingClientRect();
        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle pointer-events-none fixed z-[1200] bg-cyan-400 rounded-full';
            const size = Math.random() * 8 + 4;
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            const angle = (i / 12) * Math.PI * 2;
            const distance = Math.random() * 60 + 30;
            particle.style.left = (rect.left + rect.width / 2) + 'px';
            particle.style.top = (rect.top + rect.height / 2) + 'px';
            particle.style.background = "rgba(0,212,255,0.6)";
            particle.style.animation = "particle-float 3s ease-out forwards";
            document.body.appendChild(particle);
            setTimeout(() => {
                particle.style.transform = `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance - 50}px) scale(0)`;
                particle.style.opacity = '0';
            }, 10);
            setTimeout(() => {
                particle.remove();
            }, 3000);
        }
    }

    const logo = document.querySelector('.logo');
    if (logo) {
        logo.addEventListener('click', createParticles);
    }


    // Blob movement on mouse move
    document.addEventListener('mousemove', (e) => {
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;
        const blobs = [document.querySelector('.blob1'), document.querySelector('.blob2'), document.querySelector('.blob3')];
        blobs.forEach((blob, index) => {
            if (!blob) return;
            const speed = (index + 1) * 0.5;
            const x = (mouseX - 0.5) * speed * 30;
            const y = (mouseY - 0.5) * speed * 30;
            blob.style.transform = `translate(${x}px, ${y}px)`;
        });
    });
});