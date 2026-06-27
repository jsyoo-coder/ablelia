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
  const label = product.brand || product.mallName || "";

  return (
    <a
      href={product.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group block break-inside-avoid mb-3"
    >
      <div className="relative rounded-2xl overflow-hidden bg-gray-100">
        {product.image && (
          <img
            src={product.image}
            alt={title}
            className="w-full h-auto block"
            loading="lazy"
          />
        )}
        {/* 호버 오버레이 */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 rounded-2xl" />
        {/* 저장 버튼 */}
        <button
          onClick={(e) => e.preventDefault()}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md hover:scale-110 transition-transform"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>
      <div className="pt-2 px-0.5">
        {label && <p className="text-[11px] text-gray-400 truncate">{label}</p>}
        {price && <p className="text-sm font-semibold mt-0.5">{price}원</p>}
      </div>
    </a>
  );
}
