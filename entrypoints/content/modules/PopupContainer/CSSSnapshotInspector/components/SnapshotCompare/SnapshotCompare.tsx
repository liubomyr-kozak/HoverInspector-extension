import React, { useState, useMemo } from "react";
import styled from "styled-components";
import {
  IconGitCompare,
  IconArrowLeft,
  IconEye,
  IconEyeOff,
  IconLayoutSidebarRightExpand,
  IconLayoutList,
  IconChevronDown,
  IconChevronUp,
  IconCode,
  IconFileText,
  IconActivity,
  IconTrendingUp,
  IconTrendingDown,
  IconEqual,
} from "@tabler/icons-react";
import { ReactDiffViewer } from "./components/TreeDiffView/components/ReactDiffViewer";
import { SnapshotCompareProps } from "./types";
import { getStylesFromSnapshot } from "./utils";
import { buildDOMTree } from "../../utils/domTreeBuilder";

// Styled Components
const CompareContainer = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 32px;
  margin: 24px;
  backdrop-filter: blur(20px);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(229, 231, 235, 0.6);
`;

const CompareHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 2px solid rgba(229, 231, 235, 0.4);
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 200ms ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  &:hover {
    background: #f9fafb;
    border-color: #d1d5db;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const TitleSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const TitleIcon = styled.div`
  background: linear-gradient(135deg, #10b981, #059669);
  padding: 16px;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
`;

const TitleContent = styled.div`
  h1 {
    font-size: 28px;
    font-weight: 700;
    background: linear-gradient(135deg, #1f2937, #374151);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0 0 8px 0;
  }

  p {
    font-size: 16px;
    font-weight: 500;
    color: #6b7280;
    margin: 0;
  }
`;

const ViewControls = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ControlButton = styled.button<{ active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 200ms ease;
  
  ${props => props.active ? `
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  ` : `
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid #e5e7eb;
    color: #374151;
    
    &:hover {
      background: #f9fafb;
      border-color: #d1d5db;
    }
  `}
`;

const StatsBar = styled.div<{ expanded: boolean }>`
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(139, 92, 246, 0.05));
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 32px;
  backdrop-filter: blur(8px);
  transition: all 300ms ease;
  
  ${props => !props.expanded && `
    padding: 16px 24px;
  `}
`;

const StatsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
`;

const StatsTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }

  .icon {
    color: #6366f1;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  margin-top: 24px;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  border: 1px solid rgba(229, 231, 235, 0.5);

  .icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &.positive {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
    }
    
    &.negative {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
    }
    
    &.neutral {
      background: linear-gradient(135deg, #6b7280, #4b5563);
      color: white;
    }
  }

  .content {
    .label {
      font-size: 12px;
      font-weight: 500;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }
    
    .value {
      font-size: 18px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 2px;
    }
    
    .change {
      font-size: 12px;
      font-weight: 500;
      
      &.positive {
        color: #059669;
      }
      
      &.negative {
        color: #dc2626;
      }
      
      &.neutral {
        color: #6b7280;
      }
    }
  }
`;

const ContentArea = styled.div`
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  border: 1px solid rgba(229, 231, 235, 0.6);
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
`;

export const SnapshotCompare: React.FC<SnapshotCompareProps> = ({ snapshotA, snapshotB, onBack }) => {
  const [splitView, setSplitView] = useState(true);
  const [showLineNumbers, setShowLineNumbers] = useState(false);
  const [isStatsExpanded, setIsStatsExpanded] = useState(true);
  const [activeView, setActiveView] = useState<'diff' | 'tree' | 'stats'>('diff');

  const stylesA = getStylesFromSnapshot(snapshotA);
  const stylesB = getStylesFromSnapshot(snapshotB);

  const { treeA, treeB } = useMemo(
    () => ({
      treeA: buildDOMTree(stylesA),
      treeB: buildDOMTree(stylesB),
    }),
    [stylesA, stylesB],
  );

  const stats = useMemo(() => {
    const totalA = snapshotA.elementCount || 0;
    const totalB = snapshotB.elementCount || 0;
    const diff = totalB - totalA;
    const changePercent = totalA > 0 ? ((Math.abs(diff) / totalA) * 100).toFixed(1) : "0";
    
    // Enhanced stats for QA/Dev analysis
    const sizeA = JSON.stringify(snapshotA).length;
    const sizeB = JSON.stringify(snapshotB).length;
    const sizeDiff = sizeB - sizeA;
    const sizeChangePercent = sizeA > 0 ? ((Math.abs(sizeDiff) / sizeA) * 100).toFixed(1) : "0";
    
    return {
      totalA,
      totalB,
      diff,
      changePercent,
      sizeA,
      sizeB,
      sizeDiff,
      sizeChangePercent,
      trend: diff > 0 ? 'increase' : diff < 0 ? 'decrease' : 'stable',
      impact: Math.abs(diff) > totalA * 0.1 ? 'high' : Math.abs(diff) > totalA * 0.05 ? 'medium' : 'low'
    };
  }, [snapshotA, snapshotB]);

  if (!treeA || !treeB) {
    return (
      <CompareContainer>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '400px',
          padding: '48px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '50%',
            padding: '24px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            marginBottom: '24px'
          }}>
            <IconGitCompare size={48} color="#9ca3af" />
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
            No Valid DOM Data
          </h3>
          <p style={{ 
            color: '#6b7280', 
            textAlign: 'center', 
            marginBottom: '24px', 
            maxWidth: '400px', 
            lineHeight: '1.5' 
          }}>
            Unable to parse snapshot data for comparison. Please ensure both snapshots contain valid DOM structure.
          </p>
          <BackButton onClick={onBack}>
            <IconArrowLeft size={16} />
            Back to Snapshots
          </BackButton>
        </div>
      </CompareContainer>
    );
  }

  return (
    <CompareContainer>
      <CompareHeader>
        <HeaderLeft>
          <BackButton onClick={onBack}>
            <IconArrowLeft size={18} />
            <span>Back</span>
          </BackButton>
          
          <TitleSection>
            <TitleIcon>
              <IconGitCompare size={28} color="white" />
            </TitleIcon>
            <TitleContent>
              <h1>Snapshot Comparison</h1>
              <p>Visual diff analysis</p>
            </TitleContent>
          </TitleSection>
        </HeaderLeft>

        <ViewControls>
          <ControlButton
            active={activeView === 'diff'}
            onClick={() => setActiveView('diff')}
          >
            <IconCode size={16} />
            Diff
          </ControlButton>
          
          <ControlButton
            active={activeView === 'stats'}
            onClick={() => setActiveView('stats')}
          >
            <IconActivity size={16} />
            Stats
          </ControlButton>

          {activeView === 'diff' && (
            <ControlButton onClick={() => setSplitView(!splitView)}>
              {splitView ? <IconLayoutSidebarRightExpand size={16} /> : <IconLayoutList size={16} />}
              {splitView ? 'Split' : 'Unified'}
            </ControlButton>
          )}
        </ViewControls>
      </CompareHeader>

      <StatsBar expanded={isStatsExpanded}>
        <StatsHeader onClick={() => setIsStatsExpanded(!isStatsExpanded)}>
          <StatsTitle>
            <IconActivity size={20} className="icon" />
            <h3>Comparison Overview</h3>
          </StatsTitle>
          {isStatsExpanded ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />}
        </StatsHeader>

        {isStatsExpanded && (
          <StatsGrid>
            <StatItem>
              <div className={`icon ${stats.diff > 0 ? 'positive' : stats.diff < 0 ? 'negative' : 'neutral'}`}>
                {stats.diff > 0 ? <IconTrendingUp size={20} /> : 
                 stats.diff < 0 ? <IconTrendingDown size={20} /> : 
                 <IconEqual size={20} />}
              </div>
              <div className="content">
                <div className="label">Element Change</div>
                <div className="value">
                  {stats.diff > 0 ? '+' : ''}{stats.diff}
                </div>
                <div className={`change ${stats.diff > 0 ? 'positive' : stats.diff < 0 ? 'negative' : 'neutral'}`}>
                  {stats.changePercent}% change
                </div>
              </div>
            </StatItem>

            <StatItem>
              <div className={`icon ${stats.sizeDiff > 0 ? 'negative' : stats.sizeDiff < 0 ? 'positive' : 'neutral'}`}>
                <IconFileText size={20} />
              </div>
              <div className="content">
                <div className="label">Size Impact</div>
                <div className="value">
                  {stats.sizeDiff > 0 ? '+' : ''}{(stats.sizeDiff / 1024).toFixed(1)} KB
                </div>
                <div className={`change ${stats.sizeDiff > 0 ? 'negative' : stats.sizeDiff < 0 ? 'positive' : 'neutral'}`}>
                  {stats.sizeChangePercent}% change
                </div>
              </div>
            </StatItem>

            <StatItem>
              <div className={`icon ${
                stats.impact === 'high' ? 'negative' : 
                stats.impact === 'medium' ? 'neutral' : 'positive'
              }`}>
                <IconActivity size={20} />
              </div>
              <div className="content">
                <div className="label">QA Impact</div>
                <div className="value">{stats.impact.toUpperCase()}</div>
                <div className={`change ${
                  stats.impact === 'high' ? 'negative' : 
                  stats.impact === 'medium' ? 'neutral' : 'positive'
                }`}>
                  {stats.impact === 'high' ? 'Thorough testing needed' :
                   stats.impact === 'medium' ? 'Moderate testing' : 'Low risk changes'}
                </div>
              </div>
            </StatItem>
          </StatsGrid>
        )}
      </StatsBar>

      <ContentArea>
        {activeView === 'diff' ? (
          <ReactDiffViewer
            treeA={treeA}
            treeB={treeB}
            splitView={splitView}
            displaySingleLineNumbers={showLineNumbers}
          />
        ) : (
          <div style={{ padding: '24px' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '24px' 
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid rgba(229, 231, 235, 0.6)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
              }}>
                <h4 style={{ 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  color: '#1f2937', 
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <IconFileText size={18} color="#6366f1" />
                  Element Analysis
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f3f4f6' }}>
                    <span style={{ color: '#6b7280' }}>Before</span>
                    <span style={{ fontWeight: '600' }}>{stats.totalA} elements</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f3f4f6' }}>
                    <span style={{ color: '#6b7280' }}>After</span>
                    <span style={{ fontWeight: '600' }}>{stats.totalB} elements</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280' }}>Net Change</span>
                    <span style={{ 
                      fontWeight: '600',
                      color: stats.diff > 0 ? '#059669' : stats.diff < 0 ? '#dc2626' : '#6b7280'
                    }}>
                      {stats.diff > 0 ? '+' : ''}{stats.diff}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid rgba(229, 231, 235, 0.6)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
              }}>
                <h4 style={{ 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  color: '#1f2937', 
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <IconActivity size={18} color="#8b5cf6" />
                  Performance Impact
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f3f4f6' }}>
                    <span style={{ color: '#6b7280' }}>Size Before</span>
                    <span style={{ fontWeight: '600' }}>{(stats.sizeA / 1024).toFixed(1)} KB</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f3f4f6' }}>
                    <span style={{ color: '#6b7280' }}>Size After</span>
                    <span style={{ fontWeight: '600' }}>{(stats.sizeB / 1024).toFixed(1)} KB</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280' }}>Size Change</span>
                    <span style={{ 
                      fontWeight: '600',
                      color: stats.sizeDiff > 0 ? '#dc2626' : stats.sizeDiff < 0 ? '#059669' : '#6b7280'
                    }}>
                      {stats.sizeDiff > 0 ? '+' : ''}{(stats.sizeDiff / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </ContentArea>
    </CompareContainer>
  );
};
