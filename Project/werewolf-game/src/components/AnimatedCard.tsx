import React from 'react';
import './AnimatedCard.css';

type AnimatedCardProps = {
  frontContent: React.ReactNode;
  backContent: React.ReactNode;
  flipped: boolean;
  onClick?: () => void;
};

const AnimatedCard: React.FC<AnimatedCardProps> = ({
  frontContent,
  backContent,
  flipped,
  onClick,
}) => {
  return (
    <div className="animated-card-container" onClick={onClick}>
      <div className={`animated-card ${flipped ? 'flipped' : ''}`}>
        <div className="card-face card-front">
          {frontContent}
        </div>
        <div className="card-face card-back">
          {backContent}
        </div>
      </div>
    </div>
  );
};

export default AnimatedCard;
