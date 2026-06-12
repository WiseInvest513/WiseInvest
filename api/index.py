"""
Wise-ETF Serverless API  v4.0
==============================
缓存策略（Redis 持久化）：
  1. Redis (Upstash) — 持久化存储，cron 每日写入，永不丢失
  2. 静态兜底        — 代码内嵌数据，Redis 不可用时保底

数据分层：
  不变字段: code / name / fee_rate / scale / track_error / tracking_index
  日更字段: ytd_return / nav / nav_date / buy_status / live_data  → cron 09:30 更新
  实时字段: ETF market_price / nav / premium / volume / change_pct → 5min TTL

定时预热（vercel.json crons）：
  UTC 01:30 / 北京 09:30 — /api/cron/refresh 写入 Redis
"""

import json, os, re, logging, time, xml.etree.ElementTree as ET

# 加载 .env.local（本地开发环境）
def _load_env_local():
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env.local")
    if not os.path.exists(env_path):
        return
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
_load_env_local()
import urllib3; urllib3.disable_warnings()
from concurrent.futures import ThreadPoolExecutor, wait
from datetime import datetime
from email.utils import parsedate_to_datetime
from typing import Optional, Dict, List

import requests
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from upstash_redis import Redis

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# ─── Redis 缓存层 ───────────────────────────────────────────────────────────────

_redis: Optional[Redis] = None

def _get_redis() -> Optional[Redis]:
    global _redis
    if _redis is None:
        url   = os.environ.get("KV3_KV_REST_API_URL") or os.environ.get("KV_REST_API_URL")
        token = os.environ.get("KV3_KV_REST_API_TOKEN") or os.environ.get("KV_REST_API_TOKEN")
        if url and token:
            try:
                _redis = Redis(url=url, token=token)
            except Exception as e:
                logger.warning(f"[redis] init failed: {e}")
    return _redis

CACHE_TTL = {
    "funds":           14 * 3600,  # cron 每日 09:30 更新，14h TTL 覆盖到次日 cron
    "etfs":            5  * 60,    # ETF 实时行情，5min 有效
    "fx_history":      24 * 3600,  # 汇率历史，24h 有效
    "news":            30 * 60,    # 市场新闻，30min 缓存
    "premium_history": 12 * 3600,  # 溢价率历史，cron 每日更新
    "live_data":       4  * 3600,
}

def _cache_get(key: str) -> Optional[any]:
    r = _get_redis()
    if not r:
        return None
    try:
        val = r.get(key)
        if val:
            logger.info(f"[redis] hit {key}")
            return json.loads(val) if isinstance(val, str) else val
    except Exception as e:
        logger.warning(f"[redis:get] {key}: {e}")
    return None

def _cache_set(key: str, data: any, ttl: int):
    r = _get_redis()
    if not r:
        return
    try:
        r.set(key, json.dumps(data, ensure_ascii=False), ex=ttl)
        logger.info(f"[redis] set {key} ttl={ttl}s")
    except Exception as e:
        logger.warning(f"[redis:set] {key}: {e}")

def _cache_delete(key: str):
    r = _get_redis()
    if not r:
        return
    try:
        r.delete(key)
        logger.info(f"[redis] del {key}")
    except Exception as e:
        logger.warning(f"[redis:del] {key}: {e}")

def _cache_mget(keys: List[str]) -> Dict[str, any]:
    """批量 MGET，返回 {key: value} 字典（缺失的 key 不在字典里）"""
    if not keys:
        return {}
    r = _get_redis()
    if not r:
        return {}
    try:
        vals = r.mget(*keys)
        result = {}
        for k, v in zip(keys, vals):
            if v is not None:
                try:
                    result[k] = json.loads(v) if isinstance(v, str) else v
                except Exception:
                    pass
        return result
    except Exception as e:
        logger.warning(f"[redis:mget] {e}")
        return {}

def _cache_mset(items: Dict[str, any], ttl: int):
    """批量 SET，通过 pipeline 一次 RTT 写入所有 key（代替 N 次串行 SET）"""
    if not items:
        return
    r = _get_redis()
    if not r:
        return
    try:
        pipe = r.pipeline()
        for k, v in items.items():
            pipe.set(k, json.dumps(v, ensure_ascii=False), ex=ttl)
        pipe.exec()
        logger.info(f"[redis] mset {len(items)} keys ttl={ttl}s")
    except Exception as e:
        logger.warning(f"[redis:mset] {e}")

def _cache_delete_pattern(pattern: str):
    """批量删除匹配 pattern 的所有 Redis key（用于 force refresh 清股价缓存）"""
    r = _get_redis()
    if not r:
        return
    try:
        keys = r.keys(pattern)
        if keys:
            r.delete(*keys)
            logger.info(f"[redis] del pattern={pattern} count={len(keys)}")
    except Exception as e:
        logger.warning(f"[redis:del_pattern] {pattern}: {e}")

def _mem_get(key: str, kind: str) -> Optional[any]:
    return _cache_get(key)

def _mem_set(key: str, data: any):
    ttl = CACHE_TTL.get(kind_of(key), 12 * 3600)
    _cache_set(key, data, ttl)

def _file_save(key: str, data: any):
    pass  # Redis 已持久化，无需额外写文件

def _file_load(key: str) -> Optional[any]:
    return _cache_get(key)

def kind_of(key: str) -> str:
    """根据 key 推断缓存类型"""
    if key.startswith("funds_"):        return "funds"
    if key.startswith("prem_hist_"):    return "premium_history"
    if key == "etfs":                   return "etfs"
    if key == "live_data":              return "live_data"
    if key == "fx_history":             return "fx_history"
    if key == "news":                   return "news"
    return "funds"

# ─── 静态数据（与 App.jsx FALLBACK 严格同步）─────────────────────────────────
# 这些是不变字段：费率、规模、跟踪误差、每日限额
# 动态字段（ytd_return/nav/buy_status）会被实时数据覆盖，此处为保底值

# 静态基金数据 — 2026-04-09 更新
STATIC_FUNDS: Dict[str, List[dict]] = {
    "nasdaq_passive": [
        {"code":"019524","name":"华泰柏瑞纳斯达克100ETF联接(QDII)A","fee_rate":0.65,"scale":6.8,"ytd_return":16.66,"track_error":1.65,"daily_limit":"10元", "buy_status":"open",  "code_c":"019525"},
        {"code":"019547","name":"招商纳斯达克100ETF联接(QDII)A",      "fee_rate":0.65,"scale":15.8,"ytd_return":16.22,"track_error":1.72,"daily_limit":"100元","buy_status":"open",  "code_c":"019548"},
        {"code":"539001","name":"建信纳斯达克100指数QDIIA",            "fee_rate":1.00,"scale":13.2,"ytd_return":16.21,"track_error":2.17,"daily_limit":"100元",  "buy_status":"open",  "code_c":"012752"},
        {"code":"018966","name":"汇添富纳斯达克100ETF联接(QDII)A",    "fee_rate":0.65,"scale":11.3,"ytd_return":15.49,"track_error":2.08,"daily_limit":"100元", "buy_status":"open",  "code_c":"018967"},
        {"code":"016452","name":"南方纳斯达克100指数(QDII)A",          "fee_rate":0.65,"scale":33.3,"ytd_return":17.26,"track_error":1.64,"daily_limit":"200元", "buy_status":"open",  "code_c":"016453"},
        {"code":"000834","name":"大成纳斯达克100指数(QDII)A",          "fee_rate":1.00,"scale":38.8,"ytd_return":16.76,"track_error":1.51,"daily_limit":"100元",  "buy_status":"open",  "code_c":"008971"},
        {"code":"019172","name":"摩根纳斯达克100指数(QDII)A",          "fee_rate":0.60,"scale":26.1,"ytd_return":17.66,"track_error":2.15,"daily_limit":"100元", "buy_status":"open",  "code_c":"019173"},
        {"code":"270042","name":"广发纳斯达克100ETF联接(QDII)",        "fee_rate":1.00,"scale":108.4,"ytd_return":17.04,"track_error":1.10,"daily_limit":"10元",  "buy_status":"open",  "code_c":"006479"},
        {"code":"019441","name":"万家纳斯达克100指数发起式(QDII)",     "fee_rate":0.65,"scale":5.0, "ytd_return":16.86,"track_error":1.75,"daily_limit":"50元",  "buy_status":"open",  "code_c":"019442"},
        {"code":"161130","name":"易方达纳斯达克100ETF联接(QDII-LOF)A","fee_rate":0.60,"scale":16.1,"ytd_return":16.58,"track_error":1.55,"daily_limit":"暂停申购","buy_status":"suspended","code_c":"012870"},
        {"code":"040046","name":"华安纳斯达克100指数(QDII)",           "fee_rate":0.80,"scale":55.2,"ytd_return":15.37,"track_error":2.06,"daily_limit":"10元",  "buy_status":"open",  "code_c":"014978"},
        {"code":"160213","name":"国泰纳斯达克100指数(QDII)",           "fee_rate":1.00,"scale":18.6,"ytd_return":17.58,"track_error":1.03,"daily_limit":"暂停申购","buy_status":"suspended","code_c":None},
        {"code":"016055","name":"博时纳斯达克100ETF联接(QDII)A",       "fee_rate":0.65,"scale":15.6,"ytd_return":17.32,"track_error":1.52,"daily_limit":"暂停申购","buy_status":"suspended","code_c":"016057"},
        {"code":"018043","name":"天弘纳斯达克100指数(QDII)A",          "fee_rate":0.60,"scale":26.2,"ytd_return":17.49,"track_error":1.55,"daily_limit":"暂停申购","buy_status":"suspended","code_c":"018044"},
        {"code":"019736","name":"宝盈纳斯达克100指数(QDII)A",          "fee_rate":0.65,"scale":6.8, "ytd_return":17.19,"track_error":1.55,"daily_limit":"100元",  "buy_status":"open",  "code_c":"019737"},
        {"code":"016532","name":"嘉实纳斯达克100联接(QDII)A",          "fee_rate":0.60,"scale":21.1,"ytd_return":16.4, "track_error":1.60,"daily_limit":"暂停申购","buy_status":"suspended","code_c":"016533"},
        {"code":"015299","name":"华夏纳斯达克100ETF联接(QDII)A",       "fee_rate":0.80,"scale":3.8, "ytd_return":15.74,"track_error":2.69,"daily_limit":"暂停申购","buy_status":"suspended","code_c":"015300"},
        {"code":"017091","name":"景顺长城纳斯达克科技市值加权ETF联接A","fee_rate":1.00,"scale":25.8,"ytd_return":24.22,"track_error":3.11,"daily_limit":"暂停申购","buy_status":"suspended","code_c":"017093"},
    ],
    "sp500_passive": [
        {"code":"017641","name":"摩根标普500指数(QDII)A",           "fee_rate":0.65,"scale":31.6,"ytd_return":11.75,"track_error":2.57, "daily_limit":"100元",  "buy_status":"open",     "code_c":"019305"},
        {"code":"161125","name":"易方达标普500指数(QDII-LOF)A",     "fee_rate":1.00,"scale":14.7,"ytd_return":11.74,"track_error":2.39, "daily_limit":"暂停申购","buy_status":"suspended","code_c":"012860"},
        {"code":"017028","name":"国泰标普500ETF联接(QDII)A",        "fee_rate":0.75,"scale":1.6, "ytd_return":11.71,"track_error":1.87, "daily_limit":"暂停申购","buy_status":"suspended","code_c":"017030"},
        {"code":"050025","name":"博时标普500ETF联接(QDII)A",        "fee_rate":0.80,"scale":67.6,"ytd_return":12.14,"track_error":1.31, "daily_limit":"暂停申购","buy_status":"suspended","code_c":"006075"},
        {"code":"007721","name":"天弘标普500(QDII-FOF)A",           "fee_rate":0.80,"scale":26.5,"ytd_return":11.16,"track_error":None,"daily_limit":"暂停申购","buy_status":"suspended","code_c":"007722"},
        {"code":"018064","name":"华夏标普500ETF联接(QDII)A",        "fee_rate":0.75,"scale":4.1, "ytd_return":10.38,"track_error":1.10, "daily_limit":"暂停申购","buy_status":"suspended","code_c":"018065"},
        {"code":"096001","name":"大成标普500等权重指数(QDII)A",     "fee_rate":1.20,"scale":6.1, "ytd_return":7.17, "track_error":1.69, "daily_limit":"50元",    "buy_status":"open",     "code_c":"008401"},
        {"code":"161128","name":"易方达标普信息科技指数(QDII-FOF)A","fee_rate":1.00,"scale":36.8,"ytd_return":22.13,"track_error":10.85,"daily_limit":"暂停申购","buy_status":"suspended","code_c":None},
    ],
    "us_active": [
        {"code":"100055","name":"富国全球科技互联网股票(QDII)A","fee_rate":1.40,"scale":10.2,"ytd_return":37.81,"daily_limit":"不限额","buy_status":"open"},
        {"code":"016701","name":"银华海外数字经济量化选股混合(QDII)A","fee_rate":1.40,"scale":11.2,"ytd_return":27.21,"daily_limit":"100000元","buy_status":"open"},
        {"code":"005698","name":"华夏全球科技先锋混合(QDII)","fee_rate":1.40,"scale":26.3,"ytd_return":52.49,"daily_limit":"5000元","buy_status":"open"},
        {"code":"017144","name":"华宝海外新能源汽车股票(QDII)A","fee_rate":1.40,"scale":2.6,"ytd_return":24.08,"daily_limit":"10000元","buy_status":"open"},
        {"code":"270023","name":"广发全球精选股票(QDII)A","fee_rate":1.40,"scale":104.5,"ytd_return":32.39,"daily_limit":"2000元","buy_status":"open"},
        {"code":"008253","name":"华宝致远混合(QDII)A","fee_rate":1.40,"scale":1.7,"ytd_return":47.82,"daily_limit":"5000元","buy_status":"open"},
        {"code":"017436","name":"华宝纳斯达克精选股票(QDII)A","fee_rate":1.40,"scale":46.2,"ytd_return":26.08,"daily_limit":"5000元","buy_status":"open"},
        {"code":"501226","name":"长城全球新能源汽车股票(QDII-LOF)A","fee_rate":1.40,"scale":4.7,"ytd_return":48.21,"daily_limit":"100元","buy_status":"open"},
        {"code":"006555","name":"浦银安盛全球智能科技股票(QDII)A","fee_rate":1.40,"scale":8.7,"ytd_return":43.81,"daily_limit":"暂停申购","buy_status":"suspended"},
        {"code":"017730","name":"嘉实全球产业升级股票(QDII)A","fee_rate":1.40,"scale":7.2,"ytd_return":75.36,"daily_limit":"100元","buy_status":"open"},
        {"code":"006373","name":"国富全球科技互联混合(QDII)人民币A","fee_rate":1.40,"scale":24.3,"ytd_return":53.48,"daily_limit":"100元","buy_status":"open"},
        {"code":"012920","name":"易方达全球成长精选混合(QDII)A","fee_rate":1.40,"scale":28.3,"ytd_return":107.95,"daily_limit":"20元","buy_status":"open"},
        {"code":"539002","name":"建信新兴市场优选混合(QDII)A","fee_rate":1.40,"scale":4.6,"ytd_return":92.11,"daily_limit":"20元","buy_status":"open"},
        {"code":"001668","name":"汇添富全球移动互联混合(QDII)A","fee_rate":1.40,"scale":0.0,"ytd_return":43.29,"daily_limit":"5000元","buy_status":"open"},
        {"code":"002891","name":"华夏移动互联灵活配置混合(QDII)A","fee_rate":1.40,"scale":0.0,"ytd_return":120.50,"daily_limit":"1000元","buy_status":"open"},
        {"code":"457001","name":"国富亚洲机会股票(QDII)A","fee_rate":1.40,"scale":0.0,"ytd_return":143.79,"daily_limit":"200元","buy_status":"open"},
        # ── 新增主题型主动 QDII ──
        {"code":"004877","name":"汇添富全球医疗混合(QDII)人民币","fee_rate":1.40,"scale":0.0,"ytd_return":27.85,"daily_limit":"10000元","buy_status":"open"},
        {"code":"006308","name":"汇添富全球消费混合(QDII)人民币A","fee_rate":1.40,"scale":0.0,"ytd_return":11.6,"daily_limit":"1000元","buy_status":"open"},
        {"code":"006309","name":"汇添富全球消费混合(QDII)人民币C","fee_rate":1.40,"scale":0.0,"ytd_return":10.5,"daily_limit":"1000元","buy_status":"open"},
        {"code":"018155","name":"创金合信全球医药生物股票发起式(QDII)A","fee_rate":1.40,"scale":0.0,"ytd_return":89.49,"daily_limit":"不限额","buy_status":"open"},
        {"code":"018156","name":"创金合信全球医药生物股票发起式(QDII)C","fee_rate":1.40,"scale":0.0,"ytd_return":88.8,"daily_limit":"不限额","buy_status":"open"},
        # ── C 类份额补全 ──
        {"code":"017437","name":"华宝纳斯达克精选股票发起式(QDII)C","fee_rate":1.40,"scale":0.0,"ytd_return":16.7,"daily_limit":"5000元","buy_status":"open"},
        {"code":"017731","name":"嘉实全球产业升级股票发起式(QDII)C","fee_rate":1.40,"scale":0.0,"ytd_return":53.78,"daily_limit":"100元","buy_status":"open"},
        {"code":"022184","name":"富国全球科技互联网股票(QDII)C","fee_rate":1.40,"scale":0.0,"ytd_return":43.99,"daily_limit":"不限额","buy_status":"open"},
        {"code":"016702","name":"银华海外数字经济量化选股混合(QDII)C","fee_rate":1.40,"scale":0.0,"ytd_return":23.74,"daily_limit":"100000元","buy_status":"open"},
        {"code":"016823","name":"天弘全球新能源汽车股票(QDII-LOF)C","fee_rate":1.40,"scale":0.0,"ytd_return":35.54,"daily_limit":"10000元","buy_status":"open"},
        {"code":"018036","name":"长城全球新能源车股票发起式(QDII)C","fee_rate":1.40,"scale":0.0,"ytd_return":29.8,"daily_limit":"100元","buy_status":"open"},
        {"code":"017145","name":"华宝海外新能源汽车股票发起式(QDII)C","fee_rate":1.40,"scale":0.0,"ytd_return":26.14,"daily_limit":"10000元","buy_status":"open"},
    ],
}

# 场内ETF — 名称/tracking_index/scale/ytd_return 为稳定字段（经 fundgz 实测验证）
# market_price/nav/premium/volume/change_pct 为实时字段，由 _build_etfs 每次回填
# 静态 nav/premium 基于 2026-03-27 fundgz 数据，是合理的兜底显示值
STATIC_ETFS: List[dict] = [
    # ── 纳斯达克100 ──  scale/ytd_return/fee_rate 基于 2026-04-02 实测数据
    {"code":"513100","name":"国泰纳斯达克100ETF",        "tracking_index":"纳斯达克100",        "scale":167.9,"ytd_return":16.99,"market_price":1.708,"nav":1.6276,"premium":4.94,"volume":3.6, "change_pct":0.0,"fee_rate":0.80,"track_error":1.07},
    {"code":"513110","name":"华泰柏瑞纳斯达克100ETF",     "tracking_index":"纳斯达克100",        "scale":41.6, "ytd_return":16.60,"market_price":1.933,"nav":1.8710,"premium":3.32,"volume":1.5, "change_pct":0.0,"fee_rate":1.00,"track_error":1.04},
    {"code":"159941","name":"广发纳斯达克100ETF",         "tracking_index":"纳斯达克100",        "scale":297.8,"ytd_return":16.41,"market_price":1.276,"nav":1.2228,"premium":4.35,"volume":7.8, "change_pct":0.0,"fee_rate":1.00,"track_error":1.03},
    {"code":"513300","name":"华夏纳斯达克100ETF(QDII)",   "tracking_index":"纳斯达克100",        "scale":112.5,"ytd_return":14.72,"market_price":2.106,"nav":2.0302,"premium":3.73,"volume":3.1, "change_pct":0.0,"fee_rate":0.80,"track_error":2.53},
    {"code":"159659","name":"招商纳斯达克100ETF(QDII)",   "tracking_index":"纳斯达克100",        "scale":79.3, "ytd_return":17.42,"market_price":1.815,"nav":1.7516,"premium":3.62,"volume":1.3, "change_pct":0.0,"fee_rate":0.65,"track_error":1.08},
    {"code":"159632","name":"华安纳斯达克100ETF(QDII)",   "tracking_index":"纳斯达克100",        "scale":97.8, "ytd_return":16.28,"market_price":1.907,"nav":1.8467,"premium":3.27,"volume":1.9, "change_pct":0.0,"fee_rate":0.80,"track_error":1.24},
    {"code":"513870","name":"富国纳斯达克100ETF(QDII)",   "tracking_index":"纳斯达克100",        "scale":20.2, "ytd_return":17.41,"market_price":1.776,"nav":1.7178,"premium":3.39,"volume":0.3, "change_pct":0.0,"fee_rate":0.63,"track_error":0.86},
    {"code":"159696","name":"易方达纳斯达克100ETF(QDII)", "tracking_index":"纳斯达克100",        "scale":39.7, "ytd_return":17.37,"market_price":1.742,"nav":1.6784,"premium":3.79,"volume":0.5, "change_pct":0.0,"fee_rate":0.63,"track_error":0.86},
    {"code":"159660","name":"汇添富纳斯达克100ETF(QDII)", "tracking_index":"纳斯达克100",        "scale":37.7, "ytd_return":17.24,"market_price":2.039,"nav":1.9707,"premium":3.52,"volume":0.4, "change_pct":0.0,"fee_rate":0.66,"track_error":0.88},
    {"code":"159501","name":"嘉实纳斯达克100ETF(QDII)",   "tracking_index":"纳斯达克100",        "scale":100.7,"ytd_return":17.14,"market_price":1.753,"nav":1.6939,"premium":3.52,"volume":1.2, "change_pct":0.0,"fee_rate":0.61,"track_error":0.86},
    {"code":"513390","name":"博时纳斯达克100ETF(QDII)",   "tracking_index":"纳斯达克100",        "scale":35.6, "ytd_return":17.12,"market_price":2.094,"nav":2.0228,"premium":3.52,"volume":0.4, "change_pct":0.0,"fee_rate":0.69,"track_error":0.91},
    {"code":"159513","name":"大成纳斯达克100ETF(QDII)",   "tracking_index":"纳斯达克100",        "scale":59.7, "ytd_return":16.50,"market_price":1.566,"nav":1.5136,"premium":3.52,"volume":0.8, "change_pct":0.0,"fee_rate":1.01,"track_error":0.88},
    # ── 纳斯达克科技市值加权 ──
    {"code":"159509","name":"景顺长城纳斯达克科技ETF(QDII)","tracking_index":"纳斯达克科技市值加权","scale":123.3,"ytd_return":27.55,"market_price":1.962,"nav":1.6780,"premium":16.9,"volume":5.3, "change_pct":0.0,"fee_rate":1.00,"track_error":1.88},
    # ── 标普500 ──
    {"code":"513500","name":"博时标普500ETF",             "tracking_index":"标普500",            "scale":223.2,"ytd_return":13.89,"market_price":2.209,"nav":2.1132,"premium":4.54,"volume":2.3, "change_pct":0.0,"fee_rate":0.80,"track_error":1.07},
    {"code":"159612","name":"国泰标普500ETF(QDII)",       "tracking_index":"标普500",            "scale":7.9,  "ytd_return":13.74,"market_price":1.735,"nav":1.6582,"premium":4.63,"volume":0.1, "change_pct":0.0,"fee_rate":0.75,"track_error":1.01},
    {"code":"513650","name":"南方标普500ETF(QDII)",       "tracking_index":"标普500",            "scale":46.8, "ytd_return":13.82,"market_price":1.661,"nav":1.6117,"premium":3.06,"volume":1.0, "change_pct":0.0,"fee_rate":0.75,"track_error":1.05},
]

