import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBars, FaTimes, FaBolt, FaTint, FaCogs, FaChartLine, FaTwitter } from 'react-icons/fa';
import { SiFacebook, SiLinkedin } from 'react-icons/si';
import './style/HomeStyle.css';
import WOW from 'wow.js';
import 'wow.js/css/libs/animate.css';
import img_1 from './Images/img_3.jpg'
import img_2 from './Images/img_4.jpg'
import img_3 from './Images/img_5.jpg'
import img_4 from './Images/img_7.jpg'
const HomePage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const navigate = useNavigate();
  useEffect(() => {
    new WOW().init();
  }, []);
  // Handle mobile menu toggle
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Handle carousel navigation
  const nextSlide = () => {
    setActiveSlide((prev) => (prev === 2 ? 0 : prev + 1));
  };

  // const prevSlide = () => {
  //   setActiveSlide((prev) => (prev === 0 ? 2 : prev - 1));
  // };

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Testimonial data
  const testimonials = [
    { name: "Emily Johnson", text: "This platform transformed my home's energy and water efficiency. I reduced my bills and contributed to a sustainable future!" },
    { name: "Michael Brown", text: "Smart monitoring helped me track appliance usage and minimize energy waste. Highly recommended!" },
    { name: "Sophia Martinez", text: "A game-changer for sustainable living! My air conditioner and washing machine are now optimized for efficiency." }
  ];

  // Service items data
  const serviceItems = [
    { icon: <FaBolt className="service-icon" />, title: "Smart Energy Monitoring", description: "Track real-time energy consumption of home appliances and optimize their efficiency." },
    { icon: <FaTint className="service-icon" />, title: "Water Usage Analytics", description: "Analyze water consumption patterns in appliances and receive actionable insights to reduce wastage." },
    { icon: <FaCogs className="service-icon" />, title: "Predictive Maintenance", description: "Prevent appliance failures with AI-driven predictive maintenance alerts." },
    { icon: <FaChartLine className="service-icon" />, title: "Sustainability Reports", description: "Get detailed analytics on energy and water savings, helping you make informed decisions." }
  ];

  return (
    <div className="sustainability-container">
      {/* Header with responsive navigation */}
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="logo  wow fadeInLeft">
              <h1>SmartSaver</h1>
            </div>
            
            {/* Desktop Menu */}
            <nav className="main-nav wow fadeInRight">
              <ul>
                <li><a href="#Home" className="active">Home</a></li>
                <li><a href="#Services">Services</a></li>
                <li><a href="#About">About</a></li>
                <li><a href="#Review">Review</a></li>
                <li><a href="#Contact">Contact</a></li>
                <li><div className="auth-buttons  ">
              <button className="btn-login btn primary-btn" onClick={() => navigate("/login")}>Login</button>
              <button className="btn-signup btn primary-btn" onClick={() => navigate("/signup")}>Sign Up</button>
            </div></li>
              </ul>
            
            </nav>

            
            {/* Mobile Menu Toggle */}
            <button className="mobile-menu-toggle" onClick={toggleMobileMenu} aria-label="Toggle Menu">
              {mobileMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>

          {/* Mobile Menu */}
          <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''} wow fadeIn`}>
            <ul>
              <li><a href="#Home" className="active">Home</a></li>
              <li><a href="#Services">Services</a></li>
              <li><a href="#About">About</a></li>
              <li><a href="#Review">Review</a></li>
              <li><a href="#Contact">Contact</a></li>
            </ul>
            <button className="btn-login" onClick={() => navigate("/login")}>Login</button>
            <button className="btn-signup" onClick={() => navigate("/signup")}>Sign Up</button>
          </div>
        </div>
      </header>
      
      
      {/* Hero Section */}
      <section className="hero-section" id="Home">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text wow fadeInLeft">
              <h1>Innovating for Sustainability</h1>
              <p>
                Empowering homes with smart insights to reduce energy and water consumption in appliances.
                Track, analyze, and optimize the performance of your Refrigerators, Air Conditioners, Washing Machines,
                and Desert Air Coolers to create a more sustainable future.
              </p>
              <a href="#" className="btn primary-btn">Contact Now</a>
            </div>
            <div className="hero-image wow fadeInRight">
              <div className="image-container">
                <img src={img_1} alt="Sustainable Home Solutions" />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Services Section */}
      <section className="services-section" id='Services'>
        <div className="container">
          <div className="section-header wow tada">
            <h2>How We Can Help You?</h2>
            <p>We provide smart solutions to optimize energy and water consumption in home appliances, ensuring a sustainable future.</p>
          </div>
          
          <div className="services-grid">
            {serviceItems.map((service, index) => (
              <div className="service-card  wow bounceIn" key={index}>
                <div className="service-icon-container">
                  {service.icon}
                </div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* About Section */}
      <section className="about-section" id='About'>
        <div className="container">
          <div className="about-content">
            <div className="about-image wow fadeInLeft">
              <img src={img_4} alt="About Our Sustainable Solutions" />
              
            </div>
            <div className="about-text wow fadeInRight">
              <h2>Pioneering Smart Sustainability Solutions</h2>
              <p>At <strong>Innovating for Sustainability</strong>, we help homeowners optimize energy and water usage in refrigerators, air conditioners, washing machines, and desert air coolers.</p>
              <p>Using AI, IoT, and analytics, our platform reduces waste, lowers costs, and promotes a greener future.</p>
              <p>Join us in making home appliances smarter and more efficient!</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="testimonials-section" id='Review'>
        <div className="container">
          <div className="section-header wow tada">
            <h2>What Our Happy Clients Say</h2>
            <p>See how our smart energy and water conservation solutions are making a difference.</p>
          </div>
          
          <div className="testimonials-container">
            <div className="testimonial-images wow fadeIn">
              <img 
                src={img_3} 
                alt="Client Testimonial - Emily Johnson" 
                className="client-image-1" 
                loading="lazy"
              />
              <img 
                src={img_2} 
                alt="Client Testimonial - Michael Brown" 
                className="client-image-2"
                loading="lazy" 
              />
            </div>
            
            <div className="testimonial-slider">
              <div className="testimonial-slides wow fadeIn">
                {testimonials.map((testimonial, index) => (
                  <div 
                    key={index} 
                    className={`testimonial-slide ${index === activeSlide ? 'active' : ''}`}
                  >
                    <h3>{testimonial.name}</h3>
                    <p>"{testimonial.text}"</p>
                  </div>
                ))}
              </div>
              
              <div className="testimonial-controls">
                <div className="testimonial-indicators">
                  {testimonials.map((_, index) => (
                    <button 
                      key={index} 
                      className={`indicator ${index === activeSlide ? 'active' : ''}`}
                      onClick={() => setActiveSlide(index)}
                      aria-label={`Go to testimonial ${index + 1}`}
                    ></button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Newsletter Section */}
      <section className="newsletter-section" id='Contact'>
        <div className="container">
          <div className="newsletter-content">
            <div className="newsletter-text">
              <h2>Stay Updated with Smart Utility Solutions</h2>
              <p>Subscribe to get the latest updates on efficient water and electricity management, personalized insights, and exclusive dashboard features.</p>
            </div>
            <div className="newsletter-form-container">
              <form className="newsletter-form wow bounce">
                <input 
                  type="email" 
                  placeholder="Enter your email address..." 
                  aria-label="Email for newsletter"
                />
                <button type="submit" className="btn">Subscribe Now</button>
              </form>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-logo">
              <h1>SmartSaver</h1>
              <p>Empowering homes and businesses with smart water and electricity solutions. Monitor usage, optimize efficiency, and save resources effortlessly.</p>
              <div className="social-icons">
                <a href="#" aria-label="Facebook"><SiFacebook /></a>
                <a href="#" aria-label="Twitter"><FaTwitter /></a>
                <a href="#" aria-label="LinkedIn"><SiLinkedin /></a>
              </div>
            </div>
            
            <div className="footer-links">
              <div className="footer-column">
                <h3>Our Services</h3>
                <ul>
                  <li><a href="#">Smart Water Management</a></li>
                  <li><a href="#">Electricity Usage Monitoring</a></li>
                  <li><a href="#">Energy Optimization</a></li>
                  <li><a href="#">Real-time Usage Dashboard</a></li>
                </ul>
              </div>
              
              <div className="footer-column">
                <h3>Company</h3>
                <ul>
                  <li><a href="#">About Us</a></li>
                  <li><a href="#">Careers</a></li>
                  <li><a href="#">Partner with Us</a></li>
                </ul>
              </div>
              
              <div className="footer-column">
                <h3>Support</h3>
                <ul>
                  <li><a href="#">FAQs</a></li>
                  <li><a href="#">Privacy Policy</a></li>
                  <li><a href="#">Customer Support</a></li>
                </ul>
              </div>
              
              <div className="footer-column">
                <h3>Contact</h3>
                <ul>
                  <li><a href="#">WhatsApp Support</a></li>
                  <li><a href="#">Email Us</a></li>
                  <li><a href="#">Book a Demo</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
