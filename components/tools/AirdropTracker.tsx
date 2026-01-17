"use client";

import { useState, useEffect } from "react";
import { Search, ExternalLink, CheckCircle2, Clock, Zap, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface AirdropProject {
  id: string;
  name: string;
  icon: string;
  status: "Live" | "Snapshot Taken" | "Claimable";
  probability: "High" | "Medium" | "Low";
  tasks: string[];
  officialCheckLink: string;
  description: string;
}

const mockProjects: AirdropProject[] = [
  {
    id: "layerzero",
    name: "LayerZero",
    icon: "🌉",
    status: "Live",
    probability: "High",
    tasks: [
      "Bridge > $1000 across chains",
      "Use 5+ different dApps",
      "Active for 3+ months",
      "Interact with 10+ contracts",
    ],
    officialCheckLink: "https://layerzero.network",
    description: "全链互操作性协议，通过跨链消息传递连接不同区块链",
  },
  {
    id: "zksync-era",
    name: "ZkSync Era",
    icon: "⚡",
    status: "Snapshot Taken",
    probability: "High",
    tasks: [
      "Bridge funds to ZkSync Era",
      "Use 10+ dApps on ZkSync",
      "Maintain activity for 6+ months",
      "Trade volume > $5000",
    ],
    officialCheckLink: "https://zksync.io",
    description: "ZK-Rollup Layer 2 解决方案，提供低费用和快速交易",
  },
  {
    id: "starknet",
    name: "Starknet",
    icon: "🔷",
    status: "Live",
    probability: "Medium",
    tasks: [
      "Bridge to Starknet",
      "Use 5+ Starknet dApps",
      "Participate in governance",
      "Active for 2+ months",
    ],
    officialCheckLink: "https://starknet.io",
    description: "基于 STARK 的 Layer 2 扩容方案",
  },
  {
    id: "linea",
    name: "Linea",
    icon: "📈",
    status: "Live",
    probability: "Medium",
    tasks: [
      "Bridge to Linea",
      "Use 3+ Linea dApps",
      "Maintain consistent activity",
    ],
    officialCheckLink: "https://linea.build",
    description: "ConsenSys 的 zkEVM Layer 2 网络",
  },
  {
    id: "scroll",
    name: "Scroll",
    icon: "📜",
    status: "Snapshot Taken",
    probability: "High",
    tasks: [
      "Bridge to Scroll",
      "Use Scroll dApps",
      "Active for 4+ months",
    ],
    officialCheckLink: "https://scroll.io",
    description: "EVM 兼容的 ZK-Rollup Layer 2",
  },
  {
    id: "base",
    name: "Base",
    icon: "🔵",
    status: "Claimable",
    probability: "High",
    tasks: [
      "Bridge to Base",
      "Use Base dApps",
      "Complete Base quests",
    ],
    officialCheckLink: "https://base.org",
    description: "Coinbase 的 Layer 2 网络",
  },
];

const getStatusColor = (status: AirdropProject["status"]) => {
  switch (status) {
    case "Claimable":
      return "bg-green-100 text-green-700 border-green-200";
    case "Live":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "Snapshot Taken":
      return "bg-blue-100 text-blue-700 border-blue-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

const getStatusLabel = (status: AirdropProject["status"]) => {
  switch (status) {
    case "Claimable":
      return "可领取";
    case "Live":
      return "进行中";
    case "Snapshot Taken":
      return "快照已拍";
    default:
      return status;
  }
};

const getProbabilityColor = (probability: AirdropProject["probability"]) => {
  switch (probability) {
    case "High":
      return "bg-green-500";
    case "Medium":
      return "bg-yellow-500";
    case "Low":
      return "bg-red-500";
    default:
      return "bg-slate-500";
  }
};

const getProbabilityLabel = (probability: AirdropProject["probability"]) => {
  switch (probability) {
    case "High":
      return "高概率";
    case "Medium":
      return "中等概率";
    case "Low":
      return "低概率";
    default:
      return probability;
  }
};

export function AirdropTracker() {
  const [walletAddress, setWalletAddress] = useState("");
  const [selectedProject, setSelectedProject] = useState<AirdropProject>(mockProjects[0]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [completedTasks, setCompletedTasks] = useState<Record<string, Set<string>>>({});

  // Load completed tasks from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("airdrop-completed-tasks");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const tasksMap: Record<string, Set<string>> = {};
        Object.keys(parsed).forEach((projectId) => {
          tasksMap[projectId] = new Set(parsed[projectId]);
        });
        setCompletedTasks(tasksMap);
      } catch (e) {
        console.error("Failed to load completed tasks", e);
      }
    }
  }, []);

  const handleScan = () => {
    if (!walletAddress || walletAddress.length < 10) {
      return;
    }

    setIsScanning(true);
    setScanProgress(0);

    // Simulate scanning progress
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const toggleTask = (projectId: string, taskIndex: number) => {
    setCompletedTasks((prev) => {
      const newTasks = { ...prev };
      if (!newTasks[projectId]) {
        newTasks[projectId] = new Set();
      }
      const taskSet = new Set(newTasks[projectId]);
      const taskKey = `${projectId}-${taskIndex}`;

      if (taskSet.has(taskKey)) {
        taskSet.delete(taskKey);
      } else {
        taskSet.add(taskKey);
      }

      newTasks[projectId] = taskSet;

      // Save to localStorage
      const toSave: Record<string, string[]> = {};
      Object.keys(newTasks).forEach((id) => {
        toSave[id] = Array.from(newTasks[id]);
      });
      localStorage.setItem("airdrop-completed-tasks", JSON.stringify(toSave));

      return newTasks;
    });
  };

  const isTaskCompleted = (projectId: string, taskIndex: number) => {
    const taskKey = `${projectId}-${taskIndex}`;
    return completedTasks[projectId]?.has(taskKey) || false;
  };

  const getProjectProgress = (project: AirdropProject) => {
    const completed = project.tasks.filter((_, index) =>
      isTaskCompleted(project.id, index)
    ).length;
    return (completed / project.tasks.length) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Header: Wallet Scanner */}
      <Card className="bg-gradient-to-br from-slate-50 to-white border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">钱包地址扫描</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="输入钱包地址 (0x...)"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              className="flex-1 font-mono text-sm"
            />
            <Button
              onClick={handleScan}
              disabled={isScanning || !walletAddress}
              className="bg-yellow-400 hover:bg-yellow-500 text-black"
            >
              {isScanning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  扫描中...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  扫描
                </>
              )}
            </Button>
          </div>

          {/* Scanning Progress */}
          {isScanning && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>正在扫描链上活动...</span>
              </div>
              <Progress value={scanProgress} className="h-2" />
              <p className="text-xs text-slate-500">{scanProgress}% 完成</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content: Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar: Project List */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
            项目列表
          </h3>
          <div className="space-y-2">
            {mockProjects.map((project) => {
              const progress = getProjectProgress(project);
              const isSelected = selectedProject.id === project.id;

              return (
                <button
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? "border-yellow-400 bg-yellow-50 shadow-md"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{project.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-slate-900 text-sm truncate">
                          {project.name}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                            project.status
                          )}`}
                        >
                          {getStatusLabel(project.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getProbabilityColor(project.probability)}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">
                          {Math.round(progress)}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1">
                        {getProbabilityLabel(project.probability)}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Content: Project Details */}
        <div className="lg:col-span-2">
          <Card className="border-slate-200">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{selectedProject.icon}</div>
                  <div>
                    <CardTitle className="text-2xl mb-1">{selectedProject.name}</CardTitle>
                    <p className="text-sm text-slate-600">{selectedProject.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 mb-1">空投概率</div>
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold ${getStatusColor(
                      selectedProject.status
                    )}`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${getProbabilityColor(
                        selectedProject.probability
                      )}`}
                    />
                    {getProbabilityLabel(selectedProject.probability)}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress Overview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-900">完成进度</h4>
                  <span className="text-sm text-slate-600">
                    {selectedProject.tasks.filter((_, index) =>
                      isTaskCompleted(selectedProject.id, index)
                    ).length}{" "}
                    / {selectedProject.tasks.length} 任务
                  </span>
                </div>
                <Progress
                  value={getProjectProgress(selectedProject)}
                  className="h-3"
                />
              </div>

              {/* Task Checklist */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-4">任务清单</h4>
                <div className="space-y-3">
                  {selectedProject.tasks.map((task, index) => {
                    const completed = isTaskCompleted(selectedProject.id, index);
                    return (
                      <label
                        key={index}
                        className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          completed
                            ? "bg-green-50 border-green-200"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={completed}
                          onChange={() => toggleTask(selectedProject.id, index)}
                          className="mt-1 w-5 h-5 rounded border-slate-300 text-yellow-400 focus:ring-yellow-400 focus:ring-offset-0"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {completed ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <Clock className="h-5 w-5 text-slate-400" />
                            )}
                            <span
                              className={`text-sm ${
                                completed
                                  ? "text-slate-600 line-through"
                                  : "text-slate-900"
                              }`}
                            >
                              {task}
                            </span>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Action Area */}
              <div className="pt-4 border-t border-slate-200">
                {selectedProject.status === "Claimable" ? (
                  <Button
                    onClick={() => window.open(selectedProject.officialCheckLink, "_blank")}
                    className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-6 text-lg"
                  >
                    <ExternalLink className="h-5 w-5 mr-2" />
                    前往领取页面
                  </Button>
                ) : selectedProject.status === "Live" ? (
                  <div className="space-y-3">
                    <Button
                      onClick={() => window.open(selectedProject.officialCheckLink, "_blank")}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-6 text-lg"
                    >
                      <ExternalLink className="h-5 w-5 mr-2" />
                      查看官方页面
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-yellow-400 text-yellow-600 hover:bg-yellow-50"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      查看策略教程
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => window.open(selectedProject.officialCheckLink, "_blank")}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-6 text-lg"
                  >
                    <ExternalLink className="h-5 w-5 mr-2" />
                    查看官方页面
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

