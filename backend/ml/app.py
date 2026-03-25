from flask import Flask, request, jsonify
from flask_cors import CORS
from classifier import classifier
from chatbot import bot
import os

app = Flask(__name__)
CORS(app)

@app.route('/ml/predict', methods=['POST'])
def predict():
    data = request.json
    text = data.get('text', '')
    if not text:
        return jsonify({"error": "No text provided"}), 400
    
    if classifier:
        result = classifier.predict(text)
        print(f"[ML LOG] Input: '{text[:50]}...' -> Predicted: {result['category']} (Priority: {result['priority']})")
        return jsonify(result)
    else:
        print("[ML LOG] Classifier not loaded. Using fallback.")
        return jsonify({
            "category": "other",
            "priority": "medium",
            "aiCategoryConfidence": 0,
            "aiPriorityConfidence": 0
        })

@app.route('/ml/reload', methods=['GET', 'POST'])
def reload_models():
    if classifier:
        success = classifier.load_models()
        return jsonify({"success": success, "message": "Models reloaded" if success else "Reload failed"})
    return jsonify({"error": "Classifier not initialized"}), 400

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "running", "model_loaded": classifier is not None})


@app.route('/ml/chat', methods=['POST'])
def chat():
    data = request.json
    text = data.get('text', '')
    if not text:
        return jsonify({"error": "No text provided"}), 400
    
    response = bot.get_response(text)
    return jsonify({"response": response})

if __name__ == "__main__":
    if not os.path.exists('models/category_model.pkl'):
        print("[!] Model not found. Run 'python train.py' first.")
    else:
        print("[*] AI Models loaded successfully.")
    
    # Get port from environment or fallback to 5001
    port = int(os.environ.get('PORT', 5001))
    print(f"[*] ML Service starting on 0.0.0.0:{port}...")
    
    # Important: host='0.0.0.0' for Render/Cloud binding
    app.run(host='0.0.0.0', port=port, debug=False)
