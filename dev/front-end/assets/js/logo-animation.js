document.addEventListener('DOMContentLoaded', async () => {
    // First, load the SVG content
    try {
        const response = await fetch('/assets/graphics/logo.svg');
        const svgContent = await response.text();
        
        // Wrap the SVG in a clickable link to home
        const logoLink = document.createElement('a');
        logoLink.href = '/';
        logoLink.style.textDecoration = 'none';
        logoLink.style.display = 'block';
        logoLink.innerHTML = svgContent;
        
        document.querySelector('.logo-container').appendChild(logoLink);

        // Now that the SVG is loaded, we can select its elements
        const eyeLeft = document.querySelector('#eye-left');
        const eyeRight = document.querySelector('#eye-right');
        const containerLeft = document.querySelector('#eye-container-left');
        const containerRight = document.querySelector('#eye-container-right');
        const svg = document.querySelector('svg');

        // Cache SVG bounds to avoid repeated calculations
        let svgRect = null;
        let svgScale = null;
        
        function updateSVGBounds() {
            svgRect = svg.getBoundingClientRect();
            svgScale = svgRect.width / svg.viewBox.baseVal.width;
        }
        
        function getContainerBounds(container) {
            if (!svgRect || !svgScale) {
                updateSVGBounds();
            }
            
            const bounds = container.getBBox();
            
            return {
                left: svgRect.left + (bounds.x * svgScale),
                top: svgRect.top + (bounds.y * svgScale),
                width: bounds.width * svgScale,
                height: bounds.height * svgScale,
                centerX: svgRect.left + ((bounds.x + bounds.width / 2) * svgScale),
                centerY: svgRect.top + ((bounds.y + bounds.height / 2) * svgScale)
            };
        }

        function moveEye(eye, container, mouseX, mouseY) {
            const bounds = getContainerBounds(container);
            
            // Calculate the vector from center to mouse
            const dx = mouseX - bounds.centerX;
            const dy = mouseY - bounds.centerY;
            
            // Calculate the angle
            const angle = Math.atan2(dy, dx);
            
            // Calculate the maximum radius (distance from center to edge)
            const maxRadius = Math.min(bounds.width, bounds.height) * 0.35;
            
            // Calculate the distance from center to mouse, capped at maxRadius
            const distance = Math.min(Math.hypot(dx, dy), maxRadius);
            
            // Calculate the final position
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            
            // Apply the transform with will-change for better performance
            eye.style.willChange = 'transform';
            eye.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        }

        function moveEyes(event) {
            // Update SVG bounds on each move to handle window resizing
            updateSVGBounds();
            
            // Move both eyes in the same frame
            requestAnimationFrame(() => {
                moveEye(eyeLeft, containerLeft, event.clientX, event.clientY);
                moveEye(eyeRight, containerRight, event.clientX, event.clientY);
            });
        }

        // Add mouse move event listener for desktop
        document.addEventListener('mousemove', moveEyes);

        // Add touch support for mobile (on entire document to catch all touches)
        document.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            moveEyes({
                clientX: touch.clientX,
                clientY: touch.clientY
            });
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            const touch = e.touches[0];
            moveEyes({
                clientX: touch.clientX,
                clientY: touch.clientY
            });
        }, { passive: true });

        // Toast projectile from logo toward 3D cover
        function getElementCenterRect(el) {
            const r = el.getBoundingClientRect();
            return {
                x: r.left + r.width / 2,
                y: r.top + r.height / 2,
                width: r.width,
                height: r.height
            };
        }

        function launchToastProjectile() {
            const modelContainer = document.getElementById('model-container');
            if (!modelContainer) return;

            // Compute start (logo center) and end (3D cover center)
            const logoRect = getElementCenterRect(document.querySelector('.logo-container'));

            const start = { x: logoRect.x, y: logoRect.y };
            // Choose a random horizontal direction from the logo (left or right)
            const dir = Math.random() < 0.5 ? -1 : 1;
            const distanceX = 260 + Math.random() * 240; // 260-500px horizontally
            const end = {
                x: start.x + dir * distanceX,
                // End well below viewport so it exits the screen
                y: window.innerHeight + 160 + Math.random() * 160
            };

            // Create toast element
            const img = document.createElement('img');
            img.src = '/assets/graphics/toast.svg';
            img.alt = 'toast';
            img.style.position = 'fixed';
            img.style.left = '-25px';
            img.style.top = '-40px';
            img.style.width = '56px';
            img.style.height = '56px';
            img.style.transform = `translate3d(${start.x}px, ${start.y}px, 0) rotate(0deg)`;
            img.style.willChange = 'transform, opacity';
            img.style.pointerEvents = 'none';
            img.style.zIndex = '10';
            document.body.appendChild(img);

            // Arc control point (higher arc upward) and slight lateral curve
            const arcBoost = Math.max(420, Math.abs(end.x - start.x) * 0.8);
            const lateralCurve = (Math.random() * 2 - 1) * 60; // more pronounced sideways arc
            const mid = {
                x: (start.x + end.x) / 2 + lateralCurve,
                y: Math.min(start.y, end.y) - arcBoost
            };

            const duration = 950; // ms - slower, more floaty
            const startTime = performance.now();
            const spin = (Math.random() * 2 - 1) * 360; // random spin

            function quadBezier(p0, p1, p2, t) {
                const inv = 1 - t;
                return {
                    x: inv * inv * p0.x + 2 * inv * t * p1.x + t * t * p2.x,
                    y: inv * inv * p0.y + 2 * inv * t * p1.y + t * t * p2.y
                };
            }

            function easeOutCubic(t) {
                return 1 - Math.pow(1 - t, 3);
            }

            function animate() {
                const now = performance.now();
                const rawT = Math.min(1, (now - startTime) / duration);
                const t = easeOutCubic(rawT);
                const p = quadBezier(start, mid, end, t);
                const rot = spin * t;
                img.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) rotate(${rot}deg)`;
                // Slight hover scale for floatiness
                const scale = 1 + 0.05 * Math.sin(t * Math.PI);
                img.style.transform += ` scale(${scale})`;
                img.style.opacity = String(1 - t * 0.1);
                if (rawT < 1) {
                    requestAnimationFrame(animate);
                } else {
                    img.remove();
                }
            }

            requestAnimationFrame(animate);
        }

        // Fire a toast on each click/tap on the 3D cover area
        const modelContainer = document.getElementById('model-container');
        if (modelContainer) {
            modelContainer.addEventListener('click', () => launchToastProjectile());
            modelContainer.addEventListener('touchstart', () => launchToastProjectile(), { passive: true });
        }

    } catch (error) {
        console.error('Error loading SVG:', error);
    }
}); 