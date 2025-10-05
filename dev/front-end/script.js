// API Configuration (dynamically set based on domain)
const API_CONFIG = {
    baseUrl: window.TOASTE_CONFIG?.apiBaseUrl || 'https://api.toastebikepolo.ca/.netlify/functions'
};

// Form elements
const productForm = document.getElementById('product-form');
const customerForm = document.getElementById('customer-form');
const productSection = document.getElementById('product-selection');
const contactSection = document.getElementById('contact-form');
const reviewSection = document.getElementById('order-review');
const confirmationSection = document.getElementById('confirmation');
const orderCodeSpan = document.getElementById('order-code');

// Button groups
const spokeCountGroup = document.getElementById('spoke-count-group');
const wheelSizeGroup = document.getElementById('wheel-size-group');
const spokeCountInput = document.getElementById('spoke-count');
const wheelSizeInput = document.getElementById('wheel-size');

// New cart elements
const cartSummary = document.getElementById('cart-summary');
const cartItems = document.getElementById('cart-items');
const totalPriceSpan = document.getElementById('total-price');
const quantityInput = document.getElementById('quantity');
const quantityMinusBtn = document.getElementById('quantity-minus');
const quantityPlusBtn = document.getElementById('quantity-plus');
const addToCartBtn = document.querySelector('.add-to-cart-btn');
// Continue button removed - using cart total button instead

// Review elements
const reviewContactInfo = document.getElementById('review-contact-info');
const reviewOrderItems = document.getElementById('review-order-items');
const reviewTotalPrice = document.getElementById('review-total-price');

// Store product selection
let selectedProducts = []; // Array of {spokeCount, wheelSize, quantity}
let currentProduct = {
    spokeCount: '',
    wheelSize: '',
    quantity: 1
};

// LocalStorage keys
const STORAGE_KEYS = {
    CART: 'toaste_cart',
    CONTACT_INFO: 'toaste_contact_info',
    CURRENT_PRODUCT: 'toaste_current_product'
};

// Load cart from localStorage on page load
function loadCartFromStorage() {
    try {
        const savedCart = localStorage.getItem(STORAGE_KEYS.CART);
        if (savedCart) {
            selectedProducts = JSON.parse(savedCart);
            updateCartDisplay();
        }
        
        // Load current product state
        const savedCurrentProduct = localStorage.getItem(STORAGE_KEYS.CURRENT_PRODUCT);
        if (savedCurrentProduct) {
            const productData = JSON.parse(savedCurrentProduct);
            currentProduct = { ...currentProduct, ...productData };
            
            // Update form display
            if (currentProduct.spokeCount) {
                const spokeBtn = document.querySelector(`[data-value="${currentProduct.spokeCount}"]`);
                if (spokeBtn) {
                    handleOptionClick(spokeCountGroup, spokeCountInput, currentProduct.spokeCount);
                }
            }
            if (currentProduct.wheelSize) {
                const wheelBtn = document.querySelector(`[data-value="${currentProduct.wheelSize}"]`);
                if (wheelBtn) {
                    handleOptionClick(wheelSizeGroup, wheelSizeInput, currentProduct.wheelSize);
                }
            }
            quantityInput.value = currentProduct.quantity;
        }
    } catch (error) {
        console.error('Error loading cart from storage:', error);
    }
}

// Save cart to localStorage
function saveCartToStorage() {
    try {
        localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(selectedProducts));
    } catch (error) {
        console.error('Error saving cart to storage:', error);
    }
}

// Save current product state to localStorage
function saveCurrentProductToStorage() {
    try {
        localStorage.setItem(STORAGE_KEYS.CURRENT_PRODUCT, JSON.stringify(currentProduct));
    } catch (error) {
        console.error('Error saving current product to storage:', error);
    }
}

