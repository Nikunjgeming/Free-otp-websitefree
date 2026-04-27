// API Configuration
const API_URL = 'api.php';

// Global variables
let currentService = null;
let currentOrder = null;
let otpInterval = null;

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadServices();
    loadBalance();
    loadStats();
});

// Load services from API
async function loadServices() {
    try {
        const response = await fetch(`${API_URL}?action=getServices`);
        const data = await response.json();
        
        if (data.success) {
            displayServices(data.services);
            document.getElementById('serviceCount').innerText = `All services (${data.services.length})`;
        }
    } catch (error) {
        console.error('Error loading services:', error);
        loadMockServices(); // Fallback
    }
}

// Display services
function displayServices(services) {
    const grid = document.getElementById('servicesGrid');
    grid.innerHTML = '';
    
    services.forEach(service => {
        const card = document.createElement('div');
        card.className = 'service-card';
        card.onclick = () => showCountries(service);
        
        card.innerHTML = `
            <div class="service-info">
                <div class="service-icon">
                    <i class="${getServiceIcon(service.code)}"></i>
                </div>
                <div class="service-details">
                    <h3>${service.name}</h3>
                    <p>Tap countries below to order</p>
                </div>
            </div>
            <div class="service-price">
                <span class="current-price">₹${service.price}</span>
                <div class="availability">
                    <i class="fas fa-check-circle"></i> ${service.available}+ available
                </div>
            </div>
        `;
        
        grid.appendChild(card);
    });
}

// Mock services (fallback)
function loadMockServices() {
    const services = [
        { code: 'tg', name: 'Telegram', price: '23.30', available: 8420, icon: 'fab fa-telegram' },
        { code: 'wa', name: 'WhatsApp', price: '25.00', available: 5120, icon: 'fab fa-whatsapp' },
        { code: 'gp', name: 'Google', price: '15.00', available: 10000, icon: 'fab fa-google' },
        { code: 'fb', name: 'Facebook', price: '20.00', available: 7500, icon: 'fab fa-facebook' },
        { code: 'ig', name: 'Instagram', price: '22.00', available: 6800, icon: 'fab fa-instagram' },
        { code: 'tw', name: 'Twitter', price: '18.00', available: 4200, icon: 'fab fa-twitter' },
        { code: 'ap', name: 'Apple', price: '28.00', available: 3100, icon: 'fab fa-apple' },
        { code: 'ms', name: 'Microsoft', price: '21.00', available: 5600, icon: 'fab fa-microsoft' },
        { code: 'dc', name: 'Discord', price: '19.00', available: 2900, icon: 'fab fa-discord' },
        { code: 'sc', name: 'Snapchat', price: '24.00', available: 1800, icon: 'fab fa-snapchat' }
    ];
    
    displayServices(services);
}

// Get service icon
function getServiceIcon(code) {
    const icons = {
        'tg': 'fab fa-telegram',
        'wa': 'fab fa-whatsapp',
        'gp': 'fab fa-google',
        'fb': 'fab fa-facebook',
        'ig': 'fab fa-instagram',
        'tw': 'fab fa-twitter'
    };
    return icons[code] || 'fas fa-mobile-alt';
}

// Show countries modal
async function showCountries(service) {
    currentService = service;
    document.getElementById('modalServiceName').innerText = service.name;
    
    // Countries list
    const countries = [
        { code: '91', name: 'India', flag: '🇮🇳', price: service.price },
        { code: '1', name: 'United States', flag: '🇺🇸', price: service.price + 5 },
        { code: '44', name: 'United Kingdom', flag: '🇬🇧', price: service.price + 4 },
        { code: '61', name: 'Australia', flag: '🇦🇺', price: service.price + 6 },
        { code: '49', name: 'Germany', flag: '🇩🇪', price: service.price + 4 },
        { code: '33', name: 'France', flag: '🇫🇷', price: service.price + 3 },
        { code: '81', name: 'Japan', flag: '🇯🇵', price: service.price + 7 }
    ];
    
    const countriesList = document.getElementById('countriesList');
    countriesList.innerHTML = countries.map(country => `
        <div class="country-item" onclick="buyNumber('${service.code}', '${country.code}', '${country.name}', ${country.price})">
            <div class="country-name">
                <span class="country-flag">${country.flag}</span>
                <span>${country.name}</span>
            </div>
            <div class="country-price">₹${country.price}</div>
        </div>
    `).join('');
    
    document.getElementById('countryModal').style.display = 'flex';
}

