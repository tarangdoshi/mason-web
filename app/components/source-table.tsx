import type { EvidenceSource } from "../../content/evidence/types";

type SourceTableProps = {
  sources: EvidenceSource[];
};

export default function SourceTable({ sources }: SourceTableProps) {
  if (sources.length === 0) {
    return <p className="emptyText">No evidence sources available.</p>;
  }

  return (
    <div className="sourceTableWrap">
      <table className="sourceTable">
        <thead>
          <tr>
            <th>Source</th>
            <th>Publisher</th>
            <th>Scope</th>
            <th>Quality</th>
            <th>Published</th>
            <th>Last Verified</th>
          </tr>
        </thead>
        <tbody>
          {sources.map((source) => (
            <tr key={source.id}>
              <td>
                <a href={source.url} target="_blank" rel="noreferrer">
                  {source.title}
                </a>
              </td>
              <td>{source.publisher}</td>
              <td>{source.scope}</td>
              <td>{source.quality}</td>
              <td>{source.publishedAt}</td>
              <td>{source.lastVerifiedAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
