// app/survey/layout.tsx
export default function SurveyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="survey-layout-container">
      {children}
    </div>
  );
}