import styled, { keyframes, css } from "styled-components";
import { ExecutionStatus } from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/types.ts";

const pulseEye = keyframes`
  0% {
    r: 2.5;
  }
  100% {
    r: 5;
  }
`;

const bounce = keyframes`
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(-5px);
  }
`;

const pulseLeft = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.6); }
`;

const pulseRight = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.6); }
`;

export const StyledRobot = styled.svg<{ $status: ExecutionStatus; $variant: number }>`
  transition: all 0.3s ease;

  .hover-inspector-eye {
    fill: #555;
    stroke: none;
    transition: all 0.2s;
  }

  ${({ $status, $variant }) => {
    switch ($status) {
      case ExecutionStatus.ERROR:
        return css`
          .hover-inspector-eye {
            display: none; /* сховати кружки */
          }
          .hover-inspector-error-eye {
            stroke: red;
            stroke-width: 2.5;
            stroke-linecap: round;
          }
        `;
      case ExecutionStatus.PAUSED:
        return css`
          .hover-inspector-eye {
            fill: #999;
            transform-origin: center;
          }

          .hover-inspector-eye.hover-inspector-left {
            animation: ${pulseLeft} 2s infinite;
            animation-delay: 0s;
          }

          .hover-inspector-eye.hover-inspector-right {
            animation: ${pulseRight} 2s infinite;
            animation-delay: 1s;
          }
        `;
      case ExecutionStatus.RUNNING:
        switch ($variant) {
          case 0:
            return css`
              .hover-inspector-eye.hover-inspector-left {
                animation: ${pulseEye} 1s infinite alternate;
              }

              .hover-inspector-eye.hover-inspector-right {
                animation: ${pulseEye} 1s infinite alternate 0.5s;
              }
            `;
          case 1:
            return css`
              .hover-inspector-eye {
                animation: ${bounce} 0.6s infinite alternate;
              }
            `;
        }
    }
  }}
`;
