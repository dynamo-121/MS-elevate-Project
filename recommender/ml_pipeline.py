import pandas as pd
import numpy as np
import random
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error
from sklearn.preprocessing import LabelEncoder
import os
from pymongo import MongoClient

def create_synthetic_data(csv_path="data.csv", num_records=2000):
    """
    Connects to the MongoDB database to fetch real actual movies.
    Then generates synthetic user ratings for those real movies 
    to create a realistic training dataset containing actual posters.
    """
    print("Connecting to MongoDB to fetch real movies...")
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017/movieDB")
    client = MongoClient(MONGO_URI)
    db = client.get_default_database() if client.get_default_database().name else client['movieDB']
    movies_collection = db['movies']
    
    # Fetch all movies from DB
    movies_cursor = movies_collection.find({}, {"_id": 1, "title": 1, "genres": 1, "posterUrl": 1, "releaseYear": 1})
    movies = list(movies_cursor)
    
    if len(movies) == 0:
        print("Error: No movies found in MongoDB! Please run seed.js or fetch scripts in the backend first.")
        return None
        
    print(f"Successfully fetched {len(movies)} real movies from MongoDB.")
    print(f"Generating {num_records} synthetic user-movie interactions for these movies...")
    
    np.random.seed(42)
    random.seed(42)

    user_ids = np.random.randint(1, 101, num_records) # 100 fake users
    
    # Randomly pick movies from our real DB
    selected_movies = [random.choice(movies) for _ in range(num_records)]
    
    # Extract data from the selected real movies
    movie_ids = [str(m['_id']) for m in selected_movies]
    
    # Use the first genre as the primary genre, or 'Unknown'
    genres_list = []
    for m in selected_movies:
        if m.get('genres') and len(m.get('genres')) > 0:
            genres_list.append(m['genres'][0])
        else:
            genres_list.append('Unknown')
            
    movie_release_years = [m.get('releaseYear', 2000) for m in selected_movies]
    movie_thumbnails = [m.get('posterUrl', 'https://placehold.co/300x450/1f2937/ffffff?text=No+Poster') for m in selected_movies]
    
    # Generate random subjective ratings between 1 and 10
    ratings = np.random.uniform(1.0, 10.0, num_records).round(1)

    # Simulate sentiment scores loosely correlated with the star rating
    sentiment_scores = []
    for r in ratings:
        if r >= 7.0:
            sentiment_scores.append(round(random.uniform(0.1, 1.0), 2))
        elif r <= 4.0:
            sentiment_scores.append(round(random.uniform(-1.0, -0.1), 2))
        else:
            sentiment_scores.append(round(random.uniform(-0.3, 0.3), 2))
            
    # Calculate a sentiment-adjusted rating (Influence max +/- 2.0 stars)
    adjusted_ratings = np.clip(ratings + (np.array(sentiment_scores) * 2.0), 1.0, 10.0).round(1)

    # Create DataFrame
    df = pd.DataFrame({
        'user_id': user_ids,
        'movie_id': movie_ids,
        'genre': genres_list,
        'release_year': movie_release_years,
        'thumbnail_image': movie_thumbnails,
        'rating': ratings,
        'sentiment_score': sentiment_scores,
        'adjusted_rating': adjusted_ratings
    })

    # Save to CSV
    df.to_csv(csv_path, index=False)
    print(f"Dataset containing real movies successfully saved to {csv_path}!")
    return df

def train_and_test_model(csv_path="data.csv"):
    """
    Loads data.csv, trains an ML model to predict ratings, and tests the model.
    """
    if not os.path.exists(csv_path):
        print(f"Error: {csv_path} not found.")
        return

    print(f"\nLoading data from {csv_path}...")
    df = pd.read_csv(csv_path)

    # Convert categorical 'genre' to numeric using one-hot encoding
    df_encoded = pd.get_dummies(df, columns=['genre'], drop_first=True)

    # ------------------ NEW ADDITION ------------------
    # The movie_id is currently a complex MongoDB string ID (e.g. '60a2b...').
    # RandomForestRegressor mathematically requires number variables, so it will crash on a string.
    # We must use LabelEncoder() to map the strings locally to safe integers [0, 1, 2...].
    # --------------------------------------------------
    le = LabelEncoder()
    df_encoded['movie_id_encoded'] = le.fit_transform(df_encoded['movie_id'])

    # Features (X) and target (y)
    # Drop original string ID 'movie_id', target 'rating', unused 'thumbnail_image' and new sentiment metrics
    cols_to_drop = ['movie_id', 'rating', 'thumbnail_image', 'sentiment_score', 'adjusted_rating']
    X = df_encoded.drop([c for c in cols_to_drop if c in df_encoded.columns], axis=1)
    
    # Train heavily on the newly calculated sentiment-adjusted ratings
    y = df_encoded['adjusted_rating']

    # 1. Train-Test Split (80% training data, 20% testing data)
    print("Splitting data into Training and Testing sets (80/20)...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    print(f"Training samples: {len(X_train)}, Testing samples: {len(X_test)}")

    # 2. Initialize the AI/ML Model
    print("Initializing RandomForestRegressor model...")
    model = RandomForestRegressor(n_estimators=100, random_state=42)

    # 3. Train the model
    print("Training the ML model on the training data...")
    model.fit(X_train, y_train)

    # 4. Test the model
    print("Testing the model on the unseen test data...")
    predictions = model.predict(X_test)

    # Evaluate the results
    mse = mean_squared_error(y_test, predictions)
    rmse = np.sqrt(mse)
    mae = mean_absolute_error(y_test, predictions)

    print("\n--- Model Evaluation Results ---")
    print(f"Root Mean Squared Error (RMSE): {rmse:.2f} (Lower is better)")
    print(f"Mean Absolute Error (MAE): {mae:.2f}")
    
    # 5. Make a sample prediction
    print("\n--- Sample Prediction ---")
    sample_input = X_test.iloc[0:1]
    actual_rating = y_test.iloc[0]
    predicted_rating = model.predict(sample_input)[0]
    
    # Recover original string ID using inverse_transform
    encoded_id = int(sample_input['movie_id_encoded'].values[0])
    original_movie_id = le.inverse_transform([encoded_id])[0]
    
    print(f"Simulated User ID: {sample_input['user_id'].values[0]}, Movie ID (Real DB String): {original_movie_id}")
    print(f"Actual Assigned Rating: {sample_input.get('rating', actual_rating)}") 
    print(f"Target Sentiment-Adjusted Rating: {actual_rating}")
    print(f"Predicted ML Rating: {predicted_rating:.2f}")

if __name__ == "__main__":
    csv_filename = "data.csv"
    # Step 1: Query MongoDB to make data.csv using Real Movies + Synthetic Users
    df = create_synthetic_data(csv_filename, num_records=2000)
    
    if df is not None:
        # Step 2: Train and test the ML recommendation model
        train_and_test_model(csv_filename)
