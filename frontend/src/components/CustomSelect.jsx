import React, { useEffect, useMemo, useRef, useState } from 'react';
import '../styles/customSelect.css';

const CustomSelect = ({
  options = [],
  value = [],
  onChange,
  placeholder = 'Select option',
  isMulti = false,
  isSearchable = true,
  closeMenuOnSelect = true,
  className = '',
  disabled = false,
  maxMenuHeight = 220,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchText('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const normalizedValue = useMemo(() => {
    if (Array.isArray(value)) {
      return value.map((item) => {
        if (item && typeof item === 'object' && 'value' in item) {
          return item;
        }
        return { value: item, label: String(item) };
      });
    }

    return value ? [{ value, label: String(value) }] : [];
  }, [value]);

  const filteredOptions = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    if (!term) return options;
    return options.filter((option) => {
      const label = option?.label || '';
      return label.toLowerCase().includes(term);
    });
  }, [options, searchText]);

  const selectedLabels = useMemo(() => {
    return normalizedValue
      .map((item) => item?.label)
      .filter(Boolean)
      .join(', ');
  }, [normalizedValue]);

  const handleSelect = (option) => {
    if (disabled || option?.disabled) return;

    if (option?.label === 'Select All') {
      const selectableOptions = options.filter((item) => item?.label !== 'Select All');
      onChange?.(selectableOptions);
      if (closeMenuOnSelect) setIsOpen(false);
      return;
    }

    if (!isMulti) {
      onChange?.(option);
      setIsOpen(false);
      return;
    }

    const exists = normalizedValue.some((item) => item?.value === option?.value);
    const nextValue = exists
      ? normalizedValue.filter((item) => item?.value !== option?.value)
      : [...normalizedValue, option];

    onChange?.(nextValue);
    if (closeMenuOnSelect) setIsOpen(false);
  };

  const handleOptionClick = (event, option) => {
    event.preventDefault();
    event.stopPropagation();
    handleSelect(option);
  };

  return (
    <div ref={containerRef} className={`custom-select ${className}`.trim()}>
      <button
        type="button"
        className={`custom-select__trigger ${disabled ? 'is-disabled' : ''}`}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        disabled={disabled}
      >
        <span className="custom-select__trigger-text">
          {selectedLabels || placeholder}
        </span>
        <span className="custom-select__caret">▾</span>
      </button>

      {isOpen && (
        <div className="custom-select__menu" style={{ maxHeight: `${maxMenuHeight}px` }}>
          {isSearchable && (
            <div className="custom-select__search">
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search..."
              />
            </div>
          )}

          <div className="custom-select__options">
            {filteredOptions.map((option) => {
              const checked = normalizedValue.some((item) => item?.value === option?.value);

              return (
                <label
                  key={option?.value ?? option?.label}
                  className={`custom-select__option ${option?.disabled ? 'is-disabled' : ''}`}
                  onMouseDown={(event) => handleOptionClick(event, option)}
                  onClick={(event) => handleOptionClick(event, option)}
                >
                  <input
                    type={isMulti ? 'checkbox' : 'radio'}
                    checked={checked}
                    readOnly
                    disabled={option?.disabled || disabled}
                  />
                  <span>{option?.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