// Load contact info from localStorage
function loadContactInfoFromStorage() {
    try {
        const savedContactInfo = localStorage.getItem(STORAGE_KEYS.CONTACT_INFO);
        if (savedContactInfo) {
            const contactInfo = JSON.parse(savedContactInfo);
            document.getElementById('name').value = contactInfo.name || '';
            document.getElementById('email').value = contactInfo.email || '';
            document.getElementById('address').value = contactInfo.address || '';
            document.getElementById('notes').value = contactInfo.notes || '';
        }
    } catch (error) {
        console.error('Error loading contact info from storage:', error);
    }
}

// Save contact info to localStorage
function saveContactInfoToStorage() {
    try {
        const contactInfo = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            address: document.getElementById('address').value,
            notes: document.getElementById('notes').value
        };
        localStorage.setItem(STORAGE_KEYS.CONTACT_INFO, JSON.stringify(contactInfo));
    } catch (error) {
        console.error('Error saving contact info to storage:', error);
    }
}

// Clear all order data from localStorage
function clearOrderFromStorage() {
    try {
        localStorage.removeItem(STORAGE_KEYS.CART);
        localStorage.removeItem(STORAGE_KEYS.CONTACT_INFO);
    } catch (error) {
        console.error('Error clearing order from storage:', error);
    }
}

// Pricing configuration
const PRICING = {
    basePrice: 45.00, // Base price per wheel cover
    pairDiscount: 0.05, // 5% discount for pairs
    taxRate: 0.15 // 15% Quebec taxes
};

// Calculate price for a product
function calculateProductPrice(product) {
    return PRICING.basePrice * product.quantity;
}

// Calculate cart subtotal without discount (for step 1)
function calculateCartSubtotal(products) {
    return products.reduce((sum, product) => sum + calculateProductPrice(product), 0);
}

// Calculate total price with pair discount and taxes (for step 3)
function calculateTotalPrice(products) {
    let subtotal = products.reduce((sum, product) => sum + calculateProductPrice(product), 0);
    
    // Apply 5% discount if total quantity is 2 or more
    const totalQuantity = products.reduce((sum, product) => sum + product.quantity, 0);
    if (totalQuantity >= 2) {
        subtotal *= (1 - PRICING.pairDiscount);
    }
    
    // Add Quebec taxes (15%)
    const taxes = subtotal * PRICING.taxRate;
    const total = subtotal + taxes;
    
    return {
        subtotal: subtotal,
        taxes: taxes,
        total: total
    };
}

