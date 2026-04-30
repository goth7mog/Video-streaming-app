import {
    startRegistration,
    startAuthentication
} from '@simplewebauthn/browser';

document.addEventListener('DOMContentLoaded', function () {
    const registerBtn = document.getElementById('register-webauthn');
    const authnBtn = document.getElementById('authenticate-webauthn');
    const messageDiv = document.getElementById('mfa-message');

    if (registerBtn) {
        registerBtn.addEventListener('click', async () => {
            messageDiv.textContent = '';
            try {
                // 1. Get registration options from server
                const resp = await fetch('/admin/webauthn/register/options', { method: 'POST' });
                const options = await resp.json();
                if (!resp.ok) throw new Error(options?.error || 'Failed to load registration options');
                if (!options || typeof options !== 'object' || !options.challenge) {
                    throw new Error('Registration options were not returned in the expected format');
                }

                // 2. Start registration ceremony
                console.log('webauthn: registration options', options);
                const attResp = await startRegistration({ optionsJSON: options });

                // 3. Send attestation response to server for verification
                const verifyResp = await fetch('/admin/webauthn/register/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(attResp)
                });
                const verifyResult = await verifyResp.json();

                console.log('webauthn: registration verify result', verifyResult);
                if (verifyResult.success) {
                    messageDiv.textContent = 'Biometric device registered successfully!';
                    messageDiv.className = 'alert alert-success';
                } else {
                    throw new Error(verifyResult.error || 'Registration failed');
                }
            } catch (err) {
                messageDiv.textContent = err.message;
                messageDiv.className = 'alert alert-danger';
            }
        });
    }

    if (authnBtn) {
        authnBtn.addEventListener('click', async () => {
            messageDiv.textContent = '';
            try {
                // 1. Get authentication options from server
                const resp = await fetch('/admin/webauthn/authenticate/options', { method: 'POST' });
                const options = await resp.json();
                if (!resp.ok) throw new Error(options?.error || 'Failed to load authentication options');
                if (!options || typeof options !== 'object' || !options.challenge) {
                    throw new Error('Authentication options were not returned in the expected format');
                }

                // 2. Start authentication ceremony
                console.log('webauthn: authentication options', options);
                const assertionResp = await startAuthentication({ optionsJSON: options });

                // 3. Send assertion response to server for verification
                const verifyResp = await fetch('/admin/webauthn/authenticate/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(assertionResp)
                });
                const verifyResult = await verifyResp.json();
                if (verifyResult.success) {
                    messageDiv.textContent = 'Biometric authentication successful!';
                    messageDiv.className = 'alert alert-success';
                } else {
                    throw new Error(verifyResult.error || 'Authentication failed');
                }
            } catch (err) {
                messageDiv.textContent = err.message;
                messageDiv.className = 'alert alert-danger';
            }
        });
    }
});
