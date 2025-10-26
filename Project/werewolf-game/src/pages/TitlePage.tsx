import React from 'react';
import titleImage from '../IMG_4862.png';

interface TitlePageProps {
  onHost: () => void;
  onJoin: () => void;
}

const TitlePage: React.FC<TitlePageProps> = ({ onHost, onJoin }) => {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundImage: `url(${titleImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-end', // Changed to flex-end to push content to bottom
      imageRendering: 'pixelated',
      position: 'relative',
      paddingBottom: '20px' // Space from bottom to position over START button
    }}>
      {/* Content */}
      <div style={{ 
        position: 'relative', 
        zIndex: 1,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: '0px'
      }}>
        <button 
          onClick={onHost} 
          style={{ 
            fontSize: '28px', 
            padding: '25px 50px', 
            backgroundColor: '#8B0000',
            border: '4px solid #000',
            color: 'white',
            cursor: 'pointer',
            fontFamily: "'Press Start 2P', cursive",
            boxShadow: '6px 6px 0 #000',
            transition: 'all 0.1s',
            letterSpacing: '2px',
            minWidth: '350px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translate(3px, 3px)';
            e.currentTarget.style.boxShadow = '3px 3px 0 #000';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translate(0, 0)';
            e.currentTarget.style.boxShadow = '6px 6px 0 #000';
          }}
        >
          HOST GAME
        </button>
        
        <button 
          onClick={onJoin} 
          style={{ 
            fontSize: '28px', 
            padding: '25px 50px', 
            backgroundColor: '#8B0000',
            border: '4px solid #000',
            color: 'white',
            cursor: 'pointer',
            fontFamily: "'Press Start 2P', cursive",
            boxShadow: '6px 6px 0 #000',
            transition: 'all 0.1s',
            letterSpacing: '2px',
            minWidth: '350px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translate(3px, 3px)';
            e.currentTarget.style.boxShadow = '3px 3px 0 #000';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translate(0, 0)';
            e.currentTarget.style.boxShadow = '6px 6px 0 #000';
          }}
        >
          JOIN GAME
        </button>
      </div>

      {/* Add Google Fonts for pixel font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
      `}</style>
    </div>
  );
};

export default TitlePage;