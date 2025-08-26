import React from 'react';
import './SkeletonLoader.css';

// Base skeleton component
const Skeleton = ({ width = '100%', height = '1rem', className = '', animated = true }) => {
  return (
    <div 
      className={`skeleton ${animated ? 'skeleton-animated' : ''} ${className}`}
      style={{ width, height }}
    />
  );
};

// Note card skeleton
export const NoteCardSkeleton = () => {
  return (
    <div className="note-card-skeleton">
      <div className="skeleton-header">
        <Skeleton height="1.5rem" width="70%" />
        <Skeleton height="0.875rem" width="30%" />
      </div>
      <div className="skeleton-content">
        <Skeleton height="1rem" width="100%" />
        <Skeleton height="1rem" width="85%" />
        <Skeleton height="1rem" width="60%" />
      </div>
      <div className="skeleton-actions">
        <Skeleton height="2rem" width="4rem" />
        <Skeleton height="2rem" width="4rem" />
      </div>
    </div>
  );
};

// Notes list skeleton
export const NotesListSkeleton = ({ count = 6 }) => {
  return (
    <div className="notes-skeleton-grid">
      {Array.from({ length: count }, (_, index) => (
        <NoteCardSkeleton key={index} />
      ))}
    </div>
  );
};

// Form skeleton
export const FormSkeleton = () => {
  return (
    <div className="form-skeleton">
      <div className="form-field-skeleton">
        <Skeleton height="1rem" width="20%" />
        <Skeleton height="2.5rem" width="100%" />
      </div>
      <div className="form-field-skeleton">
        <Skeleton height="1rem" width="15%" />
        <Skeleton height="8rem" width="100%" />
      </div>
      <div className="form-actions-skeleton">
        <Skeleton height="2.5rem" width="6rem" />
        <Skeleton height="2.5rem" width="8rem" />
      </div>
    </div>
  );
};

// Header skeleton
export const HeaderSkeleton = () => {
  return (
    <div className="header-skeleton">
      <Skeleton height="2rem" width="8rem" />
      <div className="header-actions-skeleton">
        <Skeleton height="2rem" width="6rem" />
        <Skeleton height="2rem" width="2rem" className="skeleton-circle" />
      </div>
    </div>
  );
};

// Page skeleton
export const PageSkeleton = ({ showHeader = true, children }) => {
  return (
    <div className="page-skeleton">
      {showHeader && <HeaderSkeleton />}
      <div className="page-content-skeleton">
        {children}
      </div>
    </div>
  );
};

export default Skeleton;