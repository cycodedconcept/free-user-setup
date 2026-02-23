import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage = 10,
  totalItems = 0,
  maxVisiblePages = 5,
  showItemInfo = true,
  disabled = false,
  className = '',
  buttonClassName = '',
  activeButtonClassName = ''
}) => {
  // Calculate pagination info
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  const handlePageChange = (page) => {
    if (!disabled && page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  // Show item info even if only 1 page
  if (totalPages <= 1 && !showItemInfo) {
    return null;
  }

  return (
    <div className={`d-flex align-items-center justify-content-between mt-4 ${className}`}>
      {showItemInfo && totalItems > 0 && (
        <small style={{ fontSize: '13px', color: '#78716C' }}>
          Showing {startItem} to {endItem} of {totalItems} items
        </small>
      )}

      {totalPages > 1 && (
      <nav aria-label="pagination">
        <ul
          className="pagination mb-0"
          style={{
            display: 'flex',
            gap: '4px',
            listStyle: 'none',
            padding: 0,
            margin: 0
          }}
        >
          {/* Previous Button */}
          <li>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={disabled || currentPage === 1}
              className={`${buttonClassName}`}
              style={{
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                background: '#fff',
                cursor: currentPage === 1 || disabled ? 'not-allowed' : 'pointer',
                color: currentPage === 1 || disabled ? '#ccc' : '#333',
                opacity: currentPage === 1 || disabled ? 0.5 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              <FontAwesomeIcon icon={faChevronLeft} style={{ fontSize: '12px' }} />
            </button>
          </li>

          {/* First page and ellipsis */}
          {pageNumbers[0] > 1 && (
            <>
              <li>
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={disabled}
                  className={buttonClassName}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    background: '#fff',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    color: '#333',
                    transition: 'all 0.2s ease'
                  }}
                >
                  1
                </button>
              </li>
              {pageNumbers[0] > 2 && (
                <li style={{ padding: '8px 4px', color: '#666' }}>...</li>
              )}
            </>
          )}

          {/* Page numbers */}
          {pageNumbers.map((page) => (
            <li key={page}>
              <button
                onClick={() => handlePageChange(page)}
                disabled={disabled}
                className={currentPage === page ? activeButtonClassName : buttonClassName}
                style={{
                  padding: '8px 12px',
                  border: currentPage === page ? '1px solid #0273F9' : '1px solid #ddd',
                  borderRadius: '6px',
                  background: currentPage === page ? '#0273F9' : '#fff',
                  color: currentPage === page ? '#fff' : '#333',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  fontWeight: currentPage === page ? '600' : '400',
                  transition: 'all 0.2s ease',
                  opacity: disabled ? 0.5 : 1
                }}
              >
                {page}
              </button>
            </li>
          ))}

          {/* Last page and ellipsis */}
          {pageNumbers[pageNumbers.length - 1] < totalPages && (
            <>
              {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                <li style={{ padding: '8px 4px', color: '#666' }}>...</li>
              )}
              <li>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={disabled}
                  className={buttonClassName}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    background: '#fff',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    color: '#333',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {totalPages}
                </button>
              </li>
            </>
          )}

          {/* Next Button */}
          <li>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={disabled || currentPage === totalPages}
              className={buttonClassName}
              style={{
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                background: '#fff',
                cursor: currentPage === totalPages || disabled ? 'not-allowed' : 'pointer',
                color: currentPage === totalPages || disabled ? '#ccc' : '#333',
                opacity: currentPage === totalPages || disabled ? 0.5 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: '12px' }} />
            </button>
          </li>
        </ul>
      </nav>
      )}
    </div>
  );
};

export default Pagination;
