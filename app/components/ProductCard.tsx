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
  const price = product.lprice ? Number(product.lprice).toLocaleString() : null;

  return (
    <a
      href={product.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group block break-inside-avoid mb-2.5"
    >
      <div className="rounded-xl overflow-hidden bg-gray-50">
        {product.image && (
          <img
            src={product.image}
            alt={title}
            className="w-full h-auto block group-hover:opacity-90 transition-opacity"
          />
        )}
      </div>
      <div className="pt-1.5 pb-1 px-0.5">
        {product.brand && (
          <p className="text-[11px] text-gray-400 truncate">{product.brand}</p>
        )}
        {price && <p className="text-sm font-semibold">{price}원</p>}
      </div>
    </a>
  );
}
