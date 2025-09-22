interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="survey-container">
      <div className="survey-card">
        <div className="survey-header">
          <div className="logo">
            <h2>ADHDAdvisor.org</h2>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};
