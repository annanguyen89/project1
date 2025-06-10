import React from 'react';
import './button.css'; // Create this CSS file next

function Button({ children, onClick, type = 'button', className = '' }) {
  return (
    <button type={type} onClick={onClick} className={`common-button ${className}`}>
      {children}
    </button>
  );
}

export default Button;