export default function BoardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="animate-fadeIn">{children}</div>;
}
