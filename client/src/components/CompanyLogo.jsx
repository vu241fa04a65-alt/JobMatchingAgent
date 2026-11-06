import React, { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';

/**
 * Reusable Company Logo component with professional fallback initials or building placeholder.
 * Handles broken images, missing logos, and dynamic sizing automatically.
 */
export default function CompanyLogo({
  src,
  name = 'Company',
  size = 46,
  borderRadius = '10px',
  style = {},
  className = ''
}) {
  const [hasError, setHasError] = useState(false);

  // Reset error state whenever src changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  // Generate clean initials from company name (e.g. "Google" -> "G", "Morgan Stanley" -> "MS")
  const getInitials = (compName) => {
    if (!compName) return 'CO';
    const words = compName.trim().split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return compName.slice(0, 2).toUpperCase();
  };

  // Color palette for placeholders based on name hash
  const getPlaceholderColor = (compName) => {
    const colors = [
      { bg: '#EEF2FF', text: '#4F46E5', border: '#C7D2FE' }, // Indigo
      { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' }, // Emerald
      { bg: '#F0F9FF', text: '#0284C7', border: '#BAE6FD' }, // Sky
      { bg: '#FAF5FF', text: '#7C3AED', border: '#DDD6FE' }, // Purple
      { bg: '#FFF7ED', text: '#D97706', border: '#FED7AA' }, // Amber
      { bg: '#FDF2F8', text: '#DB2777', border: '#FBCFE8' }  // Pink
    ];
    if (!compName) return colors[0];
    let hash = 0;
    for (let i = 0; i < compName.length; i++) {
      hash = compName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % colors.length;
    return colors[idx];
  };

  const scheme = getPlaceholderColor(name);
  const initials = getInitials(name);
  const showImage = Boolean(src && !hasError);

  const containerStyle = {
    width: typeof size === 'number' ? `${size}px` : size,
    height: typeof size === 'number' ? `${size}px` : size,
    borderRadius,
    backgroundColor: showImage ? '#FFFFFF' : scheme.bg,
    border: `1px solid ${showImage ? '#E2E8F0' : scheme.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
    position: 'relative',
    ...style
  };

  if (showImage) {
    return (
      <div style={containerStyle} className={`company-logo-wrapper ${className}`}>
        <img
          src={src}
          alt={name ? `${name} logo` : 'Company logo'}
          onError={() => setHasError(true)}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            padding: '4px'
          }}
        />
      </div>
    );
  }

  // Fallback Initials / Icon
  return (
    <div
      style={containerStyle}
      className={`company-logo-placeholder ${className}`}
      title={name || 'Company'}
      aria-label={name || 'Company'}
    >
      {initials ? (
        <span
          style={{
            fontSize: typeof size === 'number' ? `${Math.max(11, Math.round(size * 0.38))}px` : '0.875rem',
            fontWeight: 800,
            color: scheme.text,
            letterSpacing: '0.02em',
            userSelect: 'none'
          }}
        >
          {initials}
        </span>
      ) : (
        <Building2 size={typeof size === 'number' ? Math.round(size * 0.5) : 20} color={scheme.text} />
      )}
    </div>
  );
}
