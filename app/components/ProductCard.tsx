type Product = {
  title: string;
  link: string;
  image: string;
  lprice: string;
  mallName: string;
  brand: string;
  category2: string;
};

export default function ProductCard({ product }: { product: Product }) {
  const title = product.title.replace(/<[^>]+>/g, "");
  const price = product.lprice ? Number(product.lprice).toLocaleString() : "-";

  return (
    <a
      href={product.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="aspect-square bg-gray-50 overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
            이미지 없음
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1">
        <p className="text-xs text-gray-400">{product.mallName}</p>
        <p className="text-sm font-medium leading-snug line-clamp-2">{title}</p>
        <p className="text-base font-bold mt-1">{price}원</p>
      </div>
    </a>
  );
}
