import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  DatePicker,
  Drawer,
  Input,
  message,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import { Tooltip } from "@entrypoints/shared/components/Tooltip.tsx";
import {
  DeleteOutlined,
  DownloadOutlined,
  ExportOutlined,
  EyeOutlined,
  FilterOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { ExecutionHistoryEntry, ExecutionHistoryMap, ExecutionStatus } from "../../types.ts";
import ExecutionLogViewer from "./ExecutionLogViewer.tsx";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text } = Typography;

interface ExecutionHistoryViewerProps {
  executionHistory: ExecutionHistoryMap;
  onRefresh: () => void;
  onDelete: (id: string) => void;
  onDeleteAll: (ids: string[]) => void;
  onExport: (entry: ExecutionHistoryEntry) => void;
  onExportAll: (entries: ExecutionHistoryEntry[]) => void;
  scenarios: Record<string, { title: string }>;
}

/**
 * Component for displaying execution history
 */
const ExecutionHistoryViewer: React.FC<ExecutionHistoryViewerProps> = ({
  executionHistory,
  onRefresh,
  onDelete,
  onDeleteAll,
  onExport,
  onExportAll,
  scenarios,
}) => {
  // State for filters
  const [searchText, setSearchText] = useState<string>("");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [statusFilter, setStatusFilter] = useState<ExecutionStatus | "">("");
  const [scenarioFilter, setScenarioFilter] = useState<string>("");

  // State for drawer
  const [drawerVisible, setDrawerVisible] = useState<boolean>(false);
  const [selectedEntry, setSelectedEntry] = useState<ExecutionHistoryEntry | null>(null);

  // State for table
  const [filteredEntries, setFilteredEntries] = useState<ExecutionHistoryEntry[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // Apply filters when executionHistory or filter values change
  useEffect(() => {
    applyFilters();
  }, [executionHistory, searchText, dateRange, statusFilter, scenarioFilter]);

  // Apply filters to execution history
  const applyFilters = () => {
    let filtered = Object.values(executionHistory);

    // Apply search filter
    if (searchText) {
      const lowerSearchText = searchText.toLowerCase();
      filtered = filtered.filter((entry) => {
        const scenarioTitle = scenarios[entry.scenarioId]?.title || entry.scenarioTitle || "";
        return (
          scenarioTitle.toLowerCase().includes(lowerSearchText) ||
          (entry.id || "").toLowerCase().includes(lowerSearchText) ||
          (entry.error && entry.error.toLowerCase().includes(lowerSearchText))
        );
      });
    }

    // Apply date range filter
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].startOf("day");
      const endDate = dateRange[1].endOf("day");

      filtered = filtered.filter((entry) => {
        const executionDate = dayjs(entry.executionTime);
        return executionDate.isAfter(startDate) && executionDate.isBefore(endDate);
      });
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter((entry) => entry.status === statusFilter);
    }

    // Apply scenario filter
    if (scenarioFilter) {
      filtered = filtered.filter((entry) => entry.scenarioId === scenarioFilter);
    }

    // Sort by execution time (newest first)
    filtered.sort((a, b) => new Date(b.executionTime).getTime() - new Date(a.executionTime).getTime());

    setFilteredEntries(filtered);
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchText("");
    setDateRange(null);
    setStatusFilter("");
    setScenarioFilter("");
  };

  // View execution details
  const viewExecutionDetails = (entry: ExecutionHistoryEntry) => {
    setSelectedEntry(entry);
    setDrawerVisible(true);
  };

  // Delete execution history entry
  const deleteExecutionHistoryEntry = (id: string) => {
    onDelete(id);
    message.success("Execution history entry deleted");
  };

  // Export execution history entry
  const exportExecutionHistoryEntry = (entry: ExecutionHistoryEntry) => {
    onExport(entry);
    message.success("Execution history entry exported");
  };

  // Export selected execution history entries
  const exportSelectedEntries = () => {
    const selectedEntries = filteredEntries.filter((entry) => selectedRowKeys.includes(entry.id));

    if (selectedEntries.length === 0) {
      message.warning("No entries selected");
      return;
    }

    onExportAll(selectedEntries);
    message.success(`${selectedEntries.length} execution history entries exported`);
  };

  // Delete selected execution history entries
  const deleteSelectedEntries = () => {
    const selectedIds = selectedRowKeys.filter((key) => typeof key === "string") as string[];

    if (selectedIds.length === 0) {
      message.warning("No entries selected");
      return;
    }

    onDeleteAll(selectedIds);
    setSelectedRowKeys([]); // Clear selection after delete
    message.success(`${selectedIds.length} execution history entries deleted`);
  };

  // Format timestamp to a readable format
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Format duration to a readable format
  const formatDuration = (duration: number) => {
    if (duration < 1000) {
      return `${duration}ms`;
    } else if (duration < 60000) {
      return `${(duration / 1000).toFixed(2)}s`;
    } else {
      const minutes = Math.floor(duration / 60000);
      const seconds = ((duration % 60000) / 1000).toFixed(2);
      return `${minutes}m ${seconds}s`;
    }
  };

  // Get status tag based on status
  const getStatusTag = (status: ExecutionStatus) => {
    switch (status) {
      case ExecutionStatus.SUCCESS:
        return <Tag color="success">Success</Tag>;
      case ExecutionStatus.ERROR:
        return <Tag color="error">Error</Tag>;
      case ExecutionStatus.WARNING:
        return <Tag color="warning">Warning</Tag>;
      case ExecutionStatus.RUNNING:
        return <Tag color="processing">Running</Tag>;
      case ExecutionStatus.PAUSED:
        return <Tag color="purple">Paused</Tag>;
      case ExecutionStatus.CANCELLED:
        return <Tag color="orange">Cancelled</Tag>;
      case ExecutionStatus.SKIPPED:
        return <Tag color="default">Skipped</Tag>;
      default:
        return <Tag color="default">Unknown</Tag>;
    }
  };

  // Table columns: three narrow columns so the table fits a 350-450px panel without scrolling sideways
  const columns = [
    {
      title: "Scenario",
      dataIndex: "scenarioId",
      key: "scenario",
      render: (scenarioId: string, record: ExecutionHistoryEntry) => {
        const scenarioTitle = scenarios[scenarioId]?.title || record.scenarioTitle;
        return (
          <div style={{ minWidth: 0 }}>
            <Text strong ellipsis={{ tooltip: scenarioTitle }} style={{ display: "block", maxWidth: "100%" }}>
              {scenarioTitle}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {formatTimestamp(record.executionTime)} · {formatDuration(record.duration)}
            </Text>
            {record.error && (
              <div
                title={record.error}
                style={{ fontSize: 12, color: "#cf1322", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              >
                {record.error}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 96,
      render: (status: ExecutionStatus, record: ExecutionHistoryEntry) => (
        <div>
          {getStatusTag(status)}
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
            {record.stepsCompleted} / {record.totalSteps} steps
          </div>
        </div>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 76,
      render: (text: string, record: ExecutionHistoryEntry) => (
        <Space size={0}>
          <Tooltip title="View details">
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => viewExecutionDetails(record)} />
          </Tooltip>
          <Tooltip title="Export">
            <Button
              type="text"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => exportExecutionHistoryEntry(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete this history entry?"
            onConfirm={() => deleteExecutionHistoryEntry(record.id)}
            okText="Delete"
            cancelText="Cancel"
            getPopupContainer={() =>
              // @ts-ignore
              (document.querySelector("hover-inspector")!.shadowRoot as HTMLElement)?.querySelector("html > body")!
            }
          >
            <Tooltip title="Delete">
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Row selection configuration
  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[]) => {
      setSelectedRowKeys(selectedKeys);
    },
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        <Input
          placeholder="Search scenarios"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          prefix={<SearchOutlined />}
          style={{ gridColumn: "1 / -1" }}
          allowClear
        />

        <RangePicker
          value={dateRange}
          onChange={(dates) => setDateRange(dates)}
          style={{ gridColumn: "1 / -1" }}
          getPopupContainer={() =>
            // @ts-ignore
            (document.querySelector("hover-inspector")!.shadowRoot as HTMLElement)?.querySelector("html > body")!
          }
        />

        <Select
          placeholder="Status"
          value={statusFilter || undefined}
          onChange={(value) => setStatusFilter(value || "")}
          allowClear
          getPopupContainer={() =>
            // @ts-ignore
            (document.querySelector("hover-inspector")!.shadowRoot as HTMLElement)?.querySelector("html > body")!
          }
        >
          <Option value={ExecutionStatus.SUCCESS}>Success</Option>
          <Option value={ExecutionStatus.ERROR}>Error</Option>
          <Option value={ExecutionStatus.WARNING}>Warning</Option>
          <Option value={ExecutionStatus.RUNNING}>Running</Option>
          <Option value={ExecutionStatus.PAUSED}>Paused</Option>
          <Option value={ExecutionStatus.CANCELLED}>Cancelled</Option>
          <Option value={ExecutionStatus.SKIPPED}>Skipped</Option>
        </Select>

        <Select
          placeholder="Scenario"
          value={scenarioFilter || undefined}
          onChange={(value) => setScenarioFilter(value || "")}
          allowClear
          showSearch
          optionFilterProp="children"
          getPopupContainer={() =>
            // @ts-ignore
            (document.querySelector("hover-inspector")!.shadowRoot as HTMLElement)?.querySelector("html > body")!
          }
        >
          {Object.entries(scenarios).map(([id, scenario]) => (
            <Option key={id} value={id}>
              {scenario.title}
            </Option>
          ))}
        </Select>
      </div>

      <div style={{ marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <Text type="secondary" style={{ whiteSpace: "nowrap" }}>
          {selectedRowKeys.length > 0
            ? `${selectedRowKeys.length} of ${filteredEntries.length} selected`
            : `${filteredEntries.length} ${filteredEntries.length === 1 ? "entry" : "entries"}`}
        </Text>

        <Space size={4}>
          <Tooltip title="Reset filters">
            <Button size="small" icon={<FilterOutlined />} onClick={resetFilters} />
          </Tooltip>
          <Tooltip title="Refresh">
            <Button size="small" icon={<ReloadOutlined />} onClick={onRefresh} />
          </Tooltip>
          <Tooltip title="Export selected">
            <Button
              size="small"
              icon={<ExportOutlined />}
              onClick={exportSelectedEntries}
              disabled={selectedRowKeys.length === 0}
            />
          </Tooltip>
          <Popconfirm
            title="Delete selected entries?"
            description={`Delete ${selectedRowKeys.length} history entries? This can't be undone.`}
            onConfirm={deleteSelectedEntries}
            okText="Delete"
            cancelText="Cancel"
            disabled={selectedRowKeys.length === 0}
            getPopupContainer={() =>
              // @ts-ignore
              (document.querySelector("hover-inspector")!.shadowRoot as HTMLElement)?.querySelector("html > body")!
            }
          >
            <Tooltip title="Delete selected">
              <Button size="small" danger icon={<DeleteOutlined />} disabled={selectedRowKeys.length === 0} />
            </Tooltip>
          </Popconfirm>
        </Space>
      </div>

      <Table
        size="small"
        rowSelection={rowSelection}
        columns={columns}
        dataSource={filteredEntries}
        rowKey="id"
        tableLayout="fixed"
        pagination={{ pageSize: 10, size: "small", hideOnSinglePage: true }}
      />

      <Drawer
        title="Execution Details"
        placement="right"
        width={Math.min(600, window.innerWidth)}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        getContainer={() =>
          // @ts-ignore
          (document.querySelector("hover-inspector")!.shadowRoot as HTMLElement)?.querySelector("html > body")!
        }
      >
        {selectedEntry && (
          <>
            <div style={{ marginBottom: "16px" }}>
              <Space direction="vertical" style={{ width: "100%" }}>
                <Card size="small">
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <div>
                      <Text strong>Scenario: </Text>
                      <Text>{scenarios[selectedEntry.scenarioId]?.title || selectedEntry.scenarioTitle}</Text>
                    </div>
                    <div>
                      <Text strong>Execution Time: </Text>
                      <Text>{formatTimestamp(selectedEntry.executionTime)}</Text>
                    </div>
                    <div>
                      <Text strong>Duration: </Text>
                      <Text>{formatDuration(selectedEntry.duration)}</Text>
                    </div>
                    <div>
                      <Text strong>Status: </Text>
                      {getStatusTag(selectedEntry.status)}
                    </div>
                    <div>
                      <Text strong>Steps Completed: </Text>
                      <Text>
                        {selectedEntry.stepsCompleted} / {selectedEntry.totalSteps}
                      </Text>
                    </div>
                    {selectedEntry.triggerType && (
                      <div>
                        <Text strong>Trigger Type: </Text>
                        <Text>{selectedEntry.triggerType}</Text>
                      </div>
                    )}
                    {selectedEntry.error && (
                      <div>
                        <Text strong>Error: </Text>
                        <Text type="danger">{selectedEntry.error}</Text>
                      </div>
                    )}
                  </Space>
                </Card>
              </Space>
            </div>

            {selectedEntry.log && <ExecutionLogViewer log={selectedEntry.log} title="Execution Log" />}
          </>
        )}
      </Drawer>
    </div>
  );
};

export default ExecutionHistoryViewer;
