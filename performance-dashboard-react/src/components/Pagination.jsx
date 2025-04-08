import React from 'react';

const Pagination = ({ totalPages, currentPage, setCurrentPage }) => {
  const maxVisiblePages = 5; // Number of visible pages around the current page
  const ellipsisThreshold = 2; // Show ellipsis if pages are skipped

  // Function to create a pagination button
  const createPageButton = (page, isActive = false) => (
    <button
      key={page}
      className={`pagination-button ${isActive ? 'active' : ''}`}
      onClick={() => setCurrentPage(page)}
    >
      {page}
    </button>
  );

  const renderEllipsis = (key) => (
    <span key={`ellipsis-${key}`}>...</span>
  );

  const paginationItems = [];

  // Always show the first page
  paginationItems.push(createPageButton(1, currentPage === 1));

  // Show ellipsis if current page is far from the first page
  if (currentPage > ellipsisThreshold + 1) {
    paginationItems.push(renderEllipsis('left'));
  }

  // Show pages around the current page
  const startPage = Math.max(2, currentPage - Math.floor(maxVisiblePages / 2));
  const endPage = Math.min(
    totalPages - 1,
    currentPage + Math.floor(maxVisiblePages / 2)
  );

  for (let i = startPage; i <= endPage; i++) {
    paginationItems.push(createPageButton(i, i === currentPage));
  }

  // Show ellipsis if current page is far from the last page
  if (currentPage < totalPages - ellipsisThreshold) {
    paginationItems.push(renderEllipsis('right'));
  }

  // Always show the last page if there's more than one page
  if (totalPages > 1) {
    paginationItems.push(createPageButton(totalPages, currentPage === totalPages));
  }

  return <div className="pagination">{paginationItems}</div>;
};

export default Pagination;