# 汇率/指数月度静态数据（Yahoo Finance 被墙时的兜底，来源：Wind / Bloomberg 公开数据）
STATIC_FX_HISTORY = [
    {"month":"2015-01","usdcny":6.2078,"ndx_close":4100, "spx_close":2028},
    {"month":"2015-06","usdcny":6.2097,"ndx_close":4458, "spx_close":2063},
    {"month":"2015-12","usdcny":6.4936,"ndx_close":4593, "spx_close":2044},
    {"month":"2016-06","usdcny":6.6448,"ndx_close":4457, "spx_close":2099},
    {"month":"2016-12","usdcny":6.9448,"ndx_close":4863, "spx_close":2239},
    {"month":"2017-06","usdcny":6.7744,"ndx_close":5897, "spx_close":2423},
    {"month":"2017-12","usdcny":6.5063,"ndx_close":6455, "spx_close":2674},
    {"month":"2018-06","usdcny":6.6166,"ndx_close":7066, "spx_close":2718},
    {"month":"2018-12","usdcny":6.8775,"ndx_close":6192, "spx_close":2507},
    {"month":"2019-06","usdcny":6.8650,"ndx_close":7505, "spx_close":2942},
    {"month":"2019-12","usdcny":6.9762,"ndx_close":8733, "spx_close":3231},
    {"month":"2020-06","usdcny":7.0721,"ndx_close":9946, "spx_close":3100},
    {"month":"2020-12","usdcny":6.5249,"ndx_close":12888,"spx_close":3756},
    {"month":"2021-06","usdcny":6.4601,"ndx_close":14504,"spx_close":4298},
    {"month":"2021-12","usdcny":6.3726,"ndx_close":16320,"spx_close":4766},
    {"month":"2022-06","usdcny":6.6981,"ndx_close":11378,"spx_close":3785},
    {"month":"2022-12","usdcny":6.8972,"ndx_close":10939,"spx_close":3840},
    {"month":"2023-06","usdcny":7.2258,"ndx_close":14857,"spx_close":4450},
    {"month":"2023-12","usdcny":7.1001,"ndx_close":16825,"spx_close":4770},
    {"month":"2024-06","usdcny":7.2672,"ndx_close":19685,"spx_close":5460},
    {"month":"2024-12","usdcny":7.2996,"ndx_close":21204,"spx_close":5882},
    {"month":"2025-03","usdcny":7.2515,"ndx_close":19480,"spx_close":5612},
    {"month":"2025-06","usdcny":7.1680,"ndx_close":21900,"spx_close":5970},
    {"month":"2025-12","usdcny":7.0059,"ndx_close":21204,"spx_close":5882},
]

# ─── 请求头 ────────────────────────────────────────────────────────────────────

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "http://fund.eastmoney.com/",
}

YF_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json,text/plain,*/*",
}

# ─── Yahoo Finance crumb 认证 ────────────────────────────────────────────────
# Yahoo Finance 2024 起强制要求 cookie+crumb，不带则返回 429
_YF_CRUMB: dict = {"crumb": None, "cookies": None, "ts": 0.0}

def _yf_get_crumb() -> tuple:
    """
    返回 (crumb, cookies)。
    内存缓存 12h；过期后从 Redis 取；再取不到才重新走认证流程。
    """
    now = time.time()
    if _YF_CRUMB["crumb"] and now - _YF_CRUMB["ts"] < 12 * 3600:
        return _YF_CRUMB["crumb"], _YF_CRUMB["cookies"]

    cached = _cache_get("yf_crumb")
    if cached and cached.get("crumb"):
        _YF_CRUMB.update({**cached, "ts": now})
        return cached["crumb"], cached.get("cookies") or {}

    try:
        import requests as _req
        sess = _req.Session()
        sess.get("https://finance.yahoo.com/", headers=YF_HEADERS, timeout=(5, 15), verify=False)
        resp = sess.get(
            "https://query1.finance.yahoo.com/v1/test/getcrumb",
            headers=YF_HEADERS, timeout=(4, 10), verify=False,
        )
        if resp.ok and resp.text.strip():
            crumb   = resp.text.strip()
            cookies = dict(sess.cookies)
            _YF_CRUMB.update({"crumb": crumb, "cookies": cookies, "ts": now})
            _cache_set("yf_crumb", {"crumb": crumb, "cookies": cookies}, 12 * 3600)
            logger.info(f"[yf_crumb] obtained crumb={crumb[:8]}…")
            return crumb, cookies
    except Exception as e:
        logger.warning(f"[yf_crumb] failed: {e}")
    return None, {}


def _yf_chart(symbol: str, interval: str = "1d", range_: str = "5d") -> Optional[dict]:
    """
    带 crumb 认证的 Yahoo Finance chart 请求。
    自动重试一次（crumb 失效时重新获取）。
    """
    for attempt in range(2):
        crumb, cookies = _yf_get_crumb()
        params = {"interval": interval, "range": range_}
        if crumb:
            params["crumb"] = crumb
        try:
            resp = _get(
                f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}",
                params=params,
                headers=YF_HEADERS,
                cookies=cookies or {},
                timeout=(4, 10),
            )
            if resp and resp.status_code == 429 and attempt == 0:
                # crumb 可能过期，重置后重试
                _YF_CRUMB["crumb"] = None
                _cache_delete("yf_crumb")
                logger.warning(f"[yf_chart] 429 for {symbol}, resetting crumb and retrying")
                continue
            if resp and resp.ok:
                return resp.json()["chart"]["result"][0]
        except Exception as e:
            logger.warning(f"[yf_chart] {symbol} attempt {attempt}: {e}")
    return None


def _yf_quote_summary(symbol: str) -> Optional[dict]:
    """
    Yahoo Finance v10 quoteSummary price 模块。
    直接返回 preMarketChangePercent / postMarketChangePercent，
    比从 chart 推算更可靠（Yahoo 经常在 chart meta 里省略 preMarketPrice）。
    返回 {pre_pct, post_pct, regular_pct, pre_price, post_price, regular_price, prev_close}，
    均可为 None。
    """
    crumb, cookies = _yf_get_crumb()
    params = {"modules": "price", "formatted": "false"}
    if crumb:
        params["crumb"] = crumb
    try:
        resp = _get(
            f"https://query2.finance.yahoo.com/v10/finance/quoteSummary/{symbol}",
            params=params,
            headers=YF_HEADERS,
            cookies=cookies or {},
            timeout=(4, 10),
        )
        if not (resp and resp.ok):
            return None
        price_data = resp.json()["quoteSummary"]["result"][0]["price"]

        def _raw(field) -> Optional[float]:
            v = price_data.get(field)
            if isinstance(v, dict):
                v = v.get("raw")
            try:   return float(v) if v is not None else None
            except (ValueError, TypeError): return None

        def _as_pct(raw_val) -> Optional[float]:
            """quoteSummary 的 changePercent 字段存的是小数（0.024 = 2.4%），换算为 %。"""
            return round(raw_val * 100, 2) if raw_val is not None else None

        return {
            "pre_pct":       _as_pct(_raw("preMarketChangePercent")),
            "post_pct":      _as_pct(_raw("postMarketChangePercent")),
            "regular_pct":   _as_pct(_raw("regularMarketChangePercent")),
            "pre_price":     _raw("preMarketPrice"),
            "post_price":    _raw("postMarketPrice"),
            "regular_price": _raw("regularMarketPrice"),
            "prev_close":    _raw("regularMarketPreviousClose"),
        }
    except Exception as e:
        logger.debug(f"[yf_quote_summary] {symbol}: {e}")
    return None


def _yf_batch_quote(symbols: List[str]) -> Dict[str, dict]:
    """
    Yahoo Finance v7 批量报价 — 一次请求拿所有股票盘前/盘中/盘后涨跌幅和价格。
    preMarketChangePercent / regularMarketChangePercent / postMarketChangePercent
    均为现成字段，直接用，不需要自己用 closes[-2] 手算，不会出现 KLAC +1029% 这类问题。

    ⚠️  未接入主流程原因：Yahoo v7 /quote 单次请求 symbol 数量有上限（约 10-20 个），
        QDII 美股持仓可达 100+ symbols，需分批切割后合并，改造成本较高。
        目前主流程仍走 fetch_stock_price_fields（v8 chart 逐只拉取，有四层容灾）。
        若未来要接入，需在调用侧将 symbols 按 ≤15 个一组分批，再合并结果。
    返回 {symbol: {pre_pct, regular_pct, post_pct, price, close_price}}
    """
    if not symbols:
        return {}
    crumb, cookies = _yf_get_crumb()
    fields = ("regularMarketPrice,preMarketPrice,postMarketPrice,"
              "preMarketChangePercent,postMarketChangePercent,"
              "regularMarketChangePercent,regularMarketPreviousClose")
    params = {"symbols": ",".join(symbols), "fields": fields, "formatted": "false"}
    if crumb:
        params["crumb"] = crumb
    try:
        resp = requests.get(
            "https://query1.finance.yahoo.com/v7/finance/quote",
            params=params,
            headers=YF_HEADERS,
            cookies=cookies or {},
            timeout=(3, 8),
            verify=False,
        )
        if not (resp and resp.ok):
            logger.warning(f"[yf_batch] HTTP {resp.status_code if resp else 'N/A'}")
            return {}
        results = resp.json().get("quoteResponse", {}).get("result", [])
        s = _current_session()
        out: Dict[str, dict] = {}
        for q in results:
            sym = q.get("symbol", "")
            if not sym:
                continue
            def _f(key):
                v = q.get(key)
                try: return float(v) if v is not None else None
                except (TypeError, ValueError): return None
            # v7 formatted:false 的 changePercent 直接是 % 数值（-1.93 表示 -1.93%）
            pre_pct  = round(_f("preMarketChangePercent"),  2) if _f("preMarketChangePercent")  is not None else None
            post_pct = round(_f("postMarketChangePercent"), 2) if _f("postMarketChangePercent") is not None else None
            reg_pct  = round(_f("regularMarketChangePercent"), 2) if _f("regularMarketChangePercent") is not None else None
            reg_p    = _f("regularMarketPrice")
            pre_p    = _f("preMarketPrice")
            post_p   = _f("postMarketPrice")
            prev_close = _f("regularMarketPreviousClose")
            close_price = round(prev_close, 2) if prev_close else (round(reg_p, 2) if reg_p else None)
            if s == "pre_market":
                price = round(pre_p, 2) if pre_p else close_price
            elif s == "post_market":
                price = round(post_p or reg_p, 2) if (post_p or reg_p) else close_price
            elif s == "us_open":
                price = round(reg_p, 2) if reg_p else close_price
            else:
                price = close_price
            out[sym] = {"pre_pct": pre_pct, "regular_pct": reg_pct, "post_pct": post_pct,
                        "price": price, "close_price": close_price}
        logger.info(f"[yf_batch] {len(out)}/{len(symbols)} symbols ok")
        return out
    except Exception as e:
        logger.warning(f"[yf_batch] failed: {e}")
        return {}


def _nasdaq_fetch(symbol: str) -> dict:
    """
    Nasdaq.com API：返回 {pct, price, prev_close}，均可缺失。

    数据结构（2026-05-20 确认）：
      primaryData   — 当前活跃时段数据
                      盘前/盘后：当前盘前/盘后最新成交价 + 相对昨收的涨跌幅%（直接字段，非计算）
                      盘中：实时成交价 + 当日涨跌幅%
      secondaryData — 上一个常规收盘数据（固定不变）
                      lastSalePrice = 昨日美股4PM ET收盘价
                      percentageChange = 昨日常规收盘涨跌幅

    字段说明：
      pct        — primaryData.percentageChange：盘前/盘后/盘中涨跌幅（直接字段，Nasdaq给的）
      price      — primaryData.lastSalePrice：当前时段最新价（盘前/盘后为动态盘前价）
      prev_close — secondaryData.lastSalePrice：昨日4PM ET固定收盘价（不随盘前/盘后变化）
    """
    try:
        url  = f"https://api.nasdaq.com/api/quote/{symbol}/info?assetclass=stocks"
        resp = _get(url, headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                          "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json, text/plain, */*",
        }, timeout=(4, 10))
        if not (resp and resp.ok):
            return {}
        data      = resp.json().get("data") or {}
        primary   = data.get("primaryData")   or {}
        secondary = data.get("secondaryData") or {}
        result: dict = {}

        def _parse_pct(s: str) -> Optional[float]:
            s = s.replace("%", "").replace("+", "").strip()
            if s and s not in ("--", "N/A"):
                try: return round(float(s), 2)
                except (ValueError, TypeError): pass
            return None

        def _parse_price(s: str) -> Optional[float]:
            s = s.replace("$", "").replace(",", "").strip()
            if s and s not in ("--", "N/A"):
                try: return round(float(s), 2)
                except (ValueError, TypeError): pass
            return None

        # 盘前/盘后涨跌幅：primaryData 直接给的字段，相对昨收的变动
        pct = _parse_pct(primary.get("percentageChange", ""))
        if pct is not None:
            result["pct"] = pct

        # 当前时段最新价（盘前/盘后为动态价，仅供参考，不作为"收盘价"展示）
        price = _parse_price(primary.get("lastSalePrice", ""))
        if price is not None:
            result["price"] = price

        # 昨日4PM ET固定收盘价：secondaryData.lastSalePrice
        # 盘前/盘后/A股时段"收盘价"列展示此值，固定不随盘前盘后变动
        prev_close = _parse_price(secondary.get("lastSalePrice", ""))
        if prev_close is not None:
            result["prev_close"] = prev_close

        return result
    except Exception as e:
        logger.debug(f"[nasdaq_api] {symbol}: {e}")
    return {}


def _nasdaq_change(symbol: str) -> Optional[float]:
    """向后兼容包装，返回涨跌幅%。"""
    return _nasdaq_fetch(symbol).get("pct")

# ─── HTTP 工具 ─────────────────────────────────────────────────────────────────

def _get(url, **kwargs) -> Optional[requests.Response]:
    """安全 GET：2s 建连超时 + 4s 读取超时，被墙时快速失败"""
    try:
        return requests.get(url, timeout=kwargs.pop("timeout", (2, 4)), **kwargs)
    except Exception as e:
        logger.warning(f"GET {url[:60]}: {e}")
        return None

# ─── 数据抓取 ──────────────────────────────────────────────────────────────────

def fetch_fund_realtime(code: str) -> dict:
    """天天基金实时估值（JSONP）"""
    resp = _get(f"http://fundgz.1234567.com.cn/js/{code}.js", headers=HEADERS)
    if resp and resp.ok:
        m = re.search(r"jsonpgz\((.+)\)", resp.text)
        if m:
            try:
                return json.loads(m.group(1))
            except Exception:
                pass
    return {}


def fetch_fund_performance(code: str) -> list:
    """东方财富基金近1年涨幅"""
    url = "https://fundmobapi.eastmoney.com/FundMNewApi/FundMNPeriodIncrease"
    resp = _get(url, params={"FCODE": code, "deviceid": "wise-etf",
                              "plat": "Wap", "product": "EFund", "version": "6.5.0"},
                headers=HEADERS)
    if resp and resp.ok:
        try:
            d = resp.json()
            if d.get("ErrCode") == 0:
                return d.get("Datas", [])
        except Exception:
            pass
    return []


# 只包含会变动的字段（fee_rate/track_error 不变；scale 季度更新；daily_limit/buy_status 每日可能变化）
# ⚠️  ytd_return（25年涨幅）已从此集合移除，永远使用 STATIC_FUNDS 中的写死值，禁止动态覆盖。
# ⚠️  如需修改 ytd_return 数据，必须直接编辑 STATIC_FUNDS / FALLBACK，并征得用户同意后才能改动。
_VOLATILE_FUND_FIELDS = {"nav", "nav_date", "buy_status", "daily_limit", "scale"}


def fetch_one_fund(code: str, category: str, _meta_cached=None) -> Optional[dict]:
    realtime = fetch_fund_realtime(code)
    name     = realtime.get("name", "")

    # FOF/部分QDII基金 fundgz 接口无数据，不 early-return，仍继续拉申购状态
    if name:
        result: dict = {
            "code":     code,
            "nav":      float(realtime.get("dwjz", 0)),
            "nav_date": realtime.get("jzrq", ""),
        }
    else:
        result: dict = {"code": code}

    # 实时申购状态 & 每日限额（SGZT/MAXSG）
    try:
        r = _get(
            "https://fundmobapi.eastmoney.com/FundMNewApi/FundMNBasicInformation",
            params={"FCODE": code, "deviceid": "wise-etf",
                    "plat": "Wap", "product": "EFund", "version": "6.5.0"},
            headers=_MOBILE_HEADERS, timeout=(3, 8))
        if r and r.ok:
            d = r.json().get("Datas", {})
            if d:
                sgzt = d.get("SGZT", "")
                maxsg = d.get("MAXSG", "")
                # 已限购写死：暂停申购
                if code in ("160213",):
                    result["buy_status"] = "suspended"
                    result["daily_limit"] = "暂停申购"
                elif sgzt:
                    has_limit = maxsg and str(maxsg) not in ("", "--", "0", "None")
                    # SGZT 优先：含"暂停"直接短路，MAXSG 残留值不干扰判断
                    if "暂停" in sgzt:
                        result["buy_status"] = "suspended"
                        result["daily_limit"] = "暂停申购"
                    else:
                        if has_limit:
                            try:
                                val = int(float(maxsg))
                                result["daily_limit"] = "不限额" if val >= 500_000 else f"{val}元"
                            except (ValueError, TypeError):
                                result["daily_limit"] = f"{maxsg}元"
                            result["buy_status"] = "open"
                        else:
                            result["buy_status"] = "open"
                            result["daily_limit"] = "不限额"
    except Exception:
        pass

    # 从 pingzhongdata 获取：2025全年收益率（与近1年滚动区分）+ us_active规模（缓存 12h）
    try:
        meta = fetch_fund_meta(code, _meta_cached)
        if meta.get("ytd_return") is not None:
            result["ytd_return"] = meta["ytd_return"]
        if category == "us_active" and meta.get("scale") is not None:
            result["scale"] = meta["scale"]
    except Exception:
        pass

    return result


_SINA_HEADERS = {
    "User-Agent": HEADERS["User-Agent"],
    "Referer":    "http://finance.sina.com.cn/",
}

def fetch_etfs_sina_batch(codes: List[str]) -> Dict[str, dict]:
    """
    新浪财经批量行情（单次请求，GBK 编码）。
    返回 {code: {market_price, volume, change_pct}}
    字段定义：昨收[1], 今开[2], 现价[3], 最高[4], 最低[5],
              成交量(股)[8], 成交额(元)[9]
    """
    def _prefix(c: str) -> str:
        return "sh" if c.startswith("5") else "sz"

    symbols = ",".join(f"{_prefix(c)}{c}" for c in codes)
    resp    = _get(f"http://hq.sinajs.cn/list={symbols}",
                   headers=_SINA_HEADERS, timeout=(2, 6))
    if not (resp and resp.ok):
        return {}
    try:
        text = resp.content.decode("gbk", errors="ignore")
    except Exception:
        text = resp.text

    result: Dict[str, dict] = {}
    for line in text.split("\n"):
        m = re.search(r'hq_str_\w{2}(\d{6})="([^"]+)"', line)
        if not m:
            continue
        code, data = m.group(1), m.group(2)
        parts = data.split(",")
        if len(parts) < 10:
            continue
        try:
            prev_close = float(parts[1])
            curr_price = float(parts[3])
            volume_cny = float(parts[9])      # 成交额（元）
            if curr_price <= 0:
                continue
            change_pct = round((curr_price - prev_close) / prev_close * 100, 2) \
                         if prev_close > 0 else 0.0
            result[code] = {
                "market_price": curr_price,
                "volume":       round(volume_cny / 1e8, 2),   # 转换为亿
                "change_pct":   change_pct,
            }
        except Exception:
            continue
    logger.info(f"[sina] got {len(result)}/{len(codes)} ETFs")
    return result


def _sina_stock_batch(yahoo_symbols: List[str]) -> Dict[str, dict]:
    """
    新浪财经批量行情 — A股 + 港股（一次请求）。
    输入 Yahoo Finance 格式的 symbol（如 600519.SS / 000001.SZ / 0700.HK）。
    返回 {yahoo_symbol: {pre_pct, regular_pct, post_pct, price, close_price}}。

    Sina 字段（逗号分隔）：
      [0]名称  [1]今开  [2]昨收  [3]当前价  [4]最高  [5]最低  [9]成交额
    HK 的字段位置与 A 股相同。
    """
    if not yahoo_symbols:
        return {}

    def _to_sina(sym: str) -> Optional[str]:
        if sym.endswith(".SS"):
            return f"sh{sym[:-3]}"
        if sym.endswith(".SZ"):
            return f"sz{sym[:-3]}"
        if sym.endswith(".HK"):
            code = sym[:-3]
            try:
                return f"hk{int(code):05d}"
            except ValueError:
                return None
        return None

    sina_to_yahoo: Dict[str, str] = {}
    for sym in yahoo_symbols:
        s = _to_sina(sym)
        if s:
            sina_to_yahoo[s] = sym

    if not sina_to_yahoo:
        return {}

    symbols_str = ",".join(sina_to_yahoo.keys())
    try:
        resp = _get(f"http://hq.sinajs.cn/list={symbols_str}",
                    headers=_SINA_HEADERS, timeout=(3, 8))
        if not (resp and resp.ok):
            return {}
        text = resp.content.decode("gbk", errors="ignore")
    except Exception as e:
        logger.warning(f"[sina_stock] batch failed: {e}")
        return {}

    result: Dict[str, dict] = {}
    for line in text.split("\n"):
        m = re.search(r'hq_str_(\w+)="([^"]*)"', line)
        if not m:
            continue
        sina_sym, data = m.group(1), m.group(2)
        parts = data.split(",")
        if len(parts) < 4:
            continue
        yahoo_sym = sina_to_yahoo.get(sina_sym)
        if not yahoo_sym:
            continue
        try:
            prev_close = float(parts[2])   # 昨收（索引2）
            curr_price = float(parts[3])   # 当前价（索引3）
            if prev_close <= 0 or curr_price <= 0:
                continue
            change_pct = round((curr_price - prev_close) / prev_close * 100, 2)
            result[yahoo_sym] = {
                "pre_pct":     change_pct,
                "regular_pct": change_pct,
                "post_pct":    change_pct,
                "price":       curr_price,
                "close_price": curr_price,
            }
        except (ValueError, IndexError):
            continue
    logger.info(f"[sina_stock] got {len(result)}/{len(sina_to_yahoo)} symbols")
    return result


