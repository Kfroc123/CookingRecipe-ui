import { useEffect, useMemo, useState } from "react";
import { FaHistory, FaSearch } from "react-icons/fa";
import { getSearchHistory } from "../Utils/Recipes";

const parseResultCount = (jsonResult) => {
  if (!jsonResult) return 0;

  try {
    const parsed = JSON.parse(jsonResult);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
};

const formatSearchDate = (value) => {
  if (!value) return "Unknown date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

function SearchHistory() {
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getSearchHistory();
        setHistory(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Unable to load search history.");
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  const visibleHistory = useMemo(() => {
    const query = filter.trim().toLowerCase();
    if (!query) return history;

    return history.filter((item) => {
      const searchText = item?.searchText?.toLowerCase() ?? "";
      const category = item?.category?.toLowerCase() ?? "";
      return searchText.includes(query) || category.includes(query);
    });
  }, [filter, history]);

  return (
    <section className="page-container">
      <div className="section-header">
        <div>
          <h2>Search History</h2>
          <p>{visibleHistory.length} recent search(es)</p>
        </div>
      </div>

      <div className="home-toolbar">
        <label className="search-bar" htmlFor="history-search">
          <FaSearch className="search-icon" />
          <input
            id="history-search"
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter search history"
          />
        </label>
      </div>

      {loading && <div className="spinner" aria-label="Loading search history" />}

      {!loading && (
        <>
          {error ? (
            <div className="empty-state">{error}</div>
          ) : visibleHistory.length === 0 ? (
            <div className="empty-state">
              <FaHistory style={{ marginBottom: "10px" }} />
              <div>No search history yet. Search for recipes to see them here.</div>
            </div>
          ) : (
            <div className="history-list">
              {visibleHistory.map((item) => (
                <article className="history-item" key={item.id || `${item.searchText}-${item.searchDate}`}>
                  <div className="history-icon">
                    <FaHistory />
                  </div>
                  <div className="history-content">
                    <h3>{item.searchText || "Untitled search"}</h3>
                    <p>{formatSearchDate(item.searchDate)}</p>
                  </div>
                  <div className="history-meta">
                    <span>{item.category || "search"}</span>
                    <strong>{parseResultCount(item.jsonResult)} result(s)</strong>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default SearchHistory;