// Buy number
async function buyNumber(serviceCode, countryCode, countryName, price) {
    closeCountryModal();
    showToast('Buying number... Please wait', 'info');
    
    try {
        const response = await fetch(`${API_URL}?action=buyNumber&service=${serviceCode}&country=${countryCode}`);
        const data = await response.json();
        
        if (data.success) {
            currentOrder = {
                id: data.activation_id,
                number: data.number,
                price: data.price
            };
            
            showOrderModal();
            startOTPPolling();
            showToast('Number purchased successfully!', 'success');
            loadBalance();
        } else {
            showToast('Failed to buy number: ' + (data.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
    }
}

// Show order modal
function showOrderModal() {
    document.getElementById('orderNumberDisplay').innerHTML = `
        <i class="fas fa-phone"></i> ${currentOrder.number}
        <small>Send OTP to this number</small>
    `;
    document.getElementById('orderPriceDisplay').innerHTML = `Price: ₹${currentOrder.price}`;
    document.getElementById('orderStatus').style.display = 'block';
    document.getElementById('otpCodeDisplay').style.display = 'none';
    document.getElementById('orderModal').style.display = 'flex';
}

// Start OTP polling
function startOTPPolling() {
    if (otpInterval) clearInterval(otpInterval);
    
    otpInterval = setInterval(async () => {
        await checkOTP();
    }, 5000);
}

// Check OTP
async function checkOTP() {
    if (!currentOrder) return;
    
    try {
        const response = await fetch(`${API_URL}?action=checkOTP&id=${currentOrder.id}`);
        const data = await response.json();
        
        if (data.success && data.code) {
            clearInterval(otpInterval);
            document.getElementById('orderStatus').style.display = 'none';
            document.getElementById('otpCodeDisplay').style.display = 'block';
            document.getElementById('otpCodeDisplay').innerHTML = `
                <h2>${data.code}</h2>
                <p>OTP Code Received!</p>
                <small>Use this code for verification</small>
            `;
            showToast('OTP received successfully!', 'success');
            loadStats();
        }
    } catch (error) {
        console.error('Error checking OTP:', error);
    }
}

// Cancel order
async function cancelOrder() {
    if (!currentOrder) return;
    
    if (confirm('Are you sure you want to cancel this order?')) {
        try {
            await fetch(`${API_URL}?action=cancelOrder&id=${currentOrder.id}`);
            clearInterval(otpInterval);
            closeOrderModal();
            showToast('Order cancelled. Refund processed.', 'info');
            loadBalance();
        } catch (error) {
            showToast('Error cancelling order', 'error');
        }
    }
}

// Load balance
async function loadBalance() {
    try {
        const response = await fetch(`${API_URL}?action=getBalance`);
        const data = await response.json();
        
        if (data.success) {
            const balance = data.balance;
            document.getElementById('balance').innerText = `$${(balance / 80).toFixed(2)}`; // USD conversion
        }
    } catch (error) {
        console.error('Error loading balance:', error);
    }
}

// Load stats
async function loadStats() {
    // Mock stats (replace with actual API call)
    document.getElementById('totalOrders').innerText = '1,234';
    document.getElementById('activeNumbers').innerText = '56';
}

// Filter services
function filterServices() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const cards = document.querySelectorAll('.service-card');
    
    cards.forEach(card => {
        const title = card.querySelector('h3').innerText.toLowerCase();
        if (title.includes(searchTerm)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

// Order now (from hero banner)
function orderNow(service, country) {
    showCountries({ code: service, name: service.toUpperCase(), price: 23.13 });
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.innerHTML = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Modal functions
function closeCountryModal() {
    document.getElementById('countryModal').style.display = 'none';
}

function closeOrderModal() {
    document.getElementById('orderModal').style.display = 'none';
    if (otpInterval) clearInterval(otpInterval);
    currentOrder = null;
}

function scrollToServices() {
    document.getElementById('services').scrollIntoView({ behavior: 'smooth' });
}

function showHowItWorks() {
    alert('1. Select a service\n2. Choose country\n3. Get virtual number\n4. Receive OTP\n5. Verify your account!');
}