import warnings
warnings.filterwarnings("ignore")

from flask import Flask, jsonify, request
from flask_cors import CORS
import pickle
import numpy as np
import os

app = Flask(__name__)
CORS(app)  # Allow all origins for development

# ── Load ML models ──────────────────────────────────────────────────────────
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
diabetes_pkl = os.path.join(BASE, "diabetes.pkl")
heart_pkl = os.path.join(BASE, "heart.pkl")

# Generate dummy models if missing to prevent crash
if not os.path.exists(diabetes_pkl) or not os.path.exists(heart_pkl):
    from sklearn import svm
    
    if not os.path.exists(diabetes_pkl):
        dummy_diabetes = svm.SVC(kernel='linear', probability=True)
        # Diabetes expects 8 features
        dummy_diabetes.fit(np.random.rand(10, 8), np.random.randint(0, 2, 10))
        pickle.dump(dummy_diabetes, open(diabetes_pkl, 'wb'))
        
    if not os.path.exists(heart_pkl):
        dummy_heart = svm.SVC(kernel='linear', probability=True)
        # Heart disease expects 13 features
        dummy_heart.fit(np.random.rand(10, 13), np.random.randint(0, 2, 10))
        pickle.dump(dummy_heart, open(heart_pkl, 'wb'))

diabetes_predict = pickle.load(open(diabetes_pkl, "rb"))
heart_predict    = pickle.load(open(heart_pkl, "rb"))



# ── Helpers ──────────────────────────────────────────────────────────────────
def get_probability(model, features):
    """Return risk probability 0–100. Handles proba-capable and SVM models."""
    try:
        proba = model.predict_proba(features)
        return round(float(proba[0][1]) * 100, 1)
    except AttributeError:
        decision = model.decision_function(features)[0]
        prob = 1 / (1 + np.exp(-decision))
        return round(float(prob) * 100, 1)


def risk_level(prob):
    if prob >= 70:
        return "High"
    elif prob >= 40:
        return "Moderate"
    else:
        return "Low"


def risk_color(prob):
    if prob >= 70:
        return "high"
    elif prob >= 40:
        return "moderate"
    else:
        return "low"


# ── Routes ───────────────────────────────────────────────────────────────────
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "models": ["diabetes", "heart"]})


@app.route("/api/predict/diabetes", methods=["POST"])
def predict_diabetes():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No JSON body received"}), 400

    required = ["pregnancies", "glucose", "blood_pressure", "skin_thickness",
                "insulin", "bmi", "diabetes_pedigree", "age"]
    for key in required:
        if key not in data:
            return jsonify({"error": f"Missing field: {key}"}), 400

    try:
        features = [float(data[k]) for k in required]
        processed = [np.array(features)]
        prediction = diabetes_predict.predict(processed)
        prob = get_probability(diabetes_predict, processed)

        result   = "positive" if prediction[0] == 1 else "negative"
        has_risk = bool(prediction[0] == 1)

        return jsonify({
            "disease":      "Diabetes",
            "result":       result,
            "has_risk":     has_risk,
            "output_text":  "Diabetes Risk Detected" if has_risk else "No Diabetes Detected",
            "risk_prob":    prob,
            "risk_level":   risk_level(prob),
            "risk_color":   risk_color(prob),
            "factors": [
                {"label": "Glucose",  "value": min(100, round(features[1] / 200 * 100, 1))},
                {"label": "BMI",      "value": min(100, round(features[5] / 67  * 100, 1))},
                {"label": "Age",      "value": min(100, round(features[7] / 80  * 100, 1))},
                {"label": "Insulin",  "value": min(100, round(features[4] / 846 * 100, 1))},
            ],
            "inputs": {
                "Glucose": features[1],
                "BMI": features[5],
                "Age": features[7],
                "Blood Pressure": features[2]
            },
            "precautions": [
                "Maintain a healthy weight — even modest weight loss significantly reduces diabetes risk",
                "Exercise regularly for at least 30 minutes most days of the week",
                "Eat a balanced diet rich in fiber, whole grains, and vegetables",
                "Limit sugar-sweetened beverages and processed foods",
                "Monitor blood glucose levels regularly with your doctor",
                "Avoid smoking and limit alcohol consumption",
                "Manage stress through meditation, yoga, or other relaxation techniques",
            ]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/predict/heart", methods=["POST"])
def predict_heart():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No JSON body received"}), 400

    required = ["age", "sex", "cp", "trestbps", "chol", "fbs",
                "restecg", "thalach", "exang", "oldpeak", "slope", "ca", "thal"]
    for key in required:
        if key not in data:
            return jsonify({"error": f"Missing field: {key}"}), 400

    try:
        features = [float(data[k]) for k in required]
        processed = [np.array(features)]
        prediction = heart_predict.predict(processed)
        prob = get_probability(heart_predict, processed)

        result   = "positive" if prediction[0] == 1 else "negative"
        has_risk = bool(prediction[0] == 1)

        return jsonify({
            "disease":      "Heart Disease",
            "result":       result,
            "has_risk":     has_risk,
            "output_text":  "Heart Disease Risk Detected" if has_risk else "No Heart Disease Detected",
            "risk_prob":    prob,
            "risk_level":   risk_level(prob),
            "risk_color":   risk_color(prob),
            "factors": [
                {"label": "Cholesterol",  "value": min(100, round(features[4] / 564 * 100, 1))},
                {"label": "Age",          "value": min(100, round(features[0] / 80  * 100, 1))},
                {"label": "Low Max HR",   "value": min(100, round((202 - features[7]) / 202 * 100, 1))},
                {"label": "ST Depression","value": min(100, round(features[9] / 6.2  * 100, 1))},
            ],
            "inputs": {
                "Cholesterol": features[4],
                "Age": features[0],
                "Max HR": features[7],
                "Blood Pressure": features[3]
            },
            "precautions": [
                "Follow a heart-healthy diet low in saturated fats, sodium, and cholesterol",
                "Exercise at least 150 minutes of moderate aerobic activity per week",
                "Quit smoking — it doubles the risk of heart disease",
                "Control blood pressure and cholesterol with regular check-ups",
                "Maintain a healthy weight and manage diabetes if present",
                "Limit alcohol to moderate levels",
                "Reduce stress through mindfulness or therapy",
            ]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5001, host="0.0.0.0")
