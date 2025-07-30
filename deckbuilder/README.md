# Riftbound Deck Builder

A modern deck builder game built with React + TypeScript + Tailwind CSS + DaisyUI for the frontend and FastAPI + MongoDB for the backend.

## Project Structure

```
deckbuilder/
├── backend/          # FastAPI + MongoDB
│   ├── main.py
│   └── requirements.txt
├── src/              # React + TypeScript + Tailwind
├── public/
├── package.json
├── tailwind.config.js
└── postcss.config.js
```

## Quick Start

### Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm start
```

### Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Unix/MacOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn main:app --reload
```

## Tech Stack

### Frontend
- React 19
- TypeScript
- Tailwind CSS
- DaisyUI
- React Scripts

### Backend
- FastAPI
- MongoDB (Motor async driver)
- Pydantic
- JWT Authentication

## Development

- Frontend runs on: http://localhost:3000
- Backend runs on: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Features

- Modern React with TypeScript
- Tailwind CSS for styling
- DaisyUI components
- FastAPI backend with MongoDB
- JWT authentication
- Deck building functionality
- Card collection management
