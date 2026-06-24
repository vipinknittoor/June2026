export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function isOverdue(endDate: string): boolean {
  return new Date(endDate).getTime() < Date.now();
}

export function getAttachmentUrl(fileUrl: string): string {
  if (!fileUrl) return "";
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
    return fileUrl;
  }
  const uploadsUrl = process.env.NEXT_PUBLIC_UPLOADS_URL || "";
  if (fileUrl.startsWith("/uploads")) {
    const baseUrl = uploadsUrl.endsWith("/uploads") ? uploadsUrl.slice(0, -8) : uploadsUrl;
    return `${baseUrl}${fileUrl}`;
  }
  return `${uploadsUrl}/${fileUrl.replace(/^\//, "")}`;
}

