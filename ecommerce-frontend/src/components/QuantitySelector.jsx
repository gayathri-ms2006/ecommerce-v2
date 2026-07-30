import React from 'react';

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 6h18" />
    <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </svg>
);

const QuantitySelector = ({
  value = 1,
  onChange,
  min = 1,
  max = 10,
  disabled = false,
  showRemoveIcon = false,
  onRemove,
}) => {
  const numericValue = Math.max(min, Number(value || min));
  const isAtMinimum = numericValue <= min;

  const handleDecrease = () => {
    if (disabled) return;

    if (showRemoveIcon && isAtMinimum && onRemove) {
      onRemove();
      return;
    }

    const nextValue = Math.max(min, numericValue - 1);
    onChange?.(nextValue);
  };

  const handleIncrease = () => {
    if (disabled) return;
    const nextValue = Math.min(max, numericValue + 1);
    onChange?.(nextValue);
  };

  return (
    <div className="quantity-selector" aria-label="Quantity selector">
      <button
        type="button"
        className={`quantity-step-btn${showRemoveIcon && isAtMinimum ? ' remove-btn' : ''}`}
        onClick={handleDecrease}
        disabled={disabled}
        aria-label={showRemoveIcon && isAtMinimum ? 'Remove item' : 'Decrease quantity'}
      >
        {showRemoveIcon && isAtMinimum ? <TrashIcon /> : '−'}
      </button>

      <span className="quantity-badge-value">{numericValue}</span>

      <button
        type="button"
        className="quantity-step-btn"
        onClick={handleIncrease}
        disabled={disabled || numericValue >= max}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
};

export default QuantitySelector;
