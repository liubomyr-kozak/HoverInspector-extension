import styled from "styled-components";
import { tokens } from "@entrypoints/shared/styles/tokens";

// Section heading, same size as the other tools' section headings
export const SectionTitle = styled.h3`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: ${tokens.font.size.md}px;
  font-weight: 600;
  color: ${tokens.color.text};
  margin: 0 0 8px;
`;

// Label above value, two columns: stays readable down to the 320px panel
export const InfoList = styled.dl`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 12px;
  margin: 0;

  div {
    min-width: 0;
  }
  dt {
    font-size: ${tokens.font.size.xs}px;
    color: ${tokens.color.textMuted};
  }
  dd {
    margin: 0;
    font-size: ${tokens.font.size.sm}px;
    font-weight: 600;
    color: ${tokens.color.text};
    font-variant-numeric: tabular-nums;
    overflow-wrap: anywhere;
  }
`;

export const Hint = styled.p`
  margin: 0;
  font-size: ${tokens.font.size.xs}px;
  line-height: 1.45;
  color: ${tokens.color.textMuted};
`;

export const Code = styled.code`
  font-family: ${tokens.font.mono};
  font-size: ${tokens.font.size.xs}px;
  color: ${tokens.color.textSecondary};
  overflow-wrap: anywhere;
`;

export const ExternalLink = styled.a.attrs({ target: "_blank", rel: "noreferrer" })`
  font-size: ${tokens.font.size.xs}px;
  color: ${tokens.color.primary};
  text-decoration: underline;
  text-underline-offset: 2px;

  &:hover {
    color: ${tokens.color.primaryHover};
  }
`;

export const Note = styled.div`
  padding: 6px 8px;
  font-size: ${tokens.font.size.xs}px;
  line-height: 1.4;
  color: ${tokens.color.warning};
  background: ${tokens.color.warningBg};
  border-left: 3px solid ${tokens.color.warning};
  border-radius: ${tokens.radius.sm}px;
`;
