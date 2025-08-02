import { useState } from "react";

export const useNodeDetails = (stylesA: any, stylesB: any) => {
  const [nodeDetailsPath, setNodeDetailsPath] = useState<string | null>(null);
  const [nodeDetailsData, setNodeDetailsData] = useState<any | null>(null);

  const showNodeDetails = (path: string, nodeData: any, event?: React.MouseEvent) => {
    event?.stopPropagation();

    // If clicking on the same node, toggle details off
    if (nodeDetailsPath === path) {
      setNodeDetailsPath(null);
      setNodeDetailsData(null);
    } else {
      setNodeDetailsPath(path);

      // Format the data for ElementDetails component
      const elementData = {
        tagName: nodeData.name.split(/[#.]/)[0],
        id: nodeData.element?.element?.id || null,
        classes: nodeData.element?.element?.classes || [],
        styles: stylesA[path] ? stylesA[path].styles : stylesB[path] ? stylesB[path].styles : {},
        bounds: nodeData.element?.element?.bounds,
        attributes: nodeData.element?.element?.attributes,
        path: path,
        nodeId: nodeData.element?.id || 0,
      };

      setNodeDetailsData(elementData);
    }
  };

  const closeNodeDetails = () => {
    setNodeDetailsPath(null);
    setNodeDetailsData(null);
  };

  return {
    nodeDetailsPath,
    nodeDetailsData,
    showNodeDetails,
    closeNodeDetails,
  };
};
