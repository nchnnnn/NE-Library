document.addEventListener('DOMContentLoaded', () => {
    // If already logged in, redirect to portal
    if (api.getUser() && api.token) {
        window.location.href = '/portal';
        return;
    }

    const form = document.getElementById('login-form');
    const identifierInput = document.getElementById('identifier');
    const passwordInput = document.getElementById('password');
    const submitBtn = document.getElementById('submit-btn');
    const errorAlert = document.getElementById('error-alert');
    const toggleMethodBtn = document.getElementById('toggle-method');
    const toggleText = document.getElementById('toggle-text');
    const toggleIconEmail = document.getElementById('toggle-icon-email');
    const toggleIconId = document.getElementById('toggle-icon-id');
    const inputIconEmail = document.getElementById('icon-email');
    const inputIconId = document.getElementById('icon-id');

    let loginMethod = 'email'; // or 'employee_id'

    // Toggle between email and employee ID login
    toggleMethodBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        if (loginMethod === 'email') {
            loginMethod = 'employee_id';
            identifierInput.placeholder = 'Enter Employee ID';
            identifierInput.type = 'text';
            toggleText.textContent = 'Switch to Email';
            toggleIconEmail.style.display = 'none';
            toggleIconId.style.display = 'inline';
            inputIconEmail.style.display = 'none';
            inputIconId.style.display = 'block';
        } else {
            loginMethod = 'email';
            identifierInput.placeholder = 'Enter Email Address';
            identifierInput.type = 'email';
            toggleText.textContent = 'Switch to Employee ID';
            toggleIconEmail.style.display = 'inline';
            toggleIconId.style.display = 'none';
            inputIconEmail.style.display = 'block';
            inputIconId.style.display = 'none';
        }
        
        identifierInput.value = '';
        identifierInput.focus();
    });

    const showError = (message) => {
        errorAlert.textContent = message;
        errorAlert.style.display = 'block';
    };

    const hideError = () => {
        errorAlert.style.display = 'none';
        errorAlert.textContent = '';
    };

    const setLoading = (isLoading) => {
        if (isLoading) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<span>Signing in...</span>`;
        } else {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<span>Sign In</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
            </svg>`;
        }
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError();

        const identifier = identifierInput.value.trim();
        const password = passwordInput.value;

        if (!identifier || !password) {
            showError('Please fill in all fields');
            return;
        }

        const payload = {
            password: password
        };

        if (loginMethod === 'email') {
            payload.email = identifier;
        } else {
            payload.employee_id = identifier;
        }

        try {
            setLoading(true);
            
            // Raw fetch to auth/login avoids circular dependency logic in api.js
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Invalid credentials');
            }

            if (data.success && data.token && data.user) {
                api.setToken(data.token);
                api.setUser(data.user);
                
                // Redirect on success
                window.location.href = '/portal';
            } else {
                showError('Invalid server response');
            }
            
        } catch (error) {
            console.error('Login error:', error);
            showError(error.message || 'An error occurred during login. Please try again.');
        } finally {
            setLoading(false);
        }
    });
});

