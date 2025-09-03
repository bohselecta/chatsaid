import InteractiveCherryCard from "@/components/phase2/InteractiveCherryCard";

export default function CherryGrid({ items, onReaction, onSaveToCategory, onLike }: {
  items: any[];
  onReaction: (id: string, key: string) => void;
  onSaveToCategory: (id: string, category: string) => void;
  onLike: (id: string) => void;
}) {
  if (!items) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 py-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
        {items.map((cherry) => (
          <div key={cherry.id} data-testid="cherry-card">
            <InteractiveCherryCard
              cherry={cherry}
              onReaction={(id, key) => onReaction(id, key)}
              onSaveToCategory={(id, cat) => onSaveToCategory(id, cat)}
              onCategoryClick={() => {}}
              userSavedCategories={[]}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
