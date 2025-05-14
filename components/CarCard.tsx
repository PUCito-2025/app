interface CarCardProps {
  title: string;
  price: string;
  platform: string;
  km: string;
  fuel: string;
}

export default function CarCard({ title, price, platform, km, fuel }: CarCardProps) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="mb-4 h-32 rounded-md bg-gray-200" />
      <h3 className="mb-1 font-semibold">{title}</h3>
      <p className="mb-2 text-sm text-gray-600">
        {price} •{platform}
      </p>
      <p className="text-sm text-gray-500">
        {km} •{fuel}
      </p>
      <button className="mt-4 w-full rounded-md bg-blue-600 py-2 text-sm text-white hover:bg-blue-700" type="button">
        View Details
      </button>
    </div>
  );
}
