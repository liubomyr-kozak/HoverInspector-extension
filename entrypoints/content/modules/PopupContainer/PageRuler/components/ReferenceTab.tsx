import React from "react";
import styled from "styled-components";
import { Collapse } from "antd";
import { tokens } from "@entrypoints/shared/styles/tokens";
import { REFERENCE_SECTIONS } from "../data/references";
import { unitRows } from "../utils/viewport";
import { ExternalLink } from "../PageRuler.styled";
import type { ReferenceRow, ViewportInfo } from "../types";

interface ReferenceTabProps {
  info: ViewportInfo;
}

const Rows = styled.dl`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  column-gap: 12px;

  dt {
    font-size: ${tokens.font.size.sm}px;
    color: ${tokens.color.text};
  }
  dd {
    margin: 0;
    font-size: ${tokens.font.size.sm}px;
    font-weight: 600;
    color: ${tokens.color.text};
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  dd + dd {
    grid-column: 1 / -1;
    font-size: ${tokens.font.size.xs}px;
    font-weight: 400;
    line-height: 1.45;
    color: ${tokens.color.textMuted};
    text-align: left;
  }
`;

const RowList: React.FC<{ rows: ReferenceRow[] }> = ({ rows }) => (
  <Rows>
    {rows.map(({ label, value, note }) => (
      <Row key={label}>
        <dt>{label}</dt>
        <dd>{value}</dd>
        {note && <dd>{note}</dd>}
      </Row>
    ))}
  </Rows>
);

export const ReferenceTab: React.FC<ReferenceTabProps> = ({ info }) => {
  const items = [
    {
      key: "units",
      label: "CSS units on this page",
      children: <RowList rows={unitRows(info).map(([label, value]) => ({ label, value }))} />,
    },
    ...REFERENCE_SECTIONS.map((section) => ({
      key: section.id,
      label: section.title,
      children: (
        <>
          <RowList rows={section.rows} />
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3">
            {section.sources.map((source) => (
              <ExternalLink key={source.url} href={source.url}>
                {source.label}
              </ExternalLink>
            ))}
          </div>
        </>
      ),
    })),
  ];

  return <Collapse size="small" defaultActiveKey={["units"]} items={items} />;
};
