function ReportDownload() {
  const handleDownload = () => {
    window.open('http://localhost:8000/inventory/report/', '_blank');
  };

  return (
    <div>
      <h2>Inventory Report</h2>
      <button onClick={handleDownload}>Download CSV</button>
    </div>
  );
}

export default ReportDownload;
