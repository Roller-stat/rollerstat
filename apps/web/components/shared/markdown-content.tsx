interface MarkdownContentProps {
  markdown: string;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderMarkdownToHtml(markdown: string): string {
  const escaped = escapeHtml(markdown || '');
  const blocks = escaped
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks
    .map((block) => {
      if (block.startsWith('### ')) {
        return `<h3>${block.slice(4)}</h3>`;
      }

      if (block.startsWith('## ')) {
        return `<h2>${block.slice(3)}</h2>`;
      }

      if (block.startsWith('# ')) {
        return `<h1>${block.slice(2)}</h1>`;
      }

      const listLines = block.split('\n').filter((line) => line.startsWith('- '));
      if (listLines.length > 0 && listLines.length === block.split('\n').length) {
        const items = listLines
          .map((line) => `<li>${line.slice(2)}</li>`)
          .join('');
        return `<ul>${items}</ul>`;
      }

      const inline = block
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<em>$2</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
        .replace(/\n/g, '<br />');

      return `<p>${inline}</p>`;
    })
    .join('');
}

export function MarkdownContent({ markdown }: MarkdownContentProps) {
  const html = renderMarkdownToHtml(markdown);

  return (
    <div
      className="markdown-content prose prose-zinc max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
