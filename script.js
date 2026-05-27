document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. HIGH-PERFORMANCE INTERACTIVE CANVAS PARTICLES
    // ==========================================
    const canvas = document.getElementById('particles-canvas');
    const ctx = canvas.getContext('2d');
    
    let particlesArray = [];
    const colors = ['rgba(0, 242, 254, 0.45)', 'rgba(79, 172, 254, 0.35)', 'rgba(189, 0, 255, 0.25)'];
    
    // Mouse Coordinates
    const mouse = {
        x: null,
        y: null,
        radius: 140 // Interactive radius around cursor
    };

    window.addEventListener('mousemove', (event) => {
        mouse.x = event.clientX;
        mouse.y = event.clientY;
    });

    window.addEventListener('mouseout', () => {
        mouse.x = null;
        mouse.y = null;
    });

    // Resize Canvas
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initParticles();
    }
    window.addEventListener('resize', resizeCanvas);

    // Particle Class
    class Particle {
        constructor(x, y, directionX, directionY, size, color) {
            this.x = x;
            this.y = y;
            this.directionX = directionX;
            this.directionY = directionY;
            this.size = size;
            this.color = color;
        }

        // Draw individual particle
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
            ctx.fillStyle = this.color;
            ctx.fill();
        }

        // Update particle positions and apply mouse interaction
        update() {
            // Check boundary collisions
            if (this.x > canvas.width || this.x < 0) {
                this.directionX = -this.directionX;
            }
            if (this.y > canvas.height || this.y < 0) {
                this.directionY = -this.directionY;
            }

            // Mouse interaction (repulsion physics)
            if (mouse.x != null && mouse.y != null) {
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < mouse.radius) {
                    const force = (mouse.radius - distance) / mouse.radius;
                    // Push particles away from cursor smoothly
                    this.x -= dx / distance * force * 3;
                    this.y -= dy / distance * force * 3;
                }
            }

            // Move particle
            this.x += this.directionX;
            this.y += this.directionY;
            
            this.draw();
        }
    }

    // Initialize particle array based on screen density
    function initParticles() {
        particlesArray = [];
        // Scale number of particles based on screen width
        let numberOfParticles = (canvas.width * canvas.height) / 11000;
        if (numberOfParticles > 120) numberOfParticles = 120; // Cap to keep performance buttery smooth

        for (let i = 0; i < numberOfParticles; i++) {
            let size = (Math.random() * 2) + 1.2;
            let x = (Math.random() * ((innerWidth - size * 2) - (size * 2)) + size * 2);
            let y = (Math.random() * ((innerHeight - size * 2) - (size * 2)) + size * 2);
            let directionX = (Math.random() * 0.4) - 0.2;
            let directionY = (Math.random() * 0.4) - 0.2;
            let color = colors[Math.floor(Math.random() * colors.length)];

            particlesArray.push(new Particle(x, y, directionX, directionY, size, color));
        }
    }

    // Connect particles close to each other with faint visual web lines
    function connect() {
        let opacityValue = 1;
        for (let a = 0; a < particlesArray.length; a++) {
            for (let b = a; b < particlesArray.length; b++) {
                let dx = particlesArray[a].x - particlesArray[b].x;
                let dy = particlesArray[a].y - particlesArray[b].y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 115) {
                    opacityValue = 1 - (distance / 115);
                    ctx.strokeStyle = `rgba(0, 242, 254, ${opacityValue * 0.08})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                    ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                    ctx.stroke();
                }
            }
        }
    }

    // Animation Loop
    function animate() {
        ctx.clearRect(0, 0, innerWidth, innerHeight);
        
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
        }
        connect();
        requestAnimationFrame(animate);
    }

    // Initial setup
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initParticles();
    animate();


    // ==========================================
    // 2. FETCH PORTFOLIO DATABASE & UI BUILD
    // ==========================================
    fetch('./data/data.json')
        .then(response => {
            if (!response.ok) throw new Error("Could not load data.json");
            return response.json();
        })
        .then(data => {
            populateUI(data);
            runGSAPAnimations();
        })
        .catch(error => console.error("Error loading portfolio data:", error));

    function populateUI(data) {
        // --- 1. HERO BIO SECTION ---
        document.getElementById('hero-name').textContent = data.personal.name;
        document.getElementById('hero-title').textContent = data.personal.title;
        document.getElementById('hero-summary').textContent = data.personal.summary;
        document.getElementById('hero-email').href = `mailto:${data.personal.email}`;
        document.getElementById('hero-img').src = data.personal.image;
        document.getElementById('hero-img').alt = data.personal.name;

        // --- 2. EXPERIENCE SECTION (Neon Vertical Timeline) ---
        const experienceTimeline = document.getElementById('experience-list');
        experienceTimeline.innerHTML = ''; // clear initial skeleton

        data.experience.forEach(job => {
            const jobCard = document.createElement('div');
            jobCard.className = 'job-card';
            jobCard.innerHTML = `
                <div class="job-content">
                    <div class="job-header">
                        <div class="job-details">
                            <h4>${job.role} <span class="job-company">@ ${job.company}</span></h4>
                            <span class="job-location">${job.location}</span>
                        </div>
                        <div class="job-meta-tech">
                            <span class="job-duration">${job.duration}</span>
                        </div>
                    </div>
                    <p class="job-desc">${job.description}</p>
                </div>
            `;
            experienceTimeline.appendChild(jobCard);
        });

        // --- 3. SKILLS SECTION ---
        const programmingContainer = document.getElementById('skills-programming');
        const technologyContainer = document.getElementById('skills-technology');
        
        programmingContainer.innerHTML = '';
        technologyContainer.innerHTML = '';

        data.skills.programming.forEach(skill => {
            const tag = document.createElement('span');
            tag.className = 'skill-tag';
            tag.textContent = skill;
            programmingContainer.appendChild(tag);
        });

        data.skills.technology.forEach(skill => {
            const tag = document.createElement('span');
            tag.className = 'skill-tag';
            tag.textContent = skill;
            technologyContainer.appendChild(tag);
        });

        // --- 4. FEATURED PROJECTS SECTION ---
        const projectsGrid = document.getElementById('projects-grid');
        projectsGrid.innerHTML = '';

        data.projects.forEach(project => {
            const projectCard = document.createElement('div');
            projectCard.className = 'project-card';
            projectCard.innerHTML = `
                <span class="project-badge">${project.type}</span>
                <h4>${project.name}</h4>
                <p class="project-desc">${project.description}</p>
                <div class="project-timeline-tag">${project.duration}</div>
            `;
            projectsGrid.appendChild(projectCard);
        });

        // --- 5. EDUCATION & CERTIFICATIONS ---
        const eduContainer = document.getElementById('education-content');
        eduContainer.innerHTML = `
            <div class="edu-card">
                <span class="edu-degree">${data.education.degree}</span>
                <span class="edu-inst">${data.education.institution}</span>
                <div class="edu-meta">
                    <span>CGPA: ${data.education.cgpa}</span>
                    <span>${data.education.duration}</span>
                </div>
            </div>
        `;

        const certList = document.getElementById('certifications-list');
        certList.innerHTML = '';
        data.certifications.forEach(cert => {
            const li = document.createElement('li');
            if (cert.link) {
                li.innerHTML = `<a href="${cert.link}" target="_blank" rel="noopener noreferrer" class="cert-link">${cert.name}</a> - ${cert.issuer}`;
            } else {
                li.textContent = `${cert.name} - ${cert.issuer}`;
            }
            certList.appendChild(li);
        });
    }

    // ==========================================
    // 3. ENHANCED GSAP STAGGERED REVEALS
    // ==========================================
    function runGSAPAnimations() {
        const tl = gsap.timeline();

        // Reveal background elements
        tl.fromTo('.navbar', 
            { y: -30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
        )
        // Reveal text line-by-line dynamically
        .fromTo('.reveal-text', 
            { y: 60, opacity: 0 }, 
            { y: 0, opacity: 1, duration: 1.2, stagger: 0.15, ease: 'power4.out' },
            '-=0.5'
        )
        // Scale profile image and kickstart scan line
        .fromTo('.reveal-image',
            { scale: 0.9, opacity: 0 },
            { scale: 1, opacity: 1, duration: 1.2, ease: 'expo.out' },
            '-=0.8'
        );

        // Scroll triggers can be added here or standard fade-ins
        // We'll reveal main portfolio cards slightly as they are populated
        gsap.fromTo('.glass-card', 
            { y: 40, opacity: 0 }, 
            { y: 0, opacity: 1, duration: 1, stagger: 0.15, ease: 'power3.out', delay: 0.5 }
        );
    }
});