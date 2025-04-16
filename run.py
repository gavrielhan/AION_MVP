import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Check for required environment variables
required_vars = ["API_KEY", "API_BASE_URL"]
missing_vars = [var for var in required_vars if not os.getenv(var)]

if missing_vars:
    print("Warning: The following environment variables are missing:")
    for var in missing_vars:
        print(f"- {var}")
    print("\nPlease set these variables in your .env file before running the application.")

# Run the application
if __name__ == "__main__":
    uvicorn.run(
        "oren.api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    ) 