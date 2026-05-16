@echo off
cd /d C:\Users\marti\Desktop\foodstoreSSD\FOOD-STORE-SDD
set DATABASE_URL=postgresql://postgres:postgres@localhost:5433/foodstore_test
set CORS_ORIGINS=http://localhost:5173
python -m uvicorn backend.main:app --port 8000 --reload