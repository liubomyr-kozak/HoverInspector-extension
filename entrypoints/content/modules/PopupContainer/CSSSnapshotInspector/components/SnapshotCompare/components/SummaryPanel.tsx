import React from "react";
import { IconInfoCircle } from "@tabler/icons-react";
import { Added, Changed, Removed } from "../../../CSSSnapshotInspector.styled";
import { SummaryPanelProps } from "../types";

/**
 * Component for displaying a summary of changes between snapshots
 */
export const SummaryPanel: React.FC<SummaryPanelProps> = ({ comparison }) => {
  return (
    <div
      style={{
        marginBottom: "16px",
        padding: "16px",
        backgroundColor: "#f8f9fa",
        borderRadius: "8px",
        border: "1px solid #dadce0",
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
      }}
    >
      <div style={{ 
        fontWeight: 600, 
        marginBottom: "12px", 
        fontSize: "16px",
        color: "#202124",
        display: "flex",
        alignItems: "center",
        gap: "8px"
      }}>
        <IconInfoCircle size={18} style={{ color: "#1a73e8" }} />
        Summary of Changes
      </div>
      
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        {/* Property changes */}
        <div style={{ 
          flex: "1 1 300px", 
          backgroundColor: "white", 
          padding: "12px", 
          borderRadius: "6px",
          border: "1px solid #e8eaed"
        }}>
          <div style={{ fontWeight: 500, marginBottom: "10px", fontSize: "14px", color: "#5f6368" }}>
            CSS Properties
          </div>
          
          {/* Added properties */}
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "12px", 
            marginBottom: "8px",
            padding: "8px",
            backgroundColor: "rgba(19, 115, 51, 0.05)",
            borderRadius: "4px"
          }}>
            <div style={{ width: "60px" }}>
              <Added style={{ fontSize: "12px", padding: "2px 6px", width: "100%", textAlign: "center" }}>Added</Added>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: "18px", color: "#137333" }}>
                {comparison.reduce(
                  (count, item) => count + item.changes.filter((c) => c.changeType === "added").length,
                  0,
                )}
              </div>
              <div style={{ fontSize: "12px", color: "#5f6368" }}>properties</div>
            </div>
            <div style={{ 
              width: "40px", 
              height: "40px", 
              borderRadius: "50%", 
              backgroundColor: "rgba(19, 115, 51, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#137333",
              fontSize: "18px",
              fontWeight: "bold"
            }}>
              +
            </div>
          </div>
          
          {/* Removed properties */}
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "12px", 
            marginBottom: "8px",
            padding: "8px",
            backgroundColor: "rgba(197, 34, 31, 0.05)",
            borderRadius: "4px"
          }}>
            <div style={{ width: "60px" }}>
              <Removed style={{ fontSize: "12px", padding: "2px 6px", width: "100%", textAlign: "center" }}>Removed</Removed>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: "18px", color: "#c5221f" }}>
                {comparison.reduce(
                  (count, item) => count + item.changes.filter((c) => c.changeType === "removed").length,
                  0,
                )}
              </div>
              <div style={{ fontSize: "12px", color: "#5f6368" }}>properties</div>
            </div>
            <div style={{ 
              width: "40px", 
              height: "40px", 
              borderRadius: "50%", 
              backgroundColor: "rgba(197, 34, 31, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#c5221f",
              fontSize: "18px",
              fontWeight: "bold"
            }}>
              -
            </div>
          </div>
          
          {/* Changed properties */}
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "12px",
            padding: "8px",
            backgroundColor: "rgba(234, 134, 0, 0.05)",
            borderRadius: "4px"
          }}>
            <div style={{ width: "60px" }}>
              <Changed style={{ fontSize: "12px", padding: "2px 6px", width: "100%", textAlign: "center" }}>Changed</Changed>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: "18px", color: "#ea8600" }}>
                {comparison.reduce(
                  (count, item) => count + item.changes.filter((c) => c.changeType === "changed").length,
                  0,
                )}
              </div>
              <div style={{ fontSize: "12px", color: "#5f6368" }}>properties</div>
            </div>
            <div style={{ 
              width: "40px", 
              height: "40px", 
              borderRadius: "50%", 
              backgroundColor: "rgba(234, 134, 0, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ea8600",
              fontSize: "18px",
              fontWeight: "bold"
            }}>
              ↻
            </div>
          </div>
        </div>
        
        {/* Element changes */}
        <div style={{ 
          flex: "1 1 300px", 
          backgroundColor: "white", 
          padding: "12px", 
          borderRadius: "6px",
          border: "1px solid #e8eaed"
        }}>
          <div style={{ fontWeight: 500, marginBottom: "10px", fontSize: "14px", color: "#5f6368" }}>
            DOM Elements
          </div>
          
          {/* Added elements */}
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "12px", 
            marginBottom: "8px",
            padding: "8px",
            backgroundColor: "rgba(19, 115, 51, 0.05)",
            borderRadius: "4px"
          }}>
            <div style={{ width: "60px", textAlign: "center", fontWeight: 500, color: "#137333" }}>
              Added
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: "18px", color: "#137333" }}>
                {comparison.filter((item) => item.changeType === "added").length}
              </div>
              <div style={{ fontSize: "12px", color: "#5f6368" }}>elements</div>
            </div>
            <div style={{ 
              width: "40px", 
              height: "40px", 
              borderRadius: "50%", 
              backgroundColor: "rgba(19, 115, 51, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#137333",
              fontSize: "18px",
              fontWeight: "bold"
            }}>
              +
            </div>
          </div>
          
          {/* Removed elements */}
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "12px", 
            marginBottom: "8px",
            padding: "8px",
            backgroundColor: "rgba(197, 34, 31, 0.05)",
            borderRadius: "4px"
          }}>
            <div style={{ width: "60px", textAlign: "center", fontWeight: 500, color: "#c5221f" }}>
              Removed
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: "18px", color: "#c5221f" }}>
                {comparison.filter((item) => item.changeType === "removed").length}
              </div>
              <div style={{ fontSize: "12px", color: "#5f6368" }}>elements</div>
            </div>
            <div style={{ 
              width: "40px", 
              height: "40px", 
              borderRadius: "50%", 
              backgroundColor: "rgba(197, 34, 31, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#c5221f",
              fontSize: "18px",
              fontWeight: "bold"
            }}>
              -
            </div>
          </div>
          
          {/* Modified elements */}
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "12px",
            padding: "8px",
            backgroundColor: "rgba(26, 115, 232, 0.05)",
            borderRadius: "4px"
          }}>
            <div style={{ width: "60px", textAlign: "center", fontWeight: 500, color: "#1a73e8" }}>
              Modified
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: "18px", color: "#1a73e8" }}>
                {comparison.filter((item) => item.changeType === "changed").length}
              </div>
              <div style={{ fontSize: "12px", color: "#5f6368" }}>elements</div>
            </div>
            <div style={{ 
              width: "40px", 
              height: "40px", 
              borderRadius: "50%", 
              backgroundColor: "rgba(26, 115, 232, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#1a73e8",
              fontSize: "18px",
              fontWeight: "bold"
            }}>
              ↻
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};