def _stooq_batch(yahoo_symbols: List[str]) -> Dict[str, dict]:
    """
    Stooq 批量行情 — 美股（us_open 盘中）。
    一次 HTTP 请求拿所有股票当前价 + 前收盘价，自己算 regular_pct。
    输入 Yahoo Finance 格式的 symbol（如 AAPL / NVDA / TSM）。
    返回 {yahoo_symbol: {pre_pct, regular_pct, post_pct, price, close_price}}。
    注意：stooq 只有盘中数据，pre_pct/post_pct 填 None（由 Nasdaq 补充）。
    """
    if not yahoo_symbols:
        return {}

    # stooq symbol 格式：小写 + .us，多个用 + 连接（requests 会编码 +，必须手拼 URL）
    def _to_stooq(sym: str) -> Optional[str]:
        # 只处理纯美股（无后缀或 .US），跳过 .HK/.SS/.SZ 等
        if "." not in sym:
            return sym.lower() + ".us"
        return None

    stooq_to_yahoo: Dict[str, str] = {}
    for sym in yahoo_symbols:
        s = _to_stooq(sym)
        if s:
            stooq_to_yahoo[s] = sym

    if not stooq_to_yahoo:
        return {}

    # 手动拼 URL 避免 + 被编码为 %2B
    symbols_str = "+".join(stooq_to_yahoo.keys())
    url = f"https://stooq.com/q/l/?s={symbols_str}&f=sd2t2cp"
    try:
        resp = _get(url, timeout=(5, 12))
        if not (resp and resp.ok):
            logger.warning(f"[stooq] HTTP {resp.status_code if resp else 'N/A'}")
            return {}
        text = resp.text
    except Exception as e:
        logger.warning(f"[stooq] batch failed: {e}")
        return {}

    result: Dict[str, dict] = {}
    for line in text.strip().split("\r\n"):
        if not line or "N/D" in line:
            continue
        parts = line.split(",")
        if len(parts) < 5:
            continue
        stooq_sym = parts[0].lower()
        yahoo_sym = stooq_to_yahoo.get(stooq_sym)
        if not yahoo_sym:
            continue
        try:
            curr  = float(parts[3])
            prev  = float(parts[4])
            if prev <= 0 or curr <= 0:
                continue
            pct = round((curr - prev) / prev * 100, 2)
            result[yahoo_sym] = {
                "pre_pct":     None,
                "regular_pct": pct,
                "post_pct":    None,
                "price":       round(curr, 4),
                "close_price": round(prev, 4),
            }
        except (ValueError, IndexError):
            continue

    logger.info(f"[stooq] got {len(result)}/{len(stooq_to_yahoo)} US symbols")
    return result


def fetch_etfs_em_fallback(codes: List[str]) -> Dict[str, dict]:
    """
    东方财富行情 — Sina 未返回数据时的备用（仅针对缺失 ETF）。
    f43: 最新价（×1000 → yuan）  f170: 涨跌幅（×100 → %）
    """
    def _secid(c: str) -> str:
        return f"1.{c}" if c.startswith("5") else f"0.{c}"

    def _fetch_one(c: str) -> Optional[dict]:
        resp = _get(
            "https://push2.eastmoney.com/api/qt/stock/get",
            params={"secid": _secid(c), "fields": "f43,f170", "cb": "cb"},
            headers=HEADERS, timeout=(2, 4),
        )
        if not (resp and resp.ok):
            return None
        try:
            m = re.search(r"cb\((.+)\)", resp.text)
            if not m:
                return None
            d = json.loads(m.group(1)).get("data") or {}
            price_raw = d.get("f43", 0)
            chg_raw   = d.get("f170", 0)
            if not price_raw or price_raw <= 0:
                return None
            return {
                "market_price": round(price_raw / 1000, 4),
                "change_pct":   round(chg_raw / 100, 2),
                "volume":       0.0,
            }
        except Exception:
            return None

    ex  = ThreadPoolExecutor(max_workers=len(codes))
    res: Dict[str, dict] = {}
    try:
        futs = {ex.submit(_fetch_one, c): c for c in codes}
        done, not_done = wait(list(futs), timeout=6)
        for fut in not_done:
            fut.cancel()
        for fut in done:
            c = futs[fut]
            try:
                data = fut.result()
                if data:
                    res[c] = data
            except Exception:
                pass
    finally:
        ex.shutdown(wait=False)
    logger.info(f"[em_fallback] got {len(res)}/{len(codes)} ETFs")
    return res


# ─── 市场情绪数据源 ──────────────────────────────────────────────────────────────

def fetch_index_price(symbol: str) -> dict:
    """从 Yahoo Finance 获取指数实时点位 + 多周期涨幅 + 近15日历史"""
    try:
        result = _yf_chart(symbol, interval="1d", range_="1y")
        if not result:
            return {}
        meta   = result["meta"]
        price  = meta.get("regularMarketPrice")
        if not price:
            return {}
        price = float(price)
        timestamps = result.get("timestamp", [])
        closes_raw = result["indicators"]["quote"][0].get("close", [])
        # 过滤空值
        pairs = [(ts, float(c)) for ts, c in zip(timestamps, closes_raw) if c is not None]
        if not pairs:
            return {}
        # 多周期涨幅：从末尾往前数交易日
        def pct(n):
            if len(pairs) < n + 1:
                return None
            base = pairs[-n][1]
            return round((price - base) / base * 100, 2) if base else None
        def yr1():
            if len(pairs) < 2:
                return None
            base = pairs[0][1]
            return round((price - base) / base * 100, 2) if base else None
        returns = {
            "d15":  pct(15),
            "mo1":  pct(21),
            "mo6":  pct(126),
            "yr1":  yr1(),
        }
        # 近15日历史（用于图表）+ 追加今日实时价格
        history = [
            {"date": datetime.utcfromtimestamp(ts).strftime("%m/%d"), "close": round(c, 2)}
            for ts, c in pairs[-15:]
        ]
        today_str = datetime.utcnow().strftime("%m/%d")
        if history and history[-1]["date"] != today_str:
            history.append({"date": today_str, "close": round(price, 2)})
        # 今日涨跌（用 regularMarketPreviousClose/previousClose，避免 chartPreviousClose 取到年初价格）
        prev = meta.get("regularMarketPreviousClose") or meta.get("previousClose") or (pairs[-2][1] if len(pairs) >= 2 else None)
        change_pct = round((price - float(prev)) / float(prev) * 100, 2) if prev else None
        # 连涨/连跌天数（从最近一天往前数）
        closes_all = [c for _, c in pairs]
        streak = 0
        for i in range(len(closes_all) - 1, 0, -1):
            diff = closes_all[i] - closes_all[i - 1]
            if streak == 0:
                streak = 1 if diff > 0 else -1
            elif (streak > 0 and diff > 0) or (streak < 0 and diff < 0):
                streak += (1 if streak > 0 else -1)
            else:
                break
        # 近1年最高点 / 最低点
        yr_high = round(max(closes_all), 2)
        yr_low  = round(min(closes_all), 2)
        pct_from_high = round((price - yr_high) / yr_high * 100, 2) if yr_high else None
        return {
            "price": round(price, 2),
            "change_pct": change_pct,
            "returns": returns,
            "history": history,
            "streak": streak,          # 正=连涨N天，负=连跌N天
            "yr_high": yr_high,
            "yr_low": yr_low,
            "pct_from_high": pct_from_high,  # 距年内高点的差距
        }
    except Exception as e:
        logger.warning(f"[index_price:{symbol}] {e}")
    return {}


def fetch_vix() -> dict:
    """从 CBOE 官方 API 获取 VIX 恐慌指数（实时，官方权威数据源）"""
    try:
        url = "https://cdn.cboe.com/api/global/delayed_quotes/quotes/_VIX.json"
        resp = _get(url, timeout=(4, 10), headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                          "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        })
        if not (resp and resp.ok):
            return {}
        d = resp.json().get("data", {})
        price = d.get("current_price")
        if not price:
            return {}
        ts = d.get("last_trade_time", "")[:10]
        return {
            "value": round(float(price), 2),
            "change": round(float(d.get("price_change", 0)), 2),
            "change_pct": round(float(d.get("price_change_percent", 0)), 2),
            "date": ts,
        }
    except Exception as e:
        logger.warning(f"[vix] {e}")
    return {}

def fetch_fear_greed() -> dict:
    """从 CNN 获取恐慌贪婪指数"""
    try:
        url = "https://production.dataviz.cnn.io/index/fearandgreed/graphdata"
        resp = _get(url, timeout=(4, 12), headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                          "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://edition.cnn.com/markets/fear-and-greed",
        })
        if not (resp and resp.ok):
            return {}
        fg = resp.json().get("fear_and_greed", {})
        prev_close = fg.get("previous_close")
        prev_week  = fg.get("previous_1_week")
        return {
            "score": round(float(fg.get("score", 0)), 1),
            "rating": fg.get("rating", ""),
            "previous_close": round(float(prev_close), 1) if prev_close is not None else None,
            "previous_1_week": round(float(prev_week), 1) if prev_week is not None else None,
        }
    except Exception as e:
        logger.warning(f"[fear_greed] {e}")
    return {}

def fetch_sp500_pe() -> dict:
    """从 multpl.com 获取 S&P 500 当前市盈率，结合历史年度 PE 分布计算分位。
    当前 PE：multpl.com（Standard & Poor's），实时更新；
    历史分位：使用 1950–2025 年度 PE 数据（来源同 multpl.com）。
    """
    # S&P 500 年度 PE 历史分布（1950–2025，来源：multpl.com / S&P Global）
    # 用于计算当前估值的历史分位（越低越便宜）
    _PE_HIST = [
        7.73, 7.45, 11.33, 11.04, 12.46, 12.45, 14.57, 15.26, 12.97, 17.66,  # 1950–1959
        18.02, 22.37, 22.76, 18.98, 21.06, 20.31, 19.87, 16.77, 17.27, 19.07,  # 1960–1969
        17.23, 17.23, 18.91, 17.82, 13.74,  7.35, 11.74, 11.58,  8.47,  7.58,  # 1970–1979
         7.35,  8.14,  9.14, 12.58, 11.18, 13.86, 15.04, 21.24, 14.84, 12.74,  # 1980–1989
        15.57, 26.12, 25.81, 21.30, 17.32, 16.01, 18.95, 22.38, 27.95, 33.48,  # 1990–1999
        30.44, 45.84, 46.50, 31.89, 22.73, 20.57, 17.85, 17.36, 21.46, 70.91,  # 2000–2009
        18.11, 16.31, 14.87, 17.38, 18.15, 20.02, 24.21, 25.59, 24.79, 21.15,  # 2010–2019
        26.23, 40.15, 29.27, 21.63, 26.12, 28.77,                               # 2020–2025
    ]
    try:
        url = "https://www.multpl.com/s-p-500-pe-ratio/table/by-month"
        resp = _get(url, timeout=(4, 15), headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                          "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml",
        })
        if not (resp and resp.ok):
            return {}
        import re as _re
        cells = _re.findall(r"<td[^>]*>([\s\S]*?)</td>", resp.text)
        def strip_tags(s):
            return _re.sub(r"<[^>]+>", "", s).strip()
        texts = [strip_tags(c) for c in cells]
        current_pe = None
        i = 0
        while i < len(texts) - 1:
            date_t = texts[i]
            val_t  = texts[i + 1]
            if _re.match(r"\w+\s+\d+,?\s*\d{4}", date_t):
                m = _re.search(r"(\d+\.?\d*)", val_t)
                if m:
                    v = float(m.group(1))
                    if 3.0 < v < 150.0:  # 有效 PE 范围
                        current_pe = v
                        break
            i += 1
        if current_pe is None:
            return {}
        rank = sum(1 for x in _PE_HIST if x <= current_pe)
        percentile = round(rank / len(_PE_HIST) * 100)
        return {"pe": round(current_pe, 1), "percentile": percentile}
    except Exception as e:
        logger.warning(f"[sp500_pe] {e}")
    return {}


def fetch_sp500_pe_history(start_year: int = 1990) -> list:
    """S&P500 历史月度 PE（start_year 至今）。
    优先从 multpl.com 抓全量月度数据；若返回数据不足（网站结构变化），
    则用内嵌年度数据线性插值生成月度序列，并把实时最新 PE 追加到末尾。
    """
    # ── 内嵌年度 PE（1990–2025，来源 multpl.com 年度均值）────────────────
    _ANNUAL_SP = {
        1990:15.57, 1991:26.12, 1992:25.81, 1993:21.30, 1994:17.32,
        1995:16.01, 1996:18.95, 1997:22.38, 1998:27.95, 1999:33.48,
        2000:30.44, 2001:45.84, 2002:46.50, 2003:31.89, 2004:22.73,
        2005:20.57, 2006:17.85, 2007:17.36, 2008:21.46, 2009:70.91,
        2010:18.11, 2011:16.31, 2012:14.87, 2013:17.38, 2014:18.15,
        2015:20.02, 2016:24.21, 2017:25.59, 2018:24.79, 2019:21.15,
        2020:26.23, 2021:40.15, 2022:29.27, 2023:21.63, 2024:26.12,
        2025:28.77,
    }

    def _interpolate_annual(annual: dict, from_year: int) -> list:
        from datetime import date as _date
        years = sorted(annual.keys())
        current_ym = _date.today().strftime("%Y-%m")
        result = []
        for i, yr in enumerate(years):
            if yr < from_year:
                continue
            pe_s = annual[yr]
            pe_e = annual[years[i + 1]] if i < len(years) - 1 else pe_s
            for mo in range(1, 13):
                ym = f"{yr}-{mo:02d}"
                if ym > current_ym:
                    break
                result.append({"date": ym, "pe": round(pe_s + (pe_e - pe_s) * (mo - 1) / 12, 2)})
        return result

    # ── 先尝试 multpl.com ────────────────────────────────────────────────
    try:
        import re as _re
        _MONTH_MAP = {"Jan":1,"Feb":2,"Mar":3,"Apr":4,"May":5,"Jun":6,
                      "Jul":7,"Aug":8,"Sep":9,"Oct":10,"Nov":11,"Dec":12}
        url = "https://www.multpl.com/s-p-500-pe-ratio/table/by-month"
        resp = _get(url, timeout=(4, 20), headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                          "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml",
        })
        if resp and resp.ok:
            cells = _re.findall(r"<td[^>]*>([\s\S]*?)</td>", resp.text)
            strip = lambda s: _re.sub(r"<[^>]+>", "", s).strip()
            texts = [strip(c) for c in cells]
            scraped = []
            i = 0
            while i < len(texts) - 1:
                m_d = _re.match(r"(\w{3})\w*\s+\d+,?\s*(\d{4})", texts[i])
                if m_d:
                    mon, yr = m_d.group(1), int(m_d.group(2))
                    m_v = _re.search(r"(\d+\.?\d*)", texts[i + 1])
                    if m_v:
                        v = float(m_v.group(1))
                        if 3.0 < v < 200.0:
                            scraped.append({"date": f"{yr}-{_MONTH_MAP.get(mon,1):02d}", "pe": round(v, 2)})
                i += 1
            scraped.sort(key=lambda x: x["date"])
            # 若数据足够完整（从 2000 年前开始，超过 200 条）直接使用
            if len(scraped) > 200 and scraped[0]["date"] < "2005-01":
                logger.info(f"[sp500_pe_history] multpl ok, {len(scraped)} pts")
                return [r for r in scraped if r["date"] >= f"{start_year}-01"]
            # 否则：用插值历史 + 把抓到的近期实际值覆盖末尾
            base = _interpolate_annual(_ANNUAL_SP, start_year)
            if scraped:
                scraped_map = {r["date"]: r["pe"] for r in scraped}
                for r in base:
                    if r["date"] in scraped_map:
                        r["pe"] = scraped_map[r["date"]]
            logger.info(f"[sp500_pe_history] fallback+patch, {len(base)} pts")
            return base
    except Exception as e:
        logger.warning(f"[sp500_pe_history] {e}")

    # ── 纯 fallback ───────────────────────────────────────────────────────
    return _interpolate_annual(_ANNUAL_SP, start_year)


def fetch_nasdaq100_pe() -> dict:
    """获取 QQQ（纳斯达克100）当前市盈率，结合历史年度 PE 分布计算分位。
    当前 PE：优先直接调 Yahoo Finance quoteSummary API（快速）；备用 yfinance。
    历史分位：使用 2000–2025 年度 PE 数据（Trailing PE，gurufocus.com 口径）。
    """
    # 纳斯达克100年度 PE 历史分布（2000–2025）
    # 来源：QQQ / NASDAQ-100 历史 PE 数据（Trailing PE）
    _PE_HIST = [
        102.37, 48.91, 26.14, 30.39, 26.37, 22.84, 21.44, 24.58, 20.16, 19.53,  # 2000–2009
        21.28, 18.97, 20.31, 23.15, 23.76, 23.45, 22.78, 26.59, 23.42, 29.84,   # 2010–2019
        36.20, 38.50, 24.36, 32.18, 34.62, 31.50,                                # 2020–2025
    ]

    def _calc(pe_val):
        if not pe_val or not (5.0 < pe_val < 500.0):
            return {}
        rank = sum(1 for x in _PE_HIST if x <= pe_val)
        percentile = round(rank / len(_PE_HIST) * 100)
        return {"pe": round(pe_val, 1), "percentile": percentile}

    # 方案1：直接调 Yahoo Finance v10 quoteSummary（短超时，避免拖慢整体）
    try:
        resp = _get(
            "https://query1.finance.yahoo.com/v10/finance/quoteSummary/QQQ",
            params={"modules": "summaryDetail"},
            timeout=(3, 6),
            headers={**YF_HEADERS, "Accept": "application/json"},
        )
        if resp and resp.ok:
            detail = resp.json()["quoteSummary"]["result"][0]["summaryDetail"]
            pe = detail.get("trailingPE", {}).get("raw")
            result = _calc(pe)
            if result:
                return result
    except Exception as e:
        logger.warning(f"[nasdaq100_pe] yahoo direct: {e}")

    # 方案2：硬编码兜底（外部API不可达时立即返回，不依赖任何网络请求）
    from datetime import date as _date
    _FALLBACK = {
        "2026-04": 35.1, "2026-03": 30.5, "2026-02": 32.0,
        "2026-01": 32.8, "2025-12": 32.4, "2025-11": 32.6,
    }
    cur_ym = _date.today().strftime("%Y-%m")
    for ym in sorted(_FALLBACK.keys(), reverse=True):
        if ym <= cur_ym:
            result = _calc(_FALLBACK[ym])
            if result:
                logger.info(f"[nasdaq100_pe] fallback {ym}: {_FALLBACK[ym]}")
                return result

    return {}


def fetch_nasdaq100_pe_history(current_pe: float = None) -> list:
    """获取纳斯达克100历史年度PE（1990–今），插值为月度序列。
    数据来源：内嵌年度实际值（来自 QQQ/Nasdaq-100 历史记录）。
    current_pe：当前实时 PE，用于校准近期月度估算；若不传则跳过 yfinance patch。
    """
    # 年度实际 PE（1990–2025）来源：macrotrends / QQQ factsheet / 多方核对
    _ANNUAL = {
        1990: 17.5,  1991: 18.2,  1992: 19.8,  1993: 21.3,  1994: 18.5,
        1995: 22.4,  1996: 27.1,  1997: 30.8,  1998: 45.2,  1999: 75.3,
        2000: 102.4, 2001: 48.9,  2002: 26.1,  2003: 30.4,  2004: 26.4,
        2005: 22.8,  2006: 21.4,  2007: 24.6,  2008: 20.2,  2009: 19.5,
        2010: 21.3,  2011: 19.0,  2012: 20.3,  2013: 23.2,  2014: 23.8,
        2015: 23.5,  2016: 22.8,  2017: 26.6,  2018: 23.4,  2019: 29.8,
        2020: 36.2,  2021: 38.5,  2022: 24.4,  2023: 32.2,  2024: 34.6,
        2025: 31.5,  2026: 35.1,
    }
    # 近期月度 PE 实际值（yfinance 价格比例法估算，优先于年度插值）
    # 来源：QQQ trailingPE × (月末收盘价 / 当前价格)，2026-04-27 计算
    _RECENT_MONTHLY = {
        "2025-09": 31.6, "2025-10": 33.15, "2025-11": 32.63,
        "2025-12": 32.37,
        "2026-01": 32.81, "2026-02": 32.04, "2026-03": 30.45, "2026-04": 35.1,
    }
    # 尝试 macrotrends 月度数据
    try:
        import re as _re, json as _json
        url = "https://www.macrotrends.net/stocks/charts/QQQ/invesco-qqq-trust/pe-ratio"
        resp = _get(url, timeout=(5, 20), headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                          "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml",
            "Referer": "https://www.macrotrends.net/",
        })
        if resp and resp.ok:
            m = _re.search(r"var\s+originalData\s*=\s*(\[.*?\])\s*;", resp.text, _re.DOTALL)
            if m:
                raw = _json.loads(m.group(1))
                result = []
                for item in raw:
                    date_s = str(item.get("date", ""))[:7]
                    val = item.get("value")
                    if date_s >= "1990-01" and val:
                        try:
                            v = float(val)
                            if 3.0 < v < 500.0:
                                result.append({"date": date_s, "pe": round(v, 2)})
                        except (ValueError, TypeError):
                            pass
                result.sort(key=lambda x: x["date"])
                # 要求数据足够多且历史足够长（macrotrends 只返回近期则丢弃）
                if len(result) > 200 and result[0]["date"] < "2005-01":
                    logger.info(f"[nasdaq100_pe_history] macrotrends ok, {len(result)} points")
                    return result
    except Exception as e:
        logger.warning(f"[nasdaq100_pe_history macrotrends] {e}")

    # Fallback：年度数据线性插值为月度
    from datetime import date as _date
    years = sorted(_ANNUAL.keys())
    result = []
    current_ym = _date.today().strftime("%Y-%m")
    for i, yr in enumerate(years):
        pe_start = _ANNUAL[yr]
        pe_end   = _ANNUAL[years[i + 1]] if i < len(years) - 1 else pe_start
        for mo in range(1, 13):
            ym = f"{yr}-{mo:02d}"
            if ym > current_ym:
                break
            frac = (mo - 1) / 12
            result.append({"date": ym, "pe": round(pe_start + (pe_end - pe_start) * frac, 2)})
    result.sort(key=lambda x: x["date"])

    # 覆盖近期月度 PE（_RECENT_MONTHLY 优先于年度插值）
    result_map = {r["date"]: r for r in result}
    for ym, pe_val in _RECENT_MONTHLY.items():
        if ym in result_map:
            result_map[ym]["pe"] = pe_val
        else:
            result.append({"date": ym, "pe": pe_val})
    result.sort(key=lambda x: x["date"])
    # 若传入当前 PE，再尝试用 yfinance 价格比例法更新最新月
    if current_pe and current_pe > 5.0:
        try:
            import yfinance as _yf
            hist = _yf.Ticker("QQQ").history(period="3mo", interval="1mo")
            if not hist.empty:
                current_price = float(hist["Close"].iloc[-1])
                result_map2 = {r["date"]: r for r in result}
                for ts, row in hist.iterrows():
                    ym = ts.strftime("%Y-%m")
                    if ym < "2026-01":
                        continue
                    est_pe = round(float(current_pe) * float(row["Close"]) / current_price, 2)
                    if ym in result_map2:
                        result_map2[ym]["pe"] = est_pe
                    else:
                        result.append({"date": ym, "pe": est_pe})
                result.sort(key=lambda x: x["date"])
                logger.info(f"[nasdaq100_pe_history] yfinance recent patch applied")
        except Exception as e:
            logger.warning(f"[nasdaq100_pe_history yfinance patch] {e}")

    logger.info(f"[nasdaq100_pe_history] fallback interpolated, {len(result)} points")
    return result


