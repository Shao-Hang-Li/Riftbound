import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import CardGallery from './pages/CardGallery';
import DeckBuilder from './pages/DeckBuilder';
import DeckViewer from './pages/DeckViewer';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar bg-base-100 shadow-lg">
          <div className="navbar-start">
            <div className="dropdown">
              <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
                </svg>
              </div>
              <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
                <li><Link to="/">Card Gallery</Link></li>
                <li><Link to="/deck-builder">Deck Builder</Link></li>
                <li><Link to="/deck-viewer">Deck Viewer</Link></li>
              </ul>
            </div>
            <Link to="/" className="btn btn-ghost text-xl">Riftbound Deck Builder</Link>
          </div>
          <div className="navbar-center hidden lg:flex">
            <ul className="menu menu-horizontal px-1">
              <li><Link to="/" className="link link-hover">Card Gallery</Link></li>
              <li><Link to="/deck-builder" className="link link-hover">Deck Builder</Link></li>
              <li><Link to="/deck-viewer" className="link link-hover">Deck Viewer</Link></li>
            </ul>
          </div>
          <div className="navbar-end">
            <div className="form-control">
              <input type="text" placeholder="Search cards..." className="input input-bordered w-24 md:w-auto" />
            </div>
          </div>
        </nav>

        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<CardGallery />} />
            <Route path="/deck-builder" element={<DeckBuilder />} />
            <Route path="/deck-viewer" element={<DeckViewer />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
