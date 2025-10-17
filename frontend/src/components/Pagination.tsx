import React from "react";

interface PaginationProps {
  page: number;
  setPage: (page: number) => void;
  limit: number;
  total: number;
}

const Pagination: React.FC<PaginationProps> = ({ page, setPage, limit, total }) => {
  const totalPages = Math.ceil(total / limit);

  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (Math.abs(i - page) <= 2) {
        pages.push(i);
      }
    }
    return pages;
  };

  return (
    <div className="flex justify-between items-center mt-4 flex-wrap gap-2">
      {/* Page size info */}
      <div>
        Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} accounts
      </div>

      {/* Pagination buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setPage(1)}
          disabled={page === 1}
          className="px-2 py-1 border rounded disabled:opacity-50"
        >
          {"<<"}
        </button>
        <button
          onClick={() => setPage(Math.max(page - 1, 1))}
          disabled={page === 1}
          className="px-2 py-1 border rounded disabled:opacity-50"
        >
          Prev
        </button>

        {getPageNumbers().map((p) => (
          <button
            key={p}
            onClick={() => setPage(p)}
            className={`px-3 py-1 border rounded ${
              p === page ? "bg-primary text-white" : ""
            }`}
          >
            {p}
          </button>
        ))}

        <button
          onClick={() => setPage(Math.min(page + 1, totalPages))}
          disabled={page === totalPages}
          className="px-2 py-1 border rounded disabled:opacity-50"
        >
          Next
        </button>
        <button
          onClick={() => setPage(totalPages)}
          disabled={page === totalPages}
          className="px-2 py-1 border rounded disabled:opacity-50"
        >
          {">>"}
        </button>
      </div>
    </div>
  );
};

export default Pagination;
