import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#f5f5f5',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ marginBottom: '40px', color: '#333' }}>
        🚗 Fleet Management - Test des Cartes
      </h1>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        alignItems: 'center'
      }}>
        <Link 
          to="/map-test" 
          style={{
            padding: '15px 30px',
            backgroundColor: '#007bff',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            boxShadow: '0 2px 10px rgba(0,123,255,0.3)',
            transition: 'transform 0.2s',
            minWidth: '200px',
            textAlign: 'center'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          🗺️ Carte de Test Simple
        </Link>
        
        <Link 
          to="/map-test" 
          style={{
            padding: '15px 30px',
            backgroundColor: '#28a745',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            boxShadow: '0 2px 10px rgba(40,167,69,0.3)',
            transition: 'transform 0.2s',
            minWidth: '200px',
            textAlign: 'center'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          🚀 Carte Complète
        </Link>
        
        <Link 
          to="/test-connection" 
          style={{
            padding: '15px 30px',
            backgroundColor: '#6f42c1',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            boxShadow: '0 2px 10px rgba(111,66,193,0.3)',
            transition: 'transform 0.2s',
            minWidth: '200px',
            textAlign: 'center'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          🔧 Test de Connexion
        </Link>
        
        <Link 
          to="/login" 
          style={{
            padding: '15px 30px',
            backgroundColor: '#dc3545',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            boxShadow: '0 2px 10px rgba(220,53,69,0.3)',
            transition: 'transform 0.2s',
            minWidth: '200px',
            textAlign: 'center'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          🔐 Application Complète (avec auth)
        </Link>
      </div>
      
      <div style={{
        marginTop: '40px',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        maxWidth: '600px',
        textAlign: 'center'
      }}>
        <h3 style={{ color: '#333', marginBottom: '15px' }}>ℹ️ Instructions</h3>
        <p style={{ color: '#666', lineHeight: '1.6' }}>
          <strong>Carte de Test Simple:</strong> Une carte basique qui génère automatiquement des données de test localement.<br/>
          <strong>Carte Complète:</strong> La carte avec toutes les fonctionnalités, données du backend Flask.<br/>
          <strong>Application Complète:</strong> L'application complète avec authentification (admin/admin123).
        </p>
      </div>
      
      <div style={{
        marginTop: '20px',
        fontSize: '14px',
        color: '#888'
      }}>
        Backend Flask: <code>http://localhost:5000</code> | 
        Frontend React: <code>http://localhost:3000</code>
      </div>
    </div>
  );
};

export default Home;
