from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from pymongo import MongoClient
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from bson.objectid import ObjectId
import hashlib
from textblob import TextBlob

app = FastAPI(title="Movie Recommender System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect to MongoDB
MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017/movieDB")
client = MongoClient(MONGO_URI)
db = client.get_default_database() if client.get_default_database().name else client['movieDB']
movies_collection = db['movies']

def get_recommendations_for_movie(movie_id: str, limit: int = 5):
    # Fetch all movies from DB
    movies_cursor = movies_collection.find({}, {"_id": 1, "title": 1, "description": 1, "genres": 1, "posterUrl": 1, "rating": 1, "releaseYear": 1})
    movies = list(movies_cursor)
    
    if len(movies) == 0:
        return []

    # Prepare DataFrame
    df = pd.DataFrame(movies)
    df['_id'] = df['_id'].astype(str)
    
    # Check if target movie exists
    if movie_id not in df['_id'].values:
        raise ValueError("Movie not found")
        
    # Create a combined features column
    df['genres_str'] = df['genres'].apply(lambda x: ' '.join(x) if isinstance(x, list) else '')
    df['combined_features'] = df['description'].fillna('') + ' ' + df['genres_str']
    
    # TF-IDF Vectorization
    tfidf = TfidfVectorizer(stop_words='english')
    tfidf_matrix = tfidf.fit_transform(df['combined_features'])
    
    # Compute similarity score
    cosine_sim = linear_kernel(tfidf_matrix, tfidf_matrix)
    
    # Get index of the target movie
    idx = df.index[df['_id'] == movie_id][0]
    
    # Get pairwise similarity scores of all movies with that movie
    sim_scores = list(enumerate(cosine_sim[idx]))
    
    # Sort movies based on similarity scores
    sorted_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
    
    # Get scores of top n most similar movies (ignoring itself at index 0)
    top_scores = sorted_scores[1:limit+1]
    
    # Get movie indices
    movie_indices = [i[0] for i in top_scores]
    
    # Handle NaNs for optional fields
    if 'posterUrl' in df: df['posterUrl'] = df['posterUrl'].fillna('https://placehold.co/300x450/1f2937/ffffff?text=No+Poster')
    if 'rating' in df: df['rating'] = df['rating'].fillna(0)
    if 'releaseYear' in df: df['releaseYear'] = df['releaseYear'].fillna(0)

    # Return top similar movies
    cols = ['_id', 'title']
    for c in ['posterUrl', 'rating', 'releaseYear']:
        if c in df: cols.append(c)

    recommendations = df.iloc[movie_indices][cols].to_dict('records')
    return recommendations

# Global cache for the Random Forest model and data
rf_model = None
rf_label_encoder = None
rf_df_encoded = None
rf_all_movies = None
last_review_count = 0

def get_top_picks_for_user(user_id: str, limit: int = 10):
    global rf_model, rf_label_encoder, rf_df_encoded, rf_all_movies, last_review_count
    
    csv_path = "data.csv"
    if not os.path.exists(csv_path):
        raise ValueError("data.csv not found. Please run ml_pipeline.py first to generate user interactions.")
        
    reviews_collection = db['reviews']
    current_review_count = reviews_collection.count_documents({})
    
    # Lazy load and train the model upon first request or when new reviews appear
    if rf_model is None or current_review_count > last_review_count:
        df = pd.read_csv(csv_path)
        
        # Fallback for missing newly added sentiment columns in old data.csv
        if 'adjusted_rating' not in df.columns:
            df['adjusted_rating'] = df['rating']
        if 'sentiment_score' not in df.columns:
            df['sentiment_score'] = 0.0
        
        real_reviews = list(reviews_collection.find({}))
        if real_reviews:
            real_data = []
            for r in real_reviews:
                mid_obj = r.get('movie')
                uid_obj = r.get('user')
                if not mid_obj or not uid_obj: continue
                mid = str(mid_obj)
                
                # Fetch movie details directly or rely on existing df 
                # (For simplicity, we query DB or look up genre to merge correctly)
                m = movies_collection.find_one({"_id": mid_obj})
                if m:
                    genres_list = m.get('genres')
                    genre = genres_list[0] if genres_list and len(genres_list) > 0 else 'Unknown'
                    uid_hash = int(hashlib.md5(str(uid_obj).encode()).hexdigest(), 16) % 100000
                    
                    rating_val = float(r.get('rating', 5.0))
                    comment = r.get('comment', '')
                    
                    # Sentiment Analysis
                    sentiment_score = 0
                    if comment and isinstance(comment, str):
                        try:
                            sentiment_score = TextBlob(comment).sentiment.polarity
                        except Exception:
                            sentiment_score = 0
                            
                    # Calculate Adjusted Rating (clip between 1.0 and 10.0)
                    adjusted_rating = max(1.0, min(10.0, rating_val + (sentiment_score * 2.0)))
                    
                    real_data.append({
                        'user_id': uid_hash,
                        'movie_id': mid,
                        'genre': genre,
                        'release_year': m.get('releaseYear', 2000),
                        'thumbnail_image': m.get('posterUrl', ''),
                        'rating': rating_val,
                        'sentiment_score': round(sentiment_score, 2),
                        'adjusted_rating': round(adjusted_rating, 1)
                    })
                    
            if real_data:
                df_real = pd.DataFrame(real_data)
                df = pd.concat([df, df_real], ignore_index=True)
                
        df_encoded = pd.get_dummies(df, columns=['genre'], drop_first=False)
        
        le = LabelEncoder()
        df_encoded['movie_id_encoded'] = le.fit_transform(df_encoded['movie_id'].astype(str))
        
        X = df_encoded.drop(columns=['movie_id', 'rating', 'thumbnail_image', 'sentiment_score', 'adjusted_rating'], errors='ignore')
        
        if 'adjusted_rating' in df_encoded.columns:
            y = df_encoded['adjusted_rating']
        else:
            y = df_encoded['rating']
        
        model = RandomForestRegressor(n_estimators=100, random_state=42)
        model.fit(X, y)
        
        rf_model = model
        rf_label_encoder = le
        rf_df_encoded = df_encoded
        rf_all_movies = df_encoded.drop_duplicates(subset=['movie_id']).copy()
        last_review_count = current_review_count

    # Hash the input target user id
    target_user_hash = int(hashlib.md5(str(user_id).encode()).hexdigest(), 16) % 100000

    # Get movies the user HAS seen
    user_seen_movies = set(rf_df_encoded[rf_df_encoded['user_id'] == target_user_hash]['movie_id'].unique())
    
    # Filter out movies the user has already seen
    unseen_movies = rf_all_movies[~rf_all_movies['movie_id'].isin(user_seen_movies)].copy()
    
    if len(unseen_movies) == 0:
        return []
        
    # Prepare features for prediction (force the user_id to be our target user hash)
    unseen_movies['user_id'] = target_user_hash
    
    # Ensure X has same columns as trained model 
    X_unseen = unseen_movies.drop(columns=['movie_id', 'rating', 'thumbnail_image', 'sentiment_score', 'adjusted_rating'], errors='ignore')
    
    # Predict rating
    unseen_movies['predicted_rating'] = rf_model.predict(X_unseen)
    
    # Sort by highest predicted rating
    top_recommendations = unseen_movies.sort_values(by=['predicted_rating'], ascending=[False], na_position='last').head(limit)
    
    results = []
    for _, row in top_recommendations.iterrows():
        try:
            # Query MongoDB for real-time metadata (Title, poster, etc.)
            db_movie = movies_collection.find_one({"_id": ObjectId(row['movie_id'])})
            if db_movie:
                genre_cols = [c for c in row.index if c.startswith('genre_') and row[c] == 1]
                ml_genre = genre_cols[0].replace('genre_', '') if genre_cols else "Unknown"
                
                results.append({
                    "_id": str(db_movie["_id"]),
                    "title": db_movie.get("title", 'Unknown Title'),
                    "posterUrl": db_movie.get("posterUrl", 'https://placehold.co/300x450/1f2937/ffffff?text=No+Poster'),
                    "rating": round(db_movie.get("rating", 0), 1),
                    "releaseYear": db_movie.get("releaseYear", row.get('release_year', 2000)),
                    "genre": ml_genre,
                    "predicted_rating": round(row['predicted_rating'], 1)
                })
        except Exception:
            continue
            
    return results

@app.get("/recommend/{movie_id}")
async def recommend(movie_id: str):
    try:
        recommendations = get_recommendations_for_movie(movie_id)
        return {"recommendations": recommendations}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/top-picks/{user_id}")
async def get_top_picks(user_id: str):
    try:
        top_picks = get_top_picks_for_user(user_id)
        return {"recommendations": top_picks}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def get_home_feed_for_user(user_id: str, limit: int = 50):
    users_collection = db['users']
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user or 'preferredGenres' not in user or not user['preferredGenres']:
        return []
        
    preferred_genres = user['preferredGenres']
    user_genres_str = " ".join(preferred_genres)
    
    # Fetch all movies from DB
    movies_cursor = movies_collection.find({}, {"_id": 1, "title": 1, "description": 1, "genres": 1, "posterUrl": 1, "rating": 1, "releaseYear": 1})
    movies = list(movies_cursor)
    
    if len(movies) == 0:
        return []

    # Prepare DataFrame
    df = pd.DataFrame(movies)
    df['_id'] = df['_id'].astype(str)
    
    # Create combined features
    df['genres_str'] = df['genres'].apply(lambda x: ' '.join(x) if isinstance(x, list) else '')
    df['combined_features'] = df['description'].fillna('') + ' ' + df['genres_str']
    
    # We add the user string as the "0th" document to compare everything against
    documents = [user_genres_str] + df['combined_features'].tolist()
    
    # TF-IDF Vectorization
    tfidf = TfidfVectorizer(stop_words='english')
    tfidf_matrix = tfidf.fit_transform(documents)
    
    # Compute similarity score of 0th document (User) against all other documents (Movies)
    cosine_sim = linear_kernel(tfidf_matrix[0:1], tfidf_matrix)
    
    sim_scores = list(enumerate(cosine_sim[0]))
    sorted_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
    
    # Skip index 0 (user)
    top_scores = sorted_scores[1:limit+1]
    movie_indices = [i[0] - 1 for i in top_scores]
    
    if 'posterUrl' in df: df['posterUrl'] = df['posterUrl'].fillna('https://placehold.co/300x450/1f2937/ffffff?text=No+Poster')
    if 'rating' in df: df['rating'] = df['rating'].fillna(0)
    if 'releaseYear' in df: df['releaseYear'] = df['releaseYear'].fillna(0)

    cols = ['_id', 'title']
    for c in ['posterUrl', 'rating', 'releaseYear']:
        if c in df: cols.append(c)

    # Convert objectid genres back to list or just keep columns
    recommendations = df.iloc[movie_indices][cols].to_dict('records')
    return recommendations

@app.get("/home-feed/{user_id}")
async def home_feed(user_id: str):
    try:
        feed = get_home_feed_for_user(user_id)
        return {"feed": feed}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def read_root():
    return {"message": "Recommender service is running"}

@app.get("/dataset")
def get_dataset():
    if not os.path.exists("data.csv"):
        return {"dataset": []}
    df = pd.read_csv("data.csv")
    return {"dataset": df.head(100).fillna("").to_dict('records')}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