// Update cart display
function updateCartDisplay() {
    if (selectedProducts.length === 0) {
        cartSummary.style.display = 'none';
        return;
    }
    
    cartSummary.style.display = 'block';
    
    cartItems.innerHTML = '';
    selectedProducts.forEach((product, index) => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        
        // Add discount badge only if this specific item has quantity > 1
        const discountBadge = product.quantity > 1 ? '<span class="discount-badge">5% OFF</span>' : '';
        
        cartItem.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-quantity">${product.quantity}x</div>
                <div class="cart-item-details">${product.spokeCount} spokes, ${product.wheelSize}</div>
            </div>
            <div class="cart-item-price">CAD$${calculateProductPrice(product).toFixed(2)}</div>
            <button type="button" class="remove-item-btn" onclick="removeFromCart(${index})">×</button>
            ${discountBadge}
        `;
        cartItems.appendChild(cartItem);
    });
    
    const cartSubtotal = calculateCartSubtotal(selectedProducts);
    totalPriceSpan.textContent = cartSubtotal.toFixed(2);
}

// Add product to cart
function addToCart() {
    if (!currentProduct.spokeCount || !currentProduct.wheelSize) {
        alert('Please select both spoke count and wheel size');
        return;
    }
    
    // Check if this exact combination already exists
    const existingIndex = selectedProducts.findIndex(p => 
        p.spokeCount === currentProduct.spokeCount && 
        p.wheelSize === currentProduct.wheelSize
    );
    
    if (existingIndex !== -1) {
        // Update quantity of existing item
        selectedProducts[existingIndex].quantity += currentProduct.quantity;
    } else {
        // Add new item
        selectedProducts.push({
            spokeCount: currentProduct.spokeCount,
            wheelSize: currentProduct.wheelSize,
            quantity: currentProduct.quantity
        });
    }
    
    // Reset current product
    currentProduct = {
        spokeCount: '',
        wheelSize: '',
        quantity: 1
    };
    
    // Clear current product from localStorage
    localStorage.removeItem(STORAGE_KEYS.CURRENT_PRODUCT);
    
    // Reset form
    resetProductForm();
    updateCartDisplay();
    
    // Save cart to localStorage
    saveCartToStorage();
    
    // Scroll to cart title to show the updated order
    const cartTitle = cartSummary.querySelector('h3');
    cartTitle.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Remove item from cart (global function for onclick)
window.removeFromCart = function(index) {
    selectedProducts.splice(index, 1);
    updateCartDisplay();
    saveCartToStorage();
};

// Reset product form
function resetProductForm() {
    // Clear selections
    document.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('selected'));
    spokeCountInput.value = '';
    wheelSizeInput.value = '';
    quantityInput.value = 1;
    currentProduct.quantity = 1;
    
    // Disable add to cart button
    addToCartBtn.disabled = true;
}

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
    controls.enableDolly = false; // Disable dolly (zoom with mouse wheel)
    controls.enablePan = false;   // Disable pan
    controls.minPolarAngle = Math.PI / 4;
    controls.maxPolarAngle = Math.PI * 3/4;
    
    // Configure touch controls for mobile - only rotation
    controls.touches = {
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.ROTATE  // Changed from DOLLY_PAN to ROTATE
    };

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
        currentProduct.spokeCount = value;
    } else {
        currentProduct.wheelSize = value;
    }
    
    // Save current product state
    saveCurrentProductToStorage();
    
    // Enable add to cart button if both options are selected
    addToCartBtn.disabled = !(currentProduct.spokeCount && currentProduct.wheelSize);
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

// Quantity controls
quantityMinusBtn.addEventListener('click', () => {
    if (currentProduct.quantity > 1) {
        currentProduct.quantity--;
        quantityInput.value = currentProduct.quantity;
        saveCurrentProductToStorage();
    }
});

quantityPlusBtn.addEventListener('click', () => {
    if (currentProduct.quantity < 10) {
        currentProduct.quantity++;
        quantityInput.value = currentProduct.quantity;
        saveCurrentProductToStorage();
    }
});

// Add to cart button
addToCartBtn.addEventListener('click', addToCart);

// Continue button removed - functionality moved to cart total button

// Cart total button click to continue
document.getElementById('cart-total-btn').addEventListener('click', () => {
    if (selectedProducts.length === 0) {
        alert('Please add at least one item to your cart');
        return;
    }
    
    productSection.style.display = 'none';
    contactSection.style.display = 'block';
    
    // Scroll to title of contact section with some space above
    const contactTitle = contactSection.querySelector('.section-header');
    contactTitle.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
        // Send order data to Netlify function
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
// Handle customer form submission (go to review)
customerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Validate form
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const address = document.getElementById('address').value;
    
    if (!name || !email || !address) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Show review section
    contactSection.style.display = 'none';
    reviewSection.style.display = 'block';
    updateReviewDisplay();
    
    // Scroll to title of review section with some space above
    const reviewTitle = reviewSection.querySelector('.section-header');
    reviewTitle.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

// Update review display
function updateReviewDisplay() {
    // Contact info
    reviewContactInfo.innerHTML = `
        <div class="review-contact-item">
            <span class="review-contact-label">Name:</span> ${document.getElementById('name').value}
        </div>
        <div class="review-contact-item">
            <span class="review-contact-label">Email:</span> ${document.getElementById('email').value}
        </div>
        <div class="review-contact-item">
            <span class="review-contact-label">Address:</span> ${document.getElementById('address').value}
        </div>
        ${document.getElementById('notes').value ? `
        <div class="review-contact-item">
            <span class="review-contact-label">Notes:</span> ${document.getElementById('notes').value}
        </div>
        ` : ''}
    `;
    
    // Order items
    reviewOrderItems.innerHTML = '';
    selectedProducts.forEach(product => {
        const orderItem = document.createElement('div');
        orderItem.className = 'review-order-item';
        orderItem.innerHTML = `
            <div>
                <strong>${product.quantity}x</strong> ${product.spokeCount} spokes, ${product.wheelSize}
            </div>
            <div>CAD$${calculateProductPrice(product).toFixed(2)}</div>
        `;
        reviewOrderItems.appendChild(orderItem);
    });
    
    // Show pair discount if applicable
    const totalQuantity = selectedProducts.reduce((sum, product) => sum + product.quantity, 0);
    if (totalQuantity >= 2) {
        const subtotal = selectedProducts.reduce((sum, product) => sum + calculateProductPrice(product), 0);
        const discountAmount = subtotal * PRICING.pairDiscount;
        const discountItem = document.createElement('div');
        discountItem.className = 'review-order-item';
        discountItem.innerHTML = `
            <div><em>5% Pair Discount</em></div>
            <div>-CAD$${discountAmount.toFixed(2)}</div>
        `;
        reviewOrderItems.appendChild(discountItem);
    }
    
    // Show pricing breakdown
    const pricing = calculateTotalPrice(selectedProducts);
    
    // Subtotal
    const subtotalItem = document.createElement('div');
    subtotalItem.className = 'review-order-item';
    subtotalItem.innerHTML = `
        <div><strong>Subtotal</strong></div>
        <div>CAD$${pricing.subtotal.toFixed(2)}</div>
    `;
    reviewOrderItems.appendChild(subtotalItem);
    
    // Taxes
    const taxItem = document.createElement('div');
    taxItem.className = 'review-order-item';
    taxItem.innerHTML = `
        <div><strong>Taxes (15%)</strong></div>
        <div>CAD$${pricing.taxes.toFixed(2)}</div>
    `;
    reviewOrderItems.appendChild(taxItem);
    
    // Total
    reviewTotalPrice.textContent = pricing.total.toFixed(2);
}

// Handle final order submission
document.querySelector('#order-review .submit-btn').addEventListener('click', async () => {
    const formData = {
        products: selectedProducts,
        customerName: document.getElementById('name').value,
        customerEmail: document.getElementById('email').value,
        shippingAddress: document.getElementById('address').value,
        notes: document.getElementById('notes').value
    };

    try {
        // Show loading state
        const submitBtn = document.querySelector('#order-review .submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Submitting Order...';
        submitBtn.disabled = true;

        // Create order via API
        const result = await createOrderInAPI(formData);

        if (result.success) {
            // Clear order data from localStorage after successful submission
            clearOrderFromStorage();
            
            // Show confirmation
            reviewSection.style.display = 'none';
            confirmationSection.style.display = 'block';
            orderCodeSpan.textContent = result.orderCode;
            
            // Scroll to title of confirmation section with some space above
            const confirmationTitle = confirmationSection.querySelector('.section-header');
            confirmationTitle.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            throw new Error(result.error);
        }

    } catch (error) {
        console.error('Error submitting order:', error);
        alert('There was an error submitting your order. Please try again.');
        
        // Reset button state
        const submitBtn = document.querySelector('#order-review .submit-btn');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// Handle back button clicks
document.querySelector('#contact-form .back-btn').addEventListener('click', () => {
    contactSection.style.display = 'none';
    productSection.style.display = 'block';
    
    // Scroll to title of product section with some space above
    const productTitle = productSection.querySelector('.section-header');
    productTitle.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

document.querySelector('#order-review .back-btn').addEventListener('click', () => {
    reviewSection.style.display = 'none';
    contactSection.style.display = 'block';
    
    // Scroll to title of contact section with some space above
    const contactTitle = contactSection.querySelector('.section-header');
    contactTitle.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

// Save contact info to localStorage as user types
document.getElementById('name').addEventListener('input', saveContactInfoToStorage);
document.getElementById('email').addEventListener('input', saveContactInfoToStorage);
document.getElementById('address').addEventListener('input', saveContactInfoToStorage);
document.getElementById('notes').addEventListener('input', saveContactInfoToStorage);

// Initialize: Load saved data from localStorage when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadCartFromStorage();
    loadContactInfoFromStorage();
}); 