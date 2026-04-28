import warnings
warnings.filterwarnings("ignore")
from flask import Flask, render_template, request
import pickle
import numpy as np

app = Flask(__name__)

diabetes_predict = pickle.load(open("diabetes.pkl", "rb"))
heart_predict = pickle.load(open("heart.pkl", "rb"))


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


@app.route("/")
def main():
    return render_template("index.html")


@app.route("/diabetes")
def diabetes():
    return render_template("diabetes.html")


@app.route("/heartdisease/")
def heartdisease():
    return render_template("heartdisease.html")


@app.route("/about")
def about():
    return render_template("about.html")


@app.route("/predictdiabetes/", methods=["POST"])
def predictdiabetes():
    int_features = [x for x in request.form.values()]
    processed = [np.array(int_features, dtype=float)]
    prediction = diabetes_predict.predict(processed)
    prob = get_probability(diabetes_predict, processed)

    result = "positive" if prediction[0] == 1 else "negative"
    display_text = "This person has Diabetes" if prediction[0] == 1 else "This person does not have Diabetes"

    return render_template(
        "diabetesprecaution.html",
        output_text=display_text,
        result=result,
        risk_prob=prob,
        risk_level=risk_level(prob),
        risk_color=risk_color(prob),
        disease="Diabetes",
        factors=[
            {"label": "Glucose", "value": min(100, round(float(int_features[1]) / 200 * 100, 1))},
            {"label": "BMI", "value": min(100, round(float(int_features[5]) / 67 * 100, 1))},
            {"label": "Age", "value": min(100, round(float(int_features[7]) / 80 * 100, 1))},
            {"label": "Insulin", "value": min(100, round(float(int_features[4]) / 846 * 100, 1))},
        ]
    )


@app.route("/predictheartdisease/", methods=["POST"])
def predictheartdisease():
    int_features = [x for x in request.form.values()]
    processed = [np.array(int_features, dtype=float)]
    prediction = heart_predict.predict(processed)
    prob = get_probability(heart_predict, processed)

    result = "positive" if prediction[0] == 1 else "negative"
    display_text = "This person has Heart Disease" if prediction[0] == 1 else "This person does not have Heart Disease"

    return render_template(
        "heartPrecautions.html",
        output_text=display_text,
        result=result,
        risk_prob=prob,
        risk_level=risk_level(prob),
        risk_color=risk_color(prob),
        disease="Heart Disease",
        factors=[
            {"label": "Cholesterol", "value": min(100, round(float(int_features[4]) / 564 * 100, 1))},
            {"label": "Age", "value": min(100, round(float(int_features[0]) / 80 * 100, 1))},
            {"label": "Low Max HR", "value": min(100, round((202 - float(int_features[7])) / 202 * 100, 1))},
            {"label": "ST Depression", "value": min(100, round(float(int_features[9]) / 6.2 * 100, 1))},
        ]
    )


if __name__ == "__main__":
    app.run(debug=True, port=5001)
