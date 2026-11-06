import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X, RefreshCw, AlertCircle, Check } from 'lucide-react';
import CompanyLogo from './CompanyLogo';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * CompanyLogoUpload component
 * Props:
 * - currentLogoUrl: string | null (existing logo URL)
 * - companyName: string (for fallback preview)
 * - onLogoChange: function({ file, dataUrl, removed })
 * - disabled: boolean
 */
export default function CompanyLogoUpload({
  currentLogoUrl = null,
  companyName = 'Company',
  onLogoChange,
  disabled = false
}) {
  const [previewUrl, setPreviewUrl] = useState(currentLogoUrl);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState('');
  const [isRemoved, setIsRemoved] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef(null);

  // Sync if prop changes externally
  React.useEffect(() => {
    if (!isRemoved && currentLogoUrl !== undefined) {
      setPreviewUrl(currentLogoUrl);
    }
  }, [currentLogoUrl, isRemoved]);

  const validateAndProcessFile = (file) => {
    setError('');

    if (!file) return;

    // 1. File Type validation
    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      setError('Invalid format. Please upload a PNG, JPG, JPEG, or WEBP image.');
      return;
    }

    // 2. File Size validation
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setError(`File is too large (${sizeMb} MB). Maximum allowed size is 5 MB.`);
      return;
    }

    // Read as Base64 data URL for instant client preview
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setPreviewUrl(dataUrl);
      setIsRemoved(false);
      setFileName(file.name);
      if (typeof onLogoChange === 'function') {
        onLogoChange({
          file,
          dataUrl,
          filename: file.name,
          removed: false
        });
      }
    };
    reader.onerror = () => {
      setError('Failed to read the image file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setPreviewUrl(null);
    setIsRemoved(true);
    setFileName('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (typeof onLogoChange === 'function') {
      onLogoChange({
        file: null,
        dataUrl: null,
        filename: null,
        removed: true
      });
    }
  };

  const triggerFilePicker = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      {/* Label and Optional Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1E293B' }}>
          Company Logo <span style={{ fontSize: '0.71875rem', fontWeight: 600, color: '#64748B' }}>(Optional)</span>
        </label>
        <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
          PNG, JPG, WEBP • Max 5MB
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
        disabled={disabled}
      />

      {/* Main Upload / Preview Container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!previewUrl ? triggerFilePicker : undefined}
        style={{
          border: isDragOver
            ? '2px dashed #4F46E5'
            : previewUrl
            ? '1.5px solid #E2E8F0'
            : '1.5px dashed #CBD5E1',
          backgroundColor: isDragOver ? '#EEF2FF' : '#F8FAFC',
          borderRadius: '14px',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          cursor: disabled ? 'not-allowed' : previewUrl ? 'default' : 'pointer',
          transition: 'all 0.15s ease'
        }}
      >
        {previewUrl ? (
          // Active Logo Preview State
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '12px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
              flexShrink: 0
            }}>
              <img
                src={previewUrl}
                alt="Selected Logo Preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain'
                }}
              />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {fileName || 'Company Logo Selected'}
                </span>
                <span style={{
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  color: '#059669',
                  backgroundColor: '#ECFDF5',
                  padding: '2px 6px',
                  borderRadius: '999px'
                }}>
                  Ready
                </span>
              </div>
              <p style={{ fontSize: '0.71875rem', color: '#64748B', marginTop: '2px' }}>
                Click replace to pick a different file or remove to use default initials.
              </p>
            </div>

            {/* Action Buttons: Replace & Remove */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <button
                type="button"
                onClick={triggerFilePicker}
                disabled={disabled}
                className="btn btn-outline btn-sm"
                title="Replace selected logo"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.71875rem',
                  padding: '6px 10px'
                }}
              >
                <RefreshCw size={12} />
                <span>Replace</span>
              </button>

              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled}
                className="btn btn-outline btn-sm"
                title="Remove logo and use default initials placeholder"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.71875rem',
                  color: '#DC2626',
                  borderColor: '#FECACA',
                  padding: '6px 10px'
                }}
              >
                <X size={13} />
                <span>Remove</span>
              </button>
            </div>
          </div>
        ) : (
          // Empty State: Drag & Drop Dropzone + Default Initials Preview
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#EEF2FF',
                color: '#4F46E5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <UploadCloud size={22} />
              </div>

              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#334155' }}>
                  Choose image or drag and drop
                </div>
                <div style={{ fontSize: '0.71875rem', color: '#64748B', marginTop: '2px' }}>
                  No logo? A professional initials badge will be generated automatically.
                </div>
              </div>
            </div>

            {/* Default Placeholder Preview */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '12px', borderLeft: '1px solid #E2E8F0', flexShrink: 0 }}>
              <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Default:</span>
              <CompanyLogo src={null} name={companyName || 'Company'} size={40} borderRadius="8px" />
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: '#DC2626',
          fontSize: '0.71875rem',
          backgroundColor: '#FEF2F2',
          padding: '6px 10px',
          borderRadius: '8px'
        }}>
          <AlertCircle size={13} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

