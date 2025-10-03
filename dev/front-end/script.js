// API Configuration (dynamically set based on domain)
const API_CONFIG = {
    baseUrl: window.TOASTE_CONFIG?.apiBaseUrl || 'https://api.toastebikepolo.com/api'
};

// Form elements
const productForm = document.getElementById('product-form');
const customerForm = document.getElementById('customer-form');
const productSection = document.getElementById('product-selection');
const contactSection = document.getElementById('contact-form');
const confirmationSection = document.getElementById('confirmation');
const orderCodeSpan = document.getElementById('order-code');
const backButton = document.querySelector('.back-btn');

// Button groups
const spokeCountGroup = document.getElementById('spoke-count-group');
const wheelSizeGroup = document.getElementById('wheel-size-group');
const spokeCountInput = document.getElementById('spoke-count');
const wheelSizeInput = document.getElementById('wheel-size');
const submitBtn = productForm.querySelector('.submit-btn');

// Store product selection
let selectedProduct = {
    spokeCount: '',
    wheelSize: ''
};

// Three.js setup for main scene
let scene, camera, renderer, controls, model;

function initThreeJS() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = null;

    // Create camera
    const container = document.getElementById('model-container');
    camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    camera.position.set(0, 0, 8);  // Adjusted for larger model view
    camera.lookAt(0, 0, 0);

    // Create renderer with transparency
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true
    });
    renderer.setSize(container.clientWidth, container.clientWidth);
    container.appendChild(renderer.domElement);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 2);
    scene.add(directionalLight);

    // Add controls with restricted movement
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.enableZoom = false;  // Disable zoom
    controls.minPolarAngle = Math.PI / 4;
    controls.maxPolarAngle = Math.PI * 3/4;

    // Load model
    const loader = new THREE.GLTFLoader();
    loader.load('/assets/models/Wheelcover_Outline.glb', function(gltf) {
        model = gltf.scene;
        model.rotation.x = -Math.PI / 2;
        model.scale.set(0.27, 0.27, 0.27);  // Further reduced scale for better size
        
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        
        scene.add(model);
        animate();
    }, undefined, function(error) {
        console.error('Error loading model:', error);
    });

    window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
    const container = document.getElementById('model-container');
    const size = container.clientWidth;
    camera.aspect = 1;
    camera.updateProjectionMatrix();
    renderer.setSize(size, size);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    
    if (model) {
        model.rotation.y += 0.005;
    }
    
    renderer.render(scene, camera);
}

// Initialize main scene
initThreeJS();

// Promo scene with two wheel covers
function initPromoScene() {
    const container = document.getElementById('promo-model-container');
    if (!container) return;

    const promoScene = new THREE.Scene();
    promoScene.background = null;

    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    promoScene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 2);
    promoScene.add(directionalLight);

    // Party colors array
    const partyColors = [
        0xff0000, // Red
        0x00ff00, // Green
        0x0000ff, // Blue
        0xff00ff, // Magenta
        0xffff00, // Yellow
        0x00ffff, // Cyan
        0xff8800, // Orange
        0xff0088, // Pink
        0x8800ff, // Purple
        0x00ff88  // Turquoise
    ].map(color => new THREE.Color(color));

    const loader = new THREE.GLTFLoader();
    let model1, model2;
    let material1, material2;

    loader.load('/assets/models/Wheelcover_Outline.glb', function(gltf) {
        model1 = gltf.scene.clone();
        model1.scale.set(0.3, 0.3, 0.3);
        model1.position.set(-4, 0, 0);
        model1.rotation.x = -Math.PI / 2;
        
        // Create materials for first model
        const blackMaterial1 = new THREE.MeshPhongMaterial({
            color: 0x000000,
            shininess: 100
        });
        
        material1 = new THREE.MeshPhongMaterial({
            color: partyColors[0],
            shininess: 100,
            transparent: true,
            opacity: 0.8
        });
        
        model1.traverse((child) => {
            if (child.isMesh) {
                // Check the original material color to determine if it should be black or colored
                const originalColor = child.material.color;
                const brightness = originalColor.r + originalColor.g + originalColor.b;
                
                // If the original color is very dark (black), keep it black
                child.material = brightness < 0.1 ? blackMaterial1 : material1;
            }
        });
        promoScene.add(model1);

        model2 = gltf.scene.clone();
        model2.scale.set(0.3, 0.3, 0.3);
        model2.position.set(4, 0, 0);
        model2.rotation.x = -Math.PI / 2;
        
        // Create materials for second model
        const blackMaterial2 = new THREE.MeshPhongMaterial({
            color: 0x000000,
            shininess: 100
        });
        
        material2 = new THREE.MeshPhongMaterial({
            color: partyColors[1],
            shininess: 100,
            transparent: true,
            opacity: 0.8
        });
        
        model2.traverse((child) => {
            if (child.isMesh) {
                // Check the original material color to determine if it should be black or colored
                const originalColor = child.material.color;
                const brightness = originalColor.r + originalColor.g + originalColor.b;
                
                // If the original color is very dark (black), keep it black
                child.material = brightness < 0.1 ? blackMaterial2 : material2;
            }
        });
        promoScene.add(model2);

        animatePromo();
    });

    const rotationSpeeds = {
        model1: {
            x: (Math.random() - 0.5) * 0.04,
            y: (Math.random() - 0.5) * 0.04,
            z: (Math.random() - 0.5) * 0.04
        },
        model2: {
            x: (Math.random() - 0.5) * 0.04,
            y: (Math.random() - 0.5) * 0.04,
            z: (Math.random() - 0.5) * 0.04
        }
    };

    let colorIndex1 = 0;
    let colorIndex2 = 1;
    let lastColorChange = 0;
    const colorChangeInterval = 2000;
    let transitionProgress = 0;
    
    // Store current and target colors
    let currentColor1 = partyColors[0].clone();
    let currentColor2 = partyColors[1].clone();
    let targetColor1 = partyColors[0].clone();
    let targetColor2 = partyColors[1].clone();

    function animatePromo() {
        requestAnimationFrame(animatePromo);

        if (model1 && model2 && material1 && material2) {
            // Rotate models
            model1.rotation.x += rotationSpeeds.model1.x;
            model1.rotation.y += rotationSpeeds.model1.y;
            model1.rotation.z += rotationSpeeds.model1.z;

            model2.rotation.x += rotationSpeeds.model2.x;
            model2.rotation.y += rotationSpeeds.model2.y;
            model2.rotation.z += rotationSpeeds.model2.z;

            // Update colors with smooth transition
            const currentTime = Date.now();
            
            if (currentTime - lastColorChange > colorChangeInterval) {
                // Set new target colors
                colorIndex1 = (colorIndex1 + Math.floor(Math.random() * 3) + 1) % partyColors.length;
                colorIndex2 = (colorIndex2 + Math.floor(Math.random() * 3) + 1) % partyColors.length;
                
                currentColor1.copy(material1.color);
                currentColor2.copy(material2.color);
                targetColor1.copy(partyColors[colorIndex1]);
                targetColor2.copy(partyColors[colorIndex2]);
                
                transitionProgress = 0;
                lastColorChange = currentTime;
            }

            // Smooth color transition
            if (transitionProgress < 1) {
                transitionProgress += 0.02;
                
                const lerpColor1 = new THREE.Color();
                const lerpColor2 = new THREE.Color();
                
                lerpColor1.lerpColors(currentColor1, targetColor1, transitionProgress);
                lerpColor2.lerpColors(currentColor2, targetColor2, transitionProgress);

                material1.color.copy(lerpColor1);
                material2.color.copy(lerpColor2);
            }
        }

        renderer.render(promoScene, camera);
    }

    function onPromoResize() {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }

    window.addEventListener('resize', onPromoResize, false);
}

