import { formatDate } from "@/lib/utils";
import type { Comment } from "@/types/task.types";

export function CommentThread({ comments }: { comments: Comment[] }) {
  if (comments.length === 0) {
    return <p className="text-sm text-slate-500">No comments yet.</p>;
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4" key={comment.id}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-900">{comment.author.name}</p>
            <p className="text-xs text-slate-500">{formatDate(comment.createdAt)}</p>
          </div>
          <p className="mt-2 text-sm text-slate-700">{comment.text}</p>
        </div>
      ))}
    </div>
  );
}