def _yf_monthly(symbol: str) -> dict:
    res = _yf_chart(symbol, interval="1mo", range_="11y")
    if not res:
        raise ConnectionError(f"Yahoo Finance unavailable for {symbol}")
    closes = res["indicators"]["quote"][0]["close"]
    return {
        datetime.utcfromtimestamp(ts).strftime("%Y-%m"): close
        for ts, close in zip(res["timestamp"], closes)
        if close is not None
    }

# ─── 核心数据构建（可被 cron 直接调用）────────────────────────────────────────

def _build_funds(category: str) -> tuple:
    """并发抓取基金日更数据，返回 (results, source)"""
    static = STATIC_FUNDS.get(category, [])
    if not static:
        return [], "empty"

    codes = [f["code"] for f in static]
    live_map: Dict[str, dict] = {}

    # 批量预读 qdii_meta（1 次 RTT 替代 N 次串行读）
    _meta_pre = _cache_mget([f"qdii_meta_{c}" for c in codes])

    ex = ThreadPoolExecutor(max_workers=10)
    try:
        fs = {ex.submit(fetch_one_fund, code, category, _meta_pre.get(code)): code for code in codes}
        done, not_done = wait(fs, timeout=18)   # 每只基金 3 个串行接口，最多等 18 秒
        for fut in not_done:
            fut.cancel()
        for fut in done:
            try:
                item = fut.result()
                if item:
                    live_map[item["code"]] = item
            except Exception:
                pass
    finally:
        ex.shutdown(wait=False)  # 不阻塞等待超时线程

    success_rate = len(live_map) / len(codes)
    logger.info(f"[{category}] {len(live_map)}/{len(codes)} live ({success_rate:.0%})")

    # 静态字段打底，实时字段覆盖（只覆盖 _VOLATILE_FUND_FIELDS）
    results = []
    for fb in static:
        live = live_map.get(fb["code"]) or {}
        volatile_update = {k: v for k, v in live.items() if k in _VOLATILE_FUND_FIELDS}
        results.append({**fb, **volatile_update})

    results.sort(key=lambda x: x.get("ytd_return", 0), reverse=True)
    source = "live" if success_rate >= 0.5 else ("partial" if success_rate > 0 else "none")
    return results, source


def _build_etfs() -> tuple:
    """
    并发抓取 ETF 实时行情，返回 (results, source)。
    数据来源：
      - 新浪财经（批量，单次请求）→ market_price / volume / change_pct
      - 天天基金 fundgz（并发）    → nav（计算溢价率用）
    """
    codes = [etf["code"] for etf in STATIC_ETFS]

    sina_map: Dict[str, dict] = {}
    nav_map:  Dict[str, float] = {}

    ex = ThreadPoolExecutor(max_workers=12)
    try:
        sina_fut = ex.submit(fetch_etfs_sina_batch, codes)
        nav_futs: Dict = {ex.submit(fetch_fund_realtime, c): c for c in codes}

        all_futs = [sina_fut] + list(nav_futs.keys())
        done, not_done = wait(all_futs, timeout=8)

        for fut in not_done:
            fut.cancel()
        for fut in done:
            if fut is sina_fut:
                try:
                    sina_map = fut.result() or {}
                except Exception:
                    pass
            elif fut in nav_futs:
                code = nav_futs[fut]
                try:
                    rt  = fut.result() or {}
                    nav = float(rt.get("dwjz", 0))
                    if nav > 0:
                        nav_map[code] = nav
                except Exception:
                    pass
    finally:
        ex.shutdown(wait=False)

    # 东方财富补充：Sina 未返回数据的 ETF 用东方财富补齐 market_price
    missing = [c for c in codes if c not in sina_map]
    if missing:
        em_map = fetch_etfs_em_fallback(missing)
        sina_map.update(em_map)

    live_count = 0
    results    = []
    for fb in STATIC_ETFS:
        code  = fb["code"]
        sina  = sina_map.get(code, {})
        nav   = nav_map.get(code, 0.0)
        mp    = sina.get("market_price", 0.0)

        nav_ok = nav > 0
        mp_ok  = mp > 0
        if nav_ok and mp_ok:
            premium: Optional[float] = round((mp - nav) / nav * 100, 2)
        elif mp_ok:
            # 有市价但 NAV 拉取失败 → 不保留过期溢价，显示 N/A
            premium = None
        else:
            # 市场休市或双侧均失败 → 保留静态兜底值
            premium = 0.0  # sentinel：过滤掉，由静态数据兜底

        if mp_ok:
            live_count += 1

        live_update = {**sina, "nav": nav, "premium": premium}
        patch: dict = {}
        for k, v in live_update.items():
            if k == "premium":
                if v is None:
                    patch[k] = None          # NAV 失败，清除过期溢价
                elif v != 0.0 or nav_ok:     # 成功计算（含溢价恰好为0的情况）
                    patch[k] = v
                # else: 休市 sentinel，跳过，保留静态兜底
            else:
                if v != 0:
                    patch[k] = v
        merged = {**fb, **patch}
        results.append(merged)

    success_rate = live_count / len(codes) if codes else 0
    logger.info(f"[etfs] sina={len(sina_map)}, nav={len(nav_map)}/{len(codes)} ({success_rate:.0%})")
    results.sort(key=lambda x: abs(x.get("premium", 0)), reverse=True)
    source = "live" if success_rate >= 0.5 else ("partial" if success_rate > 0 else "none")
    return results, source

# ─── FastAPI ──────────────────────────────────────────────────────────────────

