import React from "react";
import styled from "styled-components";
import { tokens } from "@entrypoints/shared/styles/tokens";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  text-align: center;
  color: ${tokens.color.textMuted};
`;

const Icon = styled.div`
  margin-bottom: 12px;
  color: #9ca3af;
  line-height: 0;

  svg {
    width: 40px;
    height: 40px;
  }
`;

const Title = styled.h3`
  margin: 0 0 4px;
  font-size: ${tokens.font.size.md}px;
  font-weight: 600;
  color: ${tokens.color.text};
`;

const Description = styled.p`
  margin: 0;
  max-width: 320px;
  font-size: ${tokens.font.size.sm}px;
  line-height: 1.5;
`;

const Action = styled.div`
  margin-top: 12px;
`;

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** A button or link that resolves the empty state */
  action?: React.ReactNode;
  className?: string;
}

/** The one empty state every tool uses: muted icon, short title, one line of help, optional action */
export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action, className }) => (
  <Wrapper className={className}>
    {icon && <Icon aria-hidden>{icon}</Icon>}
    <Title>{title}</Title>
    {description && <Description>{description}</Description>}
    {action && <Action>{action}</Action>}
  </Wrapper>
);
