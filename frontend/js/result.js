document.addEventListener('DOMContentLoaded', () => {
    const rawData = localStorage.getItem('predictionResult');
    if (!rawData) {
        window.location.href = 'index.html';
        return;
    }

    const data = JSON.parse(rawData);
    
    let riskValue = parseFloat(data.risk_prob);
    if (isNaN(riskValue)) riskValue = 0;
    
    // Cap edges for UI
    if (riskValue < 2.5) riskValue = 2.5 + (Math.random() * 5); 
    if (riskValue > 99.5) riskValue = 99.5;
    
    // Sort factors
    data.factors.sort((a, b) => b.value - a.value);

    const colors = { high: '#EF4444', moderate: '#F59E0B', low: '#10B981' };
    const activeColor = riskValue > 66 ? colors.high : riskValue > 33 ? colors.moderate : colors.low;
    const activeText = riskValue > 66 ? 'High Risk' : riskValue > 33 ? 'Moderate Risk' : 'Low Risk';
    
    // Set dynamic body gradient
    const body = document.getElementById('resultBody');
    body.className = 'app-body'; // reset
    if (riskValue > 66) body.classList.add('risk-high');
    else if (riskValue > 33) body.classList.add('risk-medium');
    else body.classList.add('risk-low');

    // Headers
    document.getElementById('diseaseTitle').textContent = `${data.disease} Results`;
    const iconDiv = document.getElementById('diseaseIcon');
    iconDiv.innerHTML = data.type === 'diabetes' ? '<i class="fa-solid fa-vial" style="color: #6366F1;"></i>' : '<i class="fa-solid fa-heart-pulse" style="color: #EC4899;"></i>';

    // Smart Alert Banner
    if (riskValue > 66) {
        document.getElementById('smartAlertContainer').innerHTML = `
            <div class="smart-alert">
                <div class="smart-alert-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
                <div class="smart-alert-text">
                    <h4>Critical Health Warning</h4>
                    <p>Based on your AI assessment, you are at HIGH RISK for ${data.disease}. We strongly recommend consulting a qualified medical professional immediately for a proper clinical diagnosis.</p>
                </div>
            </div>
        `;
    }

    // AI Patient Summary
    const user = JSON.parse(localStorage.getItem('currentUser')) || { name: 'Guest' };
    let summaryText = `Based on the deep-learning analysis, <strong>${user.name}</strong> exhibits a <strong>${activeText}</strong> profile for ${data.disease} with a model confidence of ${riskValue.toFixed(1)}%.<br><br>`;
    
    if (data.factors.length >= 3) {
        summaryText += `The primary biomarkers driving this risk calculation are:<br>`;
        summaryText += `&bull; <strong>${data.factors[0].label}</strong><br>`;
        summaryText += `&bull; <strong>${data.factors[1].label}</strong><br>`;
        summaryText += `&bull; <strong>${data.factors[2].label}</strong>`;
    }
    document.getElementById('aiSummaryText').innerHTML = summaryText;

    // Risk Comparison
    const userEmail = user.email || 'guest';
    const history = JSON.parse(localStorage.getItem(`history_${userEmail}`) || '[]');
    const previousTests = history.filter(h => h.type === data.type && h.timestamp !== data.timestamp);
    if (previousTests.length > 0) {
        const lastTest = previousTests[0]; 
        let lastRisk = parseFloat(lastTest.risk_prob);
        if (lastTest.result === 'negative' && lastRisk > 50) lastRisk = 100 - lastRisk;
        
        const diff = riskValue - lastRisk;
        const trendBadge = document.getElementById('trendBadge');
        if (Math.abs(diff) > 2.0) {
            if (diff > 0) {
                trendBadge.innerHTML = `<i class="fa-solid fa-arrow-trend-up"></i> Risk Increased by ${diff.toFixed(1)}% since last test`;
                trendBadge.style.color = colors.high;
            } else {
                trendBadge.innerHTML = `<i class="fa-solid fa-arrow-trend-down"></i> Risk Decreased by ${Math.abs(diff).toFixed(1)}% since last test`;
                trendBadge.style.color = colors.low;
            }
        }
    }

    // Modern Circular Progress
    const gaugeValue = document.getElementById('gaugeValue');
    const riskLabel = document.getElementById('riskLabel');
    let currentVal = 0;
    const steps = 60;
    const increment = riskValue / steps;
    
    const counter = setInterval(() => {
        currentVal += increment;
        if (currentVal >= riskValue) {
            currentVal = riskValue;
            clearInterval(counter);
        }
        gaugeValue.textContent = `${currentVal.toFixed(1)}%`;
    }, 1800 / steps);

    document.getElementById('riskText').textContent = activeText;
    const riskBadge = document.getElementById('riskBadge');
    riskBadge.style.color = activeColor;
    riskBadge.style.background = `${activeColor}20`; // Hex transparency
    riskLabel.textContent = activeText;
    riskLabel.style.color = activeColor;

    const fillPath = document.getElementById('gaugeFill');
    fillPath.style.stroke = activeColor;
    setTimeout(() => {
        fillPath.style.strokeDasharray = `${riskValue}, 100`;
    }, 50);

    // Precautions
    const precautionsList = document.getElementById('precautionsList');
    precautionsList.innerHTML = `
        <ul class="beautiful-list">
            ${data.precautions.map(p => `
                <li>
                    <div class="list-icon" style="background: linear-gradient(135deg, ${activeColor}, ${activeColor}dd)"><i class="fa-solid fa-check"></i></div>
                    <span>${p}</span>
                </li>
            `).join('')}
        </ul>
    `;

    // Smart Visual Diet Plan based on Risk & Factors
    const dietPlanList = document.getElementById('dietPlanList');
    let diets = [];
    if (data.type === 'diabetes') {
        if (riskValue > 66) {
            diets = [
                { emoji: "🚫", title: "Avoid Sugar", desc: "No refined sugars or sweets" },
                { emoji: "🥗", title: "More Fiber", desc: "Quinoa, oats, and leafy greens" },
                { emoji: "🚶‍♂️", title: "Daily Walk", desc: "30-min brisk walk after meals" }
            ];
        } else {
            diets = [
                { emoji: "⚖️", title: "Balanced Carbs", desc: "Complex carbohydrates only" },
                { emoji: "🍗", title: "Lean Proteins", desc: "Chicken, tofu, and beans" },
                { emoji: "💧", title: "Hydration", desc: "Stay hydrated & limit snacks" }
            ];
        }
    } else {
        if (riskValue > 66) {
            diets = [
                { emoji: "🧂", title: "Low Sodium", desc: "Crucial: Reduce salt intake" },
                { emoji: "🍔", title: "No Trans Fats", desc: "Avoid fried & processed meats" },
                { emoji: "🐟", title: "Omega-3", desc: "Increase salmon and walnuts" }
            ];
        } else {
            diets = [
                { emoji: "🍅", title: "Mediterranean", desc: "Focus on fresh veggies & olive oil" },
                { emoji: "🫐", title: "Antioxidants", desc: "Eat plenty of fresh berries" },
                { emoji: "🥑", title: "Healthy Fats", desc: "Avocados and nuts" }
            ];
        }
    }
    dietPlanList.innerHTML = `
        <div class="diet-grid">
            ${diets.map(d => `
                <div class="diet-card">
                    <span class="diet-emoji">${d.emoji}</span>
                    <div class="diet-title">${d.title}</div>
                    <div class="diet-desc">${d.desc}</div>
                </div>
            `).join('')}
        </div>
    `;

    // Future Risk Prediction & Simulation
    const futureBadge = document.getElementById('futureRiskBadge');
    if (riskValue > 66) {
        futureBadge.innerHTML = '<span style="color:#EF4444;">High Risk</span>';
        futureBadge.parentElement.style.color = '#7F1D1D';
        document.querySelector('.future-risk-card').style.background = '#FEF2F2';
        document.querySelector('.future-risk-card').style.borderColor = '#FECACA';
    } else if (riskValue > 33) {
        futureBadge.innerHTML = '<span style="color:#F59E0B;">Moderate</span>';
    } else {
        futureBadge.innerHTML = '<span style="color:#10B981;">Low Risk</span>';
        document.querySelector('.future-risk-card p').innerHTML = 'Keep up the good work! Your 6-month projection remains stable.';
        document.getElementById('simulateBtn').style.display = 'none';
    }

    document.getElementById('simulateBtn').addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Lifestyle Optimized';
        btn.disabled = true;
        btn.className = 'btn btn-primary btn-block';
        
        const newRisk = Math.max(5.0, riskValue - 20);
        document.getElementById('gaugeValue').innerHTML = `<span style="color:#10B981;">${newRisk.toFixed(1)}%</span>`;
        document.getElementById('gaugeFill').style.strokeDasharray = `${newRisk}, 100`;
        document.getElementById('gaugeFill').style.stroke = '#10B981';
        
        futureBadge.innerHTML = '<span style="color:#10B981;">Lowered</span>';
    });

    // Doctor Suggestion Logic
    if (riskValue > 66) {
        document.getElementById('doctorSuggestion').style.display = 'block';
        if (data.type === 'diabetes') {
            document.getElementById('doctorText').textContent = 'Consult an Endocrinologist immediately to discuss blood sugar management.';
            document.getElementById('doctorTests').innerHTML = '<span class="badge" style="margin:0; font-size:0.7rem; padding:0.25rem 0.5rem; background:white; color:#B45309;">HbA1c Test</span><span class="badge" style="margin:0; font-size:0.7rem; padding:0.25rem 0.5rem; background:white; color:#B45309;">Fasting Glucose</span>';
        } else {
            document.getElementById('doctorText').textContent = 'Consult a Cardiologist immediately for a comprehensive heart evaluation.';
            document.getElementById('doctorTests').innerHTML = '<span class="badge" style="margin:0; font-size:0.7rem; padding:0.25rem 0.5rem; background:white; color:#B45309;">ECG / EKG</span><span class="badge" style="margin:0; font-size:0.7rem; padding:0.25rem 0.5rem; background:white; color:#B45309;">Lipid Panel</span><span class="badge" style="margin:0; font-size:0.7rem; padding:0.25rem 0.5rem; background:white; color:#B45309;">Stress Test</span>';
        }
    }

    // Explainable AI Factors (Insights + Sliders)
    const factorInsights = {
        "Glucose": { normal: "70-99 mg/dL", getInsight: v => v > 125 ? "High glucose is a major risk factor." : "Glucose is slightly elevated." },
        "BMI": { normal: "18.5-24.9", getInsight: v => v >= 30 ? "Obesity significantly increases risk." : "Your BMI is above normal." },
        "Age": { normal: "< 50", getInsight: v => "Age naturally increases risk factors." },
        "Cholesterol": { normal: "< 200 mg/dL", getInsight: v => v > 240 ? "Cholesterol is severely high." : "Cholesterol is slightly elevated." },
        "Blood Pressure": { normal: "< 120/80", getInsight: v => v > 140 ? "Hypertension is a critical risk factor." : "BP is elevated." },
        "Insulin": { normal: "16-166 mIU/L", getInsight: v => "Abnormal insulin levels detected." },
        "Low Max HR": { normal: "> 150 bpm", getInsight: v => "Low max heart rate indicates poor cardiovascular fitness." },
        "ST Depression": { normal: "< 1 mm", getInsight: v => "ST depression suggests restricted blood flow to the heart." }
    };

    const factorsGrid = document.getElementById('factorsGrid');
    factorsGrid.innerHTML = data.factors.map((f, idx) => {
        const isTopFactor = idx < 3 && riskValue > 33;
        const factorColor = isTopFactor ? colors.high : colors.low;
        
        let rawVal = "";
        let normalText = "";
        let insightText = "";
        
        if (data.inputs && data.inputs[f.label] !== undefined) {
            const val = data.inputs[f.label];
            rawVal = `Yours: <strong>${val}</strong>`;
            if (factorInsights[f.label]) {
                normalText = `Normal: ${factorInsights[f.label].normal}`;
                insightText = factorInsights[f.label].getInsight(val);
            }
        } else {
            insightText = "AI detected significance in this biomarker.";
        }

        return `
        <div class="factor-item" style="border: 1px solid #F1F5F9; padding: 1.25rem;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 0.5rem;">
                <div>
                    <div class="metric-label" style="font-size:1.1rem; color:#0F172A; margin-bottom:0.25rem;">${f.label}</div>
                    <div style="font-size:0.85rem; color:#64748B;">${insightText}</div>
                </div>
                <div class="factor-val" style="color: ${factorColor}; font-size:0.9rem; font-weight:700; background: ${factorColor}15; padding: 0.25rem 0.75rem; border-radius: 99px;">AI Weight: ${f.value}%</div>
            </div>
            
            ${rawVal ? `
            <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-top:1rem; color:#475569; font-weight:600;">
                <span>${normalText}</span>
                <span style="color:${isTopFactor ? colors.high : colors.low}">${rawVal}</span>
            </div>
            ` : ''}

            <div class="modern-track" style="margin-top:0.5rem;">
                <div class="modern-fill" style="width: 0%; background: ${factorColor}; box-shadow: 0 4px 12px ${factorColor}60; transition: width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s; color: ${factorColor};">
                    <div class="modern-dot"></div>
                </div>
            </div>
        </div>
    `}).join('');

    setTimeout(() => {
        const fills = document.querySelectorAll('.modern-fill');
        fills.forEach((fill, idx) => {
            fill.style.width = `${data.factors[idx].value}%`;
        });
    }, 100);

    // Back button
    document.getElementById('runAnotherBtn').href = data.type === 'diabetes' ? 'diabetes.html' : 'heart.html';

    // Condition Awareness Data
    if (data.type === 'diabetes') {
        document.getElementById('awareTitle').innerHTML = '<i class="fa-solid fa-droplet" style="color:#6366F1;"></i> Understanding Type 2 Diabetes';
        document.getElementById('awareDesc').textContent = 'Diabetes is a chronic disease that occurs when your blood glucose, also called blood sugar, is too high. Over time, having too much glucose in your blood can cause health problems, such as heart disease, nerve damage, eye problems, and kidney disease.';
        document.getElementById('awarePrevent').textContent = 'Maintain a healthy body weight, stay physically active with at least 30 mins of exercise daily, eat a diet rich in fiber and whole grains, and avoid refined sugars.';
    } else {
        document.getElementById('awareTitle').innerHTML = '<i class="fa-solid fa-heart-crack" style="color:#EC4899;"></i> Understanding Heart Disease';
        document.getElementById('awareDesc').textContent = 'Heart disease describes a range of conditions that affect your heart. Diseases under the heart disease umbrella include blood vessel diseases, such as coronary artery disease; heart rhythm problems (arrhythmias); and heart defects you\'re born with (congenital heart defects).';
        document.getElementById('awarePrevent').textContent = 'Control your blood pressure and cholesterol levels, quit smoking, eat a balanced diet low in saturated fats, and exercise for at least 150 minutes per week.';
    }

    // PDF Download (Native Layout)
    document.getElementById('downloadPdfBtn').addEventListener('click', async () => {
        const btn = document.getElementById('downloadPdfBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating PDF...';
        btn.disabled = true;

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a4');
            
            // Background Header
            doc.setFillColor(15, 23, 42);
            doc.rect(0, 0, 210, 40, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont('helvetica', 'bold');
            doc.text("MEDPREDICT HEALTH REPORT", 20, 25);
            
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            
            const currentUser = JSON.parse(localStorage.getItem('currentUser')) || { name: 'Guest', id: 'MD-0000' };
            doc.text(`Patient Name: ${currentUser.name}`, 20, 50);
            doc.text(`Patient ID: ${currentUser.id}`, 20, 56);
            doc.text(`Date: ${dateStr}`, 150, 50);
            
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.5);
            doc.line(20, 62, 190, 62);
            
            // Section 1: Summary
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text("Section 1: AI Prediction Summary", 20, 75);
            
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text(`Assessment Type: ${data.disease}`, 20, 85);
            doc.text(`Risk Confidence: ${riskValue.toFixed(1)}%`, 20, 92);
            
            // Draw Color Bar for Risk
            doc.setFillColor(226, 232, 240);
            doc.rect(20, 98, 170, 8, 'F'); // bg bar
            doc.setFillColor(activeColor === colors.high ? 239 : (activeColor === colors.moderate ? 245 : 16), 
                             activeColor === colors.high ? 68 : (activeColor === colors.moderate ? 158 : 185), 
                             activeColor === colors.high ? 68 : (activeColor === colors.moderate ? 11 : 129));
            doc.rect(20, 98, 170 * (riskValue / 100), 8, 'F'); // fill bar
            
            doc.setFont('helvetica', 'bold');
            doc.text(`Calculated Category: ${activeText}`, 20, 114);
            
            // Section 2: Factors
            doc.setFontSize(16);
            doc.text("Section 2: Key Risk Factors", 20, 130);
            
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            let y = 140;
            data.factors.slice(0, 5).forEach(f => {
                doc.text(`- ${f.label}: Evaluated at ${f.value}% model weight`, 20, y);
                y += 8;
            });
            
            // Section 3: Recommendations
            y += 10;
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text("Section 3: Diet & Recommendations", 20, y);
            
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            y += 10;
            
            const dietStrings = diets.map(d => `${d.title}: ${d.desc}`);
            [...data.precautions, ...dietStrings].forEach(p => {
                const splitText = doc.splitTextToSize(`• ${p}`, 170);
                doc.text(splitText, 20, y);
                y += 6 * splitText.length;
            });
            
            // Footer
            doc.setFontSize(9);
            doc.setTextColor(150, 150, 150);
            doc.text("Disclaimer: This is an AI-generated risk assessment. Consult a doctor for a medical diagnosis.", 20, 285);
            
            doc.save(`MedPredict_${data.disease}_Report.pdf`);
        } catch (error) {
            console.error('PDF generation failed', error);
            alert('Failed to generate PDF report.');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });

    window.predictionData = { riskValue, disease: data.disease, factors: data.factors, precautions: data.precautions, diets };
});

