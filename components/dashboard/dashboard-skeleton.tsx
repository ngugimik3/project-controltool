export function DashboardSkeleton() {
  return (
    <div className="dash" aria-busy="true" aria-label="Loading dashboard">
      <div className="dash-head">
        <div style={{ flex: 1 }}>
          <div className="sk" style={{ width: 190, height: 20, marginBottom: 8 }} />
          <div className="sk" style={{ width: 280, height: 13 }} />
        </div>
        <div className="sk" style={{ width: 210, height: 34, borderRadius: 999 }} />
      </div>

      <div className="kpi-row">
        {Array.from({ length: 5 }, (_, index) => (
          <div className="kpi-card" key={index}>
            <div className="kpi-card-head">
              <div className="sk" style={{ width: 34, height: 34, borderRadius: 9 }} />
              <div className="sk" style={{ width: 72, height: 12 }} />
            </div>
            <div className="sk" style={{ width: 64, height: 30, margin: "10px 0 10px" }} />
            <div className="sk" style={{ width: 120, height: 12 }} />
            <div className="sk" style={{ width: "100%", height: 30, marginTop: 12 }} />
          </div>
        ))}
      </div>

      <div className="dash-grid">
        <div className="chart-card">
          <div className="sk" style={{ width: 120, height: 14, marginBottom: 14 }} />
          <div className="sk" style={{ width: "100%", height: 220, borderRadius: "50%" }} />
        </div>
        <div className="chart-card span-2">
          <div className="sk" style={{ width: 160, height: 14, marginBottom: 14 }} />
          <div className="sk" style={{ width: "100%", height: 280 }} />
        </div>
        <div className="chart-card">
          <div className="sk" style={{ width: 130, height: 14, marginBottom: 14 }} />
          <div className="sk" style={{ width: "100%", height: 260 }} />
        </div>
        <div className="chart-card span-2">
          <div className="sk" style={{ width: 150, height: 14, marginBottom: 14 }} />
          <div className="sk" style={{ width: "100%", height: 220 }} />
        </div>
      </div>
    </div>
  );
}
