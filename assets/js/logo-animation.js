document.addEventListener('DOMContentLoaded', async () => {
    // First, load the SVG content
    try {
        const response = await fetch('/assets/graphics/logo.svg');
        const svgContent = await response.text();
        document.querySelector('.logo-container').innerHTML = svgContent;

        // Now that the SVG is loaded, we can select its elements
        const eyeLeft = document.querySelector('#eye-left');
        const eyeRight = document.querySelector('#eye-right');
        const containerLeft = document.querySelector('#eye-container-left');
        const containerRight = document.querySelector('#eye-container-right');
        const svg = document.querySelector('svg');

        function getContainerBounds(container) {
            const bounds = container.getBBox();
            const svgRect = svg.getBoundingClientRect();
            const scale = svgRect.width / svg.viewBox.baseVal.width;
            
            return {
                left: svgRect.left + (bounds.x * scale),
                top: svgRect.top + (bounds.y * scale),
                width: bounds.width * scale,
                height: bounds.height * scale,
                centerX: svgRect.left + ((bounds.x + bounds.width / 2) * scale),
                centerY: svgRect.top + ((bounds.y + bounds.height / 2) * scale)
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
            
            // Apply the transform
            eye.style.transform = `translate(${x}px, ${y}px)`;
        }

        function moveEyes(event) {
            moveEye(eyeLeft, containerLeft, event.clientX, event.clientY);
            moveEye(eyeRight, containerRight, event.clientX, event.clientY);
        }

        // Add mouse move event listener
        document.addEventListener('mousemove', moveEyes);

        // Add touch support for mobile
        document.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            moveEyes({
                clientX: touch.clientX,
                clientY: touch.clientY
            });
        }, { passive: false });

    } catch (error) {
        console.error('Error loading SVG:', error);
    }
}); 