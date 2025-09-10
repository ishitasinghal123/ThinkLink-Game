from flask import Flask, request, jsonify
from flask_cors import CORS
import gensim.downloader as api
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

print("Loading GloVe vectors...")
model = api.load("glove-wiki-gigaword-100")
print("GloVe vectors loaded.")

app = Flask(__name__)
CORS(app)

@app.route("/check", methods=["POST"])
def check_similarity():
    data = request.get_json()
    target_word = data.get("target_word", "").lower().strip()
    user_input = data.get("user_input", "").lower().strip()
    total_score= data.get("total_score",0)

    if user_input == target_word:
        return jsonify({"matched": False, "score": 0})

    if user_input in target_word or target_word in user_input:
        return jsonify({"matched": False, "score": 0})

    try:
        user_vector = model[user_input]
        target_vector = model[target_word]
        score = cosine_similarity([user_vector], [target_vector])[0][0]
    except KeyError:
        return jsonify({"matched": False, "score": 0})

    # matched = bool(score > 0.4)  
    min_thresh = 0.3
    max_thresh = 0.5
    progress = min(1.0, total_score / 1000.0)  # scale 0–1
    threshold = min_thresh + (max_thresh - min_thresh) * progress

    matched = bool(score > threshold)
    return jsonify({"matched": matched, "score": float(score)})


if __name__ == "__main__":
    app.run(debug=True)

# git add .
# git commit -m "Describe your change"
# git push