import { useState, useEffect, useRef, useCallback } from 'react';

// 后端 API 地址配置
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://adalpha-backend-88968107416.us-central1.run.app';

export interface VKSDataPoint {
  time: string;
  vks: number;
  velocity: number;
  acceleration: number;
  hashtag?: string;  // 新增：当前监控的 hashtag
}

// SSE 连接状态
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export const useTrendData = () => {
  const [data, setData] = useState<VKSDataPoint[]>([]);
  const [currentVKS, setCurrentVKS] = useState(0);
  const [currentHashtag, setCurrentHashtag] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [dataSource, setDataSource] = useState<'backend' | 'simulation'>('simulation');

  // 用于计算 velocity 和 acceleration 的历史数据
  const lastVKSRef = useRef<number>(0);
  const lastVelocityRef = useRef<number>(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 生成模拟数据的函数（作为后备方案）
  const generateSimulatedPoint = useCallback((prevData: VKSDataPoint[]): VKSDataPoint => {
    const last = prevData[prevData.length - 1] || { vks: 45, velocity: 40, acceleration: 0 };

    // 模拟物理引擎
    const newAccel = Math.max(-5, Math.min(5, last.acceleration + (Math.random() - 0.5) * 2));
    let newVel = last.velocity + newAccel;
    newVel = Math.max(10, Math.min(100, newVel));

    let newVKS = newVel + (newAccel * 5);
    if (Math.random() > 0.9) newVKS += 15;
    newVKS = Math.max(0, (last.vks * 0.7) + (newVKS * 0.3));

    return {
      time: new Date().toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' }),
      vks: Math.round(newVKS),
      velocity: Math.round(newVel),
      acceleration: parseFloat(newAccel.toFixed(2))
    };
  }, []);

  // 连接后端 SSE
  const connectToBackend = useCallback(() => {
    // 如果已经有连接，先关闭
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setConnectionStatus('connecting');
    console.log('[VKS] 正在连接后端 SSE...', `${BACKEND_URL}/api/stream/all`);

    try {
      const eventSource = new EventSource(`${BACKEND_URL}/api/stream/all`);
      eventSourceRef.current = eventSource;

      // 连接成功
      eventSource.onopen = () => {
        console.log('[VKS] ✅ SSE 连接成功');
        setConnectionStatus('connected');
        setDataSource('backend');
      };

      // 监听 vks_update 事件（来自 Flink SQL 的 VKS 分数）
      eventSource.addEventListener('vks_update', (event) => {
        try {
          const payload = JSON.parse(event.data);
          console.log('[VKS] 收到 vks_update:', payload);

          // 计算 velocity（VKS 变化率）
          const newVKS = payload.vks_score || 0;
          const velocity = newVKS - lastVKSRef.current;
          const acceleration = velocity - lastVelocityRef.current;

          lastVKSRef.current = newVKS;
          lastVelocityRef.current = velocity;

          // 归一化 VKS 到 0-100（Flink SQL 可能输出超出范围的值）
          const normalizedVKS = Math.max(0, Math.min(100, newVKS));

          const newPoint: VKSDataPoint = {
            time: new Date().toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' }),
            vks: Math.round(normalizedVKS),
            velocity: Math.round(velocity * 10) / 10,  // 保留一位小数
            acceleration: Math.round(acceleration * 10) / 10,
            hashtag: payload.hashtag
          };

          setCurrentVKS(Math.round(normalizedVKS));
          setCurrentHashtag(payload.hashtag || '');

          setData(prev => {
            const newData = [...prev, newPoint];
            // 保留最近 60 个数据点
            if (newData.length > 60) newData.shift();
            return newData;
          });

        } catch (e) {
          console.error('[VKS] 解析 vks_update 失败:', e);
        }
      });

      // 监听 trend_update 事件（来自 market-stream 的原始数据）
      eventSource.addEventListener('trend_update', (event) => {
        try {
          const payload = JSON.parse(event.data);
          // trend_update 包含 velocity 数据，可以用来补充 VKS 计算
          if (payload.data?.metadata?.velocity) {
            const rawVelocity = payload.data.metadata.velocity;
            // 可以选择性地更新 velocity 显示
            console.log('[VKS] trend_update velocity:', rawVelocity);
          }
        } catch (e) {
          console.error('[VKS] 解析 trend_update 失败:', e);
        }
      });

      // 监听心跳
      eventSource.addEventListener('heartbeat', () => {
        console.log('[VKS] 💓 心跳');
      });

      // 监听连接确认
      eventSource.addEventListener('connected', (event) => {
        console.log('[VKS] 🔗 连接确认:', event.data);
      });

      // 错误处理
      eventSource.onerror = (error) => {
        console.error('[VKS] ❌ SSE 连接错误:', error);
        setConnectionStatus('error');
        eventSource.close();
        eventSourceRef.current = null;

        // 5 秒后自动重连
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('[VKS] 尝试重新连接...');
          connectToBackend();
        }, 5000);
      };

    } catch (error) {
      console.error('[VKS] 创建 SSE 连接失败:', error);
      setConnectionStatus('error');
      setDataSource('simulation');
    }
  }, []);

  // 初始化
  useEffect(() => {
    // 初始化历史数据（用于图表显示）
    const initialData: VKSDataPoint[] = [];
    const now = Date.now();
    for (let i = 20; i >= 0; i--) {
      initialData.push({
        time: new Date(now - i * 1000).toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' }),
        vks: 45 + Math.random() * 10,
        velocity: 0,
        acceleration: 0
      });
    }
    setData(initialData);

    // 尝试连接后端
    connectToBackend();

    // 模拟数据后备方案：如果 5 秒内没有收到后端数据，启动模拟模式
    const fallbackTimer = setTimeout(() => {
      if (dataSource === 'simulation') {
        console.log('[VKS] 使用模拟数据模式');
      }
    }, 5000);

    // 模拟数据定时器（当后端不可用时使用）
    const simulationInterval = setInterval(() => {
      // 只有在未连接后端时才使用模拟数据
      if (connectionStatus !== 'connected') {
        setData(prev => {
          const newPoint = generateSimulatedPoint(prev);
          setCurrentVKS(newPoint.vks);

          const newData = [...prev, newPoint];
          if (newData.length > 60) newData.shift();
          return newData;
        });
      }
    }, 1000);

    // 清理函数
    return () => {
      clearTimeout(fallbackTimer);
      clearInterval(simulationInterval);

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [connectToBackend, generateSimulatedPoint]);

  return {
    data,
    currentVKS,
    currentHashtag,
    connectionStatus,
    dataSource,
    // 手动重连方法
    reconnect: connectToBackend
  };
};