import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts';

// Categories for the service selector
const categories = [
  { id: 'ride', icon: '🚗', label: 'Viajes' },
  { id: 'delivery', icon: '📦', label: 'Envíos' },
  { id: 'tours', icon: '🎯', label: 'Tours' },
  { id: 'hosts', icon: '🏠', label: 'Anfitriones' },
  { id: 'experiences', icon: '✨', label: 'Experiencias' },
];

// Featured tours (Tripadvisor-style)
const featuredTours = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=600&q=80',
    category: 'Tour Histórico',
    title: 'Cartagena Colonial: Murallas y leyendas',
    rating: 4.9,
    reviews: 234,
    duration: '3 horas',
    price: 45,
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1583531172005-763a424f0d9c?w=600&q=80',
    category: 'Aventura',
    title: 'Medellín: Comuna 13 y transformación urbana',
    rating: 4.8,
    reviews: 189,
    duration: '4 horas',
    price: 35,
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1569161031678-f49b4b9ca1c2?w=600&q=80',
    category: 'Naturaleza',
    title: 'Santa Marta: Parque Tayrona expedición',
    rating: 4.9,
    reviews: 312,
    duration: '8 horas',
    price: 85,
  },
];

// Featured hosts (AirBnB-style)
const featuredHosts = [
  {
    id: '1',
    name: 'María García',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
    location: 'Cartagena',
    specialty: 'Tours gastronómicos',
    rating: 4.95,
    isSuperhost: true,
  },
  {
    id: '2',
    name: 'Carlos Rodríguez',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    location: 'Medellín',
    specialty: 'Aventura urbana',
    rating: 4.88,
    isSuperhost: true,
  },
  {
    id: '3',
    name: 'Ana Martínez',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
    location: 'Bogotá',
    specialty: 'Historia y cultura',
    rating: 4.92,
    isSuperhost: false,
  },
];

export const HomeScreen: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('ride');
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');

  const handleSearch = () => {
    if (activeCategory === 'ride') {
      navigate('/c/trips');
    } else if (activeCategory === 'tours') {
      navigate('/c/tours');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="navbar">
        <div className="navbar-logo">
          <span>Going</span>
        </div>
        <div className="navbar-links hidden md:flex">
          <a href="/c" className="active">Inicio</a>
          <a href="/c/trips">Mis viajes</a>
          <a href="/c/bookings">Reservas</a>
          <a href="/p">Ser anfitrión</a>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="btn btn-outline"
          >
            {user?.name || 'Mi cuenta'}
          </button>
        </div>
      </nav>

      {/* Hero Section with Booking Widget (Uber-style) */}
      <section className="hero">
        <div className="hero-content">
          <div>
            <h1 className="hero-title">
              Viaja. Explora.<br />
              <span className="text-going-red">Descubre.</span>
            </h1>
            <p className="hero-subtitle">
              Transporte, tours y experiencias locales en un solo lugar.
            </p>
          </div>

          {/* Booking Widget */}
          <div className="booking-widget">
            {/* Tabs */}
            <div className="booking-tabs">
              {categories.slice(0, 3).map((cat) => (
                <button
                  key={cat.id}
                  className={`booking-tab ${activeCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  <span className="mr-2">{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Inputs */}
            {activeCategory === 'ride' ? (
              <>
                <input
                  type="text"
                  className="booking-input"
                  placeholder="¿Dónde te recogemos?"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                />
                <input
                  type="text"
                  className="booking-input"
                  placeholder="¿A dónde vas?"
                  value={dropoff}
                  onChange={(e) => setDropoff(e.target.value)}
                />
              </>
            ) : activeCategory === 'delivery' ? (
              <>
                <input
                  type="text"
                  className="booking-input"
                  placeholder="Dirección de recogida"
                />
                <input
                  type="text"
                  className="booking-input"
                  placeholder="Dirección de entrega"
                />
              </>
            ) : (
              <>
                <input
                  type="text"
                  className="booking-input"
                  placeholder="¿Qué quieres explorar?"
                />
                <input
                  type="date"
                  className="booking-input"
                />
              </>
            )}

            <button className="btn btn-primary btn-block" onClick={handleSearch}>
              {activeCategory === 'ride' ? 'Buscar viaje' : 
               activeCategory === 'delivery' ? 'Cotizar envío' : 
               'Buscar experiencias'}
            </button>
          </div>
        </div>
      </section>

      {/* Category Pills (Tripadvisor-style) */}
      <section className="section">
        <div className="category-pills">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`category-pill ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              <span className="category-pill-icon">{cat.icon}</span>
              <span className="category-pill-label">{cat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Tours (Tripadvisor-style) */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Tours y experiencias populares</h2>
          <a href="/c/tours" className="section-link">Ver todos →</a>
        </div>
        <div className="grid-3">
          {featuredTours.map((tour) => (
            <div key={tour.id} className="experience-card">
              <div className="relative">
                <img src={tour.image} alt={tour.title} className="experience-image" />
                <span className="experience-badge">🔥 Popular</span>
              </div>
              <div className="experience-content">
                <p className="experience-category">{tour.category}</p>
                <h3 className="experience-title">{tour.title}</h3>
                <div className="experience-meta">
                  <span className="rating">
                    <span className="rating-star">★</span>
                    <span className="rating-score">{tour.rating}</span>
                    <span className="rating-count">({tour.reviews})</span>
                  </span>
                  <span>⏱ {tour.duration}</span>
                </div>
                <p className="mt-3">
                  <span className="text-xl font-bold">${tour.price}</span>
                  <span className="text-gray-500"> / persona</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Hosts (AirBnB-style) */}
      <section className="section" style={{ background: '#f7f7f7' }}>
        <div className="section-header">
          <h2 className="section-title">Conoce a nuestros anfitriones</h2>
          <a href="/p" className="section-link">Ser anfitrión →</a>
        </div>
        <div className="grid-3">
          {featuredHosts.map((host) => (
            <div key={host.id} className="host-card">
              <img src={host.image} alt={host.name} className="host-avatar" />
              <div className="host-info">
                <h4>{host.name}</h4>
                <p>{host.specialty} • {host.location}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="rating">
                    <span className="rating-star">★</span>
                    <span className="rating-score">{host.rating}</span>
                  </span>
                  {host.isSuperhost && (
                    <span className="superhost-badge">⭐ Superanfitrión</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-grid">
          <div>
            <div className="footer-logo">
              <span>Going</span>
            </div>
            <p className="footer-description">
              Tu plataforma para movilidad, tours y experiencias locales únicas.
            </p>
          </div>
          <div>
            <h4 className="footer-title">Servicios</h4>
            <div className="footer-links">
              <a href="/c/trips">Viajes</a>
              <a href="/c/delivery">Envíos</a>
              <a href="/c/tours">Tours</a>
              <a href="/c/experiences">Experiencias</a>
            </div>
          </div>
          <div>
            <h4 className="footer-title">Anfitriones</h4>
            <div className="footer-links">
              <a href="/p">Ser anfitrión</a>
              <a href="/p/earnings">Ganancias</a>
              <a href="/p/resources">Recursos</a>
            </div>
          </div>
          <div>
            <h4 className="footer-title">Compañía</h4>
            <div className="footer-links">
              <a href="/about">Sobre nosotros</a>
              <a href="/careers">Trabaja con nosotros</a>
              <a href="/support">Soporte</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2024 Going. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            <a href="/privacy">Privacidad</a>
            <a href="/terms">Términos</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomeScreen;
