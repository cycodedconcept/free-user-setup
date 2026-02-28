import React from 'react';

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  onClick,
  style = {},
  unstyled = false,
  ...props
}) => {
  const variants = {
    primary: {
      backgroundColor: '#0273F9',
      color: '#FFFFFF',
      border: 'none'
    },
    secondary: {
      backgroundColor: '#EAF4FF',
      color: '#0273F9',
      border: 'none'
    },
    secondaryBorder: {
      backgroundColor: '#EEEDED',
      color: '#0273F9',
      border: '1px solid #0273F9'
    },
    noBackground: {
      backgroundColor: 'transparent',
      color: '#1C1917',
      border: 'none'
    },
    greenButton: {
      backgroundColor: '#0EC049',
      color: '#FFF',
      border: 'none'
    },
    blueButton: {
      backgroundColor: '#0273F9',
      color: '#FFF',
      border: 'none'
    }
    
  };

  const sizes = {
    sm: { padding: '6px 25px', fontSize: '14px' },
    xsm: { padding: '15px 18px', fontSize: '15px' },
    md: { padding: '10px 20px', fontSize: '16px' },
    lg: { padding: '14px 28px', fontSize: '14px' }
  };

  const baseStyle = unstyled
    ? { ...style }
    : {
        fontFamily: 'Poppins, Open Sans, sans-serif',
        fontWeight: 500,
        borderRadius: '6px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'opacity 0.2s ease',
        ...variants[variant],
        ...sizes[size],
        ...style
      };

  return (
    <button
      type={type}
      style={baseStyle}
      className={className}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