app = FastAPI(title="Wise-ETF API", version="3.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


def _cache_header(response: Response, seconds: int):
    # 不做 CDN 边缘缓存，避免 Vercel Edge 提供过期数据
    # 缓存由函数内部 Redis 层控制，每次请求必须打到 serverless 函数
    response.headers["Cache-Control"] = "no-store"


@app.get("/api/funds/{category}")
def get_funds(category: str, response: Response):
    """
    三层容错：内存缓存 → 实时抓取（静态字段不变，只更新日更字段）→ 文件缓存 → 静态兜底
    """
    cache_key = f"funds_{category}"

    # 1. 内存缓存
    cached = _mem_get(cache_key, "funds")
    if cached is not None:
        _cache_header(response, 3600)
        return {"data": cached, "count": len(cached), "source": "cache"}

    static = STATIC_FUNDS.get(category, [])
    if not static:
        return {"data": [], "count": 0, "source": "empty"}

    # 2. 实时抓取
    results, source = _build_funds(category)

    if source in ("live", "partial"):
        _cache_set(cache_key, results, CACHE_TTL["funds"])
    else:
        # 3. 文件缓存（上次成功数据）
        file_data = _file_load(cache_key)
        if file_data:
            _mem_set(cache_key, file_data)
            results = file_data
            source  = "file_cache"
        else:
            # 4. 完全静态兜底
            results = static
            source  = "static"

    _cache_header(response, 3600)
    return {"data": results, "count": len(results), "source": source}


@app.get("/api/etfs")
def get_etfs(response: Response):
    """
    三层容错：内存缓存 → 实时抓取（不变字段保留）→ 文件缓存 → 静态兜底
    """
    cache_key = "etfs"

    cached = _mem_get(cache_key, "etfs")
    if cached is not None:
        _cache_header(response, 300)
        return {"data": cached, "count": len(cached), "source": "cache"}

    results, source = _build_etfs()

    if source in ("live", "partial"):
        _cache_set(cache_key, results, CACHE_TTL["etfs"])
    else:
        file_data = _file_load(cache_key)
        if file_data:
            _mem_set(cache_key, file_data)
            results = file_data
            source  = "file_cache"
        else:
            results = STATIC_ETFS
            source  = "static"

    _cache_header(response, 300)
    return {"data": results, "count": len(results), "source": source}


@app.get("/api/overview")
def get_overview(response: Response):
    _cache_header(response, 3600)
    return {
        "stats": {**{k: {"count": len(v)} for k, v in STATIC_FUNDS.items()},
                  **{"etf": {"count": len(STATIC_ETFS)}}},
        "last_update": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "total_funds": sum(len(v) for v in STATIC_FUNDS.values()) + len(STATIC_ETFS),
    }


@app.get("/api/fx-index-history")
def get_fx_index_history(response: Response):
    """
    优先 Yahoo Finance 月度数据（~130个点）；
    被墙/超时时返回静态关键月份数据（24个点）。
    """
    cache_key = "fx_history"

    cached = _mem_get(cache_key, "fx_history")
    if cached is not None:
        _cache_header(response, 21600)
        return {"data": cached, "source": "cache"}

    try:
        ndx = _yf_monthly("^NDX")
        spx = _yf_monthly("^GSPC")
        fx  = _yf_monthly("USDCNY=X")

        months = sorted(set(ndx) & set(spx) & set(fx))
        if not months:
            raise ValueError("Empty intersection")

        data   = [{"month": m, "usdcny": fx[m], "ndx_close": ndx[m], "spx_close": spx[m]}
                  for m in months]
        source = "live"
        logger.info(f"[fx-history] {len(data)} months from Yahoo Finance")
        _cache_set(cache_key, data, CACHE_TTL["fx_history"])
    except Exception as e:
        logger.warning(f"[fx-history] Yahoo Finance fallback ({e})")
        file_data = _file_load(cache_key)
        if file_data:
            data   = file_data
            source = "file_cache"
        else:
            data   = STATIC_FX_HISTORY
            source = "static"

    _cache_header(response, 21600)
    return {"data": data, "source": source}


# ── 情感关键词（轻量级，针对纳指/科技股语境）──────────────────────────────────
_BEARISH = {
    "fall", "falls", "fell", "drop", "drops", "dropped", "decline", "declines", "declined",
    "correction", "sell-off", "selloff", "plunge", "plunges", "slump", "tumble", "tumbles",
    "recession", "tariff", "tariffs", "hike", "hikes", "hawkish", "miss", "misses", "missed",
    "weak", "weaker", "concern", "concerns", "fear", "fears", "warning", "warns", "worse",
    "loss", "losses", "crash", "lower", "down", "sinks", "sank", "retreat", "retreats",
    "inflation", "layoff", "layoffs",
}
_BULLISH = {
    "rally", "rallies", "surge", "surges", "gain", "gains", "rise", "rises", "rose",
    "beat", "beats", "strong", "stronger", "growth", "cut", "cuts", "dovish", "positive",
    "record", "high", "recover", "recovers", "rebound", "rebounds", "lift", "lifts",
    "outperform", "upgrade", "upgrades", "boost", "boosted", "jump", "jumps", "jumped",
    "soar", "soars", "optimism", "upside", "better",
}

def _sentiment(title: str) -> str:
    words = set(title.lower().replace("-", " ").replace("'s", "").split())
    bull  = len(words & _BULLISH)
    bear  = len(words & _BEARISH)
    if bull > bear:  return "bullish"
    if bear > bull:  return "bearish"
    return "neutral"

# 与纳指/科技相关的筛选词（必须含其一，避免无关新闻混入）
_NASDAQ_KEYWORDS = {
    "nasdaq", "qqq", "tech", "technology", "ai", "artificial intelligence",
    "semiconductor", "chip", "fed", "federal reserve", "rate", "inflation",
    "s&p", "s&p 500", "market", "stock", "equity", "equities", "etf",
    "earnings", "gdp", "tariff", "trade", "big tech", "apple", "nvidia",
    "microsoft", "google", "alphabet", "amazon", "meta", "tesla",
}

def _is_relevant(title: str) -> bool:
    t = title.lower()
    return any(kw in t for kw in _NASDAQ_KEYWORDS)


def _translate_zh(text: str) -> str:
    """Google Translate 非官方接口，无需 API Key，失败时返回原文"""
    try:
        import urllib.parse
        url  = "https://translate.googleapis.com/translate_a/single"
        resp = _get(url, params={
            "client": "gtx", "sl": "en", "tl": "zh-CN", "dt": "t", "q": text
        }, timeout=(2, 5))
        if resp and resp.ok:
            data = resp.json()
            translated = "".join(seg[0] for seg in data[0] if seg[0])
            if translated:
                return translated
    except Exception as e:
        logger.warning(f"[translate] {e}")
    return text


def fetch_market_news() -> list:
    """
    抓取影响纳指的市场新闻。
    数据源：Yahoo Finance RSS（QQQ + ^NDX）
    返回：[{title, link, age_hours, sentiment}]
    """
    sources = [
        "https://feeds.finance.yahoo.com/rss/2.0/headline?s=QQQ&region=US&lang=en-US",
        "https://feeds.finance.yahoo.com/rss/2.0/headline?s=%5ENDX&region=US&lang=en-US",
    ]
    seen, candidates = set(), []
    for url in sources:
        resp = _get(url, headers=YF_HEADERS, timeout=(3, 8))
        if not (resp and resp.ok):
            continue
        try:
            root = ET.fromstring(resp.content)
            for item in root.findall(".//item"):
                title = (item.findtext("title") or "").strip()
                link  = (item.findtext("link")  or "").strip()
                pub   = (item.findtext("pubDate") or "").strip()
                if not title or title in seen:
                    continue
                seen.add(title)
                age_h = None
                try:
                    dt    = parsedate_to_datetime(pub)
                    age_h = round((datetime.now(dt.tzinfo) - dt).total_seconds() / 3600, 1)
                except Exception:
                    pass
                candidates.append({
                    "title":      title,
                    "link":       link,
                    "age_hours":  age_h,
                    "sentiment":  _sentiment(title),
                    "_relevant":  _is_relevant(title),
                })
        except Exception as e:
            logger.warning(f"[news] parse {url[:50]}: {e}")

    # 相关新闻优先，再按时间排（age_hours 小的更新）
    candidates.sort(key=lambda x: (0 if x["_relevant"] else 1, x["age_hours"] or 999))
    top = candidates[:5]

    # 并发翻译标题
    with ThreadPoolExecutor(max_workers=5) as ex:
        futs = {ex.submit(_translate_zh, n["title"]): i for i, n in enumerate(top)}
        done, _ = wait(futs, timeout=6)
        for fut in done:
            idx = futs[fut]
            try:
                top[idx]["title"] = fut.result() or top[idx]["title"]
            except Exception:
                pass

    items = [{k: v for k, v in n.items() if k != "_relevant"} for n in top]
    logger.info(f"[news] fetched {len(items)} items (from {len(candidates)} candidates)")
    return items


@app.get("/api/news")
def get_news(response: Response):
    """市场新闻（Yahoo Finance RSS，30min 缓存）"""
    cache_key = "news"
    cached = _mem_get(cache_key, "news")
    if cached is not None:
        _cache_header(response, 1800)
        return {"data": cached, "source": "cache"}

    data = fetch_market_news()
    if data:
        _mem_set(cache_key, data)
    _cache_header(response, 1800)
    return {"data": data, "source": "live" if data else "empty"}


@app.get("/api/cron/refresh")
def cron_refresh():
    """Vercel Cron Job（UTC 01:30 / 北京 09:30）：拉取全量最新数据写入 Redis"""
    results: dict = {}

    # 先删掉旧缓存，确保新数据立即生效
    r = _get_redis()
    if r:
        try:
            old_keys = [f"funds_{cat}" for cat in STATIC_FUNDS] + ["etfs", "live_data"]
            r.delete(*old_keys)
            logger.info(f"[cron] cleared {len(old_keys)} stale cache keys")
        except Exception as e:
            logger.warning(f"[cron] cache clear failed: {e}")

    # 三个基金分类 + ETF 并行构建
    def _refresh_category(category: str):
        data, source = _build_funds(category)
        if source != "none":
            _cache_set(f"funds_{category}", data, CACHE_TTL["funds"])
        return category, {"count": len(data), "source": source}

    def _refresh_etfs():
        data, source = _build_etfs()
        if source != "none":
            _cache_set("etfs", data, CACHE_TTL["etfs"])
        return "etfs", {"count": len(data), "source": source}

    with ThreadPoolExecutor(max_workers=4) as ex:
        futs = [ex.submit(_refresh_category, cat) for cat in STATIC_FUNDS]
        futs.append(ex.submit(_refresh_etfs))
        for fut in futs:
            try:
                key, val = fut.result(timeout=25)
                results[key] = val
            except Exception as e:
                results[f"error_{id(fut)}"] = str(e)

    return {"ts": datetime.now().isoformat(), "v": "v5", "results": results}


@app.get("/api/cron/prem")
def cron_prem():
    """独立 cron：只刷溢价率历史（数据量大，单独跑避免主 cron 超时）"""
    results = {}
    for etf in STATIC_ETFS:
        code = etf["code"]
        try:
            hist = fetch_premium_history(code)
            if hist:
                _cache_set(f"prem_hist_{code}", hist, CACHE_TTL["premium_history"])
            results[code] = len(hist)
        except Exception as e:
            results[code] = str(e)
    return {"ts": datetime.now().isoformat(), "results": results}


@app.get("/api/cron/qdii")
def cron_qdii():
    """
    QDII估值预热 cron（Vercel Cron 触发）：
    在各时段开始前5分钟运行，确保新时段开始时数据已在 Redis。
      UTC 07:55 / HKT 15:55  → 盘前预热（pre_market 15:00 HKT 启动前）
      UTC 13:25 / HKT 21:25  → 盘中预热（us_open 21:30 HKT 启动前）
      UTC 19:55 / HKT 03:55  → 盘后预热（post_market 04:00 HKT 启动前）
    策略：清旧缓存 → 全量重算 → 写入 Redis，用户刷新时直接命中缓存
    """
    session = _current_session()
    logger.info(f"[cron/qdii] pre-warming started, session={session}")

    # 清旧缓存（这里主动删是安全的，因为 cron 在窗口开始前5分钟跑，此时用户量极少）
    _cache_delete("qdii_valuations")

    # 复用主端点逻辑：force=False light=False + 无缓存 → 走完整计算流程
    dummy_resp = Response()
    try:
        result = api_qdii_valuations(dummy_resp, force=False, light=False)
        fund_count = len(result.get("funds", [])) if isinstance(result, dict) else 0
        logger.info(f"[cron/qdii] pre-warming done: {fund_count} funds, session={session}")
        return {"ok": True, "ts": datetime.now().isoformat(), "session": session, "funds": fund_count}
    except Exception as e:
        logger.error(f"[cron/qdii] pre-warming failed: {e}")
        return {"ok": False, "ts": datetime.now().isoformat(), "session": session, "error": str(e)}


@app.get("/api/cron/clear")
def cron_clear():
    """清空 Redis 基金缓存，下次用户请求时自动重拉（用于强制刷新）"""
    r = _get_redis()
    if not r:
        return {"ok": False, "msg": "Redis unavailable"}
    keys = [f"funds_{cat}" for cat in STATIC_FUNDS] + ["etfs", "live_data"]
    try:
        r.delete(*keys)
        return {"ok": True, "cleared": keys}
    except Exception as e:
        return {"ok": False, "msg": str(e)}


@app.get("/api/cache/delete")
def cache_delete_key(key: str = ""):
    """删除指定 Redis key。
    GET /api/cache/delete?key=stock_last_post_KLAC
    支持精确 key，也支持通配符（如 stock_pf_KLAC* 会删除所有匹配的 key）。
    """
    if not key:
        return {"ok": False, "msg": "key is required"}
    r = _get_redis()
    if not r:
        return {"ok": False, "msg": "Redis unavailable"}
    try:
        if "*" in key:
            _cache_delete_pattern(key)
            return {"ok": True, "pattern": key}
        else:
            _cache_delete(key)
            return {"ok": True, "deleted": [key]}
    except Exception as e:
        return {"ok": False, "msg": str(e)}


# ─── 实时行情：昨日涨跌 + 近1年滚动涨幅 ──────────────────────────────────────

_ALL_CODES = [
    f["code"] for cat in STATIC_FUNDS.values() for f in cat
] + [e["code"] for e in STATIC_ETFS]

_LIVE_CACHE: dict = {}
_LIVE_CACHE_TS: float = 0.0


_MOBILE_HEADERS = {
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
    "Referer": "https://mpservice.com",
    "Origin": "https://mpservice.com",
    "Accept": "application/json, text/plain, */*",
}


def _fetch_live_one(code: str) -> tuple:
    """单次调用 FundMNBasicInformation 获取 RZDF/SYL_1N/SGZT/MAXSG"""
    day_change, rolling_1y, buy_status, daily_limit = None, None, None, None
    for attempt in range(2):
        try:
            resp = requests.get(
                "https://fundmobapi.eastmoney.com/FundMNewApi/FundMNBasicInformation",
                params={"FCODE": code, "deviceid": "wise-etf",
                        "plat": "Wap", "product": "EFund", "version": "6.5.0"},
                headers=_MOBILE_HEADERS, timeout=(4, 8), verify=False)
            if resp.ok:
                d = resp.json()
                if d.get("ErrCode") == 0:
                    data = d.get("Datas", {})
                    rzdf = data.get("RZDF", "")
                    if rzdf not in ("", "--", None):
                        day_change = float(rzdf)
                    syl1n = data.get("SYL_1N", "")
                    if syl1n not in ("", "--", None):
                        rolling_1y = float(syl1n)
                    sgzt  = data.get("SGZT", "")
                    maxsg = data.get("MAXSG", "")
                    if sgzt:
                        has_limit = maxsg and str(maxsg) not in ("", "--", "0", "None")
                        if has_limit:
                            try:
                                val = int(float(maxsg))
                                daily_limit = "不限额" if val >= 500_000 else f"{val}元"
                            except (ValueError, TypeError):
                                daily_limit = f"{maxsg}元"
                            buy_status = "open"
                        elif "暂停" in sgzt:
                            buy_status = "suspended"
                            daily_limit = "暂停申购"
                        else:
                            buy_status = "open"
                            daily_limit = "不限额"
            break
        except Exception:
            if attempt == 0:
                time.sleep(0.5)
    return code, {"day_change": day_change, "rolling_1y": rolling_1y,
                  "buy_status": buy_status, "daily_limit": daily_limit}


# ─── ETF 溢价率历史 ──────────────────────────────────────────────────────────────

_SINA_KL_HEADERS = {
    "User-Agent": HEADERS["User-Agent"],
    "Referer":    "https://finance.sina.com.cn/",
}

def fetch_premium_history(code: str, days: int = 35) -> list:
    """
    计算ETF近N个交易日的真实溢价率。
    - 历史净值：东方财富 f10/lsjz
    - 历史收盘价：新浪财经 CN_MarketData.getKLineData（scale=240 = 日线）
    """
    prefix = "sh" if code.startswith("5") else "sz"

    # 1. 历史净值
    nav_map: Dict[str, float] = {}
    try:
        resp = _get(
            "https://api.fund.eastmoney.com/f10/lsjz",
            params={"fundCode": code, "pageIndex": 1, "pageSize": days + 5},
            headers={**HEADERS, "Referer": "https://fundf10.eastmoney.com/"},
            timeout=(3, 6), verify=False,
        )
        if resp and resp.ok:
            for item in resp.json().get("Data", {}).get("LSJZList", []):
                d, v = item.get("FSRQ", ""), item.get("DWJZ", "")
                if d and v:
                    try:
                        nav_map[d] = float(v)
                    except Exception:
                        pass
    except Exception as e:
        logger.warning(f"[prem_hist] NAV failed {code}: {e}")

    # 2. 历史收盘价
    price_map: Dict[str, float] = {}
    try:
        resp = _get(
            "https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData",
            params={"symbol": f"{prefix}{code}", "scale": 240, "ma": "no", "datalen": days + 5},
            headers=_SINA_KL_HEADERS,
            timeout=(3, 6),
        )
        if resp and resp.ok:
            for item in resp.json():
                d, c = item.get("day", ""), item.get("close", "")
                if d and c:
                    try:
                        price_map[d] = float(c)
                    except Exception:
                        pass
    except Exception as e:
        logger.warning(f"[prem_hist] price failed {code}: {e}")

    # 3. 交叉匹配 + 计算溢价率
    common = sorted(set(nav_map) & set(price_map))
    result = []
    for full_date in common[-days:]:
        nav   = nav_map[full_date]
        price = price_map[full_date]
        if nav <= 0:
            continue
        premium = round((price - nav) / nav * 100, 2)
        parts   = full_date.split("-")
        label   = f"{int(parts[1])}/{int(parts[2])}" if len(parts) == 3 else full_date
        result.append({"date": label, "premium": premium})

    logger.info(f"[prem_hist] {code}: {len(result)} points (nav={len(nav_map)}, price={len(price_map)})")
    return result


# ─── 溢价率历史静态兜底（2026-04-02 真实数据）────────────────────────────────────
STATIC_PREMIUM_HISTORY: Dict[str, list] = {
    "513100": [{"date":"3/4","premium":1.67},{"date":"3/5","premium":4.33},{"date":"3/6","premium":5.95},{"date":"3/9","premium":1.78},{"date":"3/10","premium":3.93},{"date":"3/11","premium":4.22},{"date":"3/12","premium":5.51},{"date":"3/13","premium":5.08},{"date":"3/16","premium":4.26},{"date":"3/17","premium":3.53},{"date":"3/18","premium":6.36},{"date":"3/19","premium":5.08},{"date":"3/20","premium":6.28},{"date":"3/23","premium":0.67},{"date":"3/24","premium":3.83},{"date":"3/25","premium":4.21},{"date":"3/26","premium":5.43},{"date":"3/27","premium":6.88},{"date":"3/30","premium":6.02},{"date":"3/31","premium":2.01}],
    "513110": [{"date":"3/4","premium":0.09},{"date":"3/5","premium":2.66},{"date":"3/6","premium":4.29},{"date":"3/9","premium":0.34},{"date":"3/10","premium":2.65},{"date":"3/11","premium":2.82},{"date":"3/12","premium":3.99},{"date":"3/13","premium":3.48},{"date":"3/16","premium":2.73},{"date":"3/17","premium":1.79},{"date":"3/18","premium":4.74},{"date":"3/19","premium":2.97},{"date":"3/20","premium":4.41},{"date":"3/23","premium":-0.9},{"date":"3/24","premium":2.69},{"date":"3/25","premium":2.74},{"date":"3/26","premium":4.06},{"date":"3/27","premium":5.21},{"date":"3/30","premium":4.22},{"date":"3/31","premium":0.03}],
    "159941": [{"date":"3/4","premium":0.71},{"date":"3/5","premium":3.63},{"date":"3/6","premium":5.09},{"date":"3/9","premium":1.09},{"date":"3/10","premium":3.07},{"date":"3/11","premium":3.37},{"date":"3/12","premium":4.48},{"date":"3/13","premium":4.11},{"date":"3/16","premium":3.6},{"date":"3/17","premium":2.6},{"date":"3/18","premium":5.5},{"date":"3/19","premium":3.8},{"date":"3/20","premium":5.14},{"date":"3/23","premium":0.27},{"date":"3/24","premium":3.11},{"date":"3/25","premium":3.37},{"date":"3/26","premium":4.76},{"date":"3/27","premium":6.26},{"date":"3/30","premium":5.12},{"date":"3/31","premium":1.48}],
    "513300": [{"date":"3/4","premium":-0.15},{"date":"3/5","premium":2.98},{"date":"3/6","premium":4.51},{"date":"3/9","premium":0.48},{"date":"3/10","premium":3.03},{"date":"3/11","premium":3.11},{"date":"3/12","premium":4.22},{"date":"3/13","premium":3.49},{"date":"3/16","premium":2.68},{"date":"3/17","premium":1.82},{"date":"3/18","premium":4.98},{"date":"3/19","premium":2.92},{"date":"3/20","premium":4.25},{"date":"3/23","premium":-0.8},{"date":"3/24","premium":2.56},{"date":"3/25","premium":2.52},{"date":"3/26","premium":4.23},{"date":"3/27","premium":5.64},{"date":"3/30","premium":4.92},{"date":"3/31","premium":0.49}],
    "159659": [{"date":"3/4","premium":0.67},{"date":"3/5","premium":3.07},{"date":"3/6","premium":4.54},{"date":"3/9","premium":0.95},{"date":"3/10","premium":2.81},{"date":"3/11","premium":2.88},{"date":"3/12","premium":4.07},{"date":"3/13","premium":3.58},{"date":"3/16","premium":2.8},{"date":"3/17","premium":1.77},{"date":"3/18","premium":4.82},{"date":"3/19","premium":3.14},{"date":"3/20","premium":4.48},{"date":"3/23","premium":-0.54},{"date":"3/24","premium":2.51},{"date":"3/25","premium":2.66},{"date":"3/26","premium":4.36},{"date":"3/27","premium":5.52},{"date":"3/30","premium":4.58},{"date":"3/31","premium":0.66}],
    "159632": [{"date":"3/4","premium":-0.32},{"date":"3/5","premium":2.74},{"date":"3/6","premium":4.17},{"date":"3/9","premium":0.22},{"date":"3/10","premium":2.46},{"date":"3/11","premium":2.62},{"date":"3/12","premium":3.9},{"date":"3/13","premium":3.43},{"date":"3/16","premium":2.57},{"date":"3/17","premium":1.63},{"date":"3/18","premium":4.6},{"date":"3/19","premium":2.7},{"date":"3/20","premium":4.02},{"date":"3/23","premium":-1.02},{"date":"3/24","premium":2.23},{"date":"3/25","premium":2.45},{"date":"3/26","premium":3.92},{"date":"3/27","premium":5.16},{"date":"3/30","premium":4.31},{"date":"3/31","premium":0.16}],
    "159509": [{"date":"3/4","premium":9.67},{"date":"3/5","premium":14.57},{"date":"3/6","premium":17.16},{"date":"3/9","premium":11.07},{"date":"3/10","premium":14.43},{"date":"3/11","premium":14.2},{"date":"3/12","premium":15.63},{"date":"3/13","premium":16.0},{"date":"3/16","premium":16.45},{"date":"3/17","premium":14.4},{"date":"3/18","premium":17.43},{"date":"3/19","premium":15.73},{"date":"3/20","premium":17.21},{"date":"3/23","premium":11.23},{"date":"3/24","premium":16.51},{"date":"3/25","premium":16.74},{"date":"3/26","premium":17.28},{"date":"3/27","premium":19.39},{"date":"3/30","premium":19.02},{"date":"3/31","premium":13.29}],
    "513500": [{"date":"3/4","premium":4.28},{"date":"3/5","premium":6.07},{"date":"3/6","premium":6.99},{"date":"3/9","premium":3.37},{"date":"3/10","premium":4.6},{"date":"3/11","premium":4.88},{"date":"3/12","premium":6.67},{"date":"3/13","premium":5.76},{"date":"3/16","premium":4.29},{"date":"3/17","premium":4.35},{"date":"3/18","premium":5.93},{"date":"3/19","premium":4.95},{"date":"3/20","premium":5.97},{"date":"3/23","premium":0.1},{"date":"3/24","premium":2.57},{"date":"3/25","premium":3.14},{"date":"3/26","premium":5.01},{"date":"3/27","premium":6.19},{"date":"3/30","premium":4.62},{"date":"3/31","premium":1.38}],
    "159612": [{"date":"3/4","premium":4.13},{"date":"3/5","premium":5.85},{"date":"3/6","premium":6.81},{"date":"3/9","premium":3.7},{"date":"3/10","premium":5.2},{"date":"3/11","premium":5.38},{"date":"3/12","premium":6.71},{"date":"3/13","premium":6.47},{"date":"3/16","premium":5.03},{"date":"3/17","premium":4.89},{"date":"3/18","premium":6.73},{"date":"3/19","premium":5.73},{"date":"3/20","premium":6.68},{"date":"3/23","premium":0.91},{"date":"3/24","premium":2.92},{"date":"3/25","premium":4.26},{"date":"3/26","premium":5.11},{"date":"3/27","premium":6.29},{"date":"3/30","premium":5.53},{"date":"3/31","premium":2.65}],
    "513650": [{"date":"3/4","premium":2.38},{"date":"3/5","premium":4.25},{"date":"3/6","premium":5.5},{"date":"3/9","premium":2.13},{"date":"3/10","premium":3.42},{"date":"3/11","premium":3.96},{"date":"3/12","premium":5.33},{"date":"3/13","premium":4.67},{"date":"3/16","premium":2.77},{"date":"3/17","premium":2.65},{"date":"3/18","premium":4.63},{"date":"3/19","premium":2.99},{"date":"3/20","premium":4.38},{"date":"3/23","premium":-1.17},{"date":"3/24","premium":1.31},{"date":"3/25","premium":1.91},{"date":"3/26","premium":3.49},{"date":"3/27","premium":4.68},{"date":"3/30","premium":3.14},{"date":"3/31","premium":-0.17}],
}


@app.get("/api/premium_history/{code}")
def get_premium_history(code: str, response: Response):
    """ETF历史溢价率（近30个交易日）"""
    cache_key = f"prem_hist_{code}"

    cached = _mem_get(cache_key, "premium_history")
    if cached is not None:
        _cache_header(response, 1800)
        return {"data": cached, "source": "cache"}

    data = fetch_premium_history(code)
    if data:
        _mem_set(cache_key, data)
    else:
        # 实时抓取失败，使用静态兜底
        data = STATIC_PREMIUM_HISTORY.get(code, [])
        if data:
            logger.info(f"[prem_hist] {code} fallback to static data")

    _cache_header(response, 1800)
    return {"data": data, "source": "live" if data else "empty"}


@app.get("/api/debug_live/{code}")
def debug_live(code: str):
    """调试：单只基金实时行情"""
    import urllib3; urllib3.disable_warnings()
    rt_resp = None; perf_resp_json = None; err = None
    try:
        r = requests.get(f"http://fundgz.1234567.com.cn/js/{code}.js", headers=HEADERS, timeout=(4,8))
        m = re.search(r"jsonpgz\((.+)\)", r.text)
        rt_resp = json.loads(m.group(1)) if m else r.text[:200]
    except Exception as e:
        rt_resp = str(e)
    try:
        r2 = requests.get("https://fundmobapi.eastmoney.com/FundMNewApi/FundMNPeriodIncrease",
            params={"FCODE":code,"deviceid":"wise-etf","plat":"Wap","product":"EFund","version":"6.5.0"},
            headers={
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
                "Referer": "https://mpservice.com",
                "Origin": "https://mpservice.com",
                "Accept": "application/json, text/plain, */*",
            },
            timeout=(6,12), verify=False)
        perf_resp_json = r2.json()
    except Exception as e:
        err = str(e)
    return {"rt": rt_resp, "perf": perf_resp_json, "err": err}

def _build_live_data() -> dict:
    """并发拉取所有基金昨日涨跌/申购状态，返回 {code: {...}} 字典"""
    result = {}
    with ThreadPoolExecutor(max_workers=20) as ex:
        futures = {ex.submit(_fetch_live_one, code): code for code in _ALL_CODES}
        for f in futures:
            try:
                code, data = f.result(timeout=10)
                result[code] = {k: v for k, v in data.items() if v is not None}
            except Exception:
                pass
    return result


@app.get("/api/live_data")
def get_live_data(response: Response):
    """昨日涨跌(day_change) + 近1年滚动涨幅(rolling_1y) + 申购状态
    缓存策略：服务端内存+文件缓存12h，cron 每日 09:30 预热
    """
    cached = _mem_get("live_data", "live_data")
    if cached is not None:
        _cache_header(response, 43200)
        return {"data": cached, "source": "cache"}

    data = _build_live_data()
    if data:
        _cache_set("live_data", data, CACHE_TTL["live_data"])
    else:
        data = _cache_get("live_data") or {}

    _cache_header(response, 43200)
    return {"data": data, "source": "live" if data else "empty"}


@app.get("/api/market-sentiment")
def get_market_sentiment(response: Response):
    """市场情绪：VIX 恐慌指数 + CNN 恐慌贪婪指数 + S&P500 PE分位 + 纳斯达克100 PE分位（15min缓存）"""
    cache_key = "market_sentiment"
    cached = _mem_get(cache_key, "news")
    if cached is not None:
        _cache_header(response, 900)
        return {"data": cached, "source": "cache"}

    with ThreadPoolExecutor(max_workers=6) as ex:
        f_vix    = ex.submit(fetch_vix)
        f_fg     = ex.submit(fetch_fear_greed)
        f_pe     = ex.submit(fetch_sp500_pe)
        f_nq_pe  = ex.submit(fetch_nasdaq100_pe)
        f_ndx    = ex.submit(fetch_index_price, "^NDX")
        f_spx    = ex.submit(fetch_index_price, "^GSPC")
        try:
            vix = f_vix.result(timeout=15)
        except Exception:
            vix = {}
        try:
            fg = f_fg.result(timeout=15)
        except Exception:
            fg = {}
        try:
            pe = f_pe.result(timeout=15)
        except Exception:
            pe = {}
        try:
            nq_pe = f_nq_pe.result(timeout=15)
        except Exception:
            nq_pe = {}
        try:
            ndx_price = f_ndx.result(timeout=15)
        except Exception:
            ndx_price = {}
        try:
            spx_price = f_spx.result(timeout=15)
        except Exception:
            spx_price = {}

    data = {"vix": vix, "fear_greed": fg, "pe": pe, "nasdaq_pe": nq_pe, "ndx_price": ndx_price, "spx_price": spx_price}
    if any(v for v in data.values()):
        _cache_set(cache_key, data, 15 * 60)
    _cache_header(response, 900)
    return {"data": data, "source": "live" if any(data.values()) else "empty"}


@app.get("/api/pe-history")
def get_pe_history(response: Response):
    """标普500 + 纳指100 历史月度 PE（1990–今，6小时缓存）"""
    cache_key = "pe_history_v2"
    cached = _mem_get(cache_key, "fx_history")
    if cached is not None:
        _cache_header(response, 21600)
        return {"data": cached, "source": "cache"}
    # 先并行拿当前 PE 和标普历史；纳指历史需要依赖当前 PE 才能校准近期月度
    with ThreadPoolExecutor(max_workers=3) as ex:
        f_sp_cur = ex.submit(fetch_sp500_pe)
        f_nq_cur = ex.submit(fetch_nasdaq100_pe)
        f_sp     = ex.submit(fetch_sp500_pe_history, 1990)
        try:
            sp_cur  = f_sp_cur.result(timeout=15)
        except Exception:
            sp_cur  = {}
        try:
            nq_cur  = f_nq_cur.result(timeout=15)
        except Exception:
            nq_cur  = {}
        try:
            sp500   = f_sp.result(timeout=25)
        except Exception:
            sp500   = []
    # 把当前纳指 PE 传入，用于校准近期月度数据
    try:
        nasdaq = fetch_nasdaq100_pe_history(current_pe=nq_cur.get("pe"))
    except Exception:
        nasdaq = []
    # Extend series to current month using live PE values
    from datetime import date as _date
    today_ym = _date.today().strftime("%Y-%m")
    def _extend(series, cur_pe_val):
        if not series:
            return series
        # Fall back to last known PE if live fetch failed
        pe_val = cur_pe_val if cur_pe_val else series[-1]["pe"]
        last = series[-1]["date"]
        yr, mo = map(int, last.split("-"))
        mo += 1
        if mo > 12:
            mo = 1; yr += 1
        while f"{yr}-{mo:02d}" <= today_ym:
            series.append({"date": f"{yr}-{mo:02d}", "pe": round(float(pe_val), 2)})
            mo += 1
            if mo > 12:
                mo = 1; yr += 1
        return series
    sp500  = _extend(sp500,  sp_cur.get("pe"))
    nasdaq = _extend(nasdaq, nq_cur.get("pe"))
    data = {"sp500": sp500, "nasdaq100": nasdaq}
    if sp500 or nasdaq:
        _cache_set(cache_key, data, 6 * 3600)
    _cache_header(response, 21600)
    return {"data": data, "source": "live"}


def _call_deepseek(prompt: str) -> str:
    """调用 DeepSeek API（兼容 OpenAI 格式）"""
    api_key = os.environ.get("DEEPSEEK_API_KEY", "")
    if not api_key:
        return ""
    try:
        resp = requests.post(
            "https://api.deepseek.com/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={
                "model": "deepseek-chat",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 800,
                "temperature": 0.4,
            },
            timeout=(5, 30),
        )
        if resp.ok:
            return resp.json()["choices"][0]["message"]["content"].strip()
    except Exception as e:
        logger.warning(f"[deepseek] {e}")
    return ""


@app.get("/api/market-ai-insight")
def get_market_ai_insight(response: Response):
    """DeepSeek AI 市场深度解读（缓存2小时）"""
    cache_key = "market_ai_insight"
    cached = _mem_get(cache_key, "news")
    if cached is not None:
        _cache_header(response, 7200)
        return {"data": cached, "source": "cache"}

    # 获取最新指数数据
    with ThreadPoolExecutor(max_workers=2) as ex:
        f_ndx = ex.submit(fetch_index_price, "^NDX")
        f_spx = ex.submit(fetch_index_price, "^GSPC")
        ndx = f_ndx.result(timeout=20)
        spx = f_spx.result(timeout=20)

    if not ndx or not spx:
        return {"data": None, "source": "empty"}

    def fmt(v, suffix=""):
        if v is None: return "暂无"
        sign = "+" if v >= 0 else ""
        return f"{sign}{v}{suffix}"

    today = datetime.utcnow().strftime("%Y-%m-%d")

    # ── Step 1：让 AI 先提炼客观数据洞察 ──────────────────────────────────────
    step1_prompt = f"""根据以下美股市场数据，用1-2句话提炼出4个最值得关注的积极事实，重点关注：
长期牛市趋势的延续性、连涨天数体现的强势动能、双指数携手走强的健康格局、科技股领涨的结构性机会。
只输出4条简短的正向事实陈述，每条一行，不需要标题或编号。

数据（{today}）：
纳指100：{ndx.get('price')}点 今日{fmt(ndx.get('change_pct'),'%')} 连涨{ndx.get('streak',0)}天 近15日{fmt(ndx.get('returns',{}).get('d15'),'%')} 近1月{fmt(ndx.get('returns',{}).get('mo1'),'%')} 近半年{fmt(ndx.get('returns',{}).get('mo6'),'%')} 近1年{fmt(ndx.get('returns',{}).get('yr1'),'%')} 年内高{ndx.get('yr_high')} 低{ndx.get('yr_low')}
标普500：{spx.get('price')}点 今日{fmt(spx.get('change_pct'),'%')} 连涨{spx.get('streak',0)}天 近15日{fmt(spx.get('returns',{}).get('d15'),'%')} 近1月{fmt(spx.get('returns',{}).get('mo1'),'%')} 近半年{fmt(spx.get('returns',{}).get('mo6'),'%')} 近1年{fmt(spx.get('returns',{}).get('yr1'),'%')} 年内高{spx.get('yr_high')} 低{spx.get('yr_low')}"""

    raw_facts = _call_deepseek(step1_prompt)
    if not raw_facts:
        return {"data": None, "source": "empty"}

    # ── Step 2：把客观事实转化成长期乐观投资者的口吻 ──────────────────────────────
    step2_prompt = f"""下面是今天（{today}）美股市场的4个关键事实：

{raw_facts}

现在你是一个有15年经验、长期持有纳指/标普的乐观价值投资者，把这4条事实转化成你自己的真实想法，像在跟好朋友分享投资心得。
要求：
- 用第一人称"我"，语气积极正面，比如"我越来越坚定..."、"这让我想起..."、"历史告诉我..."、"我的策略很简单..."
- 聚焦长期视角：纳指/标普过去几十年从未让长期持有者失望，每次回调都是加仓机会
- 每条50-80字，结合具体历史数据或典型行情（如2009、2020疫情后复苏）来支撑乐观观点
- 4条分别对应4个不同角度（趋势/动能/结构/策略），level全部使用"bullish"
- 严格输出JSON数组格式：
[{{"tag":"3-5字标题","icon":"一个emoji","text":"你的观点","level":"bullish"}}]
- 只输出JSON，不要任何其他文字"""

    ai_text = _call_deepseek(step2_prompt)

    # 解析 JSON
    insights = []
    if ai_text:
        try:
            match = re.search(r'\[.*\]', ai_text, re.DOTALL)
            if match:
                insights = json.loads(match.group())
        except Exception as e:
            logger.warning(f"[deepseek:parse] {e}, raw: {ai_text[:200]}")

    result = {
        "insights": insights,
        "ndx_summary": {"price": ndx.get('price'), "streak": ndx.get('streak'), "yr_high": ndx.get('yr_high')},
        "spx_summary": {"price": spx.get('price'), "streak": spx.get('streak'), "yr_high": spx.get('yr_high')},
        "generated_at": datetime.utcnow().strftime("%Y-%m-%d") + " 每日更新",
    }

    if insights:
        _cache_set(cache_key, result, 24 * 3600)  # 缓存24小时，每日更新一次
    _cache_header(response, 86400)
    return {"data": result, "source": "live" if insights else "empty"}


