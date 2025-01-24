import React, { useState, useMemo, useCallback, createContext, useContext } from 'react';
import { FixedSizeList as List } from 'react-window';
import PropTypes from 'prop-types';

// Contexts for Compound Components
const DataGridContext = createContext();
const DataGridColumnContext = createContext();

export const DataGrid = ({ data, defaultSort, children, onSort, onFilter, onRowSelect }) => {
  const [sort, setSort] = useState(defaultSort || {});
  const [filters, setFilters] = useState({});
  const [selectedRows, setSelectedRows] = useState(new Set());

  const sortedFilteredData = useMemo(() => {
    let filteredData = [...data];

    // Apply Filters
    Object.entries(filters).forEach(([field, filterFn]) => {
      if (filterFn) {
        filteredData = filteredData.filter(filterFn);
      }
    });

    // Apply Sorting
    if (sort.field) {
      filteredData.sort((a, b) => {
        const aValue = a[sort.field];
        const bValue = b[sort.field];
        const direction = sort.direction === 'asc' ? 1 : -1;
        return aValue > bValue ? direction : aValue < bValue ? -direction : 0;
      });
    }

    return filteredData;
  }, [data, sort, filters]);

  const handleSort = useCallback(
    (field) => {
      const direction = sort.field === field && sort.direction === 'asc' ? 'desc' : 'asc';
      const newSort = { field, direction };
      setSort(newSort);
      if (onSort) onSort(newSort);
    },
    [sort, onSort]
  );

  const handleFilter = useCallback(
    (field, filterFn) => {
      const newFilters = { ...filters, [field]: filterFn };
      setFilters(newFilters);
      if (onFilter) onFilter(newFilters);
    },
    [filters, onFilter]
  );

  const handleRowSelect = useCallback(
    (row) => {
      const newSelectedRows = new Set(selectedRows);
      if (newSelectedRows.has(row)) {
        newSelectedRows.delete(row);
      } else {
        newSelectedRows.add(row);
      }
      setSelectedRows(newSelectedRows);
      if (onRowSelect) onRowSelect([...newSelectedRows]);
    },
    [selectedRows, onRowSelect]
  );

  return (
    <DataGridContext.Provider
      value={{
        data: sortedFilteredData,
        sort,
        onSort: handleSort,
        onFilter: handleFilter,
        onRowSelect: handleRowSelect,
        selectedRows,
      }}
    >
      <div className="data-grid">{children}</div>
    </DataGridContext.Provider>
  );
};

// Header Component
DataGrid.Header = ({ children }) => <div className="data-grid-header">{children}</div>;

// Column Component
DataGrid.Column = ({ field, sortable, filter, children }) => {
  const { onSort, sort, onFilter } = useContext(DataGridContext);

  const handleFilterChange = (e) => {
    if (filter) {
      const filterFn = filter(e.target.value);
      onFilter(field, filterFn);
    }
  };

  return (
    <div className="data-grid-column">
      <div
        className="column-header"
        onClick={sortable ? () => onSort(field) : undefined}
        style={{ cursor: sortable ? 'pointer' : 'default' }}
      >
        {children} {sortable && (sort.field === field ? (sort.direction === 'asc' ? '↑' : '↓') : '')}
      </div>
      {filter && <input type="text" onChange={handleFilterChange} />}
    </div>
  );
};

// Body Component
DataGrid.Body = ({ children }) => {
  const { data } = useContext(DataGridContext);

  return (
    <div className="data-grid-body">
      {data.map((row, index) => (
        React.cloneElement(children(row), { key: index, row })
      ))}
    </div>
  );
};

// Row Component
DataGrid.Row = ({ children, row }) => {
  const { onRowSelect, selectedRows } = useContext(DataGridContext);

  return (
    <div
      className={`data-grid-row ${selectedRows.has(row) ? 'selected' : ''}`}
      onClick={() => onRowSelect(row)}
    >
      {React.Children.map(children, (child) => React.cloneElement(child, { row }))}
    </div>
  );
};

// Cell Component
DataGrid.Cell = ({ field, row }) => <div className="data-grid-cell">{row[field]}</div>;

// Footer Component
DataGrid.Footer = ({ children }) => <div className="data-grid-footer">{children}</div>;

// Pagination Component
DataGrid.Pagination = () => {
  // Implement custom pagination logic if required
  return <div className="pagination">Pagination</div>;
};

DataGrid.propTypes = {
  data: PropTypes.array.isRequired,
  defaultSort: PropTypes.object,
  onSort: PropTypes.func,
  onFilter: PropTypes.func,
  onRowSelect: PropTypes.func,
};
