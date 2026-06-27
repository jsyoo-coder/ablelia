export type Product = {
  title: string;
  link: string;
  image: string;
  lprice: string;
  mallName: string;
  brand: string;
  category2: string;
};

export default function ProductCard({
  product, isNew, onSelect,
}: {
  product: Product; isNew?: boolean; onSelect?: (p: Product) => void;
}) {
  const title = product.title.replace(/<[^>]+>/g, "");
  const price = product.lprice ? Number(product.lprice).toLocaleString() : null;
  const label = product.brand || product.mallName || "";

  function handleClick(e: React.MouseEvent) {
    if (onSelect) { e.preventDefault(); onSelect(product); }
  }

  return (
    <a
      href={product.link}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="group block mb-3"
    >
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="relative overflow-hidden rounded-3xl m-2 mb-0 bg-[#EDE6DA]">
          {product.image && (
            <img src={product.image} alt={title} className="w-full h-auto block" loading="lazy" />
          )}
          {isNew && (
            <div className="absolute top-2 left-2 bg-[#FF3D7F] text-white text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wide">
              NEW IN
            </div>
          )}
        </div>
        <div className="px-3 py-2.5">
          {label && (
            <p className="text-[10px] text-gray-400 uppercase tracking-wider truncate mb-0.5">{label}</p>
          )}
          <p className="text-xs font-semibold leading-tight line-clamp-2 text-[#1A1A1A] mb-1">{title}</p>
          {price && <p className="text-sm font-bold text-[#FF3D7F]">{price}원</p>}
        </div>
      </div>
    </a>
  );
}
