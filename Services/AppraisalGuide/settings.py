import os
from pydantic_settings import BaseSettings, SettingsConfigDict

current_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(current_dir, ".env")

class Settings(BaseSettings):    
    # Clockify Config
    clockify_api_key: str
    clockify_workspace_id: str
    google_api_key: str
    debug: bool = False
    clockify_user_id: str

    # This tells Pydantic to read from a .env file
    model_config = SettingsConfigDict(env_file=env_path)

# Create a singleton instance to be used across the app
settings = Settings()