// Initialize promo scene separately
document.addEventListener('DOMContentLoaded', () => {
    initPromoScene();
});

// Handle option button clicks
function handleOptionClick(group, input, value) {
    // Remove selected class from all buttons in the group
    group.querySelectorAll('.option-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Add selected class to clicked button
    event.target.classList.add('selected');
    
    // Update hidden input value
    input.value = value;
    
    // Update selected product
    if (group === spokeCountGroup) {
        selectedProduct.spokeCount = value;
    } else {
        selectedProduct.wheelSize = value;
    }
    
    // Enable submit button if both options are selected
    submitBtn.disabled = !(selectedProduct.spokeCount && selectedProduct.wheelSize);
}

// Add click handlers to spoke count buttons
spokeCountGroup.querySelectorAll('.option-btn').forEach(button => {
    button.addEventListener('click', (event) => {
        handleOptionClick(spokeCountGroup, spokeCountInput, event.target.dataset.value);
    });
});

// Add click handlers to wheel size buttons
wheelSizeGroup.querySelectorAll('.option-btn').forEach(button => {
    button.addEventListener('click', (event) => {
        handleOptionClick(wheelSizeGroup, wheelSizeInput, event.target.dataset.value);
    });
});

// Handle product form submission
productForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    if (!selectedProduct.spokeCount || !selectedProduct.wheelSize) {
        alert('Please select both spoke count and wheel size');
        return;
    }
    
    productSection.style.display = 'none';
    contactSection.style.display = 'block';
});

// Generate random order code
function generateOrderCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const codeLength = 8;
    let code = '';
    for (let i = 0; i < codeLength; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
}

// API Functions
async function createOrderInAPI(orderData) {
    try {
        // Send order data to secure API
        const response = await fetch(`${API_CONFIG.baseUrl}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Request failed: ${response.status}`);
        }

        const result = await response.json();
        return {
            success: true,
            orderId: result.order.id,
            orderCode: result.order.orderCode,
            totalPrice: result.order.totalPrice,
            taxAmount: result.order.taxAmount
        };

    } catch (error) {
        console.error('API Error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Handle customer form submission
customerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const orderCode = generateOrderCode();
    const formData = {
        orderCode,
        spokeCount: selectedProduct.spokeCount,
        wheelSize: selectedProduct.wheelSize,
        customerName: document.getElementById('name').value,
        customerEmail: document.getElementById('email').value,
        shippingAddress: document.getElementById('address').value,
        notes: document.getElementById('notes').value,
        orderDate: new Date().toISOString()
    };

    try {
        // Show loading state
        const submitBtn = customerForm.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Submitting Order...';
        submitBtn.disabled = true;

        // Add quantity to form data (default to 1 for now)
        formData.quantity = 1;

        // Create order via API
        const result = await createOrderInAPI(formData);

        if (result.success) {
            // Show confirmation
            contactSection.style.display = 'none';
            confirmationSection.style.display = 'block';
            orderCodeSpan.textContent = result.orderCode;
        } else {
            throw new Error(result.error);
        }

    } catch (error) {
        console.error('Error submitting order:', error);
        alert('There was an error submitting your order. Please try again.');
        
        // Reset button state
        const submitBtn = customerForm.querySelector('.submit-btn');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// Handle back button click
backButton.addEventListener('click', () => {
    contactSection.style.display = 'none';
    productSection.style.display = 'block';
}); 