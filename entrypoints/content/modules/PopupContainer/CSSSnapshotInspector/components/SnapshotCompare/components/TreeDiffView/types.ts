export interface TreeNode {
  path: string;
  name: string;
  element: any;
  children: TreeNode[];
  level: number;
}
