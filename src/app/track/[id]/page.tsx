export default async function SharedTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <h1>Tracking: {id}</h1>;
}
