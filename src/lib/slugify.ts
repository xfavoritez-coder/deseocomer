export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9\s-]/g, "") // remove special chars
    .replace(/\s+/g, "-") // spaces to dashes
    .replace(/-+/g, "-") // collapse dashes
    .replace(/^-|-$/g, "") // trim dashes
    .slice(0, 60); // max length
}

export function makeLocalSlug(nombre: string, comuna?: string): string {
  const parts = [nombre];
  if (comuna) parts.push(comuna);
  return slugify(parts.join(" "));
}

export function makeConcursoSlug(premio: string, localNombre: string): string {
  return slugify(`${premio} ${localNombre}`);
}
