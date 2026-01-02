// CustomButton.jsx
import React from 'react';
import '../assets/styles/CustomButton.css'; // Import the CSS styles

const CustomButton = ({ onClick, text, icon, className = '', style = {}, ...props }) => {
  return (
    <button className={`button ${className}`} onClick={onClick} style={style} {...props}>
      {icon && (
        <span className="button__icon">
          {icon}
        </span>
      )}
      {text && <span className="button__text">{text}</span>}
    </button>
  );
};

export default CustomButton;