# ─── 微信小程序：登录 & 用户收藏 ──────────────────────────────────────────────

from pydantic import BaseModel

class WxLoginBody(BaseModel):
    code: str

class FavoritesBody(BaseModel):
    openid: str
    favorites: list

@app.post("/api/wx/login")
def wx_login(body: WxLoginBody):
    """微信 code 换 openid（服务端保存 session_key，前端只拿 openid）"""
    appid  = os.environ.get("WX_APPID")
    secret = os.environ.get("WX_SECRET")
    if not appid or not secret:
        return {"error": "wx credentials not configured"}, 500

    resp = _get(
        "https://api.weixin.qq.com/sns/jscode2session",
        params={
            "appid":      appid,
            "secret":     secret,
            "js_code":    body.code,
            "grant_type": "authorization_code",
        },
        timeout=(3, 5),
    )
    if not resp or not resp.ok:
        return {"error": "weixin api failed"}

    data = resp.json()
    if "errcode" in data and data["errcode"] != 0:
        logger.warning(f"[wx_login] errcode={data['errcode']} errmsg={data.get('errmsg')}")
        return {"error": data.get("errmsg", "wx login failed")}

    openid      = data.get("openid")
    session_key = data.get("session_key", "")

    # 将 session_key 存入 Redis（TTL 2小时），openid 返回给前端
    if openid:
        r = _get_redis()
        if r:
            try:
                r.set(f"wx:session:{openid}", session_key, ex=7200)
            except Exception as e:
                logger.warning(f"[wx_login] redis set session: {e}")

    return {"openid": openid}


@app.get("/api/user/favorites")
def get_favorites(openid: str, response: Response):
    """获取用户收藏列表"""
    if not openid:
        return {"favorites": []}
    r = _get_redis()
    if not r:
        return {"favorites": []}
    try:
        raw = r.get(f"user:favorites:{openid}")
        if raw:
            return {"favorites": json.loads(raw) if isinstance(raw, str) else raw}
    except Exception as e:
        logger.warning(f"[favorites:get] {e}")
    return {"favorites": []}


@app.post("/api/user/favorites")
def save_favorites(body: FavoritesBody, response: Response):
    """保存用户收藏列表"""
    r = _get_redis()
    if not r:
        return {"ok": False, "reason": "redis unavailable"}
    try:
        r.set(
            f"user:favorites:{body.openid}",
            json.dumps(body.favorites, ensure_ascii=False),
            ex=90 * 24 * 3600,   # 90天 TTL
        )
        return {"ok": True}
    except Exception as e:
        logger.warning(f"[favorites:save] {e}")
        return {"ok": False, "reason": str(e)}


# ═══════════════════════════════════════════════════════════════════════════════
# QDII 估值模块
# ═══════════════════════════════════════════════════════════════════════════════

import html as _html_mod
import random as _random
import sqlite3 as _sqlite3
from pathlib import Path as _Path
from contextlib import contextmanager as _ctx

# 所有主动 QDII 基金代码（与前端 QDII_FUNDS 同步）
QDII_CODES = [f["code"] for f in STATIC_FUNDS["us_active"]]

# C 类 → A 类持仓重定向（同一投资组合，避免缓存时序差异导致 A/C 持仓不一致）
_C_TO_A_HOLDINGS_MAP: dict[str, str] = {
    "022184": "100055",  # 富国全球科技互联网C → A
    "016702": "016701",  # 银华海外数字经济C → A
    "017437": "017436",  # 华宝纳斯达克精选C → A
    "017731": "017730",  # 嘉实全球产业升级C → A
    "018036": "501226",  # 长城全球新能源汽车C → A
    "017145": "017144",  # 华宝海外新能源汽车C → A
    "018156": "018155",  # 创金合信全球医药生物C → A
    "006309": "006308",  # 汇添富全球消费C → A
}

# ─── SQLite ───────────────────────────────────────────────────────────────────

_SEED_DB_PATH = _Path(__file__).parent.parent / "wise_etf.db"

def _get_db_path() -> _Path:
    """Vercel 部署目录只读，写操作走 /tmp；本地开发直接用项目根目录。"""
    if os.environ.get("VERCEL"):
        tmp = _Path("/tmp/wise_etf.db")
        if not tmp.exists() and _SEED_DB_PATH.exists():
            import shutil
            try:
                shutil.copy2(str(_SEED_DB_PATH), str(tmp))
                logger.info("[db] copied seed db to /tmp/wise_etf.db")
            except Exception as e:
                logger.warning(f"[db] seed copy failed: {e}")
        return tmp
    return _SEED_DB_PATH

_DB_PATH = _get_db_path()

@_ctx
def _db():
    conn = _sqlite3.connect(str(_DB_PATH))
    conn.row_factory = _sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()

