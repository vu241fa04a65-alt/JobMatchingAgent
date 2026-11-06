import React from 'react';
import { Check, X } from 'lucide-react';

export default function StageProgressBar({
  currentStage = 1, // 1: Applied, 2: Shortlisted, 3: Interview, 4: Offer
  status = 'UNDER_REVIEW'
}) {
  const stages = [
    { id: 1, label: 'Applied' },
    { id: 2, label: 'Shortlisted' },
    { id: 3, label: 'Interview' },
    { id: 4, label: 'Offer' }
  ];

  const isRejected = status === 'NOT_SELECTED' || status === 'REJECTED';
  const isOffer = status === 'OFFER_RECEIVED' || status === 'SELECTED';

  // Calculate percentage of track completion (connecting line from circle 1 to circle 4)
  // Stage 1: 0%, Stage 2: 33.333%, Stage 3: 66.667%, Stage 4: 100%
  let progressPct = 0;
  if (isOffer || currentStage >= 4) {
    progressPct = 100;
  } else if (currentStage === 3) {
    progressPct = 66.667;
  } else if (currentStage === 2) {
    progressPct = 33.333;
  } else {
    progressPct = 0;
  }

  // Active track color
  const activeColor = isRejected ? '#EF4444' : isOffer ? '#10B981' : '#4F46E5';

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '380px', padding: '0 8px' }}>
      {/* Continuous Linear Connecting Track Line (Positioned exactly at circle vertical center) */}
      <div 
        style={{
          position: 'absolute',
          top: '11px',
          left: 'calc(100% / 8)',
          right: 'calc(100% / 8)',
          height: '3px',
          backgroundColor: '#E2E8F0',
          borderRadius: '999px',
          zIndex: 1,
          transform: 'translateY(-50%)'
        }}
      >
        {/* Active progress fill line */}
        <div 
          style={{
            height: '100%',
            width: `${progressPct}%`,
            backgroundColor: activeColor,
            borderRadius: '999px',
            transition: 'width 0.3s ease, background-color 0.3s ease'
          }}
        />
      </div>

      {/* 4 Equidistant Stage Nodes in a Uniform 4-Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', position: 'relative', zIndex: 2 }}>
        {stages.map((stage) => {
          const isDone = (currentStage > stage.id) || (isOffer && stage.id <= 4) || (currentStage === 4 && stage.id === 4 && !isRejected);
          const isCurrent = currentStage === stage.id && !isOffer;
          const isFailed = isRejected && (stage.id === currentStage || (currentStage === 1 && stage.id === 1));

          let circleBg = '#FFFFFF';
          let circleBorder = '#CBD5E1';
          let circleShadow = 'none';

          if (isFailed) {
            circleBg = '#EF4444';
            circleBorder = '#EF4444';
            circleShadow = '0 0 0 3px rgba(239, 68, 68, 0.18)';
          } else if (isDone) {
            circleBg = isOffer ? '#10B981' : '#4F46E5';
            circleBorder = isOffer ? '#10B981' : '#4F46E5';
          } else if (isCurrent) {
            circleBg = '#FFFFFF';
            circleBorder = '#4F46E5';
            circleShadow = '0 0 0 3px rgba(79, 70, 229, 0.18)';
          }

          let labelColor = '#94A3B8';
          let labelWeight = 500;
          if (isFailed) {
            labelColor = '#EF4444';
            labelWeight = 700;
          } else if (isDone || isCurrent) {
            labelColor = '#0F172A';
            labelWeight = 700;
          }

          return (
            <div 
              key={stage.id} 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                textAlign: 'center' 
              }}
            >
              {/* Node Circle (22px x 22px, perfectly centered) */}
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: circleBg,
                  border: `2px solid ${circleBorder}`,
                  boxShadow: circleShadow,
                  transition: 'all 0.25s ease',
                  flexShrink: 0
                }}
              >
                {isFailed ? (
                  <X size={11} strokeWidth={3} color="#FFFFFF" />
                ) : isDone ? (
                  <Check size={12} strokeWidth={3} color="#FFFFFF" />
                ) : isCurrent ? (
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4F46E5' }} />
                ) : (
                  <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#CBD5E1' }} />
                )}
              </div>

              {/* Node Label (Directly below circle) */}
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: labelWeight,
                  color: labelColor,
                  marginTop: '6px',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.2
                }}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
