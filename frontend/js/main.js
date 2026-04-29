document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('predictForm');
    const resultsPanel = document.getElementById('resultsPanel');
    const API_URL = 'https://disease-prediction-system-v956.onrender.com/api/predict/';

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
                
                // --- GLOBAL HEURISTIC OVERRIDE ---
                // Enforce clinical reality if the ML model underfits
                if (type === 'diabetes' && result.inputs) {
                    const glucose = parseFloat(result.inputs['Glucose'] || 0);
                    const bmi = parseFloat(result.inputs['BMI'] || 0);
                    if (glucose >= 126) finalRisk = Math.max(finalRisk, 75.0); // Diabetic range -> High
                    else if (glucose >= 100) finalRisk = Math.max(finalRisk, 40.0); // Pre-diabetic -> Medium
                    
                    if (bmi >= 30) finalRisk = Math.max(finalRisk, finalRisk + 15.0); // Obese
                    else if (bmi >= 25) finalRisk = Math.max(finalRisk, finalRisk + 5.0); // Overweight
                } else if (type === 'heart' && result.inputs) {
                    const bp = parseFloat(result.inputs['Blood Pressure'] || 0);
                    const chol = parseFloat(result.inputs['Cholesterol'] || 0);
                    if (bp >= 140) finalRisk = Math.max(finalRisk, 70.0);
                    else if (bp >= 130) finalRisk = Math.max(finalRisk, 40.0);
                    
                    if (chol >= 240) finalRisk = Math.max(finalRisk, 70.0);
                    else if (chol >= 200) finalRisk = Math.max(finalRisk, 40.0);
                }
                
                finalRisk = Math.min(99.9, Math.max(0, finalRisk));
                result.risk_prob = finalRisk;
                
                if (finalRisk >= 70) result.risk_level = "High";
                else if (finalRisk >= 40) result.risk_level = "Moderate";
                else result.risk_level = "Low";
                
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
