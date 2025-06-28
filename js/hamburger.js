        // Hamburger menu logic
        function toggleMenu() {
            const hamburger = document.getElementById('hamburger');
            const mobileMenu = document.getElementById('mobileMenu');
            const overlay = document.getElementById('overlay');
            hamburger.classList.toggle('active');
            if (hamburger.classList.contains('active')) {
                // Animate hamburger
                hamburger.children[0].style.transform = "rotate(45deg) translateY(9px)";
                hamburger.children[1].style.opacity = "0";
                hamburger.children[2].style.transform = "rotate(-45deg) translateY(-9px)";
                // Show menu
                mobileMenu.style.right = "0";
                overlay.classList.add('opacity-100', 'visible');
                overlay.classList.remove('opacity-0', 'invisible');
            } else {
                hamburger.children[0].style.transform = "";
                hamburger.children[1].style.opacity = "";
                hamburger.children[2].style.transform = "";
                mobileMenu.style.right = "-100%";
                overlay.classList.remove('opacity-100', 'visible');
                overlay.classList.add('opacity-0', 'invisible');
            }
        }
        function closeMenu() {
            const hamburger = document.getElementById('hamburger');
            const mobileMenu = document.getElementById('mobileMenu');
            const overlay = document.getElementById('overlay');
            hamburger.classList.remove('active');
            hamburger.children[0].style.transform = "";
            hamburger.children[1].style.opacity = "";
            hamburger.children[2].style.transform = "";
            mobileMenu.style.right = "-100%";
            overlay.classList.remove('opacity-100', 'visible');
            overlay.classList.add('opacity-0', 'invisible');
        }
        document.querySelectorAll('.mobile-menu-item').forEach(item => {
            item.addEventListener('click', closeMenu);
        });

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

        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