def _init_qdii_tables():
    with _db() as conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS qdii_holdings (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            fund_code   TEXT NOT NULL,
            report_date TEXT,
            symbol      TEXT NOT NULL,
            name        TEXT,
            weight      REAL,
            updated_at  TEXT
        );
        CREATE UNIQUE INDEX IF NOT EXISTS uix_qdii_holdings
            ON qdii_holdings(fund_code, symbol, report_date);

        CREATE TABLE IF NOT EXISTS qdii_stock_prices (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol      TEXT NOT NULL,
            date        TEXT NOT NULL,
            change_pct  REAL,
            updated_at  TEXT,
            UNIQUE(symbol, date)
        );

        CREATE TABLE IF NOT EXISTS qdii_valuations (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            fund_code   TEXT NOT NULL,
            date        TEXT NOT NULL,
            valuation   REAL,
            coverage    REAL,
            fx_change   REAL,
            created_at  TEXT,
            UNIQUE(fund_code, date)
        );

        CREATE TABLE IF NOT EXISTS qdii_full_cache (
            id          INTEGER PRIMARY KEY,
            payload     TEXT NOT NULL,
            session     TEXT NOT NULL,
            computed_at TEXT NOT NULL
        );
        """)

try:
    _init_qdii_tables()
except Exception as _e:
    logger.warning(f"[db] init tables failed (non-fatal): {_e}")

# qdii_stock_prices 表加 close_price 列（旧表无此列，忽略已存在错误）
try:
    with _db() as _conn:
        _conn.execute("ALTER TABLE qdii_stock_prices ADD COLUMN close_price REAL")
except Exception:
    pass


def _db_save_holdings(fund_code: str, holdings: list, report_date: str = ""):
    now = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    with _db() as conn:
        for h in holdings:
            conn.execute("""
                INSERT INTO qdii_holdings(fund_code, report_date, symbol, name, weight, updated_at)
                VALUES(?,?,?,?,?,?)
                ON CONFLICT(fund_code, symbol, report_date) DO UPDATE SET
                    name=excluded.name, weight=excluded.weight, updated_at=excluded.updated_at
            """, (fund_code, report_date, h["symbol"], h["name"], h["weight"], now))


def _db_save_stock_prices(stock_cache: dict, date: str):
    now = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    with _db() as conn:
        for sym, pf in stock_cache.items():
            # stock_cache 值为 {pre_pct, regular_pct, post_pct}，取 regular 存库
            pct = pf.get("regular_pct") if isinstance(pf, dict) else pf
            if pct is not None:
                conn.execute("""
                    INSERT INTO qdii_stock_prices(symbol, date, change_pct, updated_at)
                    VALUES(?,?,?,?)
                    ON CONFLICT(symbol, date) DO UPDATE SET
                        change_pct=excluded.change_pct, updated_at=excluded.updated_at
                """, (sym, date, pct, now))


def _db_save_daily_snap(snap: dict, date: str):
    """保存每日 Nasdaq 快照到 qdii_stock_prices，并删除 3 天前旧数据。"""
    if not snap:
        return
    now = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    with _db() as conn:
        for sym, data in snap.items():
            conn.execute("""
                INSERT INTO qdii_stock_prices(symbol, date, change_pct, updated_at)
                VALUES(?,?,?,?)
                ON CONFLICT(symbol, date) DO UPDATE SET
                    change_pct=excluded.change_pct,
                    updated_at=excluded.updated_at
            """, (sym, date, data.get("pct"), now))
        conn.execute("DELETE FROM qdii_stock_prices WHERE date < date('now', '-3 days')")
    logger.info(f"[db] saved daily snap {date}: {len(snap)} symbols, cleaned >3d old data")


def _db_load_latest_prices(symbols: list) -> dict:
    """从 DB 读取每个 symbol 最近一条涨跌数据，用于 Nasdaq 失败时兜底。"""
    if not symbols:
        return {}
    with _db() as conn:
        placeholders = ",".join("?" * len(symbols))
        rows = conn.execute(f"""
            SELECT symbol, change_pct FROM qdii_stock_prices
            WHERE symbol IN ({placeholders})
            AND change_pct IS NOT NULL
            ORDER BY date DESC
        """, symbols).fetchall()
    result = {}
    for row in rows:
        sym = row["symbol"]
        if sym not in result:  # 每个 symbol 只取最新一条
            result[sym] = {"pct": row["change_pct"]}
    return result


def _db_save_valuations(results: list, date: str):
    now = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    with _db() as conn:
        for r in results:
            if r["valuation"] is not None:
                conn.execute("""
                    INSERT INTO qdii_valuations(fund_code, date, valuation, coverage, fx_change, created_at)
                    VALUES(?,?,?,?,?,?)
                    ON CONFLICT(fund_code, date) DO UPDATE SET
                        valuation=excluded.valuation, coverage=excluded.coverage,
                        fx_change=excluded.fx_change, created_at=excluded.created_at
                """, (r["code"], date, r["valuation"], r["coverage"], r["fx_change"], now))

def _db_save_full_cache(payload: dict):
    """将完整估值 payload 持久化到 SQLite，供重启后冷启动使用。"""
    try:
        with _db() as conn:
            conn.execute("DELETE FROM qdii_full_cache")
            conn.execute(
                "INSERT INTO qdii_full_cache(payload, session, computed_at) VALUES(?,?,?)",
                (json.dumps(payload, ensure_ascii=False), payload.get("session", "closed"), payload.get("updated_at", ""))
            )
    except Exception as e:
        logger.warning(f"[qdii] db save full cache failed: {e}")


def _db_load_full_cache() -> Optional[dict]:
    """从 SQLite 加载上一次计算的完整估值 payload。"""
    try:
        with _db() as conn:
            row = conn.execute(
                "SELECT payload FROM qdii_full_cache ORDER BY id DESC LIMIT 1"
            ).fetchone()
            if row:
                return json.loads(row["payload"])
    except Exception as e:
        logger.warning(f"[qdii] db load full cache failed: {e}")
    return None


# 缓存 TTL
_HOLDINGS_TTL   = 24 * 3600   # 季报持仓，每天刷一次
_STOCK_CHG_TTL  = 20 * 3600   # 个股涨跌幅，盘后固定

def _current_session() -> str:
    """
    返回当前市场时段（基于 HKT，EDT=HKT-12）：
      a_share     HKT 08:00-16:00 周一至周五（A股交易中）
      pre_market  HKT 16:00-21:30 周一至周五（美股盘前）
      us_open     HKT 21:30-04:00 周一至周五（美股盘中，跨午夜）
                  + HKT 周六 00:00-04:00（美股周五收盘前，Fri 12:00-16:00 ET）
      post_market HKT 04:00-08:00 周一至周五（美股盘后）
      weekend     HKT 周六 04:00 至周一 08:00（美股完全休市）

    修正说明：
      - 周六 HKT 00:00-04:00：美股周五仍在交易（ET 12:00-16:00），应为 us_open
      - 周一 HKT 00:00-08:00：美股仍是周日休市，应为 weekend（原代码误判为 us_open/post_market）
    """
    from datetime import timezone, timedelta
    HKT = timezone(timedelta(hours=8))
    now = datetime.now(HKT)
    wd = now.weekday()  # 0=周一 … 4=周五 5=周六 6=周日
    h  = now.hour + now.minute / 60.0

    # 周六：
    #   00:00-04:00 → 美股周五盘中（Fri 12:00-16:00 ET）
    #   04:00-08:00 → 美股周五盘后（Fri 16:00-20:00 ET）
    #   08:00+      → 真正休市
    if wd == 5:
        if h < 4.0: return "us_open"
        if h < 8.0: return "post_market"
        return "weekend"

    # 周日：全天休市（无盘后，美股周六不交易）
    if wd == 6:
        return "weekend"

    # 周一：00:00-08:00 仍是美股周日休市（无盘后）；08:00 起 A 股开盘
    if wd == 0 and h < 8.0:
        return "weekend"

    # 周一 08:00 至周五 24:00（正常工作日逻辑）
    if 8.0 <= h < 16.0:      return "a_share"
    if 16.0 <= h < 21.5:     return "pre_market"
    if h >= 21.5 or h < 4.0: return "us_open"
    return "post_market"  # HKT 04:00-08:00

def _valuation_ttl() -> int:
    """us_open 5min，weekend 60min，其余时段 15min。"""
    s = _current_session()
    if s == "us_open":  return 5 * 60
    if s == "weekend":  return 60 * 60
    return 15 * 60

_VALUATION_TTL  = 20 * 3600   # 持仓数据写 DB 时用，实际缓存由 _valuation_ttl() 决定


# ─── 持仓抓取（多层次策略）─────────────────────────────────────────────────────

def _strip_tags(s: str) -> str:
    return re.sub(r'<[^>]+>', '', s).strip()


# 东方财富 unify/r/{id}.{code} 中的数字市场 ID → Yahoo Finance 后缀
# 实测：0=深交所 1=上交所 105=NASDAQ 106=NYSE 116=港交所
_EM_ID_TO_YF: dict[str, str] = {
    "0":   "SZ",   # 深交所（主板/创业板/科创板）
    "1":   "SS",   # 上交所
    "116": "HK",   # 港交所
    # 200-299 范围通常为其他境外交易所，遇到再补充
}
# 美股市场 ID（直接用代码，不加后缀）
_EM_US_IDS = {"105", "106", "107", "74"}

def _map_em_id_to_yahoo(market_id: str, code: str) -> str:
    """根据东方财富数字市场 ID 转换为 Yahoo Finance symbol"""
    if market_id in _EM_US_IDS:
        return code.upper()
    if market_id in _EM_ID_TO_YF:
        suffix = _EM_ID_TO_YF[market_id]
        if suffix == "HK":
            try: return f"{int(code)}.HK"
            except ValueError: return f"{code}.HK"
        return f"{code}.{suffix}"
    # 未知 ID：按代码位数+首位启发式推断
    return _normalize_symbol(code)

def _normalize_symbol(raw: str) -> str:
    """无市场 ID 时的兜底：纯数字按首位+位数推断交易所"""
    raw = raw.strip()
    if not raw:
        return raw
    if raw.isdigit():
        n, head = len(raw), raw[0]
        if n == 6:
            if head == "6": return f"{raw}.SS"   # 上交所 600xxx/603xxx/688xxx
            if head == "3": return f"{raw}.SZ"   # 创业板 300xxx/301xxx
            return f"{raw}.KS"                   # 其余6位优先当韩股
        if n == 4: return f"{raw}.TW"            # 台股
        return f"{int(raw)}.HK"                  # 港股
    return raw


def _parse_em_holdings_table(html: str) -> list:
    """
    解析东方财富持仓 HTML 表格，动态检测权重列。
    季报: 序号|代码|名称|最新价|涨跌幅|相关资讯|占净值%|持股数|持仓市值
    年报/半年报: 序号|代码|名称|相关资讯|占净值%|持股数|持仓市值（列数不同）
    取第一张有实质内容的表格（即当前报告期），忽略页面下方历史季报小表。
    """
    tables = re.findall(r'<table[^>]*>(.*?)</table>', html, re.DOTALL)
    if not tables:
        return []
    # 取第一张行数 >= 2 的表（当前报告期），而非最大的表（可能是历史合并）
    target = None
    for t in tables:
        if len(re.findall(r'<tr[^>]*>', t)) >= 2:
            target = t
            break
    if not target:
        return []

    rows = re.findall(r'<tr[^>]*>(.*?)</tr>', target, re.DOTALL)
    holdings = []
    seen_symbols: set = set()
    for row in rows:
        raw_cells = re.findall(r'<td[^>]*>(.*?)</td>', row, re.DOTALL)
        cells = [_strip_tags(c) for c in raw_cells]
        if len(cells) < 4:
            continue
        sym_raw  = cells[1] if len(cells) > 1 else ""
        name_raw = cells[2] if len(cells) > 2 else ""
        if not sym_raw:
            continue
        # 从代码列 HTML 中提取 unify/r/{id}.{code} 精准映射交易所
        symbol = sym_raw  # 默认用文本内容
        if len(raw_cells) > 1:
            mu = re.search(r'unify/r/(\d+)\.([^\'\" <>\s]+)', raw_cells[1])
            if mu:
                symbol = _map_em_id_to_yahoo(mu.group(1), mu.group(2).strip())
            else:
                symbol = _normalize_symbol(sym_raw)
        # 去重
        if symbol in seen_symbols:
            continue
        # 动态找权重列：找第一个 0 < val <= 30 的列（避免误识别价格/持股数）
        weight = None
        for i in range(3, min(len(cells), 10)):
            try:
                w = float(cells[i].replace('%', '').strip())
                if 0 < w <= 30:
                    weight = w
                    break
            except ValueError:
                continue
        if weight is None:
            continue
        seen_symbols.add(symbol)
        holdings.append({
            "name":   name_raw,
            "symbol": symbol,
            "weight": weight,
            "change": None,
        })
    return holdings


def _fetch_em_holdings_for_period(code: str, year: str, month: str) -> tuple:
    """调用东方财富 FundArchivesDatas 接口获取指定报告期持仓。
    返回 (holdings: list, report_date: str)，失败时返回 ([], "")。
    """
    url = "https://fundf10.eastmoney.com/FundArchivesDatas.aspx"
    params = {
        "type":    "jjcc",
        "code":    code,
        "topline": "200",   # 年报/半年报时服务端会返回完整持仓
        "year":    year,
        "month":   month,
        "rt":      str(_random.random()),
    }
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Referer":    f"https://fundf10.eastmoney.com/ccmx_{code}.html",
    }
    try:
        resp = _get(url, params=params, headers=headers, timeout=(6, 15))
        if not (resp and resp.ok):
            return [], ""
        m = re.search(r'content:"(.*?)"(?:,|\s*})', resp.text, re.DOTALL)
        if not m:
            return [], ""
        html = _html_mod.unescape(m.group(1))
        # 提取报告期日期（如 "2026-03-31"）
        dm = re.search(r'截止至[：:]\s*<font[^>]*>(\d{4}-\d{2}-\d{2})</font>', html)
        report_date = dm.group(1) if dm else ""
        return _parse_em_holdings_table(html), report_date
    except Exception as e:
        logger.warning(f"[em_holdings] {code} y={year} m={month}: {e}")
        return [], ""


def _fetch_holdings_from_annual_pdf(code: str) -> list:
    """
    通过东方财富 JJGG 接口找年报/半年报 PDF，用 pdfplumber 解析完整持仓。
    返回 [] 若失败。
    """
    try:
        import pdfplumber, io
    except ImportError:
        logger.warning("[pdf] pdfplumber not installed")
        return []

    try:
        # 获取基金公告列表（type=3: 定期报告）
        jjgg_url = "http://api.fund.eastmoney.com/f10/JJGG"
        jjgg_params = {
            "fundcode": code, "pageIndex": 1, "pageSize": 10,
            "type": "3", "_": str(int(time.time() * 1000)),
        }
        jjgg_headers = {
            "User-Agent": "Mozilla/5.0",
            "Referer": f"https://fundf10.eastmoney.com/jjgg_{code}_3.html",
        }
        resp = _get(jjgg_url, params=jjgg_params, headers=jjgg_headers, timeout=(5, 12))
        if not (resp and resp.ok):
            logger.warning(f"[pdf] JJGG fetch failed for {code}")
            return []

        data = resp.json()
        announcements = data.get("Data", []) or []

        # 优先找年报（含"年度报告"或"年报"），其次半年报
        pdf_url = None
        for priority_keyword in ["年度报告", "年报", "半年度报告", "半年报"]:
            for ann in announcements:
                title = ann.get("TITLE", "") or ann.get("title", "")
                ann_id = ann.get("ID", "") or ann.get("id", "")
                if priority_keyword in title and ann_id:
                    pdf_url = f"http://pdf.dfcfw.com/pdf/H2_{ann_id}_1.pdf"
                    logger.info(f"[pdf] found '{title}' → {pdf_url}")
                    break
            if pdf_url:
                break

        if not pdf_url:
            logger.warning(f"[pdf] no annual/semi-annual report found for {code}")
            return []

        # 下载 PDF
        pdf_resp = _get(pdf_url, timeout=(10, 30))
        if not (pdf_resp and pdf_resp.ok):
            logger.warning(f"[pdf] download failed: {pdf_url}")
            return []

        # 解析 PDF
        holdings = []
        seen_symbols = set()
        with pdfplumber.open(io.BytesIO(pdf_resp.content)) as pdf:
            for page in pdf.pages:
                text = page.extract_text() or ""
                # 定位到"所有权益投资明细"或"股票投资明细"部分
                if not any(kw in text for kw in ["权益投资", "股票投资", "投资明细", "持仓"]):
                    continue
                # 逐行解析，找包含股票代码和权重的行
                for line in text.split('\n'):
                    line = line.strip()
                    # 找百分比数值（占净值比例）
                    pct_matches = re.findall(r'(\d+\.\d+)%', line)
                    if not pct_matches:
                        continue
                    # 找股票代码（如 NVDA US / TSLA US / 2513 HK / 2454 TW）
                    code_match = re.search(
                        r'\b([A-Z]{1,5}(?:\.[A-Z])?|[0-9]{4,5})\s+(US|HK|TW|KR|JP|GB|FR|DE|NL)\b',
                        line
                    )
                    if not code_match:
                        continue
                    raw_code, market = code_match.group(1), code_match.group(2)
                    # 转换为 Yahoo Finance 格式
                    if market == "HK":
                        yf_sym = f"{int(raw_code)}.HK"
                    elif market == "TW":
                        yf_sym = f"{raw_code}.TW"
                    elif market == "KR":
                        yf_sym = f"{raw_code}.KS"
                    else:
                        yf_sym = raw_code  # US stocks 直接用
                    if yf_sym in seen_symbols:
                        continue
                    try:
                        weight = float(pct_matches[0])
                        if 0 < weight <= 25:
                            seen_symbols.add(yf_sym)
                            holdings.append({
                                "name": "",
                                "symbol": yf_sym,
                                "weight": weight,
                                "change": None,
                            })
                    except ValueError:
                        continue

        logger.info(f"[pdf] {code}: extracted {len(holdings)} holdings from PDF")
        return holdings
    except Exception as e:
        logger.warning(f"[pdf] {code}: {e}")
        return []


def fetch_qdii_holdings(code: str, _cached=None) -> list:
    """返回持仓列表。元数据（报告期等）存在 qdii_hmeta_{code} 缓存中。"""
    if _cached is not None:
        return _cached
    master_code = _C_TO_A_HOLDINGS_MAP.get(code, code)
    if master_code != code:
        logger.info(f"[qdii_holdings] {code} → redirect to A class {master_code}")
        return fetch_qdii_holdings(master_code)

    cache_key = f"qdii_h_{code}"
    cached = _cache_get(cache_key)
    if cached:
        return cached

    return _do_fetch_qdii_holdings(code)


def _do_fetch_qdii_holdings(code: str) -> list:
    """
    实际拉取逻辑，不走缓存。
    持仓获取策略：
    1. 最新季报（year="",month=""，东方财富返回最新一期），前十大持仓，保持原顺序。
       - 验证报告期：必须是季末（03-31 / 06-30 / 09-30 / 12-31），否则视为异常。
       - 季报失败 → 缓存30分钟（短TTL），让下次请求重试，而不是将年报数据缓存24小时。
    2. 仅用 2025年12月年报 补充季报没有的品种。
       - 不回溯更早数据；若年报异常或缺失，仅返回季报前十。
    3. 季报+年报均失败 → 尝试 PDF 年报。
    """
    cache_key = f"qdii_h_{code}"
    meta_key  = f"qdii_hmeta_{code}"

    # Step 1: 最新季报
    latest_q, q_date = _fetch_em_holdings_for_period(code, "", "")
    logger.info(f"[qdii_holdings] {code} latest: {len(latest_q)} holdings, date={q_date!r}")

    # 验证：季报日期必须是季末
    _QUARTER_ENDS = {"-03-31", "-06-30", "-09-30", "-12-31"}
    q_is_valid = bool(latest_q) and any(q_date.endswith(e) for e in _QUARTER_ENDS)
    if latest_q and not q_is_valid:
        logger.warning(f"[qdii_holdings] {code}: quarterly date={q_date!r} 不是季末，忽略")
        latest_q = []

    # Step 2: 2025年12月年报（补充用）
    complete_h: list = []
    ann_date = ""
    h, ann_date = _fetch_em_holdings_for_period(code, "2025", "12")
    if h:
        total_w = sum(x["weight"] for x in h)
        logger.info(f"[qdii_holdings] {code} 2025-12年报: {len(h)} holdings, total_w={total_w:.1f}%, date={ann_date!r}")
        if total_w > 120 or len(h) > 200:
            logger.warning(f"[qdii_holdings] {code} 2025-12年报异常(weight={total_w:.1f}%,count={len(h)})，跳过")
        elif len(h) > 10:
            complete_h = h
    else:
        logger.warning(f"[qdii_holdings] {code}: 未找到2025年12月年报")

    # Step 3: 合并
    report_date = q_date  # 优先用季报日期
    source = "quarterly"

    if latest_q and complete_h:
        q_symbols      = {x["symbol"] for x in latest_q}
        q_weight_total = sum(x["weight"] for x in latest_q)
        supplemental   = [x for x in complete_h if x["symbol"] not in q_symbols]
        sup_weight_total = sum(x["weight"] for x in supplemental)
        remaining = max(0.0, 100.0 - q_weight_total)
        if sup_weight_total > 0 and remaining > 1.0:
            scale = remaining / sup_weight_total
            supplemental = [{**x, "weight": round(x["weight"] * scale, 4)} for x in supplemental]
            supplemental.sort(key=lambda x: x["weight"], reverse=True)
            best_holdings = latest_q + supplemental
        else:
            best_holdings = latest_q
        source = "quarterly+annual"
        logger.info(f"[qdii_holdings] {code}: merged={len(best_holdings)} (q={len(latest_q)}+sup={len(supplemental)})")
    elif latest_q:
        best_holdings = latest_q
    elif complete_h:
        complete_h.sort(key=lambda x: x["weight"], reverse=True)
        best_holdings = complete_h
        report_date = ann_date
        source = "annual_only"
        logger.warning(f"[qdii_holdings] {code}: 季报失败，仅使用年报数据 date={ann_date!r}")
    else:
        best_holdings = []

    # Step 4: PDF 兜底
    if not best_holdings:
        pdf_h = _fetch_holdings_from_annual_pdf(code)
        if pdf_h:
            best_holdings = pdf_h
            source = "pdf"
            logger.info(f"[qdii_holdings] {code}: PDF兜底 ({len(pdf_h)} positions)")

    if best_holdings:
        # 季报成功 → 正常TTL；仅年报/PDF兜底 → 短TTL，让下次请求尽快重试季报
        ttl = _HOLDINGS_TTL if source in ("quarterly", "quarterly+annual") else 1800
        _cache_set(cache_key, best_holdings, ttl)
        _cache_set(meta_key, {"report_date": report_date, "source": source}, ttl)
        if source not in ("quarterly", "quarterly+annual"):
            logger.warning(f"[qdii_holdings] {code}: 使用{source}兜底，TTL=30min，等待季报重试")
    else:
        logger.warning(f"[qdii_holdings] {code}: 所有来源均失败")

    return best_holdings


# ─── 个股价格与涨跌幅（四层容灾）──────────────────────────────────────────────

def fetch_stock_price_fields(symbol: str) -> dict:
    """
    获取单只股票各时段价格和涨跌幅。
    返回: {pre_pct, regular_pct, post_pct, price, close_price}，字段可为 None。

    四层容灾（不放弃任何一只股票）：
      层1  : Yahoo Finance v8 chart（crumb 认证）→ 收盘价序列 + 三段 pct
      层1b : Yahoo Finance v10 quoteSummary    → 直接提供 preMarketChangePercent /
             postMarketChangePercent（比 chart meta 更可靠）
      层2  : Nasdaq.com API（无需认证）         → 当前涨跌幅 + 最新成交价
      层3  : Redis stale cache（7天）           → 任何外部源全部失败时的最后保障

    side-effect：post_market 时段成功后写 stock_last_post_{symbol}（48h），
                 供 a_share 时段读取"昨日涨跌"。
    """
    cache_key       = f"stock_pf_{symbol}"
    stale_cache_key = f"stock_pf_stale_{symbol}"
    last_post_key   = f"stock_last_post_{symbol}"

    cached = _cache_get(cache_key)
    if cached is not None:
        return cached

    s   = _current_session()
    ttl = _valuation_ttl() if s in ("us_open", "pre_market", "post_market") else 8 * 3600
    out: dict = {"pre_pct": None, "regular_pct": None, "post_pct": None,
                 "price": None, "close_price": None}

    # ── 层1：Yahoo Finance chart（crumb 认证）──────────────────────────────────
    yf_ok  = False
    result = _yf_chart(symbol, interval="1d", range_="5d")
    if result:
        try:
            meta   = result["meta"]
            closes = [c for c in result["indicators"]["quote"][0].get("close", []) if c is not None]
            prev   = 0.0
            # 优先用 meta.regularMarketPreviousClose，Yahoo 直接给的昨收，最可靠
            # closes[-2] 有时含过期历史数据（如分红/分拆前旧价），导致涨跌幅严重失真
            for key in ("regularMarketPreviousClose", "previousClose"):
                v = meta.get(key)
                if v:
                    prev = float(v); break
            if not prev:
                if len(closes) >= 2:
                    prev = float(closes[-2])
                else:
                    v = meta.get("chartPreviousClose")
                    if v:
                        prev = float(v)
            if prev:
                def _calc_pct(price_key: str) -> Optional[float]:
                    p = float(meta.get(price_key) or 0)
                    return round((p - prev) / prev * 100, 2) if p else None
                out["regular_pct"] = _calc_pct("regularMarketPrice")
                out["pre_pct"]     = _calc_pct("preMarketPrice")
                out["post_pct"]    = _calc_pct("postMarketPrice")

                close_price = round(float(closes[-1]), 2) if closes else None
                out["close_price"] = close_price

                pre_p  = float(meta.get("preMarketPrice")  or 0)
                post_p = float(meta.get("postMarketPrice") or 0)
                reg_p  = float(meta.get("regularMarketPrice") or 0)
                if s == "pre_market":
                    raw_price = pre_p or close_price or 0
                elif s == "post_market":
                    raw_price = post_p or reg_p or close_price or 0
                elif s == "us_open":
                    raw_price = reg_p or close_price or 0
                else:
                    raw_price = close_price or reg_p or 0
                out["price"] = round(raw_price, 2) if raw_price else None
                yf_ok = True
        except Exception as e:
            logger.warning(f"[stock_pf] chart parse {symbol}: {e}")

    # ── 层1b：Yahoo quoteSummary 补全盘前/盘后涨跌幅 ───────────────────────────
    # chart 的 meta.preMarketPrice 经常缺失；quoteSummary 直接有 changePercent 字段
    if yf_ok and (
        (s == "pre_market"  and out["pre_pct"]  is None) or
        (s == "post_market" and out["post_pct"] is None)
    ):
        qs = _yf_quote_summary(symbol)
        if qs:
            if s == "pre_market" and qs.get("pre_pct") is not None:
                out["pre_pct"] = qs["pre_pct"]
                if qs.get("pre_price") and not out["price"]:
                    out["price"] = round(float(qs["pre_price"]), 2)
                logger.info(f"[stock_pf] {symbol}: pre_pct from quoteSummary={qs['pre_pct']}%")
            elif s == "post_market" and qs.get("post_pct") is not None:
                out["post_pct"] = qs["post_pct"]
                if qs.get("post_price") and not out["price"]:
                    out["price"] = round(float(qs["post_price"]), 2)
                logger.info(f"[stock_pf] {symbol}: post_pct from quoteSummary={qs['post_pct']}%")

    # ── 层2：Nasdaq.com API（chart 完全失败 OR pre/post pct 仍缺）─────────────
    nasdaq_needed = (
        not yf_ok or
        (s == "pre_market"  and out["pre_pct"]  is None) or
        (s == "post_market" and out["post_pct"] is None)
    )
    if nasdaq_needed:
        nd = _nasdaq_fetch(symbol)
        if nd:
            nd_pct   = nd.get("pct")
            nd_price = nd.get("price")
            if not yf_ok:
                # chart 完全失败：Nasdaq 作为主数据源
                out["regular_pct"] = nd_pct
                if s == "pre_market":
                    out["pre_pct"]   = nd_pct
                    out["close_price"] = nd_price  # 盘前 lastSalePrice ≈ 昨收
                elif s == "post_market":
                    out["post_pct"]  = nd_pct
                    out["close_price"] = nd_price
                else:
                    out["close_price"] = nd_price
                out["price"] = nd_price
                logger.info(f"[stock_pf] {symbol}: chart failed, nasdaq pct={nd_pct}% price={nd_price}")
            else:
                # chart 成功但 pre/post pct 缺失：仅补涨跌幅
                if s == "pre_market"  and out["pre_pct"]  is None and nd_pct is not None:
                    out["pre_pct"]  = nd_pct
                    logger.info(f"[stock_pf] {symbol}: pre_pct from nasdaq={nd_pct}%")
                elif s == "post_market" and out["post_pct"] is None and nd_pct is not None:
                    out["post_pct"] = nd_pct
                    logger.info(f"[stock_pf] {symbol}: post_pct from nasdaq={nd_pct}%")

    # ── 有任意有效数据则缓存并返回 ────────────────────────────────────────────
    has_data = any(out.get(k) is not None for k in ("regular_pct","pre_pct","post_pct","price","close_price"))
    if has_data:
        # 盘后快照：写入 stock_last_post_{symbol}，供 a_share 时段读"昨日涨跌"
        if s == "post_market":
            snap_pct = out.get("post_pct") or out.get("regular_pct")
            if snap_pct is not None:
                _cache_set(last_post_key, {
                    "pct": snap_pct,
                    # "close_price": out.get("close_price"),  # 已停用，前端不再展示收盘价
                }, 72 * 3600)  # 72h：确保周五盘后快照能撑过周末到周一A股时段
        _cache_set(cache_key, out, ttl)
        _cache_set(stale_cache_key, out, 7 * 24 * 3600)
        return out

    # ── 层3：Redis stale cache（所有外部源均失败）────────────────────────────
    stale = _cache_get(stale_cache_key)
    if stale:
        logger.warning(f"[stock_pf] {symbol}: all sources failed, using stale cache")
        out = {**stale, "_stale": True}
        _cache_set(cache_key, out, min(ttl, 3600))
        return out

    logger.warning(f"[stock_pf] {symbol}: all sources failed, no data")
    return out


def fetch_fx_data() -> dict:
    """
    美元/人民币数据：{change: float, price: float}
    change = 涨跌幅%，price = 实际汇率（如 6.7856）
    """
    cache_key = "qdii_fx_data"
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached

    res = _yf_chart("USDCNY=X", interval="1d", range_="5d")
    if not res:
        return {"change": 0.0, "price": None}
    try:
        meta  = res["meta"]
        price = float(meta.get("regularMarketPrice") or 0)
        closes = res.get("indicators", {}).get("quote", [{}])[0].get("close", []) if isinstance(res, dict) else []
        valid = [c for c in closes if c is not None]
        prev = float(valid[-2]) if len(valid) >= 2 else float(
            meta.get("regularMarketPreviousClose")
            or meta.get("chartPreviousClose")
            or meta.get("previousClose") or 0
        )
        pct = round((price - prev) / prev * 100, 2) if price and prev else 0.0
        result = {"change": pct, "price": round(price, 4) if price else None}
        # 汇率在美股盘中随时变，跟随 _valuation_ttl()；非交易时段用 8h
        s = _current_session()
        ttl = _valuation_ttl() if s in ("us_open", "pre_market", "post_market") else 8 * 3600
        _cache_set(cache_key, result, ttl)
        return result
    except Exception:
        return {"change": 0.0, "price": None}

def fetch_fx_change() -> float:
    return fetch_fx_data()["change"]


def fetch_fund_nav(code: str) -> Optional[float]:
    """从天天基金实时接口获取最新净值（dwjz），缓存 6h"""
    cache_key = f"qdii_nav_{code}"
    cached = _cache_get(cache_key)
    if cached is not None:
        return float(cached)
    try:
        url  = f"https://fundgz.1234567.com.cn/js/{code}.js"
        resp = _get(url, timeout=(3, 8))
        if not (resp and resp.ok):
            return None
        m = re.search(r'\{.*\}', resp.text)
        if not m:
            return None
        data = json.loads(m.group(0))
        nav  = float(data.get("dwjz") or 0)
        if nav > 0:
            _cache_set(cache_key, nav, 6 * 3600)
            return nav
    except Exception as e:
        logger.warning(f"[nav] {code}: {e}")
    return None


def fetch_fund_gszzl(code: str, _cached=None) -> dict:
    """
    从天天基金 fundgz 接口一次性获取：dwjz(净值) + gszzl(估值涨幅) + gsz + gztime。
    合并原 fetch_fund_nav，避免对同一 URL 的重复请求。
    返回: {gszzl, gsz, gztime, is_fresh, nav}
    开盘时段 TTL=15min，其他时段 TTL=30min。
    """
    if _cached is not None:
        return _cached
    cache_key = f"qdii_gszzl_{code}"
    cached = _cache_get(cache_key)
    if cached:
        return cached
    result: dict = {"gszzl": None, "gsz": None, "gztime": None, "is_fresh": False, "nav": None, "nav_date": None}
    try:
        from datetime import timezone, timedelta
        url  = f"https://fundgz.1234567.com.cn/js/{code}.js"
        resp = _get(url, timeout=(3, 8))
        if not (resp and resp.ok):
            return result
        m = re.search(r'\{.*?\}', resp.text, re.DOTALL)
        if not m:
            return result
        data      = json.loads(m.group(0))
        gztime    = (data.get("gztime") or "").strip()
        gszzl_str = (data.get("gszzl") or "").strip()
        gsz_str   = (data.get("gsz")   or "").strip()
        dwjz_str  = (data.get("dwjz")  or "").strip()
        jzrq_str  = (data.get("jzrq")  or "").strip()   # 净值日期 e.g. "2025-05-14"
        beijing_today = datetime.now(timezone(timedelta(hours=8))).strftime("%Y-%m-%d")
        gszzl: Optional[float] = None
        if gszzl_str and gszzl_str not in ("0.00", "0", ""):
            try: gszzl = round(float(gszzl_str), 2)
            except ValueError: pass
        gsz: Optional[float] = None
        if gsz_str:
            try: gsz = float(gsz_str)
            except ValueError: pass
        nav: Optional[float] = None
        if dwjz_str:
            try:
                v = float(dwjz_str)
                if v > 0: nav = round(v, 4)
            except ValueError: pass
        is_fresh = bool(gztime and gztime.startswith(beijing_today) and gszzl is not None)
        result = {
            "gszzl":    gszzl,
            "gsz":      gsz,
            "gztime":   gztime or None,
            "is_fresh": is_fresh,
            "nav":      nav,
            "nav_date": jzrq_str or None,
        }
        s   = _current_session()
        # 周末 A股不开盘，gszzl 数据不变，缓存 12h；其他时段跟随 _valuation_ttl()
        ttl = 12 * 3600 if s == "weekend" else _valuation_ttl()
        _cache_set(cache_key, result, ttl)
    except Exception as e:
        logger.warning(f"[gszzl] {code}: {e}")
    return result


def fetch_fund_meta(code: str, _cached=None) -> dict:
    """
    从 eastmoney pingzhongdata 获取：
      - scale:      最新季度净资产(亿)，来自 Data_assetAllocation["净资产"][-1]
      - ytd_return: 2025全年收益率(%)，由 Data_ACWorthTrend 计算（累计净值，处理份额折算）
    缓存 12h。
    """
    if _cached is not None:
        return _cached
    cache_key = f"qdii_meta_{code}"
    cached = _cache_get(cache_key)
    if cached:
        return cached

    result: dict = {"scale": None, "ytd_return": None, "nav_latest": None}
    try:
        url  = f"https://fund.eastmoney.com/pingzhongdata/{code}.js"
        resp = _get(url, timeout=(5, 15))
        if not (resp and resp.ok):
            return result
        text = resp.text

        # ── 规模：Data_assetAllocation → 净资产 series 最新值 ──────────────────
        m = re.search(r'Data_assetAllocation\s*=\s*(\{.*?\});', text, re.DOTALL)
        if m:
            try:
                aa = json.loads(m.group(1))
                for s in aa.get("series", []):
                    if s.get("name") == "净资产" and s.get("data"):
                        last = [v for v in s["data"] if v is not None]
                        if last:
                            result["scale"] = round(last[-1], 2)
            except Exception:
                pass

        # ── Data_netWorthTrend：最新净值 ──────────────────────────────────────
        m = re.search(r'Data_netWorthTrend\s*=\s*(\[.*?\]);', text, re.DOTALL)
        if m:
            try:
                trend = json.loads(m.group(1))
                if trend:
                    last_nav = next((p["y"] for p in reversed(trend) if p.get("y")), None)
                    if last_nav and last_nav > 0:
                        result["nav_latest"] = round(float(last_nav), 4)
            except Exception:
                pass

        # ── Data_ACWorthTrend：2025全年收益率（累计净值，天然处理份额折算/分红）──
        m_ac = re.search(r'Data_ACWorthTrend\s*=\s*(\[.*?\]);', text, re.DOTALL)
        if m_ac:
            try:
                ac_trend = json.loads(m_ac.group(1))   # [[ts, val], ...]
                if ac_trend:
                    START_2025 = 1735689600000   # 2025-01-01 UTC
                    END_2025   = 1767225600000   # 2025-12-31 UTC
                    start_nav = next((p[1] for p in ac_trend if p[0] >= START_2025), None)
                    end_nav   = next((p[1] for p in reversed(ac_trend) if p[0] <= END_2025), None)
                    if start_nav and end_nav and start_nav > 0:
                        result["ytd_return"] = round((end_nav - start_nav) / start_nav * 100, 2)
            except Exception:
                pass

    except Exception as e:
        logger.warning(f"[meta] {code}: {e}")

    _cache_set(cache_key, result, 12 * 3600)
    return result


# ─── 估值计算核心 ──────────────────────────────────────────────────────────────

def calc_valuation_for_fund(code: str, stock_cache: dict, fx_change: float,
                             session: str = "a_share",
                             prefetched_holdings: Optional[list] = None) -> dict:
    """
    计算单只基金估值。
    stock_cache: {symbol -> {pre_pct, regular_pct, post_pct}}，由调用方批量填充。
    session: 当前时段，决定使用哪个价格字段。
    prefetched_holdings: 由调用方传入已预取的持仓（避免重复 Redis 调用）。
    """
    raw_holdings = prefetched_holdings if prefetched_holdings is not None else fetch_qdii_holdings(code)
    if not raw_holdings:
        return {"code": code, "valuation": None, "holdings": [], "coverage": 0,
                "fx_change": fx_change}

    # 去重：同一 symbol 保留权重最大的那条
    dedup: dict[str, dict] = {}
    for h in raw_holdings:
        sym = h["symbol"]
        if sym not in dedup or h["weight"] > dedup[sym]["weight"]:
            dedup[sym] = h
    holdings = list(dedup.values())

    # 归一化：若总权重超过110%（多期/多分类叠加），等比缩放到100%
    total_weight = sum(h["weight"] for h in holdings)
    if total_weight > 110.0:
        scale = 100.0 / total_weight
        holdings = [{**h, "weight": round(h["weight"] * scale, 4)} for h in holdings]
        total_weight = 100.0

    weighted_sum   = 0.0
    covered_weight = 0.0
    enriched = []
    for h in holdings:
        sym = h["symbol"]
        pf  = stock_cache.get(sym) or {}
        # 根据时段选价格字段
        if session == "pre_market":
            chg = pf.get("pre_pct") or pf.get("regular_pct")
        elif session == "post_market":
            chg = pf.get("post_pct") or pf.get("regular_pct")
        elif session == "a_share":
            # a_share：用盘后快照涨跌幅（last_post_pct），表示"昨日涨跌"
            chg = pf.get("last_post_pct") or pf.get("post_pct") or pf.get("regular_pct")
        else:  # us_open, weekend
            chg = pf.get("regular_pct")
        enriched.append({**h, "change": chg, "price": pf.get("price")})
        if chg is not None:
            weighted_sum   += h["weight"] / 100.0 * chg
            covered_weight += h["weight"]

    # coverage = 已获取价格的持仓占基金净值的比例（分母是100%，而非只看已知持仓）
    coverage   = round(covered_weight, 1)
    valuation  = round(weighted_sum + fx_change, 2) if covered_weight > 0 else None

    return {
        "code":      code,
        "valuation": valuation,
        "holdings":  enriched,
        "coverage":  coverage,
        "fx_change": fx_change,
    }


# ─── API 端点 ──────────────────────────────────────────────────────────────────

@app.get("/api/qdii/holdings/{code}")
def api_qdii_holdings(code: str, response: Response, force: bool = False):
    """返回单只基金季报前十大持仓（含持仓权重和报告期）"""
    response.headers["Cache-Control"] = "public, max-age=3600"
    master_code = _C_TO_A_HOLDINGS_MAP.get(code, code)
    if force:
        _cache_delete(f"qdii_h_{master_code}")
        _cache_delete(f"qdii_hmeta_{master_code}")
        logger.info(f"[qdii_holdings] force cleared cache for {master_code}")
    holdings = fetch_qdii_holdings(code)
    meta = _cache_get(f"qdii_hmeta_{master_code}") or {}
    if not holdings:
        return {"code": code, "holdings": [], "error": "fetch_failed"}
    return {
        "code":        code,
        "holdings":    holdings,
        "report_date": meta.get("report_date", ""),
        "source":      meta.get("source", ""),
    }


@app.get("/api/qdii/valuations")
def api_qdii_valuations(response: Response, force: bool = False, light: bool = False):
    """
    批量返回所有主动 QDII 基金的估值结果。

    数据策略（5-session-aware）:
    - a_share  (HKT 08:00-16:00 工作日): 优先 fundgz gszzl 实时估值，15min 刷新
    - pre_market (HKT 16:00-21:30 工作日): Yahoo preMarketPrice 加权，15min 刷新
    - us_open   (HKT 21:30-04:00 工作日): Yahoo regularMarketPrice 加权，10min 刷新
    - post_market (HKT 04:00-08:00 工作日): Yahoo postMarketPrice 加权，15min 刷新
    - weekend   (HKT 周六/日): 缓存上次收盘价，60min 刷新

    ?light=true  轻量预热：只清顶层+股价缓存，持仓/gszzl 保留（~3-5s 完成）
    ?force=true  全量重算：清所有缓存（慢，仅调试用）
    """
    from datetime import timezone, timedelta
    session   = _current_session()
    cache_key = "qdii_valuations"

    if light:
        # light 模式：直接重算并覆盖缓存，不删除旧缓存
        # → 计算期间并发请求仍命中旧缓存（不显示"计算中"），完成后原子覆盖
        logger.info(f"[qdii] light refresh: recomputing in-place, old cache retained (session={session})")
    elif force:
        _cache_delete(cache_key)
        for code in QDII_CODES:
            _cache_delete(f"qdii_h_{code}")
            _cache_delete(f"qdii_meta_{code}")
            _cache_delete(f"qdii_gszzl_{code}")
        _cache_delete("qdii_fx_chg")
        _cache_delete("qdii_fx_data")
        _cache_delete_pattern("stock_pf_*")
        logger.info(f"[qdii] force refresh: cleared all caches (session={session})")
    else:
        cached = _cache_get(cache_key)
        if cached:
            cached_session = cached.get("session", "weekend")
            # 估值来源发生根本性切换时必须失效，否则旧 session 数据会持续到 TTL 到期
            # a_share  → 持仓×昨日盘后涨跌加权（last_post_pct）
            # pre/us/post → Yahoo 实时/盘前/盘后加权
            # weekend  → 缓存收盘价
            _SOURCE_CHANGED = (
                (cached_session == "weekend"    and session != "weekend") or
                (cached_session == "a_share"    and session in ("pre_market", "us_open", "post_market")) or
                (cached_session == "post_market" and session in ("a_share", "pre_market", "us_open")) or
                (cached_session in ("pre_market", "us_open") and session == "a_share")
            )
            if _SOURCE_CHANGED:
                logger.info(f"[qdii] session {cached_session}→{session}, invalidating cache")
                _cache_delete(cache_key)
            else:
                cached["session"] = session
                _cache_set(cache_key, cached, _valuation_ttl())
                response.headers["Cache-Control"] = "no-store"
                return cached

    fx_data   = fetch_fx_data()
    fx_change = fx_data["change"]
    fx_price  = fx_data["price"]

    # ── Step 1: 并发拉取 gszzl(含nav) + 持仓 + meta ─────────────────────────────
    gszzl_cache:  dict[str, dict] = {}
    all_holdings: dict[str, list] = {}
    meta_cache:   dict[str, dict] = {}

    # 批量预读三类 per-fund key（3 次 RTT 替代 84 次串行读）
    _pre = _cache_mget(
        [f"qdii_gszzl_{c}" for c in QDII_CODES] +
        [f"qdii_h_{c}"     for c in QDII_CODES] +
        [f"qdii_meta_{c}"  for c in QDII_CODES]
    )
    _pre_gszzl = {c: _pre.get(f"qdii_gszzl_{c}") for c in QDII_CODES}
    _pre_h     = {c: _pre.get(f"qdii_h_{c}")     for c in QDII_CODES}
    _pre_meta  = {c: _pre.get(f"qdii_meta_{c}")  for c in QDII_CODES}

    with ThreadPoolExecutor(max_workers=20) as ex:
        gf = {ex.submit(fetch_fund_gszzl,   code, _pre_gszzl.get(code)): ("gszzl", code) for code in QDII_CODES}
        hf = {ex.submit(fetch_qdii_holdings, code, _pre_h.get(code)):     ("h",     code) for code in QDII_CODES}
        mf = {ex.submit(fetch_fund_meta,     code, _pre_meta.get(code)):  ("meta",  code) for code in QDII_CODES}
        for bucket in (gf, hf, mf):
            for fut, (kind, code) in bucket.items():
                try:
                    val = fut.result()
                except Exception:
                    val = {"gszzl": None, "gsz": None, "gztime": None, "is_fresh": False,
                           "nav": None, "nav_date": None} \
                          if kind == "gszzl" else [] if kind == "h" else {}
                if   kind == "gszzl": gszzl_cache[code] = val
                elif kind == "h":     all_holdings[code] = val
                else:                 meta_cache[code]   = val

    # ── Step 2: 并发拉取股价 ────────────────────────────────────────────────────
    # 价格查询只取每只基金权重最大的前15个 symbol（性能优化），
    # 但 all_holdings 保持 fetch_qdii_holdings 返回的原始顺序（季报前十在前），
    # 确保展示给用户的前十持仓与季报官方数据一致。
    _TOP_N = 15

    _NON_US_SUFFIX = (".HK", ".SS", ".SZ", ".TW", ".KS", ".T", ".L", ".PA", ".DE")

    def _is_us(sym: str) -> bool:
        return bool(sym) and not any(sym.endswith(s) for s in _NON_US_SUFFIX)

    all_symbols = list({
        h["symbol"]
        for holdings in all_holdings.values()
        for h in sorted(holdings, key=lambda x: x.get("weight", 0), reverse=True)[:_TOP_N]
        if h.get("symbol")
    })
    us_symbols  = [s for s in all_symbols if _is_us(s)]
    non_us_syms = [s for s in all_symbols if not _is_us(s)]
    logger.info(f"[qdii/stock] total={len(all_symbols)} US={len(us_symbols)} non-US={len(non_us_syms)}")

    _EMPTY_PF = {"pre_pct": None, "regular_pct": None, "post_pct": None,
                 "price": None, "close_price": None}
    stock_cache: dict[str, dict] = {}

    # 批量 MGET 所有股价缓存（一次 RTT 代替 134 次串行 GET）
    all_pf_keys   = [f"stock_pf_{s}"       for s in all_symbols]
    stale_pf_keys = [f"stock_pf_stale_{s}" for s in all_symbols]
    bulk_pf    = _cache_mget(all_pf_keys)
    bulk_stale = _cache_mget(stale_pf_keys)

    def _pf_cached(sym):   return bulk_pf.get(f"stock_pf_{sym}")
    def _stale_cached(sym): return bulk_stale.get(f"stock_pf_stale_{sym}")

    # non-US（A股/港股）：先读 Redis 缓存，缓存未命中的走新浪批量（单次请求）
    non_us_fresh = []
    for sym in non_us_syms:
        c = _pf_cached(sym)
        if c is not None:
            stock_cache[sym] = c
        else:
            non_us_fresh.append(sym)

    if non_us_fresh:
        logger.info(f"[qdii/stock] Sina batch: {len(non_us_fresh)} A/HK symbols")
        sina_result = _sina_stock_batch(non_us_fresh)
        if sina_result:
            _cache_mset({f"stock_pf_{s}":       pf for s, pf in sina_result.items()}, _valuation_ttl())
            _cache_mset({f"stock_pf_stale_{s}": pf for s, pf in sina_result.items()}, 7 * 24 * 3600)
        for sym, pf in sina_result.items():
            stock_cache[sym] = pf
        # 新浪也拿不到的：stale 兜底
        for sym in non_us_fresh:
            if sym not in stock_cache:
                stock_cache[sym] = _stale_cached(sym) or dict(_EMPTY_PF)

    if session in ("pre_market", "us_open", "post_market"):
        # 策略：① Redis缓存 → ② 拉新数据 → ③ stale兜底
        # us_open: stooq 批量（~1.5s，一次请求）
        # pre_market / post_market: Nasdaq 并发（有盘前/盘后数据，12s timeout）

        # ① Redis 缓存命中的 US symbol
        fresh_us = []
        for sym in us_symbols:
            c = _pf_cached(sym)
            if c is not None:
                stock_cache[sym] = c
            else:
                fresh_us.append(sym)

        if fresh_us:
            # ─── us_open / pre_market / post_market：统一走 Nasdaq 并发 ────────
            # Nasdaq primaryData 三个时段都提供当期正确涨跌幅：
            #   盘前/盘后：当期相对昨收的涨跌幅%（直接字段）
            #   盘中：实时成交价 + 当日涨跌幅%
            # 已在 pre_market/post_market 验证可用，us_open 同理。
            logger.info(f"[qdii/stock] Nasdaq concurrent: {len(fresh_us)} US symbols, session={session}")

            def _nasdaq_pf(sym: str) -> dict:
                r = _nasdaq_fetch(sym)
                pct         = r.get("pct")
                intra_price = r.get("price")       # 当前时段价（盘中=实时价，盘前/后=盘前/后价）
                prev_close  = r.get("prev_close")  # 昨日4PM ET固定收盘价
                if pct is not None:
                    if session == "us_open":
                        # 盘中：price 展示实时价，close_price 展示昨收，pct 只填 regular
                        return {"pre_pct": None, "regular_pct": pct, "post_pct": None,
                                "price": intra_price or prev_close, "close_price": prev_close}
                    else:
                        # 盘前/盘后：price 展示昨收（避免展示动态盘前价引起误解）
                        return {"pre_pct": pct, "regular_pct": pct, "post_pct": pct,
                                "price": prev_close, "close_price": prev_close}
                return dict(_EMPTY_PF)

            nq_ex = ThreadPoolExecutor(max_workers=min(32, len(fresh_us)))
            nq_results: Dict[str, dict] = {}
            try:
                nq_futs = {nq_ex.submit(_nasdaq_pf, s): s for s in fresh_us}
                done, not_done = wait(list(nq_futs), timeout=12)
                for fut in not_done:
                    fut.cancel()
                for fut in done:
                    sym = nq_futs[fut]
                    try:
                        pf = fut.result()
                        stock_cache[sym] = pf
                        if any(v is not None for v in pf.values()):
                            nq_results[sym] = pf
                    except Exception:
                        stock_cache[sym] = dict(_EMPTY_PF)
            finally:
                nq_ex.shutdown(wait=False)

            # 批量写回 Redis
            if nq_results:
                _cache_mset({f"stock_pf_{s}":       pf for s, pf in nq_results.items()}, _valuation_ttl())
                _cache_mset({f"stock_pf_stale_{s}": pf for s, pf in nq_results.items()}, 7 * 24 * 3600)

            # Nasdaq 超时/失败的：stale 兜底
            for sym in fresh_us:
                if sym not in stock_cache or not any(v is not None for v in stock_cache[sym].values()):
                    stock_cache[sym] = _stale_cached(sym) or dict(_EMPTY_PF)
    else:
        # a_share / weekend：美股已收盘
        if session == "a_share":
            # ── A股时段：Nasdaq 直接字段获取昨日涨跌幅，每日一次，缓存全天 ──────────
            # 改动原因：原逻辑依赖 fetch_stock_price_fields（Yahoo v8 chart）拿历史
            # close 序列，用 closes[-2] 手算涨跌幅。Yahoo 偶发在序列里混入几年前的
            # 旧价格（如 KLAC closes[-2] ≈ $213，当前价 $2411），导致算出 +1029% 这类
            # 严重失真数据，写入 stock_last_post_* 快照后污染 A 股估值（如 +38.83%）。
            # 改为调用 Nasdaq _nasdaq_fetch，percentageChange 是直接字段，不依赖历史
            # 序列，彻底规避手算风险。每日首次 A 股请求时拉取一次，缓存 20h。
            _HKT = timezone(timedelta(hours=8))
            today_hkt = datetime.now(_HKT).strftime("%Y-%m-%d")
            daily_snap_key = f"qdii_nasdaq_daily_{today_hkt}"
            daily_snap = _cache_get(daily_snap_key) or {}

            if not daily_snap:
                logger.info(f"[qdii/a_share] building Nasdaq daily snapshot {today_hkt}, {len(us_symbols)} US symbols")
                fresh_snap: dict = {}
                with ThreadPoolExecutor(max_workers=min(32, len(us_symbols))) as ex:
                    futs = {ex.submit(_nasdaq_fetch, sym): sym for sym in us_symbols}
                    done, _ = wait(list(futs), timeout=20)
                    for fut in done:
                        sym = futs[fut]
                        try:
                            r = fut.result()
                            if r.get("pct") is not None:
                                fresh_snap[sym] = {"pct": r["pct"]}
                        except Exception as e:
                            logger.warning(f"[qdii/a_share] nasdaq {sym}: {e}")
                if fresh_snap:
                    _cache_set(daily_snap_key, fresh_snap, 20 * 3600)
                    daily_snap = fresh_snap
                    _db_save_daily_snap(fresh_snap, today_hkt)  # 存 DB，保留近 3 天

                # Nasdaq 失败的 symbol：从 DB 取最近一条兜底
                failed = [s for s in us_symbols if s not in daily_snap]
                if failed:
                    db_fallback = _db_load_latest_prices(failed)
                    if db_fallback:
                        daily_snap = {**daily_snap, **db_fallback}
                        logger.info(f"[qdii/a_share] DB fallback: {len(db_fallback)} symbols")

                logger.info(f"[qdii/a_share] snapshot done: {len(daily_snap)}/{len(us_symbols)} symbols")

            # 收盘估值：last_post_pct 来自 Nasdaq percentageChange（直接字段）
            # 盘后估值：post_pct 来自 stock_pf_stale_*（Yahoo postMarketChangePercent，7天TTL）
            stale_data = _cache_mget([f"stock_pf_stale_{s}" for s in us_symbols])
            for sym in us_symbols:
                pf = _pf_cached(sym) or dict(_EMPTY_PF)
                snap = daily_snap.get(sym) or {}
                if snap.get("pct") is not None:
                    pf = {**pf, "last_post_pct": snap["pct"]}
                stale = stale_data.get(f"stock_pf_stale_{sym}") or {}
                if stale.get("post_pct") is not None:
                    pf = {**pf, "post_pct": stale["post_pct"]}
                stock_cache[sym] = pf

            # ── 以下为原来的逻辑，已停用，原因见上方注释 ──────────────────────────
            # missing = [sym for sym in all_symbols if not _pf_cached(sym)]
            # if missing:
            #     with ThreadPoolExecutor(max_workers=16) as ex:
            #         sf = {ex.submit(fetch_stock_price_fields, sym): sym for sym in missing}
            #         for fut, sym in sf.items():
            #             try:    stock_cache[sym] = fut.result()
            #             except: stock_cache[sym] = dict(_EMPTY_PF)
            # snap_keys = [f"stock_last_post_{s}" for s in all_symbols]
            # bulk_snap = _cache_mget(snap_keys)
            # for sym in all_symbols:
            #     snap = bulk_snap.get(f"stock_last_post_{sym}") or {}
            #     if snap.get("pct") is not None:
            #         stock_cache[sym] = {**stock_cache[sym], "last_post_pct": snap["pct"]}
            #         if snap.get("close_price") and not stock_cache[sym].get("close_price"):
            #             stock_cache[sym]["close_price"] = snap["close_price"]

        else:
            # weekend：读缓存，缓存未命中时用 fetch_stock_price_fields 兜底
            missing = [sym for sym in all_symbols if not _pf_cached(sym)]
            if missing:
                with ThreadPoolExecutor(max_workers=16) as ex:
                    sf = {ex.submit(fetch_stock_price_fields, sym): sym for sym in missing}
                    for fut, sym in sf.items():
                        try:    stock_cache[sym] = fut.result()
                        except: stock_cache[sym] = dict(_EMPTY_PF)

        # 兜底：确保所有 symbol 都在 stock_cache（non-US 已由 Sina batch 填充）
        for sym in all_symbols:
            if sym not in stock_cache:
                stock_cache[sym] = _pf_cached(sym) or dict(_EMPTY_PF)

    # ── Step 3: 逐基金估值（session-aware 优先级）─────────────────────────────
    # 计算「上周五」日期，用于 weekend nav_published 判断
    HKT = timezone(timedelta(hours=8))
    now_hkt = datetime.now(HKT)
    days_since_friday = (now_hkt.weekday() - 4) % 7
    last_friday = (now_hkt - timedelta(days=days_since_friday)).strftime("%Y-%m-%d")

    results = []
    for code in QDII_CODES:
        g        = gszzl_cache.get(code, {})
        meta     = meta_cache.get(code, {})
        gszzl_v  = g.get("gszzl")
        gztime   = g.get("gztime")
        is_fresh = g.get("is_fresh", False)
        nav_date = g.get("nav_date")

        if session == "a_share":
            # A股时段：
            #   收盘估值（valuation）    = 持仓 × 昨日收盘涨跌幅（Nasdaq percentageChange）
            #   盘后估值（post_valuation）= 持仓 × 昨日盘后涨跌幅（Yahoo postMarketChangePercent）
            r = calc_valuation_for_fund(code, stock_cache, fx_change, "a_share",
                                        prefetched_holdings=all_holdings.get(code, []))
            r["gszzl_time"] = gztime
            if r["valuation"] is None and gszzl_v is not None:
                r["valuation"]   = gszzl_v
                r["data_source"] = "gszzl_fallback"
            else:
                r["data_source"] = "a_share_post_calc"
            # 盘后估值
            r_post = calc_valuation_for_fund(code, stock_cache, fx_change, "post_market",
                                             prefetched_holdings=all_holdings.get(code, []))
            r["post_valuation"] = r_post["valuation"]
            r["post_coverage"]  = r_post["coverage"]
        else:
            # 其他时段 → 持仓加权计算（session决定价格字段）
            r = calc_valuation_for_fund(code, stock_cache, fx_change, session,
                                        prefetched_holdings=all_holdings.get(code, []))
            if r["valuation"] is None and gszzl_v is not None:
                r["valuation"]   = gszzl_v
                r["data_source"] = "gszzl_fallback"
            else:
                src_map = {
                    "pre_market":  "pre_market_calc",
                    "us_open":     "us_open_calc",
                    "post_market": "post_market_calc",
                    "weekend":     "cached_post",
                }
                r["data_source"] = src_map.get(session, "cached_post")
            r["gszzl_time"] = gztime

        # 净值
        r["nav"]      = g.get("nav") or meta.get("nav_latest")
        r["nav_date"] = nav_date
        # 周末：若净值日期 >= 上周五，标记已公布最新净值
        r["nav_published"] = bool(
            session == "weekend" and nav_date and nav_date >= last_friday
        )
        r["scale"]      = meta.get("scale")
        r["ytd_return"] = meta.get("ytd_return")
        # 持仓报告期
        master = _C_TO_A_HOLDINGS_MAP.get(code, code)
        hmeta = _cache_get(f"qdii_hmeta_{master}") or {}
        r["holdings_date"]   = hmeta.get("report_date", "")
        r["holdings_source"] = hmeta.get("source", "")
        results.append(r)

    today      = datetime.utcnow().strftime("%Y-%m-%d")
    updated_at = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

    # ── Step 4: 持久化到 SQLite ────────────────────────────────────────────────
    try:
        _db_save_stock_prices(stock_cache, today)
        for r in results:
            if r.get("holdings"):
                _db_save_holdings(r["code"], r["holdings"], report_date=r.get("holdings_date", ""))
        _db_save_valuations(results, today)
        logger.info(f"[qdii] saved: {len(results)} funds, {len(stock_cache)} stocks, session={session}")
    except Exception as e:
        logger.warning(f"[qdii] DB save failed: {e}")

    payload = {
        "fx_change":  fx_change,
        "fx_price":   fx_price,
        "updated_at": updated_at,
        "session":    session,
        "funds":      results,
    }
    _cache_set(cache_key, payload, _valuation_ttl())

    response.headers["Cache-Control"] = "no-store"
    return payload


@app.get("/api/stocks/prices")
def api_stocks_prices(symbols: str = "", response: Response = None):
    """
    独立股票价格端点。
    GET /api/stocks/prices?symbols=TSLA,META,NVDA

    返回每只股票的 {pre_pct, regular_pct, post_pct, price, close_price}，
    四层容灾确保所有股票均有数据。5分钟缓存（美股交易时段），8小时（非交易时段）。
    """
    if response:
        response.headers["Cache-Control"] = "no-store"

    syms = [s.strip().upper() for s in symbols.split(",") if s.strip()]
    if not syms:
        return {"session": _current_session(), "data": {}}

    s = _current_session()
    result: dict = {}
    with ThreadPoolExecutor(max_workers=min(16, len(syms))) as ex:
        futures = {ex.submit(fetch_stock_price_fields, sym): sym for sym in syms}
        for fut, sym in futures.items():
            try:
                result[sym] = fut.result()
            except Exception as e:
                logger.warning(f"[api/stocks/prices] {sym}: {e}")
                result[sym] = {"pre_pct": None, "regular_pct": None,
                               "post_pct": None, "price": None, "close_price": None}

    return {
        "session":    s,
        "updated_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "data":       result,
    }
