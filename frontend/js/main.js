document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('predictForm');
    const resultsPanel = document.getElementById('resultsPanel');
    const API_URL = 'http://localhost:5001/api/predict/';

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = document.getElementById('submitBtn');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Analyzing Data...';
            submitBtn.disabled = true;

            try {
                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());
                const type = form.dataset.type;
                // Input Validation
                let isValid = true;
                let errorMessage = '';
                if (type === 'diabetes') {
                    if (data.glucose <= 0 || data.glucose > 500) { isValid = false; errorMessage = 'Please enter a valid glucose level (1-500).'; }
                    else if (data.bmi <= 0 || data.bmi > 100) { isValid = false; errorMessage = 'Please enter a valid BMI.'; }
                    else if (data.pregnancies < 0 || data.pregnancies > 25) { isValid = false; errorMessage = 'Please enter a valid number of pregnancies.'; }
                    else if (data.blood_pressure <= 0 || data.blood_pressure > 300) { isValid = false; errorMessage = 'Please enter a valid blood pressure.'; }
                    else if (data.age <= 0 || data.age > 120) { isValid = false; errorMessage = 'Please enter a valid age.'; }
                } else if (type === 'heart') {
                    if (data.trestbps <= 50 || data.trestbps > 250) { isValid = false; errorMessage = 'Please enter a valid resting blood pressure.'; }
                    else if (data.chol <= 50 || data.chol > 600) { isValid = false; errorMessage = 'Please enter a valid cholesterol level.'; }
                    else if (data.thalach <= 30 || data.thalach > 250) { isValid = false; errorMessage = 'Please enter a valid max heart rate.'; }
                    else if (data.age <= 0 || data.age > 120) { isValid = false; errorMessage = 'Please enter a valid age.'; }
                }

                if (!isValid) {
                    alert(errorMessage);
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                    return;
                }

                const response = await fetch(`${API_URL}${type}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (!response.ok) {
                    throw new Error('API Request Failed');
                }

                const result = await response.json();
                
                // Fix absolute risk calculation
                let finalRisk = parseFloat(result.risk_prob);
                // Do NOT invert it. The backend always returns prob of class 1 (disease risk).
                result.risk_prob = finalRisk;
                
                // Save to localStorage and redirect to result page
                result.timestamp = new Date().toISOString();
                result.type = type; // 'diabetes' or 'heart'
                localStorage.setItem('predictionResult', JSON.stringify(result));
                
                // Add to history (User Specific)
                const user = JSON.parse(localStorage.getItem('currentUser')) || { email: 'guest' };
                const historyKey = `history_${user.email}`;
                let history = JSON.parse(localStorage.getItem(historyKey) || '[]');
                history.unshift(result); // Add to beginning
                localStorage.setItem(historyKey, JSON.stringify(history));

                window.location.href = 'result.html';
            } catch (error) {
                console.error(error);
                alert('An error occurred while processing your request. Ensure the backend is running.');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
});