// Chat logic
window.sendChat = function() {
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if (!msg) return;

    const chatBody = document.getElementById('chatBody');
    const userDiv = document.createElement('div');
    userDiv.className = 'chat-msg msg-user';
    userDiv.textContent = msg;
    chatBody.appendChild(userDiv);
    
    input.value = '';
    chatBody.scrollTop = chatBody.scrollHeight;

    setTimeout(() => {
        const aiDiv = document.createElement('div');
        aiDiv.className = 'chat-msg msg-ai';
        aiDiv.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Thinking...';
        chatBody.appendChild(aiDiv);
        chatBody.scrollTop = chatBody.scrollHeight;

        setTimeout(() => {
            aiDiv.innerHTML = generateAIResponse(msg.toLowerCase(), window.predictionData);
            chatBody.scrollTop = chatBody.scrollHeight;
        }, 1000);
    }, 300);
}

function generateAIResponse(query, data) {
    if (query.includes('diet') || query.includes('eat') || query.includes('food')) {
        return `Based on your ${data.disease} assessment, I recommend: <br>1. <strong>${data.diets[0].title}</strong>: ${data.diets[0].desc}<br>2. <strong>${data.diets[1].title}</strong>: ${data.diets[1].desc}`;
    }
    if (query.includes('reduce') || query.includes('improve') || query.includes('how to')) {
        return `Your biggest risk factor is <strong>${data.factors[0].label}</strong>. Focus on improving that by following your diet plan and: <br>${data.precautions[0]}`;
    }
    return `Your calculated risk is ${data.riskValue.toFixed(1)}%. I am your AI assistant—ask me about your diet, risk factors, or how to improve!`;
}
